from rest_framework import serializers
from .models import Organization, OrganizationMember
from rest_framework_simplejwt.tokens import RefreshToken
from users.serializers import UserSerializer, User



class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ('id', 'name', 'slug', 'description', 'created_at')
        read_only_fields = ('id','created_at',)
        
class OrganizationMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    # role = serializers.CharField(source='get_role_display', read_only=True)
    invited_by = UserSerializer(read_only=True)

    class Meta:
        model = OrganizationMember
        fields = ('id', 'user', 'role', 'invited_by', 'invited_at', 'joined_at')
        read_only_fields = ('id','invited_at','joined_at')

