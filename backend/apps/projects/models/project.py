"""
Project model
"""
from django.db import models
from core.database.base_model import BaseModel
from apps.users.models import User
from apps.customers.models import Customer


class ProjectStatus(models.TextChoices):
    """Project status choices"""
    NEGOTIATION = 'negotiation', 'Đang thương thảo'  # Initial negotiation phase
    DEPOSIT = 'deposit', 'Chờ đặt cọc'  # Customer accepted, waiting for deposit payment
    PENDING = 'pending', 'Chờ xử lý'  # Deprecated, kept for backward compatibility
    IN_PROGRESS = 'in_progress', 'Đang thực hiện'  # Active development after deposit confirmed
    ON_HOLD = 'on_hold', 'Tạm dừng'
    PENDING_ACCEPTANCE = 'pending_acceptance', 'Chờ nghiệm thu'  # All phases paid, waiting for customer acceptance
    REVISION_REQUIRED = 'revision_required', 'Yêu cầu sửa chữa'  # Customer rejected, needs fixes
    COMPLETED = 'completed', 'Hoàn thành'  # Customer accepted, project completed
    CANCELLED = 'cancelled', 'Đã hủy'


class ProjectPriority(models.TextChoices):
    """Project priority choices"""
    LOW = 'low', 'Low'
    MEDIUM = 'medium', 'Medium'
    HIGH = 'high', 'High'
    URGENT = 'urgent', 'Urgent'


class Project(BaseModel):
    """Project model for managing software projects"""
    
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    
    # Customer relationship
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name='projects'
    )
    
    # Project manager (usually a sale or admin)
    project_manager = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='managed_projects'
    )
    
    # Team members (developers)
    team_members = models.ManyToManyField(
        User,
        related_name='assigned_projects',
        blank=True
    )
    
    # Project details
    status = models.CharField(
        max_length=20,
        choices=ProjectStatus.choices,
        default=ProjectStatus.PENDING
    )
    priority = models.CharField(
        max_length=20,
        choices=ProjectPriority.choices,
        default=ProjectPriority.MEDIUM
    )
    
    # Timeline
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    estimated_hours = models.IntegerField(null=True, blank=True)
    
    # Budget
    budget = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True
    )
    
    # Repository & deployment
    repository_url = models.URLField(null=True, blank=True)
    staging_url = models.URLField(null=True, blank=True)
    production_url = models.URLField(null=True, blank=True)
    
    class Meta:
        db_table = 'projects'
        verbose_name = 'Project'
        verbose_name_plural = 'Projects'
    
    def __str__(self):
        return self.name
