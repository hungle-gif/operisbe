"""
Database mixins for common functionality
"""
from django.db import models


class SoftDeleteMixin(models.Model):
    """
    Mixin for soft delete functionality
    """
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        abstract = True

    def soft_delete(self):
        """Soft delete the instance"""
        from django.utils import timezone
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()

    def restore(self):
        """Restore soft deleted instance"""
        self.is_deleted = False
        self.deleted_at = None
        self.save()


class ActiveMixin(models.Model):
    """
    Mixin for active/inactive status
    """
    is_active = models.BooleanField(default=True)

    class Meta:
        abstract = True
