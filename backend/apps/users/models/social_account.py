"""
Social Account model for OAuth provider connections
"""
from django.db import models
from django.conf import settings
from django.utils import timezone
from core.database.base_model import BaseModel


class SocialProvider(models.TextChoices):
    """Supported social authentication providers"""
    GOOGLE = 'google', 'Google'
    FACEBOOK = 'facebook', 'Facebook'
    GITHUB = 'github', 'GitHub'
    # Add more providers as needed


class SocialAccount(BaseModel):
    """
    Social account linking for OAuth providers

    Stores OAuth tokens and provider user information
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='social_accounts',
        help_text='User associated with this social account'
    )

    provider = models.CharField(
        max_length=50,
        choices=SocialProvider.choices,
        help_text='OAuth provider name (google, facebook, etc.)'
    )

    provider_user_id = models.CharField(
        max_length=255,
        help_text='Unique user ID from the provider'
    )

    access_token = models.TextField(
        help_text='OAuth access token (encrypted in production)'
    )

    refresh_token = models.TextField(
        null=True,
        blank=True,
        help_text='OAuth refresh token (encrypted in production)'
    )

    token_expires_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='When the access token expires'
    )

    profile_data = models.JSONField(
        default=dict,
        help_text='Cached user profile data from provider'
    )

    email = models.EmailField(
        help_text='Email from provider (for matching)'
    )

    is_primary = models.BooleanField(
        default=False,
        help_text='Is this the primary login method'
    )

    last_login_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Last time this social account was used to login'
    )

    class Meta:
        db_table = 'social_accounts'
        verbose_name = 'Social Account'
        verbose_name_plural = 'Social Accounts'
        ordering = ['-created_at']
        unique_together = [('provider', 'provider_user_id')]
        indexes = [
            models.Index(fields=['user', 'provider']),
            models.Index(fields=['provider', 'provider_user_id']),
            models.Index(fields=['email']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.provider} ({self.provider_user_id})"

    @property
    def is_token_expired(self):
        """Check if access token has expired"""
        if not self.token_expires_at:
            return False
        return timezone.now() >= self.token_expires_at

    def update_last_login(self):
        """Update last login timestamp"""
        self.last_login_at = timezone.now()
        self.save(update_fields=['last_login_at'])

    def update_tokens(self, access_token, refresh_token=None, expires_in=None):
        """
        Update OAuth tokens

        Args:
            access_token: New access token
            refresh_token: New refresh token (optional)
            expires_in: Seconds until token expires (optional)
        """
        self.access_token = access_token

        if refresh_token:
            self.refresh_token = refresh_token

        if expires_in:
            from datetime import timedelta
            self.token_expires_at = timezone.now() + timedelta(seconds=expires_in)

        self.save(update_fields=['access_token', 'refresh_token', 'token_expires_at'])

    @classmethod
    def get_or_create_for_user(cls, user, provider, provider_user_id, **kwargs):
        """
        Get or create social account for user

        Args:
            user: User instance
            provider: Provider name (google, facebook, etc.)
            provider_user_id: Unique ID from provider
            **kwargs: Additional fields (access_token, profile_data, etc.)

        Returns:
            Tuple of (SocialAccount instance, created boolean)
        """
        social_account, created = cls.objects.get_or_create(
            user=user,
            provider=provider,
            provider_user_id=provider_user_id,
            defaults=kwargs
        )

        if not created:
            # Update existing account
            for key, value in kwargs.items():
                setattr(social_account, key, value)
            social_account.save()

        return social_account, created

    @classmethod
    def find_by_provider(cls, provider, provider_user_id):
        """
        Find social account by provider and provider user ID

        Args:
            provider: Provider name
            provider_user_id: Unique ID from provider

        Returns:
            SocialAccount instance or None
        """
        try:
            return cls.objects.select_related('user').get(
                provider=provider,
                provider_user_id=provider_user_id
            )
        except cls.DoesNotExist:
            return None

    @classmethod
    def find_by_email(cls, provider, email):
        """
        Find social account by provider and email

        Args:
            provider: Provider name
            email: Email address

        Returns:
            SocialAccount instance or None
        """
        try:
            return cls.objects.select_related('user').get(
                provider=provider,
                email=email
            )
        except cls.DoesNotExist:
            return None
