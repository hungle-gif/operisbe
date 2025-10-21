"""
Password Reset Service
Handles forgot password, reset password logic and email sending
"""
from typing import Optional, Dict
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.utils import timezone

from apps.users.models import User, PasswordResetToken
from apps.users.repositories.user_repository import UserRepository
from api.exceptions.base_exception import ValidationException, NotFoundException


class PasswordResetService:
    """
    Service for password reset operations

    Handles:
    - Generating reset tokens
    - Sending reset emails
    - Verifying tokens
    - Resetting passwords
    """

    def __init__(self):
        self.user_repo = UserRepository()

    def request_password_reset(
        self,
        email: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Dict[str, str]:
        """
        Request password reset for email

        Args:
            email: User's email address
            ip_address: Optional IP address of requester
            user_agent: Optional browser user agent

        Returns:
            Dict with success message

        Note:
            Always returns success message even if email doesn't exist
            (for security - don't reveal which emails are registered)
        """
        # Try to find user by email
        user = self.user_repo.get_by_email(email)

        # If user doesn't exist, still return success (security)
        if not user:
            return {
                'success': True,
                'message': 'If the email exists, a password reset link has been sent'
            }

        # Check if user is active
        if not user.is_active:
            return {
                'success': True,
                'message': 'If the email exists, a password reset link has been sent'
            }

        # Create reset token
        reset_token = PasswordResetToken.create_token(
            user=user,
            ip_address=ip_address,
            user_agent=user_agent
        )

        # Send reset email
        self._send_reset_email(user, reset_token)

        return {
            'success': True,
            'message': 'If the email exists, a password reset link has been sent'
        }

    def verify_reset_token(self, token: str) -> Dict:
        """
        Verify if reset token is valid

        Args:
            token: Reset token string

        Returns:
            Dict with validation result

        Raises:
            ValidationException: If token is invalid
        """
        try:
            reset_token = PasswordResetToken.objects.select_related('user').get(
                token=token
            )
        except PasswordResetToken.DoesNotExist:
            raise ValidationException('Invalid or expired reset token')

        # Check if token is valid
        if not reset_token.is_valid():
            if reset_token.is_used:
                raise ValidationException('This reset link has already been used')
            elif reset_token.is_expired:
                raise ValidationException('This reset link has expired')
            else:
                raise ValidationException('Invalid reset token')

        return {
            'valid': True,
            'message': 'Token is valid',
            'email': reset_token.user.email,
            'expires_in_minutes': int(reset_token.time_remaining.total_seconds() / 60)
        }

    def reset_password(self, token: str, new_password: str) -> Dict:
        """
        Reset password using valid token

        Args:
            token: Reset token string
            new_password: New password to set

        Returns:
            Dict with success message

        Raises:
            ValidationException: If token is invalid
        """
        try:
            reset_token = PasswordResetToken.objects.select_related('user').get(
                token=token
            )
        except PasswordResetToken.DoesNotExist:
            raise ValidationException('Invalid or expired reset token')

        # Verify token is valid
        if not reset_token.is_valid():
            if reset_token.is_used:
                raise ValidationException('This reset link has already been used')
            elif reset_token.is_expired:
                raise ValidationException('This reset link has expired')
            else:
                raise ValidationException('Invalid reset token')

        # Get user
        user = reset_token.user

        # Check if user is active
        if not user.is_active:
            raise ValidationException('Account is inactive')

        # Set new password
        user.set_password(new_password)
        user.save(update_fields=['password'])

        # Mark token as used
        reset_token.mark_as_used()

        # Invalidate all other unused tokens for this user
        PasswordResetToken.objects.filter(
            user=user,
            used_at__isnull=True
        ).exclude(
            id=reset_token.id
        ).update(
            expires_at=timezone.now()
        )

        # Send confirmation email
        self._send_password_changed_email(user)

        return {
            'success': True,
            'message': 'Password has been reset successfully'
        }

    def change_password(
        self,
        user: User,
        old_password: str,
        new_password: str
    ) -> Dict:
        """
        Change password for authenticated user

        Args:
            user: User instance
            old_password: Current password
            new_password: New password

        Returns:
            Dict with success message

        Raises:
            ValidationException: If old password is incorrect
        """
        # Verify old password
        if not user.check_password(old_password):
            raise ValidationException('Current password is incorrect')

        # Check if new password is same as old
        if old_password == new_password:
            raise ValidationException('New password must be different from current password')

        # Set new password
        user.set_password(new_password)
        user.save(update_fields=['password'])

        # Send confirmation email
        self._send_password_changed_email(user)

        return {
            'success': True,
            'message': 'Password has been changed successfully'
        }

    def _send_reset_email(self, user: User, reset_token: PasswordResetToken):
        """
        Send password reset email to user

        Args:
            user: User instance
            reset_token: PasswordResetToken instance
        """
        # Build reset URL
        frontend_url = settings.FRONTEND_URL
        reset_url = f"{frontend_url}/reset-password?token={reset_token.token}"

        # Calculate expiry time in minutes
        expiry_minutes = int(settings.PASSWORD_RESET_TIMEOUT / 60)

        # Context for email template
        context = {
            'user': user,
            'reset_url': reset_url,
            'expiry_minutes': expiry_minutes,
            'site_name': 'Operis',
            'support_email': settings.DEFAULT_FROM_EMAIL,
        }

        # Render email HTML (we'll create template later)
        try:
            html_message = render_to_string(
                'emails/password_reset.html',
                context
            )
            plain_message = strip_tags(html_message)
        except Exception:
            # Fallback to plain text if template doesn't exist
            plain_message = f"""
Xin chào {user.full_name},

Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.

Vui lòng nhấp vào link sau để đặt lại mật khẩu:
{reset_url}

Link này sẽ hết hạn sau {expiry_minutes} phút.

Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.

Trân trọng,
Đội ngũ Operis
            """.strip()
            html_message = None

        # Send email
        send_mail(
            subject='Đặt lại mật khẩu - Operis',
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )

    def _send_password_changed_email(self, user: User):
        """
        Send confirmation email after password change

        Args:
            user: User instance
        """
        # Context for email template
        context = {
            'user': user,
            'site_name': 'Operis',
            'support_email': settings.DEFAULT_FROM_EMAIL,
        }

        # Render email
        try:
            html_message = render_to_string(
                'emails/password_changed.html',
                context
            )
            plain_message = strip_tags(html_message)
        except Exception:
            # Fallback to plain text
            plain_message = f"""
Xin chào {user.full_name},

Mật khẩu tài khoản của bạn đã được thay đổi thành công.

Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ ngay với chúng tôi tại {settings.DEFAULT_FROM_EMAIL}.

Trân trọng,
Đội ngũ Operis
            """.strip()
            html_message = None

        # Send email
        send_mail(
            subject='Mật khẩu đã được thay đổi - Operis',
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )

    def cleanup_expired_tokens(self):
        """
        Cleanup expired tokens (can be called by periodic task)

        Returns:
            Number of deleted tokens
        """
        deleted_count, _ = PasswordResetToken.objects.filter(
            expires_at__lt=timezone.now()
        ).delete()

        return deleted_count
