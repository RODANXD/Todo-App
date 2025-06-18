from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta
from .models import Invitation


class InvitationSerializers(serializers.ModelSerializer):
    class Meta:
        model = Invitation
        fields = ('id', 'email', 'role', 'organization', 'status', 'created_at')
        read_only_fields = ('id', 'created_at', 'status')
        extra_kwargs = {'organization': {'required': False}}

    def create(self, validated_data):
        validated_data['expired_at'] = timezone.now() + timedelta(days=7)
        return super().create(validated_data)