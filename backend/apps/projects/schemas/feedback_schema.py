"""
Pydantic schemas for Project Acceptance/Feedback API
"""
from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime


class AcceptanceSubmit(BaseModel):
    """Schema for customer submitting acceptance decision"""
    acceptance_status: Literal['accepted', 'rejected'] = Field(..., description="Accept or reject project")
    feedback: str = Field(..., min_length=10, description="General feedback (required)")
    rating: Optional[int] = Field(None, ge=1, le=5, description="Rating (required if accepting)")
    complaint: Optional[str] = Field(None, description="Issues/problems (if rejecting)")
    revision_details: Optional[str] = Field(None, description="Detailed revision requests (if rejecting)")
    feature_request: Optional[str] = Field(None, description="Feature requests for future")
    upgrade_request: Optional[str] = Field(None, description="Upgrade/Maintenance requests")


class FeedbackOut(BaseModel):
    """Schema for feedback output"""
    id: str
    project_id: str
    customer: dict  # {id, full_name, email}
    acceptance_status: str
    accepted_at: Optional[datetime]
    rejected_at: Optional[datetime]
    rating: Optional[int]
    feedback: str
    complaint: Optional[str]
    revision_details: Optional[str]
    feature_request: Optional[str]
    upgrade_request: Optional[str]
    admin_response: Optional[str]
    admin_responded_at: Optional[datetime]
    responded_by: Optional[dict]  # {id, full_name, email}
    revision_completed: bool
    revision_completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AdminResponse(BaseModel):
    """Schema for admin responding to feedback"""
    admin_response: str = Field(..., min_length=10, description="Admin response to feedback")


class RevisionComplete(BaseModel):
    """Schema for marking revision as complete"""
    admin_response: str = Field(..., min_length=10, description="Description of completed revisions")
