from rest_framework import permissions
from .models import UserRole

class IsOwnerUser(permissions.BasePermission):
    """
    Allows access only to users with the OWNER role.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == UserRole.OWNER)

class IsOwnerOrManager(permissions.BasePermission):
    """
    Allows access to Owners AND Managers.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in [UserRole.OWNER, UserRole.MANAGER]
        )