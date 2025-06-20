from rest_framework import permissions

class CanManageCalendarEvent(permissions.BasePermission):
    """Custom permission to check if user can manage calendar events."""

    def has_permission(self, request, view):
        # Allow all authenticated users to list and create events
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any user who can view the project
        if request.method in permissions.SAFE_METHODS:
            return obj.project.can_view(request.user)

        # Write permissions are only allowed to event creator and project admins
        return (
            obj.created_by == request.user or
            obj.project.is_admin(request.user)
        )

class CanManageEventParticipant(permissions.BasePermission):
    """Custom permission to check if user can manage event participants."""

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Users can manage their own participant status
        if obj.user == request.user:
            return True

        # Event creators and project admins can manage all participants
        return (
            obj.event.created_by == request.user or
            obj.event.project.is_admin(request.user)
        )

class CanManageEventNotification(permissions.BasePermission):
    """Custom permission to check if user can manage event notifications."""

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Users can only manage their own notifications
        return obj.recipient == request.user