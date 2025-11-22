from drf_spectacular.utils import extend_schema_view, extend_schema, OpenApiParameter
from rest_framework import viewsets, permissions, exceptions
from .models import Link
from .serializers import LinkSerializer, LinkCreateSerializer
# Create your views here.

@extend_schema_view(
    list=extend_schema(
        summary="List all Company Links",
        description="""
        Returns a list of links filtered by the authenticated user's company.
        - **Consumers** see requests they have sent.
        - **Suppliers** see requests sent to them.
        """
    ),
    retrieve=extend_schema(
        summary="Get Link Details",
        description="Retrieve detailed information about a specific link relationship."
    ),
    create=extend_schema(
        summary="Request a Link (Consumer only)",
        description="""
        Creates a new link request from the authenticated Consumer to a target Supplier.
        - Status is automatically set to **PENDING**.
        - **Fails** if you are acting as a Supplier.
        - **Fails** if a link already exists.
        """,
        responses={201: LinkCreateSerializer}
    ),
    partial_update=extend_schema(
        summary="Update Link Status (Approve/Block)",
        description="""
        **Supplier Only:** Update the status of a link request.
        - Send `{"status": "ACCEPTED"}` to approve.
        - Send `{"status": "BLOCKED"}` to block.
        """,
        request=LinkCreateSerializer
    ),
    destroy=extend_schema(
        summary="Delete/Cancel Link",
        description="Removes the link relationship entirely."
    )
)

class LinkViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Link.objects.none()

    def get_serializer_class(self):
        # Use CreateSerializer for POST requests
        if self.action == 'create':
            return LinkCreateSerializer
        return LinkSerializer

    def get_queryset(self):
        """
            Filter links so:
            - Consumers see only THEIR links.
            - Suppliers see only THEIR links.
        """
        # Schema generation fallback
        if getattr(self, 'swagger_fake_view', False):
            return Link.objects.none()
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