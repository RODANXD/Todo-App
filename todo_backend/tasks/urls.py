from django.urls import path
from . import views

urlpatterns = [
    path('', views.TaskListCreateView.as_view(), name='task-list'),
    path('<int:pk>/', views.TaskDetailView.as_view(), name='task-detail'),
    path('analytics/', views.task_analytics, name='task-analytics'),
    path('stats/', views.task_stats, name='task-stats'),
    # path('api/projects/<int:project_id>/invite/', views.invite_team_member, name='invite-team-member'),
    # path('api/tasklists/<int:tasklist_id>/reorder/', views.reorder_tasks, name='reorder-tasks'),
    # path('api/tasks/<int:task_id>/log-time/', views.log_time, name='log-time'),
]