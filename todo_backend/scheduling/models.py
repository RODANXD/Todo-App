from django.db import models
from django.conf import settings
from tasks.models import Task
from project.models import Project

class CalendarEvent(models.Model):
    EVENT_TYPES = [
        ('task', 'Task Deadline'),
        ('meeting', 'Meeting'),
        ('milestone', 'Project Milestone'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    all_day = models.BooleanField(default=False)
    location = models.CharField(max_length=255, blank=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='calendar_events')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_events')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    task = models.ForeignKey(Task, on_delete=models.SET_NULL, null=True, blank=True, related_name='calendar_events')
    google_calendar_id = models.CharField(max_length=255, blank=True, null=True)
    outlook_calendar_id = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        ordering = ['start_time']

    def __str__(self):
        return self.title

class EventParticipant(models.Model):
    RESPONSE_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
        ('tentative', 'Tentative'),
    ]

    event = models.ForeignKey(CalendarEvent, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='calendar_events')
    response_status = models.CharField(max_length=20, choices=RESPONSE_CHOICES, default='pending')
    response_time = models.DateTimeField(null=True, blank=True)
    notification_sent = models.BooleanField(default=False)

    class Meta:
        unique_together = ['event', 'user']

    def __str__(self):
        return f"{self.user.username} - {self.event.title}"

class EventNotification(models.Model):
    NOTIFICATION_TYPES = [
        ('reminder', 'Reminder'),
        ('invitation', 'Invitation'),
        ('update', 'Event Update'),
        ('cancellation', 'Event Cancellation'),
    ]

    event = models.ForeignKey(CalendarEvent, on_delete=models.CASCADE, related_name='notifications')
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='event_notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    is_email_sent = models.BooleanField(default=False)
    scheduled_time = models.DateTimeField()

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.notification_type} for {self.event.title} to {self.recipient.username}"
