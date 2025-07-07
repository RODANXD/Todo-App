from django.shortcuts import render
from rest_framework import generics, status, viewsets
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from rest_framework.exceptions import NotFound, ValidationError
from django.core.mail import send_mail
from django.conf import settings
from .models import Invitation
from .serializers import InvitationSerializers
from .auditmixin import AuditLogMixin
from rest_framework.decorators import api_view
from rest_framework.response import Response
from organizations.models import Organization, OrganizationMember
# Create your views here.


class InvitationViewSet(AuditLogMixin,viewsets.ModelViewSet):
    queryset = Invitation.objects.select_related('organization').all()
    serializer_class = InvitationSerializers
    permission_classes =[IsAuthenticated]
    # lookup_field = 'pk'
    
    def get_queryset(self):
        organization_id = self.kwargs.get('organization_pk')
        return Invitation.objects.select_related('organization').filter(organization_id=organization_id)
    

    def perform_create(self, serializer):
        organization_id = self.kwargs.get('organization_pk')
        
        # Get the organization object first to ensure it exists
        try:
            organization = Organization.objects.get(id=organization_id)
        except Organization.DoesNotExist:
            raise NotFound("Organization not found")
        
        # Get the email from the serializer's validated data
        email = serializer.validated_data.get('email')
        
        # Check if user with this email already exists in the organization
        User = get_user_model()
        try:
            user = User.objects.get(email=email)
            # Check if user is already a member of this organization
            if OrganizationMember.objects.filter(organization=organization, user=user).exists():
                raise ValidationError({
                    'email': 'This email is already a member of this organization. Please use direct invite instead.'
                })
        except User.DoesNotExist:
            # User doesn't exist, which is fine for email invitations
            pass
        
        # Check if there's already a pending invitation for this email
        if Invitation.objects.filter(
            organization=organization, 
            email=email, 
            status='pending'
        ).exists():
            raise ValidationError({
                'email': 'A pending invitation already exists for this email address.'
            })
            
        invitation = serializer.save(
            organization=organization,  # Pass the organization object instead of just the ID
            invited_by=self.request.user
        )
        
        self.log_action(action="create", 
                        target_type="Invitation", 
                        target_id=invitation.id,
                        details={
                            'email': invitation.email,
                            'role': invitation.role,
                        })
        self.send_invitation(invitation)
        
    def perform_update(self, serializer):
        invitation = serializer.save()
        self.log_action(action="update", 
                        target_type="Invitation", 
                        target_id=invitation.id,
                        details={
                            'email': invitation.email,
                            'role': invitation.role,
                        })
        
    def perform_destroy(self, instance):
        invitation_id = instance.id
        self.log_action(action="delete", 
                        target_type="Invitation", 
                        target_id=invitation_id,
                        details={
                            'email': instance.email,
                            'role': instance.role,
                        })
        instance.delete()
        
        
    def send_invitation(self, invitation):
        # Ensure the invitation object has the organization loaded
        invitation.refresh_from_db()
        
        # Get the organization name
        organization_name = invitation.organization.name
        
        invite_url = f"{settings.SERVER_URL}login"
        
        # Debug logging (remove in production)
        print(f"DEBUG: Sending invitation for organization: {organization_name}")
        print(f"DEBUG: Organization ID: {invitation.organization.id}")
        
        send_mail(
            subject=f"Invitation to join {organization_name}",
            message=f"""
You have been invited to join {organization_name} organization as {invitation.role}.
To accept the invitation, please click the following link: {invite_url}

This invitation will expire on {invitation.expired_at.strftime('%Y-%m-%d %H:%M:%S')}

Best regards,
{organization_name} Team
            """.strip(),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[invitation.email],
        )
