# from django.urls import path, include
# from rest_framework.routers import DefaultRouter
# from . import views





# # router = DefaultRouter()
# # router.register(r'project', views.ProjectViewSet, basename='project')
# urlpatterns = [
#     # path('', include(router.urls)),
#     path('', views.ProjectListCreateView.as_view(), name='project-list-create'),
#     path('<int:pk>/', views.ProjectDetailView.as_view(), name='project-detail'),
#     path('<int:project_id>/roles/', views.ProjectRoleView.as_view(), name='project-role-list'),
#     path('<int:project_id>/roles/<int:pk>/', views.ProjectRoleDetailView.as_view(), name='project-role-detail'),
#     path('<int:project_id>/task-lists/', views.TaskListView.as_view(), name='task-list-list-create'),
#     path('<int:project_id>/add-collaborator/', views.add_collaborator, name='add-collaborator'),
#     path('<int:project_id>/archive/', views.ProjectViewSet.as_view({'methods': ['post']}), name = 'archive')
# ]

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router and register viewsets
router = DefaultRouter()
router.register(r'', views.ProjectViewSet, basename='project')

urlpatterns = [
    path('', include(router.urls)),
    path('', views.ProjectListCreateView.as_view(), name='project-list-create'),
    path('<int:pk>/', views.ProjectDetailView.as_view(), name='project-detail'),
    path('<int:project_id>/roles/', views.ProjectRoleView.as_view(), name='project-role-list'),
    path('<int:project_id>/roles/<int:pk>/', views.ProjectRoleDetailView.as_view(), name='project-role-detail'),
    path('<int:project_id>/task-lists/', views.TaskListView.as_view(), name='task-list-list-create'),
    path('<int:project_id>/add-collaborator/', views.add_collaborator, name='add-collaborator'),
]