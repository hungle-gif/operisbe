"""
Password Reset API endpoints
"""
from ninja import Router
from django.http import HttpRequest

from apps.users.schemas import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    VerifyResetTokenRequest,
    VerifyResetTokenResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    ChangePasswordRequest,
    ChangePasswordResponse
)
from apps.users.services.password_reset_service import PasswordResetService
from core.responses.api_response import APIResponse
from api.dependencies.current_user import auth_bearer


router = Router(tags=['Password Reset'])
password_reset_service = PasswordResetService()


@router.post("/forgot-password", response=ForgotPasswordResponse)
def forgot_password(request: HttpRequest, payload: ForgotPasswordRequest):
    """
    Request password reset email

    - **email**: Email address of the account to reset

    Returns a generic success message regardless of whether email exists (security)

    Process:
    1. Validates email format
    2. If user exists, creates reset token and sends email
    3. Always returns success message (don't reveal if email exists)

    Reset link expires in 30 minutes
    """
    # Get client IP and user agent
    ip_address = request.META.get('REMOTE_ADDR')
    user_agent = request.META.get('HTTP_USER_AGENT', '')

    result = password_reset_service.request_password_reset(
        email=payload.email,
        ip_address=ip_address,
        user_agent=user_agent
    )

    return ForgotPasswordResponse(**result)


@router.post("/verify-reset-token", response=VerifyResetTokenResponse)
def verify_reset_token(request: HttpRequest, payload: VerifyResetTokenRequest):
    """
    Verify if reset token is valid

    - **token**: Reset token from email link

    Use this endpoint to validate token before showing reset password form

    Returns:
    - valid: True if token is valid
    - message: Status message
    - email: User's email (masked) if valid
    - expires_in_minutes: Time remaining before expiration

    Possible errors:
    - Invalid or expired reset token
    - Token has already been used
    """
    result = password_reset_service.verify_reset_token(payload.token)

    return VerifyResetTokenResponse(**result)


@router.post("/reset-password", response=ResetPasswordResponse)
def reset_password(request: HttpRequest, payload: ResetPasswordRequest):
    """
    Reset password using valid token

    - **token**: Reset token from email link
    - **new_password**: New password (min 8 chars, must contain letter and number)
    - **confirm_password**: Password confirmation (must match new_password)

    Password requirements:
    - Minimum 8 characters
    - At least one letter
    - At least one number

    Process:
    1. Validates token
    2. Validates password strength
    3. Updates user password
    4. Marks token as used
    5. Invalidates all other reset tokens for user
    6. Sends confirmation email

    Possible errors:
    - Invalid or expired token
    - Token already used
    - Passwords don't match
    - Password doesn't meet requirements
    - Account is inactive
    """
    result = password_reset_service.reset_password(
        token=payload.token,
        new_password=payload.new_password
    )

    return ResetPasswordResponse(**result)


@router.post("/change-password", response=ChangePasswordResponse, auth=auth_bearer)
def change_password(request: HttpRequest, payload: ChangePasswordRequest):
    """
    Change password for authenticated user

    **Requires authentication** (Bearer token)

    - **old_password**: Current password for verification
    - **new_password**: New password (min 8 chars, must contain letter and number)
    - **confirm_password**: Password confirmation (must match new_password)

    Password requirements:
    - Minimum 8 characters
    - At least one letter
    - At least one number
    - Must be different from current password

    Process:
    1. Verifies current password
    2. Validates new password strength
    3. Updates password
    4. Sends confirmation email

    Possible errors:
    - Current password is incorrect
    - New password same as old password
    - Passwords don't match
    - Password doesn't meet requirements
    """
    user = request.auth  # Get authenticated user

    result = password_reset_service.change_password(
        user=user,
        old_password=payload.old_password,
        new_password=payload.new_password
    )

    return ChangePasswordResponse(**result)
