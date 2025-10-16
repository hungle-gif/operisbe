"""
Chat model for project communication
"""
from django.db import models
from core.database.base_model import BaseModel
from apps.users.models import User
from .project import Project


class ChatMessage(BaseModel):
    """Chat message for project communication between customer and sales"""

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='chat_messages'
    )

    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sent_messages'
    )

    message = models.TextField()

    # Attachments (optional)
    attachments = models.JSONField(
        default=list,
        help_text="List of file URLs attached to this message"
    )

    # Read status
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)

    # Message type
    class MessageType(models.TextChoices):
        TEXT = 'text', 'Text'
        FILE = 'file', 'File'
        SYSTEM = 'system', 'System Notification'

    message_type = models.CharField(
        max_length=20,
        choices=MessageType.choices,
        default=MessageType.TEXT
    )

    class Meta:
        db_table = 'chat_messages'
        verbose_name = 'Chat Message'
        verbose_name_plural = 'Chat Messages'
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender.full_name}: {self.message[:50]}"


class ChatParticipant(BaseModel):
    """Track participants and their last read time in project chat"""

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='chat_participants'
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='chat_participations'
    )

    last_read_at = models.DateTimeField(null=True, blank=True)
    is_typing = models.BooleanField(default=False)

    class Meta:
        db_table = 'chat_participants'
        verbose_name = 'Chat Participant'
        verbose_name_plural = 'Chat Participants'
        unique_together = ['project', 'user']

    def __str__(self):
        return f"{self.user.full_name} in {self.project.name}"
