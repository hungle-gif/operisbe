"""
User repository for database operations
"""
from typing import Optional, List
from uuid import UUID
from apps.users.models import User
from django.db.models import Q


class UserRepository:
    """Repository for User model"""
    
    @staticmethod
    def get_by_id(user_id: UUID) -> Optional[User]:
        """Get user by ID"""
        try:
            return User.objects.get(id=user_id, is_active=True)
        except User.DoesNotExist:
            return None
    
    @staticmethod
    def get_by_email(email: str) -> Optional[User]:
        """Get user by email"""
        try:
            return User.objects.get(email=email)
        except User.DoesNotExist:
            return None
    
    @staticmethod
    def create(user_data: dict) -> User:
        """Create new user"""
        password = user_data.pop('password', None)
        user = User.objects.create(**user_data)
        if password:
            user.set_password(password)
            user.save()
        return user
    
    @staticmethod
    def update(user: User, update_data: dict) -> User:
        """Update user"""
        for field, value in update_data.items():
            setattr(user, field, value)
        user.save()
        return user
    
    @staticmethod
    def delete(user: User) -> None:
        """Soft delete user"""
        user.is_active = False
        user.save()
    
    @staticmethod
    def list_all(role: Optional[str] = None, skip: int = 0, limit: int = 10) -> List[User]:
        """List all users with optional filters"""
        query = User.objects.filter(is_active=True)
        
        if role:
            query = query.filter(role=role)
        
        return list(query[skip:skip + limit])
    
    @staticmethod
    def count(role: Optional[str] = None) -> int:
        """Count users"""
        query = User.objects.filter(is_active=True)
        
        if role:
            query = query.filter(role=role)
        
        return query.count()
    
    @staticmethod
    def search(search_term: str, skip: int = 0, limit: int = 10) -> List[User]:
        """Search users by name or email"""
        query = User.objects.filter(
            Q(full_name__icontains=search_term) | Q(email__icontains=search_term),
            is_active=True
        )
        return list(query[skip:skip + limit])
