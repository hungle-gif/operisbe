"""
User service for business logic
"""
from typing import List, Optional
from uuid import UUID
from apps.users.models import User
from apps.users.repositories.user_repository import UserRepository
from api.exceptions.base_exception import NotFoundException, ValidationException


class UserService:
    """Service for user operations"""
    
    def __init__(self):
        self.user_repo = UserRepository()
    
    def get_user(self, user_id: UUID) -> User:
        """Get user by ID"""
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")
        return user
    
    def list_users(self, role: Optional[str] = None, page: int = 1, page_size: int = 10) -> dict:
        """List users with pagination"""
        skip = (page - 1) * page_size
        users = self.user_repo.list_all(role=role, skip=skip, limit=page_size)
        total = self.user_repo.count(role=role)
        
        return {
            'items': users,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }
    
    def update_user(self, user_id: UUID, update_data: dict) -> User:
        """Update user"""
        user = self.get_user(user_id)
        return self.user_repo.update(user, update_data)
    
    def delete_user(self, user_id: UUID) -> None:
        """Delete user"""
        user = self.get_user(user_id)
        self.user_repo.delete(user)
    
    def change_password(self, user_id: UUID, old_password: str, new_password: str) -> None:
        """Change user password"""
        user = self.get_user(user_id)
        
        if not user.check_password(old_password):
            raise ValidationException("Invalid old password")
        
        user.set_password(new_password)
        user.save()
    
    def search_users(self, search_term: str, page: int = 1, page_size: int = 10) -> List[User]:
        """Search users"""
        skip = (page - 1) * page_size
        return self.user_repo.search(search_term, skip=skip, limit=page_size)
