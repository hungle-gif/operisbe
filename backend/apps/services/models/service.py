"""
Service model - Dịch vụ của công ty
"""
from django.db import models
from core.database.base_model import BaseModel
from apps.users.models import User


class ServiceCategory(models.TextChoices):
    """Loại dịch vụ"""
    WEB_DEVELOPMENT = 'web_development', 'Web Development'
    MOBILE_APP = 'mobile_app', 'Mobile App Development'
    UI_UX_DESIGN = 'ui_ux_design', 'UI/UX Design'
    ECOMMERCE = 'ecommerce', 'E-commerce Solution'
    CRM_SYSTEM = 'crm_system', 'CRM System'
    ERP_SYSTEM = 'erp_system', 'ERP System'
    AI_ML = 'ai_ml', 'AI/ML Solutions'
    CONSULTING = 'consulting', 'IT Consulting'
    MAINTENANCE = 'maintenance', 'Maintenance & Support'


class Service(BaseModel):
    """
    Model cho các dịch vụ công ty cung cấp
    """
    # Thông tin cơ bản
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    category = models.CharField(
        max_length=50,
        choices=ServiceCategory.choices,
        default=ServiceCategory.WEB_DEVELOPMENT
    )
    
    # Mô tả
    short_description = models.TextField()  # Mô tả ngắn
    full_description = models.TextField()  # Giới thiệu đầy đủ về dịch vụ
    
    # Điểm khác biệt
    key_features = models.JSONField(default=list)  # Danh sách tính năng nổi bật
    differentiators = models.JSONField(default=list)  # Điểm khác biệt của Operis
    
    # Quy trình thực hiện
    process_stages = models.JSONField(default=list)  # Các giai đoạn thực hiện
    
    # Đội ngũ
    team_structure = models.JSONField(default=dict)  # Cấu trúc đội ngũ dự kiến
    estimated_team_size = models.IntegerField(default=1)
    
    # Thời gian & chi phí
    estimated_duration_min = models.IntegerField(help_text="Thời gian tối thiểu (ngày)")
    estimated_duration_max = models.IntegerField(help_text="Thời gian tối đa (ngày)")
    price_range_min = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    price_range_max = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    # Media
    icon = models.CharField(max_length=50, default='briefcase')  # Icon name
    thumbnail = models.URLField(null=True, blank=True)
    gallery = models.JSONField(default=list)  # Ảnh minh họa
    
    # Metadata
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    order = models.IntegerField(default=0)  # Thứ tự hiển thị
    
    # Technologies
    technologies = models.JSONField(default=list)  # Công nghệ sử dụng
    
    class Meta:
        db_table = 'services'
        verbose_name = 'Service'
        verbose_name_plural = 'Services'
        ordering = ['order', '-is_featured', 'name']
    
    def __str__(self):
        return self.name


class ServiceRequest(BaseModel):
    """
    Yêu cầu sử dụng dịch vụ từ khách hàng
    """
    service = models.ForeignKey(
        Service,
        on_delete=models.CASCADE,
        related_name='requests'
    )
    
    customer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='service_requests'
    )
    
    # Thông tin liên hệ
    contact_name = models.CharField(max_length=255)
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=20)
    zalo_number = models.CharField(max_length=20, null=True, blank=True)
    company_name = models.CharField(max_length=255, null=True, blank=True)

    # Yêu cầu chi tiết - Form mới
    system_users_count = models.IntegerField(default=1, help_text="Số lượng người sử dụng hệ thống")
    required_functions = models.JSONField(default=list, help_text="Danh sách chức năng cần có")
    special_requirements = models.TextField(null=True, blank=True, help_text="Yêu cầu đặc biệt")
    workflow_description = models.TextField(null=True, blank=True, help_text="Mô tả luồng công việc")

    # Legacy fields for backward compatibility
    project_description = models.TextField(null=True, blank=True)
    requirements = models.JSONField(default=dict)  # Form data tùy chỉnh
    budget_range = models.CharField(max_length=100, null=True, blank=True)
    expected_timeline = models.CharField(max_length=100, null=True, blank=True)
    
    # Trạng thái
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        REVIEWING = 'reviewing', 'Reviewing'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'
        CONVERTED = 'converted', 'Converted to Project'
    
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    
    # Phản hồi từ admin/sale
    admin_notes = models.TextField(null=True, blank=True)
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_service_requests'
    )
    
    # Chuyển đổi sang project
    converted_project = models.ForeignKey(
        'projects.Project',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='source_service_request'
    )
    
    class Meta:
        db_table = 'service_requests'
        verbose_name = 'Service Request'
        verbose_name_plural = 'Service Requests'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.service.name} - {self.contact_name}"
