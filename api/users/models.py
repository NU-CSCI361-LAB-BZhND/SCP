from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager

# Create your models here.
# User roles
class UserRole(models.TextChoices):
    OWNER = 'OWNER', 'Owner'
    MANAGER = 'MANAGER', 'Manager'
    SALES_REP = 'SALES_REP', 'Sales Representative'
    CONSUMER = 'CONSUMER', 'Consumer'

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    # Create superuser
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', UserRole.OWNER)  # Set default role for superuser

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    username = None # We use email as username
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.CONSUMER)
    supplier = models.ForeignKey(
        'companies.Supplier',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='staff'
    )
    consumer = models.ForeignKey(
        'companies.Consumer',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='staff'
    )
    USERNAME_FIELD = 'email' # We use email as username
    REQUIRED_FIELDS = []
    objects = CustomUserManager()

    def __str__(self):
        return self.email

