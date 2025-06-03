from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings

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
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='owned_projects')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
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
    
    def can_edit(self, user):
        """Check if a user can edit the project"""
        role = self.get_user_role(user)
        return role in ['owner', 'editor']
    
    def can_view(self, user):
        """Check if a user can view the project"""
        return self.get_user_role(user) is not None or self.owner == user

class TaskList(models.Model):
    name = models.CharField(max_length=255)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='task_lists')
    order = models.IntegerField(default = 0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.project.name} - {self.name}"