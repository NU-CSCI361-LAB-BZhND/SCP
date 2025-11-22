from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied

from .models import Link, Supplier, Consumer


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ['id', 'company_name', 'address', 'subscription_status']


class ConsumerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Consumer
        fields = ['id', 'company_name', 'address']


class LinkSerializer(serializers.ModelSerializer):
    supplier = SupplierSerializer(read_only=True)
    consumer = ConsumerSerializer(read_only=True)

    class Meta:
        model = Link
        fields = ['id', 'supplier', 'consumer', 'status', 'created_at']


class LinkCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Link
        fields = ['id', 'supplier', 'status']
        read_only_fields = ['status']  # Status is always PENDING on creation

    def validate(self, attributes):
        # Check if this link already exists
        user = self.context['request'].user
        supplier = attributes['supplier']

        if not user.consumer:
            raise PermissionDenied("Only Consumers can request links.")

        if Link.objects.filter(consumer=user.consumer, supplier=supplier).exists():
            raise serializers.ValidationError("A link request to this Supplier already exists.")

        return attributes