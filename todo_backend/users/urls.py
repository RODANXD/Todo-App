from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('forgotpassword/', views.forgot_pass, name='forgotpassword'),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.login, name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', views.profile_view, name='profile'),
    path('profile/update/', views.update_profile, name='update_profile'),
    path('profile/update_password/', views.update_password, name='update_password'),
    path('profile/all_user_emails/', views.all_user_emails, name="all_user_emails"),
    path('profile/all_username/', views.all_username, name="all_username"),
    
]