"""
Project Template schemas for API
"""
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field
from decimal import Decimal


class ProjectTemplatePhase(BaseModel):
    """Schema for project template phase"""
    name: str
    duration_days: int
    percentage: float  # Percentage of total work
    description: Optional[str] = None


class ProjectTemplateTeamStructure(BaseModel):
    """Schema for project template team structure"""
    project_manager: int = 1
    developers: int = 1
    designers: int = 0
    testers: int = 0


class ProjectTemplateOut(BaseModel):
    """Schema for project template output"""
    id: UUID
    name: str
    description: str
    category: str
    icon: Optional[str] = None
    price_min: Decimal
    price_max: Optional[Decimal] = None
    estimated_duration_min: int
    estimated_duration_max: Optional[int] = None
    key_features: List[str] = []
    deliverables: List[str] = []
    technologies: List[str] = []
    phases: List[Dict[str, Any]] = []
    team_structure: Dict[str, Any] = {}
    options: List[Dict[str, Any]] = []  # Dynamic options configuration
    is_active: bool
    display_order: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProjectTemplateListOut(BaseModel):
    """Schema for project template list (simplified)"""
    id: UUID
    name: str
    description: str
    category: str
    icon: Optional[str] = None
    price_min: Decimal
    price_max: Optional[Decimal] = None
    estimated_duration_min: int
    estimated_duration_max: Optional[int] = None
    is_active: bool
    display_order: int
    created_at: datetime

    class Config:
        from_attributes = True


class ProjectTemplateCreate(BaseModel):
    """Schema for creating project template"""
    name: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1)
    category: str
    icon: Optional[str] = None
    price_min: Decimal = Field(..., gt=0)
    price_max: Optional[Decimal] = Field(None, gt=0)
    estimated_duration_min: int = Field(..., gt=0)
    estimated_duration_max: Optional[int] = Field(None, gt=0)
    key_features: List[str] = []
    deliverables: List[str] = []
    technologies: List[str] = []
    phases: List[Dict[str, Any]] = []
    team_structure: Dict[str, Any] = {}
    options: List[Dict[str, Any]] = []  # Dynamic options configuration
    is_active: bool = True
    display_order: int = 0


class ProjectTemplateUpdate(BaseModel):
    """Schema for updating project template"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, min_length=1)
    category: Optional[str] = None
    icon: Optional[str] = None
    price_min: Optional[Decimal] = Field(None, gt=0)
    price_max: Optional[Decimal] = Field(None, gt=0)
    estimated_duration_min: Optional[int] = Field(None, gt=0)
    estimated_duration_max: Optional[int] = Field(None, gt=0)
    key_features: Optional[List[str]] = None
    deliverables: Optional[List[str]] = None
    technologies: Optional[List[str]] = None
    phases: Optional[List[Dict[str, Any]]] = None
    team_structure: Optional[Dict[str, Any]] = None
    options: Optional[List[Dict[str, Any]]] = None  # Dynamic options configuration
    is_active: Optional[bool] = None
    display_order: Optional[int] = None
