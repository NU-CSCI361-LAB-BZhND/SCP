from rest_framework import viewsets, permissions, exceptions
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

        user = self.request.user
        if user.supplier:
            return Product.objects.filter(supplier=user.supplier)

        if user.consumer:
            # Find all suppliers where we have an ACCEPTED link
            linked_supplier_ids = Link.objects.filter(
                consumer=user.consumer,
                status=LinkStatus.ACCEPTED
            ).values_list('supplier_id', flat=True)

            # Return products from those suppliers only and only available ones
            return Product.objects.filter(
                supplier_id__in=linked_supplier_ids,
                is_available=True
            )

        if user.is_superuser:
            return Product.objects.all()

        return Product.objects.none()

    def perform_create(self, serializer):
        user = self.request.user

        if not user.supplier:
            raise exceptions.PermissionDenied("Only Suppliers can add products")

        serializer.save(supplier=user.supplier)
