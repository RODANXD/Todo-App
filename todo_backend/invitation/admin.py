from django.contrib import admin
from .models import Invitation, AuditLog

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'organization', 'user', 'action', 'target_type', 'ip_address')
    list_filter = ('action', 'organization', 'created_at')
    search_fields = ('user__email', 'ip_address')
    readonly_fields = ('created_at', 'ip_address')

admin.site.register(Invitation)