from rest_framework import viewsets, permissions, exceptions
from .models import Link
from .serializers import LinkSerializer, LinkCreateSerializer
# Create your views here.

class LinkViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Link.objects.none()

    def get_serializer_class(self):
        # Use CreateSerializer for POST requests
        if self.action == 'create':
            return LinkCreateSerializer
        return LinkSerializer

    def get_queryset(self):
        user = self.request.user

        if user.consumer:
            return Link.objects.filter(consumer=user.consumer)
        elif user.supplier:
            return Link.objects.filter(supplier=user.supplier)

        return Link.objects.none()  # Fallback for admins/unassigned

    def perform_create(self, serializer):
        # Automatically assign the requesting Consumer
        user = self.request.user
        if not user.consumer:
            raise exceptions.PermissionDenied("Only Consumers can request links.")

        serializer.save(consumer=user.consumer)