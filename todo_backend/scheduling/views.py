from rest_framework import viewsets, permissions, status, filters
from .permissions import CanManageCalendarEvent, CanManageEventParticipant, CanManageEventNotification
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Q
from django.utils import timezone
from datetime import datetime, timedelta

from .models import CalendarEvent, EventParticipant, EventNotification
from .serializers import CalendarEventSerializer, EventParticipantSerializer, EventNotificationSerializer
from .utils import create_reminder_notifications, get_user_calendar_events, get_user_availability
from project.models import Project

class CalendarEventViewSet(viewsets.ModelViewSet):
    serializer_class = CalendarEventSerializer
    permission_classes = [permissions.IsAuthenticated, CanManageCalendarEvent]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description']

    def get_queryset(self):
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            except ValueError:
                start_date = None
        
        if end_date:
            try:
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            except ValueError:
                end_date = None
        
        return get_user_calendar_events(self.request.user, start_date, end_date)

    @action(detail=True, methods=['post'])
    def add_participant(self, request, pk=None):
        event = self.get_object()
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        if not event.project.can_view(request.user):
            return Response({'error': 'User does not have access to this project'}, 
                          status=status.HTTP_403_FORBIDDEN)

        participant = EventParticipant.objects.create(
            event=event,
            user_id=user_id,
            response_status='pending'
        )

        # Create notification for the participant
        notification = EventNotification.objects.create(
            event=event,
            recipient_id=user_id,
            notification_type='invitation',
            message=f'You have been invited to {event.title}',
            scheduled_time=timezone.now()
        )

        # Send email notification
        self.send_invitation_email(event, participant)

        serializer = EventParticipantSerializer(participant)
        # Create reminder notifications
        create_reminder_notifications(event)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def send_invitation_email(self, event, participant):
        subject = f'Invitation: {event.title}'
        message = f'''
        You have been invited to {event.title}
        
        Event Details:
        Date: {event.start_time.strftime('%Y-%m-%d %H:%M')}
        Location: {event.location}
        Description: {event.description}
        
        Please respond to this invitation.
        '''
        
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [participant.user.email],
                fail_silently=False,
            )
            participant.notification_sent = True
            participant.save()
        except Exception as e:
            print(f'Failed to send invitation email: {str(e)}')

class EventParticipantViewSet(viewsets.ModelViewSet):
    serializer_class = EventParticipantSerializer
    permission_classes = [permissions.IsAuthenticated, CanManageEventParticipant]

    def get_queryset(self):
        return EventParticipant.objects.filter(
            Q(user=self.request.user) | Q(event__created_by=self.request.user)
        )

    @action(detail=True, methods=['post'])
    def respond(self, request, pk=None):
        participant = self.get_object()
        response_status = request.data.get('response_status')
        
        if not response_status or response_status not in dict(EventParticipant.RESPONSE_CHOICES):
            return Response({'error': 'Invalid response_status'}, 
                          status=status.HTTP_400_BAD_REQUEST)

        participant.response_status = response_status
        participant.response_time = timezone.now()
        participant.save()

        # Notify event creator
        EventNotification.objects.create(
            event=participant.event,
            recipient=participant.event.created_by,
            notification_type='update',
            message=f'{participant.user.username} has {response_status} the invitation',
            scheduled_time=timezone.now()
        )

        serializer = self.get_serializer(participant)
        return Response(serializer.data)

class EventNotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = EventNotificationSerializer
    permission_classes = [permissions.IsAuthenticated, CanManageEventNotification]

    def get_queryset(self):
        return EventNotification.objects.filter(recipient=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'notification marked as read'})

    @action(detail=False, methods=['get'])
    def unread(self, request):
        notifications = self.get_queryset().filter(is_read=False)
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({'status': 'all notifications marked as read'})

class UserAvailabilityViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        date_str = request.query_params.get('date')
        if not date_str:
            date = timezone.now().date()
        else:
            try:
                date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': 'Invalid date format. Use YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        available_slots = get_user_availability(request.user, date)
        return Response(available_slots)
