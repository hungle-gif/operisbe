"""
Project Template model - Predefined project templates for customers to choose
"""
from django.db import models
from core.database.base_model import BaseModel


class ProjectTemplateCategory(models.TextChoices):
    """Project template category choices"""
    WEB_DEVELOPMENT = 'web_development', 'Phát triển Website'
    MOBILE_APP = 'mobile_app', 'Ứng dụng Mobile'
    ENTERPRISE_SYSTEM = 'enterprise_system', 'Hệ thống Doanh nghiệp'
    ECOMMERCE = 'ecommerce', 'Thương mại điện tử'
    CRM_SYSTEM = 'crm_system', 'Hệ thống CRM'
    ERP_SYSTEM = 'erp_system', 'Hệ thống ERP'
    AI_ML = 'ai_ml', 'AI & Machine Learning'
    CONSULTING = 'consulting', 'Tư vấn'
    MAINTENANCE = 'maintenance', 'Bảo trì & Hỗ trợ'


class ProjectTemplate(BaseModel):
    """
    Project Template model for predefined project types
    Admins can create templates that customers can choose when creating service requests
    """

    # Basic information
    name = models.CharField(max_length=255, help_text="Tên dự án mẫu, ví dụ: 'Xây dựng hệ thống quản trị doanh nghiệp'")
    description = models.TextField(help_text="Mô tả chi tiết về dự án")

    # Category
    category = models.CharField(
        max_length=50,
        choices=ProjectTemplateCategory.choices,
        default=ProjectTemplateCategory.WEB_DEVELOPMENT,
        help_text="Danh mục dự án"
    )

    # Icon and display
    icon = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="Icon class hoặc emoji cho template, ví dụ: 🏢"
    )

    # Pricing
    price_min = models.DecimalField(
        max_digits=12,
        decimal_places=0,
        help_text="Giá tối thiểu (VNĐ)"
    )
    price_max = models.DecimalField(
        max_digits=12,
        decimal_places=0,
        null=True,
        blank=True,
        help_text="Giá tối đa (VNĐ), để trống nếu muốn hiển thị 'Liên hệ'"
    )

    # Timeline
    estimated_duration_min = models.IntegerField(
        help_text="Thời gian thực hiện tối thiểu (ngày)"
    )
    estimated_duration_max = models.IntegerField(
        null=True,
        blank=True,
        help_text="Thời gian thực hiện tối đa (ngày)"
    )

    # Features and details (JSON fields for flexibility)
    key_features = models.JSONField(
        default=list,
        blank=True,
        help_text="Danh sách tính năng chính (array of strings)"
    )

    deliverables = models.JSONField(
        default=list,
        blank=True,
        help_text="Sản phẩm bàn giao (array of strings)"
    )

    technologies = models.JSONField(
        default=list,
        blank=True,
        help_text="Công nghệ sử dụng (array of strings)"
    )

    phases = models.JSONField(
        default=list,
        blank=True,
        help_text="""Các giai đoạn thực hiện (array of objects):
        [
            {
                "name": "Phân tích & Thiết kế",
                "duration_days": 7,
                "percentage": 20,
                "description": "..."
            },
            ...
        ]
        """
    )

    # Team structure
    team_structure = models.JSONField(
        default=dict,
        blank=True,
        help_text="""Cấu trúc team dự kiến (object):
        {
            "project_manager": 1,
            "developers": 2,
            "designers": 1,
            "testers": 1
        }
        """
    )

    # Dynamic Options Configuration
    options = models.JSONField(
        default=list,
        blank=True,
        help_text="""Cấu hình options động cho dự án (array of option objects):
        [
            {
                "id": "language",
                "type": "single_select",
                "label": "Ngôn ngữ",
                "description": "Chọn ngôn ngữ cho website",
                "required": true,
                "choices": [
                    {"value": "vi", "label": "Tiếng Việt", "price_modifier": 0},
                    {"value": "en", "label": "Tiếng Anh", "price_modifier": 3000000},
                    {"value": "multi", "label": "Đa ngôn ngữ", "price_modifier": 8000000}
                ]
            },
            {
                "id": "features",
                "type": "multi_select",
                "label": "Tính năng bổ sung",
                "description": "Chọn các tính năng muốn thêm",
                "required": false,
                "choices": [
                    {"value": "seo", "label": "SEO Nâng cao", "price_modifier": 5000000},
                    {"value": "analytics", "label": "Google Analytics", "price_modifier": 2000000},
                    {"value": "chat", "label": "Live Chat", "price_modifier": 3000000}
                ]
            },
            {
                "id": "package",
                "type": "package",
                "label": "Gói dịch vụ",
                "description": "Chọn gói phù hợp với nhu cầu",
                "required": true,
                "choices": [
                    {
                        "value": "basic",
                        "label": "Basic",
                        "price": 30000000,
                        "duration_days": 30,
                        "features": ["5 trang", "Responsive", "SEO cơ bản"]
                    },
                    {
                        "value": "standard",
                        "label": "Standard",
                        "price": 50000000,
                        "duration_days": 45,
                        "features": ["10 trang", "Responsive", "SEO nâng cao", "Admin panel"]
                    }
                ]
            },
            {
                "id": "product_count",
                "type": "number_range",
                "label": "Số lượng sản phẩm",
                "description": "Số sản phẩm tối đa trên hệ thống",
                "required": true,
                "min": 100,
                "max": 10000,
                "step": 100,
                "default": 500,
                "price_per_unit": 1000
            },
            {
                "id": "custom_note",
                "type": "text_input",
                "label": "Yêu cầu đặc biệt",
                "description": "Nhập yêu cầu tùy chỉnh của bạn",
                "required": false,
                "placeholder": "Ví dụ: Tích hợp với hệ thống ERP hiện có..."
            }
        ]
        """
    )

    # Status
    is_active = models.BooleanField(
        default=True,
        help_text="Template có đang hoạt động không (hiển thị cho customer)"
    )

    # Display order
    display_order = models.IntegerField(
        default=0,
        help_text="Thứ tự hiển thị (số càng nhỏ càng ưu tiên)"
    )

    class Meta:
        db_table = 'project_templates'
        verbose_name = 'Project Template'
        verbose_name_plural = 'Project Templates'
        ordering = ['display_order', 'name']

    def __str__(self):
        return self.name

    def get_price_display(self):
        """Get formatted price range for display"""
        if self.price_max:
            return f"{self.price_min:,.0f}đ - {self.price_max:,.0f}đ"
        return f"{self.price_min:,.0f}đ"

    def get_duration_display(self):
        """Get formatted duration for display"""
        if self.estimated_duration_max:
            return f"{self.estimated_duration_min} - {self.estimated_duration_max} ngày"
        return f"{self.estimated_duration_min} ngày"
