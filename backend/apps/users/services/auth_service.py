"""
Authentication service
"""
from typing import Dict
from apps.users.models import User
from apps.users.repositories.user_repository import UserRepository
from core.utils.jwt_utils import create_access_token, create_refresh_token, verify_token
from api.exceptions.base_exception import UnauthorizedException, ValidationException


class AuthService:
    """Service for authentication operations"""
    
    def __init__(self):
        self.user_repo = UserRepository()
    
    def register(self, user_data: dict) -> User:
        """Register new user"""
        # Check if email already exists
        existing_user = self.user_repo.get_by_email(user_data['email'])
        if existing_user:
            raise ValidationException("Email already registered")
        
        # Create user
        user = self.user_repo.create(user_data)
        return user
    
    def login(self, email: str, password: str) -> Dict:
        """Login user and return tokens"""
        # Get user by email
        user = self.user_repo.get_by_email(email)
        
        if not user:
            raise UnauthorizedException("Invalid credentials")
        
        # Check password
        if not user.check_password(password):
            raise UnauthorizedException("Invalid credentials")
        
        # Check if user is active
        if not user.is_active:
            raise UnauthorizedException("Account is inactive")
        
        # Generate tokens
        access_token = create_access_token(user.id)
        refresh_token = create_refresh_token(user.id)
        
        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user
        }
    
    def refresh_token(self, refresh_token: str) -> Dict:
        """Refresh access token"""
        try:
            user_id = verify_token(refresh_token, token_type='refresh')
        except Exception as e:
            raise UnauthorizedException(str(e))
        
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise UnauthorizedException("User not found")
        
        # Generate new tokens
        access_token = create_access_token(user.id)
        new_refresh_token = create_refresh_token(user.id)
        
        return {
            'access_token': access_token,
            'refresh_token': new_refresh_token,
            'user': user
        }
    
    def get_current_user(self, token: str) -> User:
        """Get current user from access token"""
        try:
            user_id = verify_token(token, token_type='access')
        except Exception as e:
            raise UnauthorizedException(str(e))
        
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise UnauthorizedException("User not found")
        
        return user
