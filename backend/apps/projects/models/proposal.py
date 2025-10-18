"""
Proposal model for negotiation between sales and customers
"""
from django.db import models
from core.database.base_model import BaseModel
from apps.users.models import User
from .project import Project


class ProposalStatus(models.TextChoices):
    """Proposal status choices"""
    DRAFT = 'draft', 'Bản thảo'
    SENT = 'sent', 'Đã gửi'
    VIEWED = 'viewed', 'Đã xem'
    ACCEPTED = 'accepted', 'Đã chấp nhận'
    REJECTED = 'rejected', 'Từ chối'
    NEGOTIATING = 'negotiating', 'Đang thương thảo'


class Proposal(BaseModel):
    """
    Proposal/Quote model
    Sale tạo và gửi cho customer để thương thảo
    """
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='proposals'
    )

    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_proposals'
    )

    # Project Analysis from Operis
    project_analysis = models.TextField(
        null=True,
        blank=True,
        help_text="Chi tiết phân tích dự án từ Operis"
    )

    # Pricing (auto-calculated from phases)
    total_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text="Tổng giá dự án (tự động tính từ các giai đoạn)"
    )
    currency = models.CharField(max_length=3, default='VND')

    # Timeline (auto-calculated from phases)
    estimated_start_date = models.DateField(null=True, blank=True)
    estimated_end_date = models.DateField(null=True, blank=True)
    estimated_duration_days = models.IntegerField(
        null=True,
        blank=True,
        default=0,
        help_text="Số ngày ước tính (tự động tính từ các giai đoạn)"
    )

    # Deposit phase (Cọc - Giai đoạn 1)
    deposit_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=500000,
        help_text="Số tiền cọc tối thiểu 500,000 VND"
    )
    deposit_paid = models.BooleanField(
        default=False,
        help_text="Đã cọc chưa"
    )
    deposit_paid_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Thời gian cọc"
    )
    deposit_approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_deposits',
        help_text="Admin duyệt cọc"
    )

    # Full Payment Option
    full_payment_option = models.BooleanField(
        default=False,
        help_text="Khách hàng chọn thanh toán toàn bộ (1 lần) thay vì từng giai đoạn"
    )
    full_payment_paid = models.BooleanField(
        default=False,
        help_text="Đã thanh toán toàn bộ"
    )
    full_payment_paid_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Thời gian thanh toán toàn bộ"
    )

    # Customer payment submission (for future SePay integration)
    payment_submitted = models.BooleanField(
        default=False,
        help_text="Khách hàng đã submit thanh toán (chờ xác nhận)"
    )
    payment_submitted_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Thời gian khách submit thanh toán"
    )
    payment_proof = models.JSONField(
        default=dict,
        blank=True,
        help_text="Thông tin chứng từ thanh toán (transaction_id, screenshot_url, etc.) - Dành cho tích hợp SePay"
    )

    # Phases (Giai đoạn thực hiện)
    phases = models.JSONField(
        default=list,
        help_text="Các giai đoạn thực hiện dự án"
    )
    # Example: [
    #   {"name": "Giai đoạn 2", "days": 10, "amount": 10000000, "payment_percentage": 100, "tasks": "..."},
    #   {"name": "Giai đoạn 3", "days": 15, "amount": 20000000, "payment_percentage": 50, "tasks": "..."},
    # ]

    # Team members
    team_members = models.JSONField(
        default=list,
        help_text="Danh sách nhân sự thực hiện"
    )
    # Example: [
    #   {"name": "Nguyễn Văn A", "role": "Backend Developer", "rating": 5},
    #   {"name": "Trần Thị B", "role": "Frontend Developer", "rating": 4},
    # ]

    # Old milestones field (keeping for backward compatibility)
    milestones = models.JSONField(
        default=list,
        help_text="Các mốc thanh toán (deprecated - dùng phases)"
    )

    payment_terms = models.TextField(
        null=True,
        blank=True,
        help_text="Điều khoản thanh toán"
    )

    # Scope & Deliverables
    scope_of_work = models.TextField(
        null=True,
        blank=True,
        help_text="Phạm vi công việc chi tiết"
    )
    deliverables = models.JSONField(
        default=list,
        help_text="Danh sách sản phẩm bàn giao"
    )

    # Terms
    terms_and_conditions = models.TextField(
        null=True,
        blank=True,
        help_text="Điều khoản và điều kiện"
    )
    warranty_terms = models.TextField(
        null=True,
        blank=True,
        help_text="Điều khoản bảo hành"
    )

    # Status
    status = models.CharField(
        max_length=20,
        choices=ProposalStatus.choices,
        default=ProposalStatus.DRAFT
    )

    # Response from customer
    customer_notes = models.TextField(
        null=True,
        blank=True,
        help_text="Ghi chú từ khách hàng"
    )
    customer_approvals = models.JSONField(
        default=dict,
        help_text="Trạng thái đồng ý từng phần: {analysis: bool, deposit: bool, phases: bool, team: bool, commitments: bool}"
    )
    accepted_at = models.DateTimeField(null=True, blank=True)
    rejected_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(null=True, blank=True)

    # Validity
    valid_until = models.DateField(
        null=True,
        blank=True,
        help_text="Giá trị đến ngày"
    )

    class Meta:
        db_table = 'proposals'
        verbose_name = 'Proposal'
        verbose_name_plural = 'Proposals'
        ordering = ['-created_at']

    def __str__(self):
        return f"Proposal #{self.id} - {self.project.name} - {self.get_status_display()}"
