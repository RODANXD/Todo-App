from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from organizations.models import Organization, OrganizationMember

User = get_user_model()
class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)
    organization_name = serializers.CharField(write_only=True, required=False)
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password_confirm', 'profile_pic','first_name', 'last_name','bio','timezone', 'phone', 'organization_name')

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords do not match.")
        return attrs

    def create(self, validated_data):
        organization_name = validated_data.pop('organization_name', None)
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        
        if organization_name:
            org = Organization.objects.create(name=organization_name,slug= organization_name.lower().replace(' ', '-'))
            OrganizationMember.objects.create(organization=org, user=user, role='admin')
            user.current_organization = org
            user.save()
        return user
    
class UserSerializer(serializers.ModelSerializer):
    
    current_organization = serializers.SerializerMethodField(read_only = True)
    current_organization_id = serializers.IntegerField(write_only=True, required=False)
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'profile_pic',
                  'bio','timezone','phone','current_organization','current_organization_id')
        read_only_fields = ('id','email')
        
    def get_current_organization(self, obj):
        if obj.current_organization:
            return {'name':obj.current_organization.name,
                    'id':obj.current_organization.id,
                    'slug':obj.current_organization.slug
                    }
        return None
    
    def update(self, instance, validated_data):
        
        current_orgID = validated_data.pop('current_organization_id', None)
        if current_orgID:
            try:
                organization = Organization.objects.get(id=current_orgID)
                instance.current_organization = organization
                instance.save()
            except Organization.DoesNotExist:
                raise serializers.ValidationError("Organization does not exist.")
        return super().update(instance, validated_data)
