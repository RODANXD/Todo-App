from django.db.models.signals import post_save, pre_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from .models import CalendarEvent, EventParticipant, EventNotification
from tasks.models import Task

@receiver(post_save, sender=Task)
def create_task_calendar_event(sender, instance, created, **kwargs):
    """Create or update calendar event when a task is created or updated"""
    if instance.due_date:
        calendar_event, event_created = CalendarEvent.objects.get_or_create(
            task=instance,
            defaults={
                'title': instance.title,
                'description': instance.description,
                'event_type': 'task',
                'start_time': instance.due_date,
                'end_time': instance.due_date,
                'all_day': True,
                'project': instance.project,
                'created_by': instance.created_by
            }
        )
        
        if not event_created and (
            calendar_event.title != instance.title or
            calendar_event.description != instance.description or
            calendar_event.start_time != instance.due_date
        ):
            calendar_event.title = instance.title
            calendar_event.description = instance.description
            calendar_event.start_time = instance.due_date
            calendar_event.end_time = instance.due_date
            calendar_event.save()
            
            
            
@receiver(post_delete, sender=Task)
def delete_task_calendar_event(sender, instance, **kwargs):
    """Delete calendar event when a task is deleted"""
    CalendarEvent.objects.filter(task=instance).delete()
    
    
    
    
@receiver(post_save, sender=CalendarEvent)
def create_event_notifications(sender, instance, created, **kwargs):
    """Create notifications for calendar events"""
    if created and instance.project:
        # Get project members using correct field name
        project_members = instance.project.get_members()
        
        for member in project_members:
            if member != instance.created_by:
                EventNotification.objects.create(
                    event=instance,
                    recipient=member,
                    notification_type='invitation',
                    message=f'New event: {instance.title}',
                    scheduled_time=timezone.now()
                )

@receiver(pre_save, sender=EventNotification)
def send_notification_email(sender, instance, **kwargs):
    """Send email for event notifications"""
    if not instance.is_email_sent:
        try:
            subject = f'Calendar Notification: {instance.notification_type}'
            message = f'''
            {instance.message}
            
            Event: {instance.event.title}
            Date: {instance.event.start_time.strftime('%Y-%m-%d %H:%M')}
            Location: {instance.event.location}
            
            View event details in your calendar.
            '''
            
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [instance.recipient.email],
                fail_silently=False,
            )
            instance.is_email_sent = True
        except Exception as e:
            print(f'Failed to send notification email: {str(e)}')