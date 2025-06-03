from django.db import models
from django.conf import settings
from project.models import Project, TaskList
from django.core.exceptions import PermissionDenied
# Create your models here.


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