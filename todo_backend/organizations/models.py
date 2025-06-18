from django.db import models
from django.conf import settings
from datetime import datetime


now = datetime.now()
class Organization(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    
    
    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name
    
    
    
class OrganizationMember(models.Model):
    ROLE_CHOICES =(
        ('admin', ('Admin')),
        ('manager',('Manager')),
        ('member', ('Member')),
        ('viewer', ('Viewer')),
               )
    
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    
    invited_by = models.ForeignKey(settings.AUTH_USER_MODEL, 
                                   on_delete=models.SET_NULL, null=True, blank=True, related_name='invited_by')
    
    invited_at = models.DateTimeField(auto_now_add=True)
    joined_at = models.DateTimeField(null=True, blank=True)
    
    
    class Meta:
        unique_together = ('organization', 'user')


