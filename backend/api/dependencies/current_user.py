"""
Authentication dependencies
"""
from functools import wraps
from ninja.security import HttpBearer
from ninja.errors import HttpError
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


def require_roles(*allowed_roles):
    """
    Decorator to restrict endpoint access to specific roles
    Admin ALWAYS has access unless explicitly excluded with 'no_admin'

    Usage:
        @require_roles('admin', 'sales')  # Allow admin and sales
        @require_roles('sales')            # Allow admin and sales (admin implicit)
        @require_roles('customer', 'no_admin')  # ONLY customer, no admin
    """
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            user = request.auth
            if not user:
                raise HttpError(401, "Authentication required")

            # Admin always has access unless explicitly excluded
            exclude_admin = 'no_admin' in allowed_roles
            if user.role == 'admin' and not exclude_admin:
                return func(request, *args, **kwargs)

            # Normalize user role
            normalized_role = user.role
            if normalized_role in ['sales', 'sale']:
                normalized_role = 'sale'
            elif normalized_role in ['developer', 'dev']:
                normalized_role = 'dev'

            # Normalize and filter allowed roles
            allowed = []
            for role in allowed_roles:
                if role == 'no_admin':
                    continue
                if role in ['sales', 'sale']:
                    allowed.append('sale')
                elif role in ['developer', 'dev']:
                    allowed.append('dev')
                else:
                    allowed.append(role)

            # Check if user role is in allowed roles
            if normalized_role not in allowed:
                raise HttpError(403, f"Access denied. Required roles: {', '.join(allowed_roles)}")

            return func(request, *args, **kwargs)
        return wrapper
    return decorator
