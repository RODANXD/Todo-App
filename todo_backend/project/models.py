from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from organizations.models import Organization
from django.core.validators import FileExtensionValidator
import uuid
from django.contrib.auth import get_user_model


class ProjectRole(models.Model):
    ROLE_CHOICES = [
        ('owner', 'Owner'),
        ('editor', 'Editor'),
        ('viewer', 'Viewer'),
    ]
    
    project = models.ForeignKey('Project', on_delete=models.CASCADE, related_name='roles')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='project_roles')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='viewer')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('project', 'user')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.role} in {self.project.name}"

class Project(models.Model):
    
    STATUS_CHOICES =[
        ('active', 'Active'),
        ('archived', 'Archived'),
        ('on_hold', 'On Hold'),
        ('completed', 'Completed'),
    ]
    
    
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='owned_projects')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='project', null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    is_archived = models.BooleanField(default=False)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    
    
    def __str__(self):
        return self.name
    
    def add_user(self, user, role='viewer'):
        """Add a user to the project with a specific role"""
        ProjectRole.objects.create(project=self, user=user, role=role)
    
    def remove_user(self, user):
        """Remove a user from the project"""
        ProjectRole.objects.filter(project=self, user=user).delete()
    
    def get_user_role(self, user):
        """Get the role of a user in the project"""
        if self.owner == user:
            return 'owner'
        try:
            return ProjectRole.objects.get(project=self, user=user).role
        except ProjectRole.DoesNotExist:
            return None
    def get_members(self):
        """Get all users who have roles in this project"""
        User = get_user_model()
        
        return User.objects.filter(project_roles__project=self).distinct()
    
    def can_edit(self, user):
        """Check if a user can edit the project"""
        role = self.get_user_role(user)
        return role in ['owner', 'editor']
    
    def can_view(self, user):
        """Check if a user can view the project"""
        return self.get_user_role(user) is not None or self.owner == user
    
    
    def archived(self):
        self.is_archived = True
        self.status = 'archived'
        self.save()
        
    def duplicate(self, new_name =None):
        if not self.organization:
            raise ValueError("Cannot duplicate project without organization")
        new_project = Project.objects.create(
            name = new_name or f"Copy of {self.name}",
            description = self.description,
            organization = self.organization,
            owner = self.owner,
            status = 'active',
            start_date = self.start_date,
            end_date = self.end_date,
            is_archived = False
            
        )
        
        for task_list in self.task_lists.all():
            TaskList.objects.create(
                project = new_project,
                name = task_list.name,
                order = task_list.order
            )
        for role in self.roles.exclude(role='owner'):
            ProjectRole.objects.create(
                project = new_project,
                user = role.user,
                role = role.role
            )
            
        return  new_project

class TaskList(models.Model):
    name = models.CharField(max_length=255)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='task_lists')
    order = models.IntegerField(default = 0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.project.name} - {self.name}"

# Chat Models
class ChatRoom(models.Model):
    id = models.AutoField(primary_key=True)
    project = models.OneToOneField('Project', on_delete=models.CASCADE, related_name='chat_room')
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_global = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Chat Room - {self.project.name}"

class ChatMessage(models.Model):
    id = models.AutoField(primary_key=True)
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='chat_messages')
    parent_message = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    content = models.TextField()
    mentions = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='mentions', blank=True)
    is_edited = models.BooleanField(default=False)
    edited_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    file = models.FileField(upload_to='chat_files/', null=True, blank=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.author.username}: {self.content[:50]}"

class ChatAttachment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(ChatMessage, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(
        upload_to='chat_attachments/',
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'mp3', 'zip', 'rar'])]
    )
    filename = models.CharField(max_length=255)
    file_size = models.IntegerField()  # Size in bytes
    file_type = models.CharField(max_length=50)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.filename} - {self.message.author.username}"

class ChatReaction(models.Model):
    REACTION_CHOICES = [
        ('👍', 'Thumbs Up'),
        ('👎', 'Thumbs Down'),
        ('❤️', 'Heart'),
        ('😄', 'Smile'),
        ('😢', 'Cry'),
        ('😡', 'Angry'),
        ('🎉', 'Party'),
        ('👏', 'Clap'),
        ('🔥', 'Fire'),
        ('💯', '100'),
    ]
    
    message = models.ForeignKey(ChatMessage, on_delete=models.CASCADE, related_name='reactions')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='chat_reactions')
    emoji = models.CharField(max_length=10, choices=REACTION_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('message', 'user', 'emoji')
    
    def __str__(self):
        return f"{self.user.username} {self.emoji} on {self.message.id}"

class ChatNotification(models.Model):
    NOTIFICATION_TYPES = [
        ('mention', 'Mention'),
        ('reply', 'Reply'),
        ('reaction', 'Reaction'),
        ('attachment', 'Attachment'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='chat_notifications')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_chat_notifications')
    message = models.ForeignKey(ChatMessage, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    is_read = models.BooleanField(default=False)
    is_email_sent = models.BooleanField(default=False)
    is_push_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.notification_type} notification for {self.recipient.username}"
    

