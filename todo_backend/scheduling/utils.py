from datetime import datetime, timedelta
from django.utils import timezone
from .models import CalendarEvent, EventNotification

def create_reminder_notifications(event):
    """Create reminder notifications for an event."""
    reminder_times = [
        {'days': 1, 'message': 'Event tomorrow'},
        {'hours': 1, 'message': 'Event in 1 hour'},
        {'minutes': 15, 'message': 'Event in 15 minutes'}
    ]

    for reminder in reminder_times:
        scheduled_time = event.start_time - timedelta(**reminder)
        # Only create future reminders
        if scheduled_time > timezone.now():
            for participant in event.participants.filter(response_status='accepted'):
                EventNotification.objects.create(
                    event=event,
                    recipient=participant.user,
                    notification_type='reminder',
                    message=f"{reminder['message']}: {event.title}",
                    scheduled_time=scheduled_time
                )
from django.db.models import Q
def get_user_calendar_events(user, start_date=None, end_date=None):
    """Get calendar events for a user within a date range."""
    if not start_date:
        start_date = timezone.now().date()
    if not end_date:
        end_date = start_date + timedelta(days=30)

    # Get events from projects where user is a member or owner
    events = CalendarEvent.objects.filter(
        start_time__date__gte=start_date,
        start_time__date__lte=end_date
    ).distinct()
    # Add events where user is a participant
    # participant_events = CalendarEvent.objects.filter(
    #     start_time__date__gte=start_date,
    #     start_time__date__lte=end_date,
    #     participants__user=user
    # )

    return events 

def get_user_availability(user, date):
    """Get user's availability for a specific date."""
    events = CalendarEvent.objects.filter(
        start_time__date=date,
        participants__user=user,
        participants__response_status='accepted'
    )

    # Create a list of busy time slots
    busy_slots = []
    for event in events:
        busy_slots.append({
            'start': event.start_time,
            'end': event.end_time
        })

    # Sort by start time
    busy_slots.sort(key=lambda x: x['start'])

    # Find available slots (assuming 9 AM to 5 PM workday)
    workday_start = datetime.combine(date, datetime.min.time().replace(hour=9))
    workday_end = datetime.combine(date, datetime.min.time().replace(hour=17))
    
    available_slots = []
    current_time = workday_start

    for busy in busy_slots:
        if current_time < busy['start']:
            available_slots.append({
                'start': current_time,
                'end': busy['start']
            })
        current_time = busy['end']

    if current_time < workday_end:
        available_slots.append({
            'start': current_time,
            'end': workday_end
        })

    return available_slots