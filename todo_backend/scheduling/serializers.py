from rest_framework import serializers
from .models import CalendarEvent, EventParticipant, EventNotification
from users.serializers import UserSerializer
from tasks.serializers import TaskSerializer

class EventParticipantSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = EventParticipant
        fields = ['id', 'event', 'user', 'response_status', 'response_time', 'notification_sent']
        read_only_fields = ['id', 'notification_sent']

class EventNotificationSerializer(serializers.ModelSerializer):
    recipient = UserSerializer(read_only=True)
    
    class Meta:
        model = EventNotification
        fields = ['id', 'event', 'recipient', 'notification_type', 'message', 
                 'created_at', 'is_read', 'is_email_sent', 'scheduled_time']
        read_only_fields = ['id', 'created_at', 'is_read', 'is_email_sent']

class CalendarEventSerializer(serializers.ModelSerializer):
    participants = EventParticipantSerializer(many=True, read_only=True)
    notifications = EventNotificationSerializer(many=True, read_only=True)
    created_by = UserSerializer(read_only=True)
    task = TaskSerializer(read_only=True)
    
    class Meta:
        model = CalendarEvent
        fields = ['id', 'title', 'description', 'event_type', 'start_time', 'end_time',
                 'all_day', 'location', 'project', 'created_by', 'created_at', 'updated_at',
                 'task', 'google_calendar_id', 'outlook_calendar_id', 'participants', 'notifications']
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at', 
                          'google_calendar_id', 'outlook_calendar_id']

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)