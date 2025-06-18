from rest_framework import serializers
from .models import Task, SubTask,TimeLog, Tag, TaskAttachment,ActivityLog,Comment
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
    
class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ('id', 'name','color')
        
        
class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    class Meta:
        model = Comment
        fields = ('id', 'author', 'content', 'updated_at', 'created_at')
        # read_only_fields = ('id', 'user', 'created_at')

class TaskAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)
    class Meta:
        model = TaskAttachment
        fields = ('id', 'file', 'filename', 'uploaded_by', 'uploaded_at')
        # read_only_fields = ('id', 'uploaded_by', 'created_at')

class ActivityLogSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = ActivityLog
        fields = ('id', 'task', 'action', 'description', 'created_at','user')
        # read_only_fields = ('id', 'user', 'created_at'
        


class TaskSerializer(serializers.ModelSerializer):
    assigned_to = UserSerializer(read_only=True)
    created_by = UserSerializer(read_only=True)
    subtask = SubTaskSerializer(many=True, read_only=True)
    time_logs = TimeLogSerializer(many=True, read_only=True)
    total_time = serializers.SerializerMethodField()
    comments = CommentSerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    attachments = TaskAttachmentSerializer(many=True, read_only=True)
    activity_logs = ActivityLogSerializer(many=True, read_only=True)
    dependencies = serializers.PrimaryKeyRelatedField(many=True, queryset=Task.objects.all())
    
    
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