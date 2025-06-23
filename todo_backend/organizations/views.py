from rest_framework import generics, status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Organization, OrganizationMember
from .serializers import OrganizationSerializer, OrganizationMemberSerializer
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.exceptions import NotFound
from invitation.auditmixin import AuditLogMixin

# Create your views here.

User = get_user_model()
class Organizationlistcreated(generics.ListCreateAPIView):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Organization.objects.filter(organizationmember__user=self.request.user)
    
    def perform_create(self, serializer):
        org = serializer.save()
        OrganizationMember.objects.create(organization=org, user = self.request.user, role='admin',joined_at=timezone.now())



class OrganizationaMember(generics.ListCreateAPIView):
    queryset = OrganizationMember.objects.all()
    serializer_class = OrganizationMemberSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        org_id = self.kwargs.get('organization_id')
        try:
            org = Organization.objects.get(id=org_id)
            return OrganizationMember.objects.filter(organization=org)
        except Organization.DoesNotExist as e:
            raise NotFound( f"Does not found: {e}")
    
    def perform_create(self, serializer):
        org_id = self.kwargs.get('oraganization_id')
        try:
            org = Organization.objects.get(id=org_id)
            
            if not OrganizationaMember.objects.filter(
                organization = org, user = self.request.user,
                role='Admin'
            ).exists():
                return Response({
                    'error': 'You are not authorized to add members to this organization'
                }, status=status.HTTP_403_FORBIDDEN)
            serializer.save(organization=org)
        except Organization.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)




@api_view(['POST'])
@permission_classes([IsAuthenticated])
def invite_member(request,org_id):
    try:
        org = Organization.objects.get(id=org_id)
        member = OrganizationMember.objects.get(organization=org, 
                                                user=request.user, 
                                                role='admin')
    except OrganizationMember.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    except OrganizationMember.DoesNotExist:
        return Response({
            'error': 'You are not authorized to invite members to this organization'
        }, status=status.HTTP_403_FORBIDDEN)
        
    email = request.data.get('email')
    role = request.data.get('role', 'member')
    
    
    user = User.objects.get(email=email)
    
    OrganizationMember.objects.create(organization=org, user=user, role=role, invited_by=request.user, invited_at=timezone.now())
    
    return Response({'message': 'Member invited successfully'},status=status.HTTP_201_CREATED)



class OrganizationViewset(AuditLogMixin, viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Organization.objects.filter(
            organizationmember__user=self.request.user)
        
    def perform_create(self, serializer):
        org_id = serializer.save()
        OrganizationMember.objects.create(organization=org_id, user=self.request.user, role='admin',joined_at=timezone.now())
        self.log_action(action="Organization created", target_type="Organization", target_id=x.instance.id)
        
        
    def perfrom_update(self, serializer):
        serializer.save(org_user=self.request.user)
        self.log_action(action="Organization updated", target_type="Organization", target_id=serializer.instance.id)
        
    def perform_destroy(self, instance):
        self.log_action(action="Organization deleted", target_type="Organization", target_id=instance.id)
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    