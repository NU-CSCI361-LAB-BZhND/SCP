from rest_framework import serializers
from .models import Product

class ProductSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(
        source='supplier.companyName',
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
            'isAvailable',
            # 'image',
            # 'image_url'
        ]

    # def get_image_url(self, obj):
    #     request = self.context.get('request')
    #     if obj.image and request:
    #         return request.build_absolute_uri(obj.image.url)
    #     return None
