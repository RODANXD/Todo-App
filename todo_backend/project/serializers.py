from rest_framework import serializers
from .models import Project, TaskList, ProjectRole
from users.serializers import UserSerializer


class ProjectRoleSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = ProjectRole
        fields = ('id', 'user', 'user_id', 'role', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class TaskListSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskList
        fields = ('id', 'name','project', 'order', 'created_at')
        read_only_fields = ('id', 'created_at')
        

class ProjectSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    roles = ProjectRoleSerializer(many=True, read_only=True)
    task_list = TaskListSerializer(many=True, read_only=True)
    task_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = ('id', 'name', 'description', 'owner', 'roles', 'created_at', 'updated_at', 'task_list', 'task_count')
        read_only_fields = ('id', 'owner', 'created_at', 'updated_at')
        
    def get_task_count(self, obj):
        return obj.tasks.count()
    
    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)