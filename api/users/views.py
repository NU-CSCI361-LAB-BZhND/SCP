from drf_spectacular.utils import extend_schema
from rest_framework import generics, status, permissions, viewsets, exceptions
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from .serializers import UserRegistrationSerializer, UserSerializer
from .models import User, UserRole
from .permissions import IsOwnerUser, IsOwnerOrManager

# Create your views here.

# Endpoint
class RegisterView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]  # Open to the public

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            "email": user.email,
            "role": user.role,
            "message": "User and Company created successfully",
        }, status=status.HTTP_201_CREATED)


class ManageUserView(generics.RetrieveAPIView):
    """
    GET /api/auth/me/
    Returns the authenticated user's profile.
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]  # Only logged-in users can call this

    def get_object(self):
        # Return the user who made the request
        return self.request.user


class StaffViewSet(viewsets.ModelViewSet):
    """
    Allows Owners to create and manage their staff (Managers/Sales Reps).
    """
    permission_classes = [IsOwnerOrManager]
    queryset = User.objects.none()

    def get_queryset(self):
        return User.objects.filter(supplier=self.request.user.supplier).exclude(id=self.request.user.id)

    def get_serializer_class(self):
        # Short serializer
        from rest_framework import serializers
        class StaffCreateSerializer(serializers.ModelSerializer):
            password = serializers.CharField(write_only=True)

            class Meta:
                model = User
                fields = ('id', 'email', 'password', 'first_name', 'last_name', 'role', 'is_active')
                read_only_fields = ['is_active']

            def validate_role(self, value):
                user = self.context["request"].user
                if value not in [UserRole.MANAGER, UserRole.SALES_REP]:
                    raise serializers.ValidationError("You can only create Managers or Sales Reps.")

                if user.role == UserRole.MANAGER and value == UserRole.MANAGER:
                    raise serializers.ValidationError("Managers cannot create other Managers.")
                return value

            def create(self, validated_data):
                # Auto assign the Owner's supplier
                owner = self.context['request'].user
                validated_data['supplier'] = owner.supplier

                user = User.objects.create_user(**validated_data)
                return user

        return StaffCreateSerializer

    def perform_destroy(self, instance):
        user = self.request.user

        if user.role == UserRole.MANAGER:
            if instance.role in [UserRole.MANAGER, UserRole.OWNER]:
                raise exceptions.PermissionDenied("Managers can only remove Sales Representatives.")

        instance.is_active = False
        instance.save()

class DeleteAccountView(APIView):
    """
        Owner deletes supplier account.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Owner Delete Account",
        description="Soft deletes the Supplier company and all associated staff.",
        request=None,  # Explicitly tell Swagger there is no request body
        responses={204: None}  # Explicitly tell Swagger the response is 204 No Content
    )
    def delete(self, request):
        user = request.user

        # Identify the Company
        company = None
        if user.supplier:
            company = user.supplier
        elif user.consumer:
            company = user.consumer

        if not company:
            return Response({"error": "No company linked to this user."}, status=status.HTTP_400_BAD_REQUEST)

        # Only Owners can delete the company
        if user.supplier and user.role != UserRole.OWNER:
            return Response({"error": "Only the Owner can delete the Supplier account."},
                            status=status.HTTP_403_FORBIDDEN)


        company.is_active = False
        company.save()

        # Deactivate All Associated Users
        # If Supplier: Deactivate Owner + Managers + Sales Reps
        if user.supplier:
            staff_members = User.objects.filter(supplier=company)
            for staff in staff_members:
                staff.is_active = False
                staff.save()

        # If Consumer: Deactivate just the user
        elif user.consumer:
            user.is_active = False
            user.save()

        return Response({"message": "Account deactivated and data archived."}, status=status.HTTP_204_NO_CONTENT)


