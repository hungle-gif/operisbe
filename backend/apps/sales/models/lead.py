"""
Lead and Deal models for sales management
"""
from django.db import models
from core.database.base_model import BaseModel
from apps.users.models import User


class LeadStatus(models.TextChoices):
    """Lead status choices"""
    NEW = 'new', 'New'
    CONTACTED = 'contacted', 'Contacted'
    QUALIFIED = 'qualified', 'Qualified'
    UNQUALIFIED = 'unqualified', 'Unqualified'
    CONVERTED = 'converted', 'Converted'
    LOST = 'lost', 'Lost'


class LeadSource(models.TextChoices):
    """Lead source choices"""
    WEBSITE = 'website', 'Website'
    REFERRAL = 'referral', 'Referral'
    SOCIAL_MEDIA = 'social_media', 'Social Media'
    EMAIL = 'email', 'Email'
    PHONE = 'phone', 'Phone'
    EVENT = 'event', 'Event'
    OTHER = 'other', 'Other'


class Lead(BaseModel):
    """Lead model for managing sales leads"""
    
    # Contact information
    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20, null=True, blank=True)
    company_name = models.CharField(max_length=255, null=True, blank=True)
    
    # Lead details
    status = models.CharField(
        max_length=20,
        choices=LeadStatus.choices,
        default=LeadStatus.NEW
    )
    source = models.CharField(
        max_length=20,
        choices=LeadSource.choices,
        default=LeadSource.WEBSITE
    )
    
    # Assignment
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_leads'
    )
    
    # Additional info
    description = models.TextField(null=True, blank=True)
    estimated_budget = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True
    )
    expected_close_date = models.DateField(null=True, blank=True)
    
    class Meta:
        db_table = 'leads'
        verbose_name = 'Lead'
        verbose_name_plural = 'Leads'
    
    def __str__(self):
        return f"{self.full_name} - {self.company_name or 'No Company'}"


class DealStage(models.TextChoices):
    """Deal stage choices"""
    QUALIFICATION = 'qualification', 'Qualification'
    PROPOSAL = 'proposal', 'Proposal'
    NEGOTIATION = 'negotiation', 'Negotiation'
    CLOSED_WON = 'closed_won', 'Closed Won'
    CLOSED_LOST = 'closed_lost', 'Closed Lost'


class Deal(BaseModel):
    """Deal model for managing sales opportunities"""
    
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    
    # Related lead (optional)
    lead = models.ForeignKey(
        Lead,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='deals'
    )
    
    # Deal details
    stage = models.CharField(
        max_length=20,
        choices=DealStage.choices,
        default=DealStage.QUALIFICATION
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    probability = models.IntegerField(default=0)  # 0-100%
    
    # Assignment
    owner = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='owned_deals'
    )
    
    # Dates
    expected_close_date = models.DateField(null=True, blank=True)
    actual_close_date = models.DateField(null=True, blank=True)
    
    class Meta:
        db_table = 'deals'
        verbose_name = 'Deal'
        verbose_name_plural = 'Deals'
    
    def __str__(self):
        return self.name
