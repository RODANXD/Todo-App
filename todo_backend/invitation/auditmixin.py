from .models import AuditLog
from organizations.models import Organization
class AuditLogMixin:
    
    def get_organization(self):
        organization_id = self.kwargs.get('organization_pk')
        if organization_id:
            return Organization.objects.get(id=organization_id)
        
        
        if hasattr(self, 'get_object'):
            obj = self.get_object()
            
            return getattr(obj, 'organization', None)
        return None
    
    def log_action(self, action, target_type,target_id, details=None):
        organization = self.get_organization()
        if not organization:
            return
        
        
        AuditLog.objects.create(
            organization=organization,
            user=self.request.user,
            action=action,
            target_type=target_type,
            target_id=target_id,
            details=details,
            ip_address=self.request.META.get('REMOTE_ADDR')
        )
