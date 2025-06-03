from rest_framework import serializers
from .models import Task, SubTask,TimeLog
from users.serializers import UserSerializer

class SubTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubTask
        fields = ('id', 'title', 'is_completed','order', 'created_at')
        # read_only_fields = ('id', 'created_at')
        
    
    
class TimeLogSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    duration = serializers.SerializerMethodField()
    
    
    class Meta:
        model = TimeLog
        fields = ('id', 'task', 'user', 'start_time', 'end_time', 'description', 'created_at', 'duration')
        # read_only_fields = ('id', 'user', 'created_at')
        
    def get_duration(self, obj):
        duration = obj.duration()
        return str(duration) if duration else None
    


class TaskSerializer(serializers.ModelSerializer):
    assigned_to = UserSerializer(read_only=True)
    created_by = UserSerializer(read_only=True)
    subtask = SubTaskSerializer(many=True, read_only=True)
    time_logs = TimeLogSerializer(many=True, read_only=True)
    total_time = serializers.SerializerMethodField()
    
    
    class Meta:
        model = Task
        fields = '__all__'
        # read_only_fields = ('id', 'created_at', 'updated_at')
    
    
    def get_total_time(self, obj):
        total_seconds = sum([log.duration().total_seconds() for log in obj.time_logs.all() if log.duration()])
        return total_seconds / 3600 if total_seconds > 0 else 0  # Return hours

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)