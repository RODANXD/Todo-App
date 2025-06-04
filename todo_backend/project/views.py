from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db import models
from .models import Project, TaskList, ProjectRole
from rest_framework.views import APIView
from .serializers import ProjectSerializer, TaskListSerializer, ProjectRoleSerializer
from django.contrib.auth import get_user_model



User = get_user_model()

class ProjectListCreateView(generics.ListCreateAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Project.objects.filter(
            models.Q(owner=self.request.user) | 
            models.Q(roles__user=self.request.user)
        ).distinct()
    
    def perform_create(self, serializer):
        project = serializer.save(owner=self.request.user)
        # Create owner role
        ProjectRole.objects.create(project=project, user=self.request.user, role='owner')


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
        members = []
        
        # Add owner
        members.append({
            'id': project.owner.id,
            'email': project.owner.email,
            'name': project.owner.get_full_name(),
            'role': 'owner'
        })
        return Response(members)
    
    
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





@api_view(['POST'])
def add_collaborator(request, project_id):
    project = get_object_or_404(Project, id=project_id, owner=request.user)
    email = request.data.get('email')
    
    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.get(email=email)
        project.collaborators.add(user)
        return Response({'message': 'Collaborator added successfully'})
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    




 




