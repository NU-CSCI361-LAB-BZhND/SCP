from rest_framework import serializers
from .models import Complaint, ChatThread, ChatMessage
from orders.models import Order

class ComplaintSerializer(serializers.ModelSerializer):
    created_by_email = serializers.CharField(source='created_by.email', read_only=True)
    order = serializers.PrimaryKeyRelatedField(queryset=Order.objects.all())

    class Meta:
        model = Complaint
        fields = [
            'id', 'order', 'created_by_email',
            'subject', 'description', 'status',
            'escalation_level', 'created_at'
        ]
        read_only_fields = ['status', 'escalation_level', 'created_by_email']

    def validate_order(self, value):
        user = self.context['request'].user
        if user.consumer and value.consumer != user.consumer:
            raise serializers.ValidationError("You can only file complaints for your own orders.")
        return value

class ComplaintUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Complaint
        fields = ['status', 'escalation_level']


class ChatMessageSerializer(serializers.ModelSerializer):
    sender_email = serializers.CharField(source='sender.email', read_only=True)
    sender_role = serializers.CharField(source='sender.role', read_only=True)

    class Meta:
        model = ChatMessage
        fields = ['id', 'thread', 'sender', 'sender_email', 'sender_role', 'text', 'file', 'is_read', 'created_at']
        read_only_fields = ['thread', 'sender', 'is_read']


class ChatThreadSerializer(serializers.ModelSerializer):
    consumer_name = serializers.CharField(source='consumer.company_name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.company_name', read_only=True)
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = ChatThread
        fields = [
            'id', 'consumer', 'consumer_name', 'supplier', 'supplier_name',
            'updated_at', 'last_message', 'escalation_level'
        ]
        read_only_fields = ['escalation_level']
        extra_kwargs = {
            'consumer': {'required': False},
            'supplier': {'required': False}
        }
        validators = []

    def get_last_message(self, obj):
        last_msg = obj.messages.last()
        if last_msg:
            return ChatMessageSerializer(last_msg).data
        return None