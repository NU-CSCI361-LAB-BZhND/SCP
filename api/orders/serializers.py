from rest_framework import serializers
from django.db import transaction
from .models import Order, OrderItem
from products.models import Product
from companies.models import Link, LinkStatus


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_unit = serializers.CharField(source='product.unit', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'product_unit', 'quantity', 'price_at_time_of_order', 'total_price']


class OrderReadSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    supplier_name = serializers.CharField(source='supplier.company_name', read_only=True)
    consumer_name = serializers.CharField(source='consumer.company_name', read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'status', 'total_amount', 'created_at', 'supplier', 'supplier_name', 'consumer',
                  'consumer_name', 'items']


class OrderItemCreateSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField()


class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemCreateSerializer(many=True)

    class Meta:
        model = Order
        fields = ['supplier', 'items']

    def validate(self, attrs):
        """
        Check: Does the link exist and is it ACCEPTED?
        """
        user = self.context['request'].user
        supplier = attrs['supplier']

        if not user.consumer:
            raise serializers.ValidationError("Only Consumers can place orders.")

        has_link = Link.objects.filter(
            consumer=user.consumer,
            supplier=supplier,
            status=LinkStatus.ACCEPTED
        ).exists()

        if not has_link:
            raise serializers.ValidationError("You do not have an active link with this Supplier.")

        return attrs

    def create(self, validated_data):
        """
        The Transactional Logic:
        1. Create Order
        2. Loop items -> Check Stock -> Deduct Stock -> Create OrderItem
        3. Calculate Total
        """
        items_data = validated_data.pop('items')
        consumer = self.context['request'].user.consumer
        supplier = validated_data['supplier']

        # Atomic Block: If anything fails here, DB rolls back to start
        with transaction.atomic():
            order = Order.objects.create(consumer=consumer, supplier=supplier, total_amount=0)
            total_amount = 0

            for item in items_data:
                product_id = item['product_id']
                quantity = item['quantity']

                try:
                    product = Product.objects.select_for_update().get(id=product_id, supplier=supplier)
                except Product.DoesNotExist:
                    raise serializers.ValidationError(f"Product {product_id} not found or belongs to another supplier.")

                if quantity < 1:
                    raise serializers.ValidationError(f"You have to order at least 1 item.")

                if product.stock_level < quantity:
                    raise serializers.ValidationError(
                        f"Insufficient stock for {product.name}. Available: {product.stock_level}")

                product.stock_level -= quantity
                product.save()

                price = product.price
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=quantity,
                    price_at_time_of_order=price
                )

                total_amount += (price * quantity)

            order.total_amount = total_amount
            order.save()

            return order

class OrderUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['status']

    def validate(self, value):
        return value