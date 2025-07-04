from organizations.models import OrganizationMember
from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db import models
from .models import Project, TaskList, ProjectRole, ChatRoom, ChatMessage, ChatAttachment, ChatReaction, ChatNotification
from rest_framework.views import APIView
from .serializers import ProjectSerializer, TaskListSerializer, ProjectRoleSerializer, ChatRoomSerializer, ChatMessageSerializer, ChatAttachmentSerializer, ChatReactionSerializer, ChatNotificationSerializer
from django.contrib.auth import get_user_model
from rest_framework.viewsets import ModelViewSet
from organizations.models import Organization, OrganizationMember
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.exceptions import PermissionDenied
import re
import os

User = get_user_model()

class ProjectListCreateView(generics.ListCreateAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'is_archived']
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'updated_at', 'name']
    
    def get_queryset(self):
        return Project.objects.filter(
            models.Q(owner=self.request.user) | 
            models.Q(roles__user=self.request.user)
        ).distinct()
    
    def perform_create(self, serializer):
        user = self.request.user
        org = user.current_organization
        if not OrganizationMember.objects.filter(
            organization=org, user=user, role__in = ['admin','owner']
        ).exists():
            raise PermissionDenied("Only organization admins or owners can create projects.")
        project = serializer.save(owner=self.request.user)
        # Create owner role
        ProjectRole.objects.create(project=project, user=self.request.user, role='owner')
        # Create chat room for the project
        ChatRoom.objects.create(project=project, name=f"Chat - {project.name}")


class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Project.objects.filter(
            models.Q(owner=self.request.user) | 
            models.Q(roles__user=self.request.user)
        ).distinct()
    
    def check_object_permissions(self, request, obj):
        if request.method in ['PUT', 'PATCH', 'DELETE']:
            if obj.owner != request.user and not obj.roles.filter(user=request.user, role='editor').exists():
                self.permission_denied(request, message="You don't have permission to edit this project")
        super().check_object_permissions(request, obj)


class ProjectRoleView(generics.ListCreateAPIView):
    serializer_class = ProjectRoleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        project = get_object_or_404(Project, id=self.kwargs['project_id'])
        if project.owner != self.request.user:
            self.permission_denied(self.request, message="Only project owner can manage roles")
        return ProjectRole.objects.filter(project=project)
    
    def perform_create(self, serializer):
        project = get_object_or_404(Project, id=self.kwargs['project_id'])
        if project.owner != self.request.user:
            self.permission_denied(self.request, message="Only project owner can add roles")
        serializer.save(project=project)


class ProjectRoleDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProjectRoleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        project = get_object_or_404(Project, id=self.kwargs['project_id'])
        if project.owner != self.request.user:
            self.permission_denied(self.request, message="Only project owner can manage roles")
        return ProjectRole.objects.filter(project=project)


class TaskListView(generics.ListCreateAPIView):
    serializer_class = TaskListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        project = get_object_or_404(Project, id=self.kwargs['project_id'])
        if not project.can_view(self.request.user):
            self.permission_denied(self.request, message="You don't have permission to view task lists")
        return TaskList.objects.filter(project=project)

    def perform_create(self, serializer):
        project = get_object_or_404(Project, id=self.kwargs['project_id'])
        if not project.can_edit(self.request.user):
            self.permission_denied(self.request, message="You don't have permission to create task lists")
        serializer.save(project=project)


class ProjectViewSet(ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Project.objects.filter(
            models.Q(owner = self.request.user) | models.Q(roles__user = self.request.user)
        ).distinct()
        
        
    def perform_create(self, serializer):
        organization = self.request.user.current_organization
        if not organization:
            organization, created = Organization.objects.get_or_create(
                name=f"{self.request.user.username}'s Organization",
                slug = f"{self.request.user.username}-organization",
                defaults={'description': f"Default Oraganization for {self.request.user.username}"}
                
            )
            
            if created:
                OrganizationMember.objects.create(
                    organization= organization,
                    user = self.request.user,
                    role='admin',
                    joined_at = timezone.now(),
                
                )
                
            self.request.user.current_organization = organization
            self.request.user.save()
        
        project = serializer.save(
            owner=self.request.user,
            organization=organization
        )
        ProjectRole.objects.create(project=project, user=self.request.user, role='owner')
        
    @action(detail = True, methods =['post'])
    def archive(self, request, pk=None):
        project = self.get_object()
        project.is_archived = True
        project.status = 'archived'
        project.save()
        return Response({'message': 'Project archived successfully'})
    
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        try:
            try:
                project = Project.objects.get(pk=pk)
            except Project.DoesNotExist:
                return Response(
                    {"error": f"Project with id {pk} does not exist"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
    
            # Check permissions
            if not (project.owner == request.user or project.roles.filter(user=request.user).exists()):
                return Response(
                    {"error": "You don't have permission to access this project"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
    
            new_name = request.data.get('name', f"Copy of {project.name}")
            
            # Get or create organization
            organization = project.organization or request.user.current_organization
            if not organization:
                organization = Organization.objects.create(
                    name=f"{request.user.username}'s Organization",
                    slug=f"{request.user.username}-organization",
                    description=f"Default Organization for {request.user.username}"
                )
                OrganizationMember.objects.create(
                    organization=organization,
                    user=request.user,
                    role='admin',
                    joined_at=timezone.now()
                )
    
            # Create new project with proper date handling
            new_project = Project.objects.create(
                name=new_name,
                description=project.description,
                owner=request.user,
                organization=organization,
                status='active',
                start_date=timezone.now().date(),  # Convert datetime to date
                end_date=None,
                is_archived=False
            )
    
            # Copy task lists
            for task_list in project.task_lists.all():
                TaskList.objects.create(
                    project=new_project,
                    name=task_list.name,
                    order=task_list.order
                )
    
            # Create owner role
            ProjectRole.objects.create(
                project=new_project,
                user=request.user,
                role='owner'
            )
    
            serializer = self.get_serializer(new_project)
            return Response(
                {"message": "Project duplicated successfully", "data": serializer.data}, 
                status=status.HTTP_201_CREATED
            )
    
        except Exception as e:
            return Response(
                {"error": f"Failed to duplicate project: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ProjectMembersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, project_id):
        """Get all members of a project"""
        project = get_object_or_404(Project, id=project_id)
        if not project.can_view(request.user):
            return Response(
                {"error": "You don't have permission to view project members"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get all roles for the project
        roles = ProjectRole.objects.filter(project=project).select_related('user')
        serializer = ProjectRoleSerializer(roles, many=True)
        # members = []
        
        # # Add owner
        # members.append({
        #     'id': project.owner.id,
        #     'email': project.owner.email,
        #     'name': project.owner.get_full_name(),
        #     'role': 'owner'
        # })
        return Response(serializer.data)
    
    
    def post(self, request, project_id):
        """Add a new member to the project"""
        project = get_object_or_404(Project, id=project_id)
        if not project.can_edit(request.user):
            return Response(
                {"error": "You don't have permission to add members"}, 
                status=status.HTTP_403_FORBIDDEN
            )

        email = request.data.get('email')
        role = request.data.get('role', 'viewer')  # Default role is viewer

        try:
            user = User.objects.get(email=email)
            # Check if user is already a member
            if ProjectRole.objects.filter(project=project, user=user).exists():
                return Response(
                    {"error": "User is already a member of this project"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Add user with specified role
            project.add_user(user, role)
            
            return Response({
                "message": "Member added successfully",
                "member": {
                    "id": user.id,
                    "email": user.email,
                    "name": user.get_full_name(),
                    "role": role
                }
            })
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
    def patch(self, request, project_id, member_id):
        """Update member role"""
        project = get_object_or_404(Project, id=project_id)
        if not project.can_edit(request.user):
            return Response(
                {"error": "You don't have permission to update roles"}, 
                status=status.HTTP_403_FORBIDDEN
            )

        role = request.data.get('role')
        project_role = get_object_or_404(ProjectRole, id=member_id, project=project)
        
        if project_role.user == project.owner:
            return Response(
                {"error": "Cannot modify owner's role"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        project_role.role = role
        project_role.save()
        return Response({"message": "Role updated successfully"})

    def delete(self, request, project_id, member_id):
        """Remove a member from the project"""
        project = get_object_or_404(Project, id=project_id)
        if not project.can_edit(request.user):
            return Response(
                {"error": "You don't have permission to remove members"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        project_role = get_object_or_404(ProjectRole, id=member_id, project=project)
        
        if project_role.user == project.owner:
            return Response(
                {"error": "Cannot remove project owner"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        project_role.delete()
        return Response({"message": "Member removed successfully"})





@api_view(['POST'])
def add_collaborator(request, project_id):
    project = get_object_or_404(Project, id=project_id, owner=request.user)
    email = request.data.get('email')
    
    try:
        user = User.objects.get(email=email)
        project.collaborators.add(user)
        return Response({'message': 'Collaborator added successfully'})
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    

# Chat Views
class ChatRoomView(generics.RetrieveAPIView):
    serializer_class = ChatRoomSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        project_id = self.kwargs.get('project_id')
        project = get_object_or_404(Project, id=project_id)
        
        # Check if user has access to the project
        if not project.can_view(self.request.user):
            raise PermissionError("You don't have access to this project")
        
        chat_room, created = ChatRoom.objects.get_or_create(
            project=project,
            defaults={'name': f"Chat - {project.name}"}
        )
        return chat_room

class ChatMessageListCreateView(generics.ListCreateAPIView):
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    filterset_fields = ['parent_message']
    search_fields = ['content']

    def get_queryset(self):
        project_id = self.kwargs.get('project_id')
        project = get_object_or_404(Project, id=project_id)
        
        if not project.can_view(self.request.user):
            raise PermissionError("You don't have access to this project")
        
        chat_room, created = ChatRoom.objects.get_or_create(
            project=project,
            defaults={'name': f"Chat - {project.name}"}
        )
        
        return ChatMessage.objects.filter(room=chat_room)

    def perform_create(self, serializer):
        project_id = self.kwargs.get('project_id')
        project = get_object_or_404(Project, id=project_id)
        
        if not project.can_view(self.request.user):
            raise PermissionError("You don't have access to this project")
        
        chat_room, created = ChatRoom.objects.get_or_create(
            project=project,
            defaults={'name': f"Chat - {project.name}"}
        )
        
        message = serializer.save(
            room=chat_room,
            author=self.request.user
        )
        
        # Process mentions
        self.process_mentions(message, project)
        
        # Send WebSocket notification
        self.send_websocket_notification(message)

    def process_mentions(self, message, project):
        """Extract mentions from message content and create notifications"""
        mention_pattern = r'@(\w+)'
        mentions = re.findall(mention_pattern, message.content)
        
        for username in mentions:
            try:
                user = User.objects.get(username=username)
                # Check if user is part of the project
                if project.can_view(user):
                    message.mentions.add(user)
                    # Create notification
                    ChatNotification.objects.create(
                        recipient=user,
                        sender=self.request.user,
                        message=message,
                        notification_type='mention'
                    )
                    # Send email notification
                    self.send_email_notification(user, message, 'mention')
            except User.DoesNotExist:
                pass

    def send_email_notification(self, user, message, notification_type):
        """Send email notification to user"""
        subject = f"New {notification_type} in {message.room.project.name}"
        content = f"""
        Hi {user.username},
        
        You have a new {notification_type} in the project "{message.room.project.name}".
        
        Message: {message.content[:100]}...
        
        From: {message.author.username}
        
        Best regards,
        TaskFlow Team
        """
        
        try:
            send_mail(
                subject,
                content,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=True,
            )
        except Exception as e:
            print(f"Failed to send email: {e}")

    def send_websocket_notification(self, message):
        """Send WebSocket notification to all project members"""
        # This will be implemented with Django Channels
        pass

class ChatMessageDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        project_id = self.kwargs.get('project_id')
        project = get_object_or_404(Project, id=project_id)
        
        if not project.can_view(self.request.user):
            raise PermissionError("You don't have access to this project")
        
        chat_room, created = ChatRoom.objects.get_or_create(
            project=project,
            defaults={'name': f"Chat - {project.name}"}
        )
        
        return ChatMessage.objects.filter(room=chat_room)

    def perform_update(self, serializer):
        message = serializer.save(is_edited=True, edited_at=timezone.now())

class ChatAttachmentCreateView(generics.CreateAPIView):
    serializer_class = ChatAttachmentSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        message_id = self.kwargs.get('message_id')
        message = get_object_or_404(ChatMessage, id=message_id)
        
        # Check if user can access the message
        if not message.room.project.can_view(self.request.user):
            raise PermissionError("You don't have access to this message")
        
        file_obj = self.request.FILES.get('file')
        if file_obj:
            attachment = serializer.save(
                message=message,
                filename=file_obj.name,
                file_size=file_obj.size,
                file_type=file_obj.content_type
            )
            
            # Create notification for attachment
            ChatNotification.objects.create(
                recipient=message.author,
                sender=self.request.user,
                message=message,
                notification_type='attachment'
            )

class ChatReactionCreateView(generics.CreateAPIView):
    serializer_class = ChatReactionSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        message_id = self.kwargs.get('message_id')
        message = get_object_or_404(ChatMessage, id=message_id)
        
        # Check if user can access the message
        if not message.room.project.can_view(self.request.user):
            raise PermissionError("You don't have access to this message")
        
        reaction, created = ChatReaction.objects.get_or_create(
            message=message,
            user=self.request.user,
            emoji=serializer.validated_data['emoji']
        )
        
        if not created:
            # If reaction already exists, remove it (toggle)
            reaction.delete()
            return Response({'status': 'reaction_removed'})
        
        # Create notification for reaction
        ChatNotification.objects.create(
            recipient=message.author,
            sender=self.request.user,
            message=message,
            notification_type='reaction'
        )
        
        return Response(ChatReactionSerializer(reaction).data)

class ChatNotificationListView(generics.ListAPIView):
    serializer_class = ChatNotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ChatNotification.objects.filter(
            recipient=self.request.user,
            is_read=False
        )

@api_view(['POST'])
def mark_notification_read(request, notification_id):
    """Mark a notification as read"""
    notification = get_object_or_404(ChatNotification, id=notification_id, recipient=request.user)
    notification.is_read = True
    notification.save()
    return Response({'status': 'success'})

@api_view(['POST'])
def mark_all_notifications_read(request):
    """Mark all notifications as read"""
    ChatNotification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
    return Response({'status': 'success'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_chat_room(request, project_id):
    try:
        project = Project.objects.get(id=project_id)
        if not project.can_view(request.user):
            return Response(
                {"error": "You don't have permission to access this chat"},
                status=status.HTTP_403_FORBIDDEN
            )
            
        chat_room, created = ChatRoom.objects.get_or_create(
            project=project,
            defaults={'name': f"Chat - {project.name}"}
        )
        return Response({'room_id': chat_room.id})
    except Project.DoesNotExist:
        return Response(
            {"error": "Project not found"},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getglobalchatroom(request):
    room, created = ChatRoom.objects.get_or_create(id=0, defaults={"name": "Global Chat"})
    return Response({'room_id': room.id})
