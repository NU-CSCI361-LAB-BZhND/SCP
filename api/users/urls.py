from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, ManageUserView, StaffViewSet, DeleteAccountView
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'staff', StaffViewSet, basename='staff')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', ManageUserView.as_view(), name='me'),
    path('account/delete/', DeleteAccountView.as_view(), name='delete-account'),
    path('', include(router.urls)),
]