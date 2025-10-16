"""
Customer model - extended profile for customer users
"""
from django.db import models
from core.database.base_model import BaseModel
from apps.users.models import User


class Customer(BaseModel):
    """
    Customer profile model
    Extends User model with customer-specific fields
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='customer_profile'
    )
    company_name = models.CharField(max_length=255, null=True, blank=True)
    company_website = models.URLField(null=True, blank=True)
    industry = models.CharField(max_length=100, null=True, blank=True)
    company_size = models.CharField(max_length=50, null=True, blank=True)
    
    # Contact information
    address = models.TextField(null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    country = models.CharField(max_length=100, null=True, blank=True)
    postal_code = models.CharField(max_length=20, null=True, blank=True)
    
    # Business information
    tax_id = models.CharField(max_length=50, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    
    class Meta:
        db_table = 'customers'
        verbose_name = 'Customer'
        verbose_name_plural = 'Customers'
    
    def __str__(self):
        return f"{self.company_name or self.user.full_name} - {self.user.email}"
