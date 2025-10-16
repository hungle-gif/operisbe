"""
Proposal schemas for API validation
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal


class PhaseSchema(BaseModel):
    """Schema for phase in proposal with payment tracking"""
    name: str = Field(..., description="Tên giai đoạn")
    days: int = Field(..., description="Số ngày thực hiện")
    amount: Decimal = Field(..., description="Tổng tiền")
    payment_percentage: int = Field(default=100, ge=0, le=100, description="Tỉ lệ thanh toán (%)")
    tasks: str = Field(..., description="Chi tiết nhiệm vụ")

    # Payment tracking fields (optional for backward compatibility)
    completed: bool = Field(default=False, description="Sale đã đánh dấu hoàn thành")
    completed_at: Optional[datetime] = Field(None, description="Thời gian hoàn thành")
    completed_by: Optional[str] = Field(None, description="User ID người đánh dấu hoàn thành")

    payment_submitted: bool = Field(default=False, description="Khách hàng đã submit thanh toán")
    payment_submitted_at: Optional[datetime] = Field(None, description="Thời gian submit thanh toán")

    payment_approved: bool = Field(default=False, description="Admin đã duyệt thanh toán")
    payment_approved_at: Optional[datetime] = Field(None, description="Thời gian duyệt thanh toán")
    payment_approved_by: Optional[str] = Field(None, description="User ID người duyệt")

    payment_proof: dict = Field(default_factory=dict, description="Chứng từ thanh toán (SePay data)")


class TeamMemberSchema(BaseModel):
    """Schema for team member"""
    name: str = Field(..., description="Họ tên")
    role: str = Field(..., description="Chức vụ")
    rating: float = Field(default=5.0, ge=0, le=5, description="Đánh giá (0-5 sao)")


class DeliverableSchema(BaseModel):
    """Schema for deliverable/commitment item"""
    description: str = Field(..., description="Nội dung cam kết hoặc sản phẩm bàn giao")
    penalty: Optional[str] = Field(None, description="Mức phạt nếu vi phạm")
    # Backward compatibility
    name: Optional[str] = Field(None, description="Tên sản phẩm bàn giao (deprecated)")


# Old milestone schema (deprecated)
class MilestoneSchema(BaseModel):
    """Schema for milestone in proposal (deprecated - use PhaseSchema)"""
    name: str = Field(..., description="Tên giai đoạn")
    percentage: int = Field(..., ge=0, le=100, description="Phần trăm thanh toán")
    amount: Decimal = Field(..., description="Số tiền")
    description: str = Field(..., description="Mô tả công việc")
    duration: int = Field(..., description="Số ngày thực hiện")


class ProposalCreate(BaseModel):
    """Schema for creating a new proposal"""
    project_analysis: Optional[str] = Field(None, description="Chi tiết phân tích dự án từ Operis")

    deposit_amount: Decimal = Field(default=500000, description="Số tiền cọc (tối thiểu 500,000 VND)")

    total_price: Decimal = Field(default=0, description="Tổng giá dự án (tự động tính)")
    currency: str = Field(default='VND', max_length=3)

    estimated_start_date: Optional[date] = None
    estimated_duration_days: Optional[int] = Field(default=0, description="Tổng thời gian (tự động tính)")

    phases: List[PhaseSchema] = Field(default_factory=list, description="Các giai đoạn thực hiện")
    team_members: List[TeamMemberSchema] = Field(default_factory=list, description="Danh sách nhân sự")
    deliverables: List[DeliverableSchema] = Field(default_factory=list, description="Sản phẩm bàn giao")

    payment_terms: Optional[str] = None
    scope_of_work: Optional[str] = None
    terms_and_conditions: Optional[str] = None
    warranty_terms: Optional[str] = None

    valid_until: Optional[date] = None

    # Old fields (for backward compatibility)
    milestones: List[MilestoneSchema] = Field(default_factory=list)


class ProposalUpdate(BaseModel):
    """Schema for updating a proposal"""
    project_analysis: Optional[str] = None
    deposit_amount: Optional[Decimal] = None

    total_price: Optional[Decimal] = None
    currency: Optional[str] = None

    estimated_start_date: Optional[date] = None
    estimated_end_date: Optional[date] = None
    estimated_duration_days: Optional[int] = None

    phases: Optional[List[PhaseSchema]] = None
    team_members: Optional[List[TeamMemberSchema]] = None
    milestones: Optional[List[MilestoneSchema]] = None
    payment_terms: Optional[str] = None

    scope_of_work: Optional[str] = None
    deliverables: Optional[List[DeliverableSchema]] = None

    terms_and_conditions: Optional[str] = None
    warranty_terms: Optional[str] = None

    customer_approvals: Optional[dict] = None

    valid_until: Optional[date] = None


class CustomerResponse(BaseModel):
    """Schema for customer response to proposal"""
    customer_notes: Optional[str] = None
    rejection_reason: Optional[str] = None


class CreatorInfo(BaseModel):
    """Schema for proposal creator info"""
    id: UUID
    full_name: str
    email: str
    role: str


class ProposalOut(BaseModel):
    """Schema for proposal output"""
    id: UUID
    project_id: UUID
    created_by: CreatorInfo

    project_analysis: Optional[str]
    deposit_amount: Decimal

    # Deposit payment tracking
    deposit_paid: bool = Field(default=False, description="Tiền cọc đã được thanh toán")
    deposit_paid_at: Optional[datetime] = Field(None, description="Thời gian thanh toán cọc")
    payment_submitted: bool = Field(default=False, description="Khách đã submit thanh toán cọc")
    payment_submitted_at: Optional[datetime] = Field(None, description="Thời gian submit thanh toán cọc")
    payment_proof: dict = Field(default_factory=dict, description="Chứng từ thanh toán")

    total_price: Decimal
    currency: str

    estimated_start_date: Optional[date]
    estimated_end_date: Optional[date]
    estimated_duration_days: Optional[int]

    phases: List[dict]
    team_members: List[dict]
    milestones: List[dict]
    payment_terms: Optional[str]

    scope_of_work: Optional[str]
    deliverables: List[dict]

    terms_and_conditions: Optional[str]
    warranty_terms: Optional[str]

    status: str

    customer_notes: Optional[str]
    customer_approvals: dict
    accepted_at: Optional[datetime]
    rejected_at: Optional[datetime]
    rejection_reason: Optional[str]

    valid_until: Optional[date]

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = False  # Manual serialization


class ProposalListOut(BaseModel):
    """Schema for listing proposals"""
    id: UUID
    project_id: UUID
    project_name: str
    created_by_name: str
    total_price: Decimal
    currency: str
    status: str
    created_at: datetime
    valid_until: Optional[date]

    class Config:
        from_attributes = False
