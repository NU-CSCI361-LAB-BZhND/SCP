from rest_framework import serializers
from .models import Product

class ProductSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(
        source='supplier.company_name',
        read_only=True
    )
    # image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id',
            'supplier',
            'supplier_name',
            'name',
            'description',
            'price',
            'unit',
            'stock_level',
            'discount_price',
            'min_order_qty'
            'is_available',
            'image',
            # 'image_url'
        ]

        read_only_fields = ['supplier']

    # def get_image_url(self, obj):
    #     request = self.context.get('request')
    #     if obj.image and request:
    #         return request.build_absolute_uri(obj.image.url)
    #     return None
