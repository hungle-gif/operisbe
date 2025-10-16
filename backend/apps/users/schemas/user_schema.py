"""
User schemas for API input/output validation
"""
from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    """Schema for creating a new user"""
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=1, max_length=255)
    phone: Optional[str] = None
    role: str = Field(default='customer')


class UserUpdate(BaseModel):
    """Schema for updating user"""
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None


class UserPasswordChange(BaseModel):
    """Schema for changing password"""
    old_password: str
    new_password: str = Field(..., min_length=8)


class UserOut(BaseModel):
    """Schema for user output"""
    id: UUID
    email: str
    full_name: str
    phone: Optional[str] = None
    role: str
    avatar: Optional[str] = None
    bio: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class LoginSchema(BaseModel):
    """Schema for login"""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Schema for token response"""
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    user: UserOut


class RefreshTokenSchema(BaseModel):
    """Schema for refreshing token"""
    refresh_token: str


class UserListQuery(BaseModel):
    """Schema for user list query parameters"""
    role: Optional[str] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=10, ge=1, le=100)
