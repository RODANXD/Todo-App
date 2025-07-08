

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'timelogs', views.TimeLogViewSet, basename='timelog')

urlpatterns = [
    path('', views.TaskListCreateView.as_view(), name='task-list'),
    path('<int:pk>/', views.TaskDetailView.as_view(), name='task-detail'),
    path('analytics/', views.task_analytics, name='task-analytics'),
    path('stats/', views.task_stats, name='task-stats'),
    path('', include(router.urls)),
    # path('timelogs/', views.TimeLogListCreateView.as_view(), name='time-log-list-create'),
    # path('api/projects/<int:project_id>/invite/', views.invite_team_member, name='invite-team-member'),
    # path('api/tasklists/<int:tasklist_id>/reorder/', views.reorder_tasks, name='reorder-tasks'),
    # path('api/tasks/<int:task_id>/log-time/', views.log_time, name='log-time'),
]