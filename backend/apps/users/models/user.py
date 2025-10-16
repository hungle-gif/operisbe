"""
User model with role-based access
"""
import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from core.database.base_model import BaseModel
from core.database.mixins import ActiveMixin


class UserRole(models.TextChoices):
    """User roles in the system"""
    ADMIN = 'admin', 'Admin'
    SALE = 'sale', 'Sale'
    DEV = 'dev', 'Developer'
    CUSTOMER = 'customer', 'Customer'


class UserManager(BaseUserManager):
    """Custom user manager"""
    
    def create_user(self, email, password=None, **extra_fields):
        """Create and return a regular user"""
        if not email:
            raise ValueError('Email is required')
        
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """Create and return a superuser"""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', UserRole.ADMIN)
        
        return self.create_user(email, password, **extra_fields)


class User(BaseModel, AbstractBaseUser, PermissionsMixin, ActiveMixin):
    """Custom user model"""
    
    email = models.EmailField(unique=True, max_length=255)
    username = models.CharField(max_length=150, unique=True, null=True, blank=True)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, null=True, blank=True)
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.CUSTOMER
    )
    
    # Profile fields
    avatar = models.URLField(null=True, blank=True)
    bio = models.TextField(null=True, blank=True)
    
    # Permissions
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    
    # Timestamps handled by BaseModel
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return self.email
    
    @property
    def is_admin(self):
        return self.role == UserRole.ADMIN
    
    @property
    def is_sale(self):
        return self.role == UserRole.SALE
    
    @property
    def is_dev(self):
        return self.role == UserRole.DEV
    
    @property
    def is_customer(self):
        return self.role == UserRole.CUSTOMER
