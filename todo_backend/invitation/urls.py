from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers
from .views import InvitationViewSet
from organizations.views import OrganizationViewset

router = DefaultRouter()
router.register(r'organizations', OrganizationViewset, basename='organization')

org_router = routers.NestedSimpleRouter(router, r'organizations', lookup='organization')
org_router.register(r'invitations', InvitationViewSet, basename='organization-invitations')

urlpatterns = [

    path('', include(router.urls)),
    path('', include(org_router.urls)),
]