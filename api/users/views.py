from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .serializers import UserRegistrationSerializer, UserSerializer

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
