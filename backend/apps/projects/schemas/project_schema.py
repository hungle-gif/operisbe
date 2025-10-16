"""
Project schemas for API
"""
from typing import Optional, List
from uuid import UUID
from datetime import datetime, date
from pydantic import BaseModel, Field


# User info schema (simplified)
class UserInfo(BaseModel):
    id: UUID
    full_name: str
    email: str
    role: str

    class Config:
        from_attributes = True


# Customer info schema
class CustomerInfo(BaseModel):
    id: UUID
    company_name: Optional[str] = None
    user_email: str  # From user.email
    user_name: str   # From user.full_name

    class Config:
        from_attributes = False  # We'll serialize manually


# Project schemas
class ProjectListOut(BaseModel):
    """Schema for project list (simplified)"""
    id: UUID
    name: str
    status: str
    priority: str
    customer: CustomerInfo
    project_manager: Optional[UserInfo] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProjectOut(BaseModel):
    """Schema for project detail"""
    id: UUID
    name: str
    description: Optional[str] = None
    status: str
    priority: str
    customer: CustomerInfo
    project_manager: Optional[UserInfo] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    estimated_hours: Optional[int] = None
    budget: Optional[float] = None
    repository_url: Optional[str] = None
    staging_url: Optional[str] = None
    production_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Chat schemas
class ChatMessageOut(BaseModel):
    """Schema for chat message output"""
    id: UUID
    project_id: UUID
    sender: UserInfo
    message: str
    message_type: str
    attachments: List[str] = []
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ChatMessageCreate(BaseModel):
    """Schema for creating chat message"""
    message: str = Field(..., min_length=1)
    message_type: Optional[str] = 'text'
    attachments: Optional[List[str]] = []
