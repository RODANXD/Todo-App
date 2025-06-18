from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db import models
from .models import Project, TaskList, ProjectRole
from rest_framework.views import APIView
from .serializers import ProjectSerializer, TaskListSerializer, ProjectRoleSerializer
from django.contrib.auth import get_user_model
from rest_framework.viewsets import ModelViewSet
from organizations.models import Organization, OrganizationMember
from django.utils import timezone

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
    




 




