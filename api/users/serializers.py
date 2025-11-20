from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction
from companies.models import Supplier, Consumer

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):

    password = serializers.CharField(write_only=True)

    company_name = serializers.CharField(write_only=True)
    company_address = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'password', 'role', 'company_name', 'company_address')

    def create(self, validated_data):
        company_name = validated_data.pop('company_name')
        company_address = validated_data.pop('company_address')
        role = validated_data.get('role')
        password = validated_data.pop('password')

        with transaction.atomic():
            # Create a company based on role
            supplier = None
            consumer = None

            if role == 'OWNER':
                # Owners create a Supplier company
                supplier = Supplier.objects.create(
                    company_name=company_name,
                    address=company_address
                )
            elif role == 'CONSUMER':
                # Consumers create a Consumer company
                consumer = Consumer.objects.create(
                    company_name=company_name,
                    address=company_address
                )

            # Create the User
            user = User.objects.create(**validated_data)
            user.set_password(password)  # Hash the password

            # Link User to the Company
            if supplier:
                user.supplier = supplier
            if consumer:
                user.consumer = consumer

            user.save()
            return user

class UserSerializer(serializers.ModelSerializer):

    company_id = serializers.SerializerMethodField()
    company_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'email', 'role', 'company_id', 'company_name')

    def get_company_id(self, obj):
        # Return the ID of whichever company they are linked to
        if obj.supplier:
            return obj.supplier.id
        if obj.consumer:
            return obj.consumer.id
        return None

    def get_company_name(self, obj):
        if obj.supplier:
            return obj.supplier.company_name
        if obj.consumer:
            return obj.consumer.company_name
        return None