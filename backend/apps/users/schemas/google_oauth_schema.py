"""
Google OAuth2 schemas for API input/output validation
"""
from typing import Optional
from pydantic import BaseModel, Field, HttpUrl


class GoogleOAuthInitRequest(BaseModel):
    """
    Schema for initiating Google OAuth flow

    Frontend sends redirect_uri for callback
    """
    redirect_uri: Optional[str] = Field(
        default=None,
        description="Frontend callback URL (overrides default from settings)"
    )
    state: Optional[str] = Field(
        default=None,
        description="Optional state parameter for CSRF protection"
    )


class GoogleOAuthInitResponse(BaseModel):
    """Schema for Google OAuth init response"""
    authorization_url: str = Field(
        ...,
        description="Google OAuth authorization URL to redirect user to"
    )
    state: Optional[str] = Field(
        default=None,
        description="State parameter for CSRF validation"
    )


class GoogleOAuthCallbackRequest(BaseModel):
    """
    Schema for Google OAuth callback

    Frontend sends authorization code after user authorizes
    """
    code: str = Field(
        ...,
        min_length=1,
        description="Authorization code from Google OAuth redirect"
    )
    state: Optional[str] = Field(
        default=None,
        description="State parameter for CSRF validation"
    )
    redirect_uri: Optional[str] = Field(
        default=None,
        description="Redirect URI used in init request (must match)"
    )


class GoogleOAuthCallbackResponse(BaseModel):
    """Schema for successful Google OAuth callback"""
    access_token: str = Field(
        ...,
        description="JWT access token for API authentication"
    )
    refresh_token: str = Field(
        ...,
        description="JWT refresh token"
    )
    token_type: str = Field(
        default="Bearer",
        description="Token type"
    )
    user: dict = Field(
        ...,
        description="User information"
    )
    is_new_user: bool = Field(
        default=False,
        description="Whether this is a newly created user"
    )
    social_account_created: bool = Field(
        default=False,
        description="Whether a new social account was created"
    )


class GoogleUserInfo(BaseModel):
    """Schema for Google user information"""
    id: str = Field(..., description="Google user ID")
    email: str = Field(..., description="User email")
    verified_email: bool = Field(default=True, description="Email verification status")
    name: Optional[str] = Field(default=None, description="Full name")
    given_name: Optional[str] = Field(default=None, description="First name")
    family_name: Optional[str] = Field(default=None, description="Last name")
    picture: Optional[str] = Field(default=None, description="Profile picture URL")
    locale: Optional[str] = Field(default=None, description="User locale")


class LinkGoogleAccountRequest(BaseModel):
    """
    Schema for linking Google account to existing user

    User must be authenticated
    """
    code: str = Field(
        ...,
        min_length=1,
        description="Authorization code from Google"
    )
    redirect_uri: Optional[str] = Field(
        default=None,
        description="Redirect URI used in OAuth flow"
    )


class LinkGoogleAccountResponse(BaseModel):
    """Schema for link Google account response"""
    success: bool = True
    message: str = Field(
        default="Google account linked successfully",
        description="Success message"
    )
    provider: str = Field(
        default="google",
        description="Provider name"
    )
    provider_user_id: str = Field(
        ...,
        description="Google user ID"
    )
    email: str = Field(
        ...,
        description="Email from Google account"
    )


class UnlinkSocialAccountRequest(BaseModel):
    """Schema for unlinking social account"""
    provider: str = Field(
        ...,
        description="Provider to unlink (google, facebook, etc.)"
    )


class UnlinkSocialAccountResponse(BaseModel):
    """Schema for unlink response"""
    success: bool = True
    message: str = Field(
        default="Social account unlinked successfully",
        description="Success message"
    )


class SocialAccountInfo(BaseModel):
    """Schema for social account information"""
    provider: str
    provider_user_id: str
    email: str
    is_primary: bool
    last_login_at: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True
