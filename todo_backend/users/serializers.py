from importlib.metadata import requires
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from organizations.models import Organization, OrganizationMember
from django.utils import timezone
import uuid
import base64
from django.core.files.base import ContentFile
User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)
    organization_name = serializers.CharField(write_only=True, required=False)
    role = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password_confirm', 'profile_pic','first_name', 'last_name','bio','timezone', 'phone', 'organization_name', 'role')

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords do not match.")
        
        # Validate role
        role = attrs.get('role', 'member')
        if role not in ['admin', 'member', 'manager', 'viewer']:
            raise serializers.ValidationError("Invalid role specified.")
        
        # If role is admin, organization_name is required
        if role == 'admin' and not attrs.get('organization_name'):
            raise serializers.ValidationError("Organization name is required for admin role.")
        
        return attrs

    def create(self, validated_data):
        organization_name = validated_data.pop('organization_name', None)
        role = validated_data.pop('role', 'member')
        validated_data.pop('password_confirm')
        
        # Create user
        user = User.objects.create_user(**validated_data)
        
        if role == 'admin' and organization_name:
            # Create organization and make user admin
            org = Organization.objects.create(
                name=organization_name,
                slug=organization_name.lower().replace(' ', '-')
            )
            OrganizationMember.objects.create(
                organization=org, 
                user=user, 
                role=role,
                joined_at=timezone.now()
            )
            user.current_organization = org
            user.save()
        elif role == 'member':
            # For members, you might want to handle this differently
            # For now, we'll just create the user without organization
            # You can modify this based on your business logic
            pass
        
        return user
    
class UserSerializer(serializers.ModelSerializer):
    
    current_organization = serializers.SerializerMethodField(read_only = True)
    current_organization_id = serializers.IntegerField(write_only=True, required=False)
    profile_pic = serializers.ImageField(allow_null=True, required=False)
    role = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'profile_pic',
                  'bio','timezone','phone','current_organization','current_organization_id','role')
        read_only_fields = ('id','email')
        
    def get_current_organization(self, obj):
        if obj.current_organization:
            return {'name':obj.current_organization.name,
                    'id':obj.current_organization.id,
                    'slug':obj.current_organization.slug
                    }
        return None
    
    def get_role(self, obj):
        if obj.current_organization:
            membership = OrganizationMember.objects.filter(
                organization=obj.current_organization, user=obj
            ).first()
            print(f"User: {obj.username}, Org: {obj.current_organization}, Membership: {membership}")
            if membership:
                return membership.role
        # If no current organization, check if user has any organization membership
        membership = OrganizationMember.objects.filter(user=obj).first()
        if membership:
            return membership.role
        return 'member'  # Default role if no membership found
    
    def update(self, instance, validated_data):
        
        current_orgID = validated_data.pop('current_organization_id', None)
        if current_orgID:
            try:
                organization = Organization.objects.get(id=current_orgID)
                instance.current_organization = organization
                instance.save()
            except Organization.DoesNotExist:
                raise serializers.ValidationError("Organization does not exist.")
            
        profile_pic = validated_data.pop('profile_pic',None)
        if profile_pic is not None:
            if instance.profile_pic:
                instance.profile_pic.delete(save=False)
            instance.profile_pic = profile_pic
            
            
        return super().update(instance, validated_data)