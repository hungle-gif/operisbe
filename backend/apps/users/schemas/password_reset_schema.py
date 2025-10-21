"""
Password Reset schemas for API input/output validation
"""
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator
import re


class ForgotPasswordRequest(BaseModel):
    """
    Schema for forgot password request

    User submits email to receive reset link
    """
    email: EmailStr = Field(
        ...,
        description="Email address of the account to reset"
    )


class ForgotPasswordResponse(BaseModel):
    """Schema for forgot password response"""
    success: bool = True
    message: str = Field(
        default="If the email exists, a password reset link has been sent",
        description="Generic message for security (don't reveal if email exists)"
    )


class VerifyResetTokenRequest(BaseModel):
    """
    Schema for verifying reset token validity

    Check if token is valid before showing reset form
    """
    token: str = Field(
        ...,
        min_length=20,
        description="Password reset token to verify"
    )


class VerifyResetTokenResponse(BaseModel):
    """Schema for verify token response"""
    valid: bool
    message: str
    email: Optional[str] = None


class ResetPasswordRequest(BaseModel):
    """
    Schema for resetting password with token

    User submits token and new password
    """
    token: str = Field(
        ...,
        min_length=20,
        description="Password reset token"
    )

    new_password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="New password (min 8 characters)"
    )

    confirm_password: str = Field(
        ...,
        description="Password confirmation (must match new_password)"
    )

    @field_validator('new_password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """
        Validate password strength

        Requirements:
        - At least 8 characters
        - Contains at least one letter
        - Contains at least one number
        """
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')

        if not re.search(r'[A-Za-z]', v):
            raise ValueError('Password must contain at least one letter')

        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one number')

        return v

    @field_validator('confirm_password')
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        """Validate that passwords match"""
        if 'new_password' in info.data and v != info.data['new_password']:
            raise ValueError('Passwords do not match')
        return v


class ResetPasswordResponse(BaseModel):
    """Schema for reset password response"""
    success: bool = True
    message: str = Field(
        default="Password has been reset successfully",
        description="Success message"
    )


class ChangePasswordRequest(BaseModel):
    """
    Schema for changing password (authenticated users)

    Different from reset - requires old password
    """
    old_password: str = Field(
        ...,
        description="Current password for verification"
    )

    new_password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="New password (min 8 characters)"
    )

    confirm_password: str = Field(
        ...,
        description="Password confirmation (must match new_password)"
    )

    @field_validator('new_password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')

        if not re.search(r'[A-Za-z]', v):
            raise ValueError('Password must contain at least one letter')

        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one number')

        return v

    @field_validator('confirm_password')
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        """Validate that passwords match"""
        if 'new_password' in info.data and v != info.data['new_password']:
            raise ValueError('Passwords do not match')
        return v


class ChangePasswordResponse(BaseModel):
    """Schema for change password response"""
    success: bool = True
    message: str = Field(
        default="Password has been changed successfully",
        description="Success message"
    )
