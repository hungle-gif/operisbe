"""
Google OAuth2 Service
Handles Google OAuth authentication flow with customizable redirect_uri
"""
from typing import Dict, Optional, Tuple
from django.conf import settings
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from google_auth_oauthlib.flow import Flow
import requests
import secrets

from apps.users.models import User, SocialAccount, SocialProvider
from apps.users.repositories.user_repository import UserRepository
from core.utils.jwt_utils import create_access_token, create_refresh_token
from api.exceptions.base_exception import ValidationException, UnauthorizedException


class GoogleOAuthService:
    """
    Service for Google OAuth2 authentication

    Supports custom redirect_uri parameter for flexible frontend integration
    """

    # Google OAuth2 endpoints
    GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
    GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
    GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo'

    def __init__(self):
        self.user_repo = UserRepository()
        self.client_id = settings.GOOGLE_OAUTH_CLIENT_ID
        self.client_secret = settings.GOOGLE_OAUTH_CLIENT_SECRET
        self.default_redirect_uri = settings.GOOGLE_OAUTH_REDIRECT_URI
        self.scopes = settings.GOOGLE_OAUTH_SCOPES

    def _check_credentials(self):
        """Check if credentials are configured"""
        if not self.client_id or not self.client_secret:
            raise ValidationException(
                'Google OAuth is not configured. Please set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET.'
            )

    def get_authorization_url(
        self,
        redirect_uri: Optional[str] = None,
        state: Optional[str] = None
    ) -> Dict[str, str]:
        """
        Generate Google OAuth authorization URL

        Args:
            redirect_uri: Custom redirect URI (overrides default from settings)
            state: Optional state parameter for CSRF protection

        Returns:
            Dict with authorization_url and state

        Example:
            >>> service = GoogleOAuthService()
            >>> result = service.get_authorization_url(
            ...     redirect_uri='http://localhost:3000/auth/google/callback'
            ... )
            >>> # Redirect user to result['authorization_url']
        """
        self._check_credentials()

        # Use custom redirect_uri or fall back to default
        final_redirect_uri = redirect_uri or self.default_redirect_uri

        # Generate state for CSRF protection if not provided
        if not state:
            state = secrets.token_urlsafe(32)

        # Build authorization URL with parameters
        params = {
            'client_id': self.client_id,
            'redirect_uri': final_redirect_uri,
            'response_type': 'code',
            'scope': ' '.join(self.scopes),
            'state': state,
            'access_type': 'offline',  # Request refresh token
            'prompt': 'consent',  # Force consent screen to get refresh token
        }

        # Construct URL
        param_string = '&'.join([f'{k}={requests.utils.quote(str(v))}' for k, v in params.items()])
        authorization_url = f'{self.GOOGLE_AUTH_URL}?{param_string}'

        return {
            'authorization_url': authorization_url,
            'state': state
        }

    def exchange_code_for_tokens(
        self,
        code: str,
        redirect_uri: Optional[str] = None
    ) -> Dict[str, any]:
        """
        Exchange authorization code for access token

        Args:
            code: Authorization code from Google OAuth redirect
            redirect_uri: Redirect URI used in authorization request (must match)

        Returns:
            Dict with access_token, refresh_token, expires_in

        Raises:
            ValidationException: If code exchange fails
        """
        # Use custom redirect_uri or fall back to default
        final_redirect_uri = redirect_uri or self.default_redirect_uri

        # Exchange code for tokens
        token_data = {
            'code': code,
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'redirect_uri': final_redirect_uri,
            'grant_type': 'authorization_code',
        }

        try:
            response = requests.post(self.GOOGLE_TOKEN_URL, data=token_data)
            response.raise_for_status()
            tokens = response.json()

            return {
                'access_token': tokens.get('access_token'),
                'refresh_token': tokens.get('refresh_token'),
                'expires_in': tokens.get('expires_in', 3600),
                'id_token': tokens.get('id_token'),
            }

        except requests.exceptions.RequestException as e:
            raise ValidationException(f'Failed to exchange code for tokens: {str(e)}')

    def get_user_info(self, access_token: str) -> Dict[str, any]:
        """
        Get user information from Google

        Args:
            access_token: Google OAuth access token

        Returns:
            Dict with user information (id, email, name, picture, etc.)

        Raises:
            ValidationException: If request fails
        """
        headers = {'Authorization': f'Bearer {access_token}'}

        try:
            response = requests.get(self.GOOGLE_USERINFO_URL, headers=headers)
            response.raise_for_status()
            user_info = response.json()

            return {
                'id': user_info.get('sub'),
                'email': user_info.get('email'),
                'verified_email': user_info.get('email_verified', True),
                'name': user_info.get('name'),
                'given_name': user_info.get('given_name'),
                'family_name': user_info.get('family_name'),
                'picture': user_info.get('picture'),
                'locale': user_info.get('locale'),
            }

        except requests.exceptions.RequestException as e:
            raise ValidationException(f'Failed to get user info: {str(e)}')

    def authenticate_with_google(
        self,
        code: str,
        redirect_uri: Optional[str] = None
    ) -> Dict[str, any]:
        """
        Complete Google OAuth flow and authenticate user

        Args:
            code: Authorization code from Google
            redirect_uri: Redirect URI used in authorization (must match)

        Returns:
            Dict with access_token, refresh_token, user, is_new_user, social_account_created

        Process:
            1. Exchange code for Google tokens
            2. Get user info from Google
            3. Find or create user
            4. Create or update social account
            5. Generate JWT tokens

        Example:
            >>> service = GoogleOAuthService()
            >>> result = service.authenticate_with_google(
            ...     code='4/0AQlEd...',
            ...     redirect_uri='http://localhost:3000/auth/google/callback'
            ... )
            >>> # result contains JWT tokens and user info
        """
        # Step 1: Exchange code for tokens
        google_tokens = self.exchange_code_for_tokens(code, redirect_uri)

        # Step 2: Get user info from Google
        google_user_info = self.get_user_info(google_tokens['access_token'])

        # Step 3: Find or create user and social account
        user, is_new_user, social_account_created = self._find_or_create_user(
            google_user_info,
            google_tokens
        )

        # Step 4: Generate JWT tokens
        access_token = create_access_token(user.id)
        refresh_token = create_refresh_token(user.id)

        # Step 5: Update last login
        social_account = SocialAccount.objects.get(
            user=user,
            provider=SocialProvider.GOOGLE,
            provider_user_id=google_user_info['id']
        )
        social_account.update_last_login()

        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'token_type': 'Bearer',
            'user': {
                'id': str(user.id),
                'email': user.email,
                'full_name': user.full_name,
                'phone': user.phone,
                'role': user.role,
                'avatar': user.avatar,
                'bio': user.bio,
                'is_active': user.is_active,
                'created_at': user.created_at.isoformat(),
                'updated_at': user.updated_at.isoformat(),
            },
            'is_new_user': is_new_user,
            'social_account_created': social_account_created,
        }

    def link_google_account(
        self,
        user: User,
        code: str,
        redirect_uri: Optional[str] = None
    ) -> Dict[str, any]:
        """
        Link Google account to existing authenticated user

        Args:
            user: Authenticated User instance
            code: Authorization code from Google
            redirect_uri: Redirect URI used in authorization

        Returns:
            Dict with success message and account info

        Raises:
            ValidationException: If account already linked to another user
        """
        # Exchange code for tokens
        google_tokens = self.exchange_code_for_tokens(code, redirect_uri)

        # Get user info from Google
        google_user_info = self.get_user_info(google_tokens['access_token'])

        # Check if Google account already linked to another user
        existing_account = SocialAccount.find_by_provider(
            SocialProvider.GOOGLE,
            google_user_info['id']
        )

        if existing_account and existing_account.user.id != user.id:
            raise ValidationException(
                'This Google account is already linked to another user'
            )

        # Create or update social account
        social_account, created = SocialAccount.get_or_create_for_user(
            user=user,
            provider=SocialProvider.GOOGLE,
            provider_user_id=google_user_info['id'],
            access_token=google_tokens['access_token'],
            refresh_token=google_tokens.get('refresh_token'),
            email=google_user_info['email'],
            profile_data=google_user_info,
        )

        if google_tokens.get('expires_in'):
            social_account.update_tokens(
                access_token=google_tokens['access_token'],
                refresh_token=google_tokens.get('refresh_token'),
                expires_in=google_tokens['expires_in']
            )

        return {
            'success': True,
            'message': 'Google account linked successfully' if created else 'Google account updated',
            'provider': SocialProvider.GOOGLE,
            'provider_user_id': google_user_info['id'],
            'email': google_user_info['email'],
        }

    def _find_or_create_user(
        self,
        google_user_info: Dict[str, any],
        google_tokens: Dict[str, any]
    ) -> Tuple[User, bool, bool]:
        """
        Find existing user or create new one

        Args:
            google_user_info: User info from Google
            google_tokens: OAuth tokens from Google

        Returns:
            Tuple of (User instance, is_new_user, social_account_created)
        """
        google_user_id = google_user_info['id']
        email = google_user_info['email']

        # Try to find existing social account
        social_account = SocialAccount.find_by_provider(
            SocialProvider.GOOGLE,
            google_user_id
        )

        if social_account:
            # User exists with this Google account
            user = social_account.user

            # Update tokens
            social_account.update_tokens(
                access_token=google_tokens['access_token'],
                refresh_token=google_tokens.get('refresh_token'),
                expires_in=google_tokens.get('expires_in')
            )

            # Update profile data
            social_account.profile_data = google_user_info
            social_account.save(update_fields=['profile_data'])

            return user, False, False

        # Try to find user by email
        user = self.user_repo.get_by_email(email)

        if user:
            # User exists but no Google account linked
            social_account, created = SocialAccount.get_or_create_for_user(
                user=user,
                provider=SocialProvider.GOOGLE,
                provider_user_id=google_user_id,
                access_token=google_tokens['access_token'],
                refresh_token=google_tokens.get('refresh_token'),
                email=email,
                profile_data=google_user_info,
                is_primary=False,
            )

            if google_tokens.get('expires_in'):
                social_account.update_tokens(
                    access_token=google_tokens['access_token'],
                    refresh_token=google_tokens.get('refresh_token'),
                    expires_in=google_tokens['expires_in']
                )

            return user, False, created

        # Create new user
        user_data = {
            'email': email,
            'full_name': google_user_info.get('name') or email.split('@')[0],
            'username': email.split('@')[0],
            'avatar': google_user_info.get('picture'),
            'role': 'customer',  # Default role
            'is_active': True,
        }

        # Generate random password (user won't need it for Google login)
        import secrets
        user_data['password'] = secrets.token_urlsafe(32)

        user = self.user_repo.create(user_data)

        # Create social account
        social_account, _ = SocialAccount.get_or_create_for_user(
            user=user,
            provider=SocialProvider.GOOGLE,
            provider_user_id=google_user_id,
            access_token=google_tokens['access_token'],
            refresh_token=google_tokens.get('refresh_token'),
            email=email,
            profile_data=google_user_info,
            is_primary=True,  # Primary login method for new user
        )

        if google_tokens.get('expires_in'):
            social_account.update_tokens(
                access_token=google_tokens['access_token'],
                refresh_token=google_tokens.get('refresh_token'),
                expires_in=google_tokens['expires_in']
            )

        return user, True, True
