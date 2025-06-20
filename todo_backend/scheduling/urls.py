from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'events', views.CalendarEventViewSet, basename='calendar-event')
router.register(r'participants', views.EventParticipantViewSet, basename='event-participant')
router.register(r'notifications', views.EventNotificationViewSet, basename='event-notification')
router.register(r'availability', views.UserAvailabilityViewSet, basename='user-availability')

urlpatterns = [
    path('', include(router.urls)),
]