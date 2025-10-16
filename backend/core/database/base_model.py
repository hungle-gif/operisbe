"""
Base model with UUID primary key and timestamps
"""
import uuid
from django.db import models


class BaseModel(models.Model):
    """
    Abstract base model with UUID primary key and timestamps
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ['-created_at']

    def __str__(self):
        return str(self.id)
