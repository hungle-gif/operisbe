"""
User API endpoints
"""
from uuid import UUID
from ninja import Router, Query
from apps.users.schemas import UserOut, UserUpdate, UserPasswordChange, UserListQuery
from apps.users.services.user_service import UserService
from api.dependencies.current_user import auth_bearer, get_current_user
from core.responses.api_response import APIResponse
from typing import List

router = Router(tags=['Users'], auth=auth_bearer)
user_service = UserService()


@router.get("/me", response=UserOut)
def get_current_user_info(request):
    """Get current user info"""
    return request.auth


@router.get("", response=List[UserOut])
def list_users(request, query: UserListQuery = Query(...)):
    """List all users with pagination"""
    result = user_service.list_users(
        role=query.role,
        page=query.page,
        page_size=query.page_size
    )
    return result['items']


@router.get("/{user_id}", response=UserOut)
def get_user(request, user_id: UUID):
    """Get user by ID"""
    user = user_service.get_user(user_id)
    return user


@router.put("/{user_id}", response=UserOut)
def update_user(request, user_id: UUID, payload: UserUpdate):
    """Update user"""
    user = user_service.update_user(user_id, payload.dict(exclude_unset=True))
    return user


@router.delete("/{user_id}", response=APIResponse)
def delete_user(request, user_id: UUID):
    """Delete user"""
    user_service.delete_user(user_id)
    return APIResponse.success_response(message="User deleted successfully")


@router.post("/change-password", response=APIResponse)
def change_password(request, payload: UserPasswordChange):
    """Change password"""
    user_service.change_password(
        request.auth.id,
        payload.old_password,
        payload.new_password
    )
    return APIResponse.success_response(message="Password changed successfully")
