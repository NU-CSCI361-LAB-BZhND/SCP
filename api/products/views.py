from rest_framework import viewsets, permissions, exceptions
from django.db.models import F
from users.models import UserRole
from .models import Product
from .serializers import ProductSerializer
from companies.models import Link, LinkStatus

class ProductViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

    """
        - Suppliers: See ONLY their own products.
        - Consumers: See ONLY products from Suppliers they are linked with.
    """
    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Product.objects.none()

        base_qs = Product.objects.filter(is_archived=False, supplier__is_active=True)
        user = self.request.user
        if user.supplier:
            return base_qs.filter(supplier=user.supplier)

        if user.consumer:
            # Find all suppliers where we have an ACCEPTED link
            linked_supplier_ids = Link.objects.filter(
                consumer=user.consumer,
                status=LinkStatus.ACCEPTED
            ).values_list('supplier_id', flat=True)

            # Return products from those suppliers only and only available ones
            return base_qs.filter(
                supplier_id__in=linked_supplier_ids,
                is_available=True,
                stock_level__gte=F('min_order_qty')
            )

        if user.is_superuser:
            return Product.objects.all()

        return Product.objects.none()

    def perform_create(self, serializer):
        user = self.request.user

        if not user.supplier:
            raise exceptions.PermissionDenied("Only Suppliers can add products")

        if user.role not in [UserRole.OWNER, UserRole.MANAGER]:
            raise exceptions.PermissionDenied("Sales Representatives cannot manage the Catalog.")

        serializer.save(supplier=user.supplier)

    def perform_update(self, serializer):
        user = self.request.user
        if user.role not in [UserRole.OWNER, UserRole.MANAGER]:
            raise exceptions.PermissionDenied("Sales Representatives cannot edit the Catalog.")
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        if user.role not in [UserRole.OWNER, UserRole.MANAGER]:
            raise exceptions.PermissionDenied("Sales Representatives cannot delete Products.")
        instance.is_archived = True
        instance.is_available = False
        instance.save()
