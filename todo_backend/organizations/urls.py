from django.urls import path, include
from . import views

urlpatterns =[
    path('', views.Organizationlistcreated.as_view(), name='organization-list-create'),
    # path('<int:pk>/', views.or.as_view(), name='organization-detail'),
    path('<int:organization_id>/members/', views.OrganizationaMember.as_view(), name='organization-member-list'),
    path('<int:org_id>/invite/', views.invite_member, name='invite-member'),
]