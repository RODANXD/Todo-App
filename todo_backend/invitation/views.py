from django.shortcuts import render
from rest_framework import generics, status, viewsets
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from rest_framework.exceptions import NotFound
from django.core.mail import send_mail
from django.conf import settings
from .models import Invitation
from .serializers import InvitationSerializers
from .auditmixin import AuditLogMixin
# Create your views here.


class InvitationViewSet(AuditLogMixin,viewsets.ModelViewSet):
    queryset = Invitation.objects.all()
    serializer_class = InvitationSerializers
    permission_classes =[IsAuthenticated]
    # lookup_field = 'pk'
    
    def get_queryset(self):
        organization_id = self.kwargs.get('organization_pk')
        return Invitation.objects.filter(organization_id=organization_id)
    

    def perform_create(self, serializer):
        organization_id = self.kwargs.get('organization_pk')
        invitation = serializer.save(
            organization_id=organization_id,
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
        invite_url = f"{settings.FRONTEND_URL}/join/{invitation.token}"
        send_mail(
            subject="Invitation to join organization",
            message=f"""
            you have been invited to join {invitation.organization.name} organization as {invitation.role}.
            To accept the invitation, please click the following link: {invite_url}
            
            this invitation will expire on {invitation.expired_at}
            """,
            
            
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[invitation.email],
        )
