"""
Google OAuth2 API endpoints
"""
from ninja import Router
from django.http import HttpRequest

from apps.users.schemas import (
    GoogleOAuthInitRequest,
    GoogleOAuthInitResponse,
    GoogleOAuthCallbackRequest,
    GoogleOAuthCallbackResponse,
    LinkGoogleAccountRequest,
    LinkGoogleAccountResponse,
    UnlinkSocialAccountRequest,
    UnlinkSocialAccountResponse,
    SocialAccountInfo
)
from apps.users.services.google_oauth_service import GoogleOAuthService
from apps.users.models import SocialAccount
from api.dependencies.current_user import auth_bearer


router = Router(tags=['Google OAuth'])
google_oauth_service = GoogleOAuthService()


@router.post("/init", response=GoogleOAuthInitResponse)
def init_google_oauth(request: HttpRequest, payload: GoogleOAuthInitRequest):
    """
    Initialize Google OAuth flow - Get authorization URL

    **No authentication required**

    - **redirect_uri**: (Optional) Custom redirect URI for callback
    - **state**: (Optional) State parameter for CSRF protection

    Returns:
    - **authorization_url**: URL to redirect user to for Google authorization
    - **state**: State parameter for CSRF validation

    Process:
    1. Frontend calls this endpoint with optional redirect_uri
    2. Backend generates Google authorization URL
    3. Frontend redirects user to authorization_url
    4. User authorizes on Google
    5. Google redirects back to redirect_uri with code

    Example redirect_uri:
    - `http://localhost:3000/auth/google/callback`
    - `https://yourdomain.com/auth/google/callback`

    The redirect_uri MUST match the one configured in Google Console
    """
    result = google_oauth_service.get_authorization_url(
        redirect_uri=payload.redirect_uri,
        state=payload.state
    )

    return GoogleOAuthInitResponse(**result)


@router.post("/callback", response=GoogleOAuthCallbackResponse)
def google_oauth_callback(request: HttpRequest, payload: GoogleOAuthCallbackRequest):
    """
    Handle Google OAuth callback - Exchange code for tokens

    **No authentication required** (creates session)

    - **code**: Authorization code from Google (from URL parameter)
    - **state**: (Optional) State parameter for validation
    - **redirect_uri**: (Optional) Must match the one used in init

    Returns:
    - **access_token**: JWT access token for API authentication
    - **refresh_token**: JWT refresh token
    - **user**: User information
    - **is_new_user**: Whether this is a newly created user
    - **social_account_created**: Whether social account was just created

    Process:
    1. Exchange authorization code for Google tokens
    2. Get user info from Google
    3. Find or create user account
    4. Create or update social account link
    5. Generate JWT tokens
    6. Return tokens and user info

    Frontend should:
    1. Extract code from URL parameters after Google redirect
    2. Call this endpoint with the code
    3. Store access_token and refresh_token
    4. Redirect user to dashboard/home page

    Example:
    ```javascript
    // After Google redirects to: /auth/google/callback?code=xxx&state=yyy
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    const response = await fetch('/api/auth/google/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, state })
    });

    const data = await response.json();
    localStorage.setItem('access_token', data.access_token);
    ```
    """
    result = google_oauth_service.authenticate_with_google(
        code=payload.code,
        redirect_uri=payload.redirect_uri
    )

    return GoogleOAuthCallbackResponse(**result)


@router.post("/link", response=LinkGoogleAccountResponse, auth=auth_bearer)
def link_google_account(request: HttpRequest, payload: LinkGoogleAccountRequest):
    """
    Link Google account to existing authenticated user

    **Requires authentication** (Bearer token)

    - **code**: Authorization code from Google
    - **redirect_uri**: (Optional) Must match the one used in init

    Use case:
    - User already has an account (email/password)
    - User wants to enable "Sign in with Google"
    - User authorizes with Google
    - This endpoint links Google account to their existing account

    Process:
    1. User must be logged in (has JWT token)
    2. User clicks "Link Google Account" in settings
    3. Frontend initiates OAuth flow (calls /init)
    4. User authorizes with Google
    5. Frontend calls this endpoint with code
    6. Google account is linked to user's account

    Returns:
    - Success message
    - Provider info (google)
    - Google user ID
    - Email from Google

    Possible errors:
    - 401: Not authenticated
    - 400: Google account already linked to another user
    """
    user = request.auth  # Get authenticated user

    result = google_oauth_service.link_google_account(
        user=user,
        code=payload.code,
        redirect_uri=payload.redirect_uri
    )

    return LinkGoogleAccountResponse(**result)


@router.post("/unlink", response=UnlinkSocialAccountResponse, auth=auth_bearer)
def unlink_google_account(request: HttpRequest, payload: UnlinkSocialAccountRequest):
    """
    Unlink social account from user

    **Requires authentication** (Bearer token)

    - **provider**: Provider to unlink (google, facebook, etc.)

    Use case:
    - User wants to remove Google login from their account
    - User has other login methods (email/password)

    Returns:
    - Success message

    Possible errors:
    - 401: Not authenticated
    - 400: Social account not found
    - 400: Cannot unlink only login method
    """
    user = request.auth

    # Find social account
    social_account = SocialAccount.objects.filter(
        user=user,
        provider=payload.provider
    ).first()

    if not social_account:
        from api.exceptions.base_exception import ValidationException
        raise ValidationException(f'No {payload.provider} account linked')

    # Check if user has other login methods
    has_password = user.has_usable_password()
    other_social_accounts = SocialAccount.objects.filter(user=user).exclude(
        id=social_account.id
    ).exists()

    if not has_password and not other_social_accounts:
        from api.exceptions.base_exception import ValidationException
        raise ValidationException(
            'Cannot unlink the only login method. Please set a password first.'
        )

    # Delete social account
    social_account.delete()

    return UnlinkSocialAccountResponse(
        message=f'{payload.provider.title()} account unlinked successfully'
    )


@router.get("/accounts", response=list[SocialAccountInfo], auth=auth_bearer)
def list_social_accounts(request: HttpRequest):
    """
    List all social accounts linked to authenticated user

    **Requires authentication** (Bearer token)

    Returns list of social accounts with:
    - Provider name (google, facebook, etc.)
    - Provider user ID
    - Email from provider
    - Is primary login method
    - Last login timestamp
    - Created timestamp

    Use case:
    - Show user which accounts are linked in settings
    - Let user manage their social connections
    """
    user = request.auth

    social_accounts = SocialAccount.objects.filter(user=user).order_by('-created_at')

    return [
        SocialAccountInfo(
            provider=account.provider,
            provider_user_id=account.provider_user_id,
            email=account.email,
            is_primary=account.is_primary,
            last_login_at=account.last_login_at.isoformat() if account.last_login_at else None,
            created_at=account.created_at.isoformat()
        )
        for account in social_accounts
    ]
