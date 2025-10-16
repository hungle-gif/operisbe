"""
Authentication dependencies
"""
from ninja.security import HttpBearer
from apps.users.services.auth_service import AuthService


class AuthBearer(HttpBearer):
    """Bearer token authentication"""
    
    def authenticate(self, request, token):
        """Authenticate request with bearer token"""
        try:
            auth_service = AuthService()
            user = auth_service.get_current_user(token)
            return user
        except Exception:
            return None


# Create instance to use as dependency
auth_bearer = AuthBearer()


def get_current_user(request):
    """Get current authenticated user"""
    return request.auth
