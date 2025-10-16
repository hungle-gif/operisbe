"""
Project Handover Feedback Model
Stores customer feedback, ratings, complaints, feature requests after project completion
"""
import uuid
from django.db import models
from django.utils import timezone


class ProjectFeedback(models.Model):
    """
    Customer feedback for project acceptance/completion
    This is created when customer reviews the project (acceptance stage)
    """

    ACCEPTANCE_STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected - Needs Revision'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        'Project',
        on_delete=models.CASCADE,
        related_name='feedbacks'
    )
    customer = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='project_feedbacks'
    )

    # Acceptance Status
    acceptance_status = models.CharField(
        max_length=20,
        choices=ACCEPTANCE_STATUS_CHOICES,
        default='pending',
        help_text="Acceptance decision: accept or request changes"
    )
    accepted_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When customer accepted the project"
    )
    rejected_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When customer rejected (requested revisions)"
    )

    # Rating (1-5 stars) - only required if accepting
    rating = models.IntegerField(
        blank=True,
        null=True,
        help_text="Project rating from 1 to 5 stars",
        choices=[(i, f"{i} stars") for i in range(1, 6)]
    )

    # General feedback
    feedback = models.TextField(
        help_text="General feedback about the project"
    )

    # Complaint / Revision Requests (if rejecting)
    complaint = models.TextField(
        blank=True,
        null=True,
        help_text="Issues or problems that need to be fixed"
    )
    revision_details = models.TextField(
        blank=True,
        null=True,
        help_text="Detailed list of changes/fixes required"
    )

    # Feature requests (future enhancements)
    feature_request = models.TextField(
        blank=True,
        null=True,
        help_text="Additional features customer wants"
    )

    # Upgrade/Maintenance requests
    upgrade_request = models.TextField(
        blank=True,
        null=True,
        help_text="System upgrade or maintenance requests"
    )

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Admin/Sales response
    admin_response = models.TextField(
        blank=True,
        null=True,
        help_text="Admin/Sales response to feedback or revision completion"
    )
    admin_responded_at = models.DateTimeField(
        blank=True,
        null=True
    )
    responded_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='feedback_responses'
    )

    # Revision tracking
    revision_completed = models.BooleanField(
        default=False,
        help_text="Has the requested revision been completed"
    )
    revision_completed_at = models.DateTimeField(
        blank=True,
        null=True
    )

    class Meta:
        db_table = 'project_feedbacks'
        ordering = ['-created_at']
        verbose_name = 'Project Feedback'
        verbose_name_plural = 'Project Feedbacks'

    def __str__(self):
        return f"Feedback for {self.project.name} - {self.rating} stars"
