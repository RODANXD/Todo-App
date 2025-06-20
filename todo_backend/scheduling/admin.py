from django.contrib import admin
from .models import CalendarEvent, EventParticipant, EventNotification

@admin.register(CalendarEvent)
class CalendarEventAdmin(admin.ModelAdmin):
    list_display = ('title', 'event_type', 'start_time', 'end_time', 'project', 'created_by')
    list_filter = ('event_type', 'project', 'all_day')
    search_fields = ('title', 'description', 'location')
    date_hierarchy = 'start_time'

@admin.register(EventParticipant)
class EventParticipantAdmin(admin.ModelAdmin):
    list_display = ('event', 'user', 'response_status', 'response_time', 'notification_sent')
    list_filter = ('response_status', 'notification_sent')
    search_fields = ('event__title', 'user__username', 'user__email')

@admin.register(EventNotification)
class EventNotificationAdmin(admin.ModelAdmin):
    list_display = ('event', 'recipient', 'notification_type', 'is_read', 'is_email_sent', 'created_at')
    list_filter = ('notification_type', 'is_read', 'is_email_sent')
    search_fields = ('event__title', 'recipient__username', 'recipient__email', 'message')
    date_hierarchy = 'created_at'
