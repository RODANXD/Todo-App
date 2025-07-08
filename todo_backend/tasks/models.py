from django.db import models
from django.conf import settings
from project.models import Project, TaskList
from django.core.exceptions import PermissionDenied
from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.contrib.contenttypes.models import ContentType
# Create your models here.

class Tag(models.Model):
    name = models.CharField(max_length=50, unique= True)
    color = models.CharField(max_length=7, default= "#FF0000")
    
    def __str__(self):
        return f"{self.name}"
    
class Task(models.Model):
    PRIORITY_CHOICES =[
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]
    
    STATUS_CHOICES = [
        ('todo', 'To Do'),
        ('in_progress', 'In Progress'),
        ('done', 'Done'),
    ]
    
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    task_list = models.ForeignKey(TaskList, on_delete=models.CASCADE, related_name='tasks')
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_tasks')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    due_date = models.DateTimeField(null=True, blank=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    tags = models.ManyToManyField(Tag, blank=True, related_name='tasks')
    dependencies = models.ManyToManyField('self', blank=True, symmetrical=False, related_name='dependent_tasks')
    is_recurring = models.BooleanField(default=False)
    recurrence_pattern = models.CharField(max_length=50, blank=True, null=True)
    recurrence_end_date = models.DateTimeField(null=True, blank=True)
        
    
    class Meta:
        ordering = ['order','-created_at']
    def __str__(self):
        return f"{self.title}"
    
    def can_assign_task(self, user):
        """Check if a user can assign tasks"""
        return self.project.can_edit(user)
    
    def assign_to(self, user, assigner):
        """Assign the task to a user"""
        if not self.can_assign_task(assigner):
            raise PermissionDenied("You don't have permission to assign tasks")
        if not self.project.can_view(user):
            raise PermissionDenied("Cannot assign task to a user who cannot view the project")
        self.assigned_to = user
        self.save()
    
    def can_edit(self, user):
        """Check if a user can edit the task"""
        return self.project.can_edit(user)
    
    def can_view(self, user):
        """Check if a user can view the task"""
        return self.project.can_view(user)
    
    
    
    
    def add_comment(self,user,content):
        comment = Comment.objects.create(task=self, user=user, content=content)
        ActivityLog.objects.create(task=self, user=user, action='comment', 
                                   content_object=comment, description=f'Comment added: {content[:50]}...')
        return comment
    
    def log_activity(self, user, action, description):
        return ActivityLog.objects.create(task=self, user=user, action=action, 
                                   content_object=None, description=description)
    
    def add_dependency(self, task):
        if task !=self:
            self.dependencies.add(task)
            self.log_activity(self.created_by, 'updated',f'Added dependency: {task.title}')
            
    def remove_dependency(self, task):
        self.dependencies.remove(task)
        self.log_activity(self.created_by, 'updated',f'Removed dependency: {task.title}')
    
    




class SubTask(models.Model):
        task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='subtasks')
        title = models.CharField(max_length=255)
        is_completed = models.BooleanField(default=False)
        order = models.IntegerField(default=0)
        created_at = models.DateTimeField(auto_now_add=True)
        updated_at = models.DateTimeField(auto_now=True)
        
        
        
        class Meta:
            ordering = ['order']
            
        
        def __str__(self):
            return f"{self.title} - {self.task.title}"
        
        
        
class TimeLog(models.Model):
        task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='time_logs')
        user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
        start_time = models.DateTimeField()
        end_time = models.DateTimeField( null = True, blank=True)
        description = models.TextField(blank=True)
        created_at = models.DateTimeField(auto_now_add=True)
        
        def duration(self):
            if self.end_time:
                return self.end_time - self.start_time
            return None
        


class Comment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']



class TaskAttachment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='task_attachments/')
    filename = models.CharField(max_length=255)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    

class ActivityLog(models.Model):
    ACTION_CHOICES =[
        ('created', 'Created'),
        ('updated', 'Updated'),
        ('deleted', 'Deleted'),
        ('assigned', 'Assigned'),
        ('comment', 'Commented'),
        ('status_change', 'Status_Change')
    ]
    
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='activity_logs')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    description = models.TextField()
    
    
    class Meta:
        ordering = ['-created_at']