"""
Password Reset Token model for handling forgot password functionality
"""
import secrets
from datetime import timedelta
from django.db import models
from django.utils import timezone
from django.conf import settings
from core.database.base_model import BaseModel


class PasswordResetToken(BaseModel):
    """
    Token model for password reset functionality

    Stores secure tokens for password reset with expiration
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='password_reset_tokens',
        help_text='User requesting password reset'
    )

    token = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        help_text='Secure token for password reset'
    )

    expires_at = models.DateTimeField(
        help_text='Token expiration time'
    )

    used_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='When token was used (null if not used)'
    )

    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text='IP address of requester'
    )

    user_agent = models.CharField(
        max_length=500,
        null=True,
        blank=True,
        help_text='Browser user agent'
    )

    class Meta:
        db_table = 'password_reset_tokens'
        verbose_name = 'Password Reset Token'
        verbose_name_plural = 'Password Reset Tokens'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['token', 'expires_at']),
            models.Index(fields=['user', 'created_at']),
        ]

    def __str__(self):
        return f"Password reset token for {self.user.email}"

    @staticmethod
    def generate_token():
        """Generate a secure random token"""
        return secrets.token_urlsafe(32)

    @classmethod
    def create_token(cls, user, ip_address=None, user_agent=None):
        """
        Create a new password reset token for user

        Args:
            user: User instance
            ip_address: Optional IP address
            user_agent: Optional user agent string

        Returns:
            PasswordResetToken instance
        """
        # Invalidate all previous unused tokens for this user
        cls.objects.filter(
            user=user,
            used_at__isnull=True,
            expires_at__gt=timezone.now()
        ).update(expires_at=timezone.now())

        # Create new token
        token = cls.generate_token()
        expires_at = timezone.now() + timedelta(seconds=settings.PASSWORD_RESET_TIMEOUT)

        return cls.objects.create(
            user=user,
            token=token,
            expires_at=expires_at,
            ip_address=ip_address,
            user_agent=user_agent
        )

    def is_valid(self):
        """
        Check if token is valid (not used and not expired)

        Returns:
            bool: True if valid, False otherwise
        """
        if self.used_at is not None:
            return False

        if timezone.now() > self.expires_at:
            return False

        return True

    def mark_as_used(self):
        """Mark token as used"""
        self.used_at = timezone.now()
        self.save(update_fields=['used_at'])

    @property
    def is_expired(self):
        """Check if token has expired"""
        return timezone.now() > self.expires_at

    @property
    def is_used(self):
        """Check if token has been used"""
        return self.used_at is not None

    @property
    def time_remaining(self):
        """Get remaining time before expiration"""
        if self.is_expired:
            return timedelta(0)
        return self.expires_at - timezone.now()
