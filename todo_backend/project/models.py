from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from organizations.models import Organization

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
    
    # def can_edit(self, user):
    #     """Check if a user can edit the project"""
    #     role = self.get_user_role(user)
    #     return role in ['owner', 'editor']
    
    def can_edit(self, user):
        return (
            self.owner == user or 
            self.roles.filter(user=user, role__in=['owner', 'admin']).exists()
        )
    
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