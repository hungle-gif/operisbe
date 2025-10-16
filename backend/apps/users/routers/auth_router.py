"""
Authentication API endpoints
"""
from ninja import Router
from apps.users.schemas import UserCreate, LoginSchema, TokenResponse, RefreshTokenSchema
from apps.users.services.auth_service import AuthService
from core.responses.api_response import APIResponse

router = Router(tags=['Authentication'])
auth_service = AuthService()


@router.post("/register", response=APIResponse)
def register(request, payload: UserCreate):
    """Register new user"""
    user = auth_service.register(payload.dict())
    return APIResponse.success_response(
        data={'user_id': str(user.id)},
        message="User registered successfully"
    )


@router.post("/login", response=TokenResponse)
def login(request, payload: LoginSchema):
    """Login user"""
    result = auth_service.login(payload.email, payload.password)
    return result


@router.post("/refresh", response=TokenResponse)
def refresh_token(request, payload: RefreshTokenSchema):
    """Refresh access token"""
    result = auth_service.refresh_token(payload.refresh_token)
    return result
