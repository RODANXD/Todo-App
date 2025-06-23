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
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import path
from project.consumers import ChatConsumer

websocket_urlpatterns = [
    path('ws/chat/<int:room_id>/', ChatConsumer.as_asgi()),
]

application = ProtocolTypeRouter({
    'websocket': AuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})

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
    path('<int:project_id>/task-lists/<int:pk>/', views.TaskListView.as_view(), name='task-list-detail'),
    path('<int:project_id>/members/', views.ProjectMembersView.as_view(), name='project-members'),
    path('<int:project_id>/members/<int:member_id>/', views.ProjectMembersView.as_view(), name='project-member-detail'),
    path('<int:project_id>/chat/', views.ChatRoomView.as_view(), name='chat-room'),
    path('<int:project_id>/chat/messages/', views.ChatMessageListCreateView.as_view(), name='chat-messages'),
    path('<int:project_id>/chat/messages/<uuid:pk>/', views.ChatMessageDetailView.as_view(), name='chat-message-detail'),
    path('<int:project_id>/chat/messages/<uuid:message_id>/attachments/', views.ChatAttachmentCreateView.as_view(), name='chat-attachments'),
    path('<int:project_id>/chat/messages/<uuid:message_id>/reactions/', views.ChatReactionCreateView.as_view(), name='chat-reactions'),
    path('notifications/', views.ChatNotificationListView.as_view(), name='chat-notifications'),
    path('notifications/<uuid:notification_id>/read/', views.mark_notification_read, name='mark-notification-read'),
    path('notifications/read-all/', views.mark_all_notifications_read, name='mark-all-notifications-read'),
    path('<int:project_id>/chat-room/', views.get_chat_room, name='get-chat-room'),
    path('global-chat-room/', views.getglobalchatroom, name='getglobalchatroom'),
]