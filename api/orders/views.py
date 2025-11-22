from rest_framework import viewsets, permissions, exceptions, status
from rest_framework.response import Response
from django.db import transaction
from drf_spectacular.utils import extend_schema, extend_schema_view
from .models import Order, OrderStatus
from .serializers import OrderReadSerializer, OrderCreateSerializer, OrderUpdateSerializer


@extend_schema_view(
    list=extend_schema(summary="List Orders (History)"),
    retrieve=extend_schema(summary="Get Order Details"),
    create=extend_schema(
        summary="Place a New Order",
        description="Atomic transaction. Deducts stock immediately. Fails if stock is low or link is missing.",
        responses={201: OrderReadSerializer}
    ),
    partial_update=extend_schema(
        summary="Update Order Status",
        description="Suppliers can Confirm, Ship, or Decline orders. Declining restores stock."
    )
)
class OrderViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['create']:
            return OrderCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return OrderUpdateSerializer
        return OrderReadSerializer

    def get_queryset(self):
        """
        Filter orders:
        - Consumers see orders they placed.
        - Suppliers see orders received.
        """
        if getattr(self, 'swagger_fake_view', False):
            return Order.objects.none()

        user = self.request.user
        if user.consumer:
            return Order.objects.filter(consumer=user.consumer)
        elif user.supplier:
            return Order.objects.filter(supplier=user.supplier)

        return Order.objects.none()

    def create(self, request, *args, **kwargs):
        # Override create to return the ReadSerializer
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()

        # Return full details instead of just IDs
        read_serializer = OrderReadSerializer(order)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)

    def perform_update(self, serializer):
        """
        Handle Status Changes and Restocking Logic.
        """
        user = self.request.user
        if not user.supplier:
            raise exceptions.PermissionDenied("Only Suppliers can update order status.")

        # Get the previous status from the DB before saving
        instance = serializer.instance
        old_status = instance.status
        new_status = serializer.validated_data.get('status')

        with transaction.atomic():
            # Save the new status
            serializer.save()

            # Logic: If order is cancelled/declined, RESTOCK the items
            if new_status in [OrderStatus.DECLINED, OrderStatus.CANCELED] and old_status != new_status:
                for item in instance.items.all():
                    product = item.product
                    product.stock_level += item.quantity
                    product.save()