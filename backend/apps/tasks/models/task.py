"""
Task model for project tasks
"""
from django.db import models
from core.database.base_model import BaseModel
from apps.users.models import User
from apps.projects.models import Project


class TaskStatus(models.TextChoices):
    """Task status choices"""
    TODO = 'todo', 'To Do'
    IN_PROGRESS = 'in_progress', 'In Progress'
    IN_REVIEW = 'in_review', 'In Review'
    TESTING = 'testing', 'Testing'
    DONE = 'done', 'Done'
    BLOCKED = 'blocked', 'Blocked'


class TaskPriority(models.TextChoices):
    """Task priority choices"""
    LOW = 'low', 'Low'
    MEDIUM = 'medium', 'Medium'
    HIGH = 'high', 'High'
    URGENT = 'urgent', 'Urgent'


class Task(BaseModel):
    """Task model for managing development tasks"""
    
    title = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    
    # Relationships
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='tasks'
    )
    
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tasks'
    )
    
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_tasks'
    )
    
    # Task details
    status = models.CharField(
        max_length=20,
        choices=TaskStatus.choices,
        default=TaskStatus.TODO
    )
    priority = models.CharField(
        max_length=20,
        choices=TaskPriority.choices,
        default=TaskPriority.MEDIUM
    )
    
    # Time tracking
    estimated_hours = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True
    )
    actual_hours = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True
    )
    
    # Dates
    due_date = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Additional
    tags = models.JSONField(default=list, blank=True)
    attachments = models.JSONField(default=list, blank=True)
    
    class Meta:
        db_table = 'tasks'
        verbose_name = 'Task'
        verbose_name_plural = 'Tasks'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
