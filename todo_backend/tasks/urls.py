# from django.urls import path, include
# from rest_framework.routers import DefaultRouter
# from . import views


# router= DefaultRouter()

# router.register(r'tags', views.TagViewset)
# router.register(r'tasks/(?P<task_pk>\d+)/comments', views.CommentViewSet, basename='task-comments')
# router.register(r'tasks/(?P<task_pk>\d+)/attachments', views.TaskAttachmentViewset, basename='task-attachments')


# urlpatterns = [
#     # path('', include(router.urls)),
#     # path('tasks/', views.TaskListCreateView.as_view(), name='task-list'),
#     # path('tasks/<int:pk>/', views.TaskDetailView.as_view(), name='task-detail'),
#     # path('tasks/<int:pk>/add-tag/', views.TaskDetailView.as_view({'post': 'add_tag'}), name='task-add-tag'),
#     # path('tasks/<int:pk>/add-dependency/', views.TaskDetailView.as_view({'post': 'add_dependency'}), name='task-add-dependency'),
#     path('', views.TaskListCreateView.as_view(), name='task-list'),
#     path('<int:pk>/', views.TaskDetailView.as_view(), name='task-detail'),
#     path('analytics/', views.task_analytics, name='task-analytics'),
#     path('stats/', views.task_stats, name='task-stats'), 
#     # path('api/projects/<int:project_id>/invite/', views.invite_team_member, name='invite-team-member'),
#     # path('api/tasklists/<int:tasklist_id>/reorder/', views.reorder_tasks, name='reorder-tasks'),
#     # path('api/tasks/<int:task_id>/log-time/', views.log_time, name='log-time'),
# ]

# from django.urls import path, include
# from rest_framework.routers import DefaultRouter
# from . import views

# router = DefaultRouter()
# # Fix: Change TagViewset to TaskViewSet for tasks endpoint
# router.register(r'tasks', views.TaskViewSet, basename='task')  # Changed from TagViewset to TaskViewSet
# router.register(r'tags', views.TagViewset, basename='tag')
# router.register(r'tasks/(?P<task_pk>\d+)/comments', views.CommentViewSet, basename='task-comments')
# router.register(r'tasks/(?P<task_pk>\d+)/attachments', views.TaskAttachmentViewset, basename='task-attachments')

# app_name = 'tasks'

# urlpatterns = [
#     path('', include(router.urls)),
#     path('analytics/', views.task_analytics, name='task-analytics'),
#     path('stats/', views.task_stats, name='task-stats'),
# ]

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