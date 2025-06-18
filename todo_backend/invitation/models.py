from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
import uuid
from organizations.models import OrganizationMember, Organization
class Invitation(models.Model):
    
    STATUS_CHOICES=(
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    )
    
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    email = models.EmailField(_("Email"), unique=True)
    role = models.CharField(_("Role"), max_length=50, choices = OrganizationMember.ROLE_CHOICES, default='member')
    token = models.UUIDField(default=uuid.uuid4, editable=False)
    status = models.CharField(_("Status"), max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(_("Created at"), auto_now_add=True)
    expired_at = models.DateTimeField()
    invited_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, 
                                   related_name='sent_invitations')
    

class AuditLog(models.Model):
    """
    Model to store audit logs for invitations
    """
    
    ACTION_CHOICES = (
        ('create', ('Created')),
        ('update', ('Updated')),
        ('delete', ('Deleted')),
        ('invite', ('Invited')),
        ('join', ('Join')),
        ('leave',('Leave')),
    )
    
    organization = models.ForeignKey(Organization, on_delete= models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(_("Action"), max_length=20, choices=ACTION_CHOICES)
    created_at = models.DateTimeField(_("Created at"), auto_now_add=True)
    target_type = models.CharField(max_length=50)
    target_id = models.PositiveIntegerField()
    details = models.JSONField(null= True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    
    
    