"""
Service schemas for API
"""
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


# Service Schemas
class ServiceOut(BaseModel):
    """Schema for service output"""
    id: UUID
    name: str
    slug: str
    category: str
    short_description: str
    full_description: str
    key_features: List[Any]  # Can be list of strings OR list of objects (challenges)
    differentiators: List[str]
    process_stages: List[Dict[str, Any]]
    team_structure: Dict[str, Any]
    estimated_team_size: int
    estimated_duration_min: int
    estimated_duration_max: int
    price_range_min: Optional[float] = None
    price_range_max: Optional[float] = None
    icon: str
    thumbnail: Optional[str] = None
    gallery: List[str]
    is_active: bool
    is_featured: bool
    technologies: List[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ServiceListOut(BaseModel):
    """Schema for service list (simplified)"""
    id: UUID
    name: str
    slug: str
    category: str
    short_description: str
    icon: str
    thumbnail: Optional[str] = None
    is_featured: bool
    estimated_duration_min: int
    estimated_duration_max: int
    price_range_min: Optional[float] = None
    price_range_max: Optional[float] = None
    
    class Config:
        from_attributes = True


class ServiceCreate(BaseModel):
    """Schema for creating service"""
    name: str
    slug: str
    category: str
    short_description: str
    full_description: str
    key_features: List[Any] = []  # Can be list of strings OR list of objects
    differentiators: List[str] = []
    process_stages: List[Dict[str, Any]] = []
    team_structure: Dict[str, Any] = {}
    estimated_team_size: int = 1
    estimated_duration_min: int
    estimated_duration_max: int
    price_range_min: Optional[float] = None
    price_range_max: Optional[float] = None
    icon: str = 'briefcase'
    thumbnail: Optional[str] = None
    gallery: List[str] = []
    technologies: List[str] = []
    is_active: bool = True
    is_featured: bool = False
    order: int = 0


# Service Request Schemas
class ServiceRequestCreate(BaseModel):
    """Schema for creating service request - Updated form"""
    service_id: UUID
    company_name: str = Field(..., description="Tên công ty")
    contact_name: str = Field(..., description="Tên người yêu cầu")
    contact_phone: str = Field(..., description="Số điện thoại")
    zalo_number: str = Field(..., description="Số Zalo")
    contact_email: EmailStr = Field(..., description="Email")
    system_users_count: int = Field(..., description="Số lượng người sử dụng hệ thống", gt=0)
    required_functions: List[str] = Field(..., description="Các chức năng cần có")
    special_requirements: str = Field(..., description="Những yêu cầu đặc biệt")
    workflow_description: str = Field(..., description="Mô tả chi tiết luồng công việc")

    # Keep for backward compatibility
    project_description: Optional[str] = ""
    requirements: Dict[str, Any] = {}
    budget_range: Optional[str] = None
    expected_timeline: Optional[str] = None


class ServiceRequestOut(BaseModel):
    """Schema for service request output"""
    id: UUID
    service: ServiceListOut
    customer: Dict[str, Any]  # Simple user info
    contact_name: str
    contact_email: str
    contact_phone: str
    company_name: Optional[str] = None
    project_description: str
    requirements: Dict[str, Any]
    budget_range: Optional[str] = None
    expected_timeline: Optional[str] = None
    status: str
    admin_notes: Optional[str] = None
    assigned_to: Optional[Dict[str, Any]] = None
    converted_project: Optional[Dict[str, Any]] = None  # Project info if converted
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ServiceRequestUpdate(BaseModel):
    """Schema for updating service request (admin only)"""
    status: Optional[str] = None
    admin_notes: Optional[str] = None
    assigned_to_id: Optional[UUID] = None
