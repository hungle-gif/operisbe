"""
Script to add sample options to existing project templates
Run: python manage.py shell < scripts/add_sample_options.py
"""
import sys
import os
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.projects.models import ProjectTemplate

def add_sample_options():
    """Add sample dynamic options to existing templates"""

    # Update Enterprise System template
    try:
        enterprise_template = ProjectTemplate.objects.get(
            name__contains="hệ thống quản trị doanh nghiệp"
        )

        enterprise_template.options = [
            {
                "id": "package",
                "type": "package",
                "label": "Gói dịch vụ",
                "description": "Chọn gói phù hợp với quy mô doanh nghiệp",
                "required": True,
                "choices": [
                    {
                        "value": "basic",
                        "label": "Basic - Doanh nghiệp nhỏ",
                        "price": 12000000,
                        "duration_days": 14,
                        "features": [
                            "Tối đa 10 nhân viên",
                            "Quản lý nhân sự cơ bản",
                            "Quản lý công việc",
                            "Báo cáo cơ bản",
                            "Hỗ trợ 3 tháng"
                        ]
                    },
                    {
                        "value": "standard",
                        "label": "Standard - Doanh nghiệp vừa",
                        "price": 25000000,
                        "duration_days": 21,
                        "features": [
                            "Tối đa 50 nhân viên",
                            "Quản lý nhân sự đầy đủ",
                            "Quản lý dự án & công việc",
                            "Quản lý tài chính",
                            "Báo cáo chi tiết",
                            "Hỗ trợ 6 tháng"
                        ]
                    },
                    {
                        "value": "enterprise",
                        "label": "Enterprise - Doanh nghiệp lớn",
                        "price": 50000000,
                        "duration_days": 30,
                        "features": [
                            "Không giới hạn nhân viên",
                            "Toàn bộ tính năng",
                            "Tích hợp hệ thống bên ngoài",
                            "Báo cáo nâng cao & BI",
                            "Tùy biến cao",
                            "Hỗ trợ 12 tháng"
                        ]
                    }
                ]
            },
            {
                "id": "modules",
                "type": "multi_select",
                "label": "Modules bổ sung",
                "description": "Chọn các modules cần thêm vào hệ thống",
                "required": False,
                "choices": [
                    {
                        "value": "crm",
                        "label": "CRM - Quản lý khách hàng",
                        "price_modifier": 8000000
                    },
                    {
                        "value": "inventory",
                        "label": "Quản lý kho",
                        "price_modifier": 6000000
                    },
                    {
                        "value": "accounting",
                        "label": "Kế toán",
                        "price_modifier": 10000000
                    },
                    {
                        "value": "hr_advanced",
                        "label": "Nhân sự nâng cao (Chấm công, Lương)",
                        "price_modifier": 7000000
                    },
                    {
                        "value": "workflow",
                        "label": "Quy trình tự động",
                        "price_modifier": 5000000
                    }
                ]
            },
            {
                "id": "deployment",
                "type": "single_select",
                "label": "Hình thức triển khai",
                "description": "Chọn nơi triển khai hệ thống",
                "required": True,
                "choices": [
                    {
                        "value": "cloud",
                        "label": "Cloud (AWS/Azure)",
                        "price_modifier": 0
                    },
                    {
                        "value": "on_premise",
                        "label": "On-premise (Server riêng)",
                        "price_modifier": 5000000
                    },
                    {
                        "value": "hybrid",
                        "label": "Hybrid (Kết hợp)",
                        "price_modifier": 8000000
                    }
                ]
            },
            {
                "id": "custom_requirements",
                "type": "text_input",
                "label": "Yêu cầu tùy chỉnh",
                "description": "Nhập các yêu cầu đặc biệt của doanh nghiệp",
                "required": False,
                "placeholder": "Ví dụ: Tích hợp với phần mềm kế toán MISA, báo cáo theo mẫu riêng..."
            }
        ]

        enterprise_template.save()
        print(f"✅ Updated options for: {enterprise_template.name}")
        print(f"   Total options: {len(enterprise_template.options)}")

    except ProjectTemplate.DoesNotExist:
        print("⚠️  Enterprise template not found")

    # Update Website template
    try:
        website_template = ProjectTemplate.objects.get(
            name__contains="Phát triển Website"
        )

        website_template.options = [
            {
                "id": "package",
                "type": "package",
                "label": "Gói website",
                "description": "Chọn gói website phù hợp",
                "required": True,
                "choices": [
                    {
                        "value": "landing",
                        "label": "Landing Page",
                        "price": 15000000,
                        "duration_days": 15,
                        "features": [
                            "1 trang đơn",
                            "Responsive",
                            "SEO cơ bản",
                            "Form liên hệ",
                            "Google Analytics"
                        ]
                    },
                    {
                        "value": "corporate",
                        "label": "Website giới thiệu",
                        "price": 30000000,
                        "duration_days": 25,
                        "features": [
                            "5-10 trang",
                            "Responsive",
                            "SEO nâng cao",
                            "Admin panel",
                            "Blog/Tin tức",
                            "Multi-language"
                        ]
                    },
                    {
                        "value": "professional",
                        "label": "Website chuyên nghiệp",
                        "price": 50000000,
                        "duration_days": 30,
                        "features": [
                            "Không giới hạn trang",
                            "Thiết kế custom",
                            "SEO chuyên sâu",
                            "CMS mạnh mẽ",
                            "Tích hợp API",
                            "Performance cao"
                        ]
                    }
                ]
            },
            {
                "id": "language",
                "type": "single_select",
                "label": "Ngôn ngữ",
                "description": "Số lượng ngôn ngữ hỗ trợ",
                "required": True,
                "choices": [
                    {
                        "value": "single",
                        "label": "Một ngôn ngữ (Việt hoặc Anh)",
                        "price_modifier": 0
                    },
                    {
                        "value": "bilingual",
                        "label": "Song ngữ (Việt + Anh)",
                        "price_modifier": 5000000
                    },
                    {
                        "value": "multilingual",
                        "label": "Đa ngôn ngữ (3+ ngôn ngữ)",
                        "price_modifier": 10000000
                    }
                ]
            },
            {
                "id": "features",
                "type": "multi_select",
                "label": "Tính năng bổ sung",
                "description": "Chọn các tính năng cần thêm",
                "required": False,
                "choices": [
                    {
                        "value": "booking",
                        "label": "Hệ thống đặt lịch/booking",
                        "price_modifier": 8000000
                    },
                    {
                        "value": "payment",
                        "label": "Thanh toán online",
                        "price_modifier": 5000000
                    },
                    {
                        "value": "chat",
                        "label": "Live chat",
                        "price_modifier": 3000000
                    },
                    {
                        "value": "membership",
                        "label": "Hệ thống thành viên",
                        "price_modifier": 6000000
                    },
                    {
                        "value": "mobile_app",
                        "label": "Mobile App đi kèm",
                        "price_modifier": 20000000
                    }
                ]
            },
            {
                "id": "page_count",
                "type": "number_range",
                "label": "Số trang",
                "description": "Số lượng trang cần thiết kế (ngoài gói cơ bản)",
                "required": False,
                "min": 0,
                "max": 50,
                "step": 1,
                "default": 0,
                "price_per_unit": 2000000
            },
            {
                "id": "special_requirements",
                "type": "text_input",
                "label": "Yêu cầu đặc biệt",
                "description": "Mô tả các yêu cầu đặc biệt khác",
                "required": False,
                "placeholder": "Ví dụ: Tích hợp hệ thống CRM, thiết kế 3D, animation đặc biệt..."
            }
        ]

        website_template.save()
        print(f"✅ Updated options for: {website_template.name}")
        print(f"   Total options: {len(website_template.options)}")

    except ProjectTemplate.DoesNotExist:
        print("⚠️  Website template not found")

    print("\n🎉 Sample options added successfully!")

if __name__ == '__main__':
    add_sample_options()
