from rest_framework import generics, viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, CharFilter
from django.db import models
from django.utils import timezone
from datetime import timedelta
from .models import Task, SubTask, TimeLog, Tag, TaskAttachment, Comment, ActivityLog
from .serializers import TaskSerializer, SubTaskSerializer, TimeLogSerializer, CommentSerializer, TaskAttachmentSerializer, TagSerializer, ActivityLogSerializer
from project.models import Project
from django_filters import rest_framework as filters
from django.core.exceptions import PermissionDenied


class TaskFilter(FilterSet):
    tasklist = filters.NumberFilter(field_name='task_list')
    status = filters.ChoiceFilter(choices=Task.STATUS_CHOICES)
    priority = filters.ChoiceFilter(choices=Task.PRIORITY_CHOICES)
    due_date = filters.DateFilter()
    
    class Meta:
        model = Task
        fields = ['tasklist', 'status', 'priority', 'due_date']

class TaskListCreateView(generics.ListCreateAPIView):
    serializer_class = TaskSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = TaskFilter
    search_fields = ['title', 'description']
    ordering_fields = ['due_date', 'priority', 'created_at']

    def get_queryset(self):
        user_projects = Project.objects.filter(
            models.Q(owner=self.request.user) | 
            models.Q(roles__user=self.request.user)
        ).distinct()
        return Task.objects.filter(project__in=user_projects)

class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TaskSerializer
    filterset_class = TaskFilter
    filter_backends = (filters.DjangoFilterBackend,)

    def get_queryset(self):
        # user_projects = Project.objects.filter(
        #     models.Q(owner=self.request.user) | 
        #     models.Q(roles__user=self.request.user)
        # ).distinct()
        # return Task.objects.filter(project__in=user_projects)
        queryset = Task.objects.all()
        tasklist_id = self.request.query_params.get('tasklist', None)
        if tasklist_id is not None:
            queryset = queryset.filter(task_list_id=tasklist_id)
        return queryset
    
    
    @action(detail =True, methods=['post'])
    def add_tag(self, request, pk=None):
        task = self.get_object()
            
        tag_id = request.data.get('tag_id')
            
        try:
            
            tag = Tag.objects.get(id=tag_id)
            task.tags.add(tag)
            task.log_activity(request.user, 'updated', f'Added tag: {tag.name}')
            return Response({'status': 'tag added'})
        except Tag.DoesNotExist:
            return Response({'error': 'Tag not found'}, status=status.HTTP_404_NOT_FOUND)

 
    @action(detail=True, methods=['post'])
    def add_dependency(self, request, pk=None):
        task = self.get_object()
        dependency_id = request.data.get('dependency_id')
        try:
            dependency = Task.objects.get(id=dependency_id)
            task.add_dependency(dependency)
            print("dependency:", dependency)
            return Response({'status': 'dependency added'})
        except Task.DoesNotExist:
            return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
def task_analytics(request):
    user_projects = Project.objects.filter(
        models.Q(owner=request.user) | 
        models.Q(roles__user=request.user)
    ).distinct()
    tasks = Task.objects.filter(project__in=user_projects)
    
    today = timezone.now().date()
    week_ago = today - timedelta(days=7)
    
    analytics = {
        'total_tasks': tasks.count(),
        'completed_tasks': tasks.filter(status='done').count(),
        'pending_tasks': tasks.exclude(status='done').count(),
        'overdue_tasks': tasks.filter(due_date__lt=timezone.now(), status__in=['todo', 'in_progress']).count(),
        'tasks_this_week': tasks.filter(created_at__date__gte=week_ago).count(),
        'completed_this_week': tasks.filter(status='done', updated_at__date__gte=week_ago).count(),
    }
    
    return Response(analytics)

@api_view(['GET'])
def task_stats(request):
    user_projects = Project.objects.filter(
        models.Q(owner=request.user) | 
        models.Q(roles__user=request.user)
    ).distinct()
    tasks = Task.objects.filter(project__in=user_projects)
    
    today = timezone.now().date()
    week_ago = today - timedelta(days=7)
    
    # Get tasks completed this week
    completed_this_week = tasks.filter(
        status='done',
        updated_at__date__gte=week_ago
    ).count()
    
    # Get overdue tasks
    overdue_tasks = tasks.filter(
        due_date__lt=timezone.now(),
        status__in=['todo', 'in_progress']
    ).count()
    
    # Get time spent per task
    time_logs = TimeLog.objects.filter(
        task__project__in=user_projects,
        # end_time__isnull=False
    ).values('task__id', 'task__title').annotate(
        total_time=models.Sum(
            models.ExpressionWrapper(
                models.F('end_time') - models.F('start_time'),
                output_field=models.DurationField()
            )
        )
    )
    
    # Get time spent per project
    project_time = TimeLog.objects.filter(
        task__project__in=user_projects,
        end_time__isnull=False
    ).values('task__project__id', 'task__project__name').annotate(
        total_time=models.Sum(
            models.ExpressionWrapper(
                models.F('end_time') - models.F('start_time'),
                output_field=models.DurationField()
            )
        )
    )
    
    time_logs_list = [
        {
            'task__id': log['task__id'],
            'task__title': log['task__title'],
            'total_time': int(log['total_time'].total_seconds() / 60) if log['total_time'] else 0
        }
        for log in time_logs
    ]
    print("Time logs list:", time_logs_list)
    
    project_time_list = [
        {
            'task__project__id': proj['task__project__id'],
            'task__project__name': proj['task__project__name'],
            'total_time': int(proj['total_time'].total_seconds() / 60) if proj['total_time'] else 0
        }
        for proj in project_time
    ]
    
    
    stats = {
        'completed_this_week': completed_this_week,
        'overdue_tasks': overdue_tasks,
        'time_per_task': time_logs_list,
        'time_per_project': project_time_list,
    }
    
    return Response(stats)

class SubTaskListCreateView(generics.ListCreateAPIView):
    serializer_class = SubTaskSerializer
    
    def get_queryset(self):
        task_id = self.kwargs.get('task_id')
        return SubTask.objects.filter(task_id=task_id)
    
    def perform_create(self, serializer):
        task_id = self.kwargs.get('task_id')
        task = Task.objects.get(id=task_id)
        if not task.can_edit(self.request.user):
            raise PermissionDenied("You don't have permission to add subtasks to this task")
        serializer.save(task_id=task_id)

class SubTaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SubTaskSerializer
    
    def get_queryset(self):
        task_id = self.kwargs.get('task_id')
        return SubTask.objects.filter(task_id=task_id)
    
    def perform_update(self, serializer):
        task_id = self.kwargs.get('task_id')
        task = Task.objects.get(id=task_id)
        if not task.can_edit(self.request.user):
            raise PermissionDenied("You don't have permission to edit subtasks of this task")
        serializer.save()

class TimeLogViewSet(viewsets.ModelViewSet):
    serializer_class = TimeLogSerializer
    
    def get_queryset(self):
        user_projects = Project.objects.filter(
            models.Q(owner=self.request.user) | 
            models.Q(roles__user=self.request.user)
        ).distinct()
        return TimeLog.objects.filter(task__project__in=user_projects)
    
    def perform_create(self, serializer):
        task_id = self.request.data.get('task')
        task = Task.objects.get(id=task_id)
        if not task.can_edit(self.request.user):
            raise PermissionDenied("You don't have permission to log time for this task")
        serializer.save(user=self.request.user)
        
        
        
class TagViewset(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    

class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    
    def get_queryset(self):
        return Comment.objects.filter(task_id = self.kwargs['task_pk'])
    def perform_create(self,serializer):
        task = Task.objects.get(id=self.kwargs['task_pk'])
        if not task.can_view(self.request.user):
            raise PermissionDenied("You don't have permission to comment on this task")
        serializer.save(task_id=self.kwargs['task_pk'],
            author=self.request.user
            )


class TaskAttachmentViewset(viewsets.ModelViewSet):
    serializer_class = TaskAttachmentSerializer
    
    def get_queryset(self):
        return TaskAttachment.objects.filter(task_id = self.kwargs['task_pk'])
    def perform_create(self,serializer):
        task = Task.objects.get(id=self.kwargs['task_pk'])
        if not task.can_edit(self.request.user):
            raise PermissionDenied("You don't have permission to attach files to this task")
        serializer.save(task_id=self.kwargs['task_pk'],
            uploaded_by=self.request.user
            )