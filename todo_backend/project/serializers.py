from rest_framework import serializers
from .models import Project, TaskList, ProjectRole, ChatRoom, ChatMessage, ChatAttachment, ChatReaction, ChatNotification
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

# Chat Serializers
class ChatAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatAttachment
        fields = ('id', 'file', 'filename', 'file_size', 'file_type', 'uploaded_at')
        read_only_fields = ('id', 'filename', 'file_size', 'file_type', 'uploaded_at')

class ChatReactionSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = ChatReaction
        fields = ('id', 'user', 'emoji', 'created_at')
        read_only_fields = ('id', 'user', 'created_at')

class ChatMessageSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    mentions = UserSerializer(many=True, read_only=True)
    attachments = ChatAttachmentSerializer(many=True, read_only=True)
    reactions = ChatReactionSerializer(many=True, read_only=True)
    replies_count = serializers.SerializerMethodField()
    user_reactions = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatMessage
        fields = (
            'id', 'room', 'author', 'parent_message', 'content', 'mentions',
            'is_edited', 'edited_at', 'created_at', 'updated_at',
            'attachments', 'reactions', 'replies_count', 'user_reactions'
        )
        read_only_fields = ('id', 'author', 'is_edited', 'edited_at', 'created_at', 'updated_at')
    
    def get_replies_count(self, obj):
        return obj.replies.count()
    
    def get_user_reactions(self, obj):
        user = self.context['request'].user
        return [reaction.emoji for reaction in obj.reactions.filter(user=user)]

class ChatRoomSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatRoom
        fields = ('id', 'project', 'name', 'created_at', 'updated_at', 'messages', 'last_message', 'unread_count')
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def get_last_message(self, obj):
        last_message = obj.messages.filter(parent_message__isnull=True).last()
        if last_message:
            return ChatMessageSerializer(last_message, context=self.context).data
        return None
    
    def get_unread_count(self, obj):
        user = self.context['request'].user
        return obj.messages.filter(
            created_at__gt=user.last_login if user.last_login else user.date_joined
        ).exclude(author=user).count()

class ChatNotificationSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    message = ChatMessageSerializer(read_only=True)
    
    class Meta:
        model = ChatNotification
        fields = ('id', 'recipient', 'sender', 'message', 'notification_type', 'is_read', 'created_at')
        read_only_fields = ('id', 'recipient', 'sender', 'message', 'created_at')