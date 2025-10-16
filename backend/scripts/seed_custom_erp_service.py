import os
import sys
import django

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.services.models.service import Service

def create_custom_erp_service():
    """Create a custom ERP service"""

    # Delete existing service if it exists
    Service.objects.filter(slug='xay-dung-he-thong-quan-tri-doanh-nghiep').delete()

    service = Service.objects.create(
        name="Xây dựng hệ thống quản trị doanh nghiệp thông minh tùy biến",
        slug="xay-dung-he-thong-quan-tri-doanh-nghiep",
        category="custom_software",
        short_description="Giải pháp quản trị doanh nghiệp toàn diện, tùy biến theo nhu cầu riêng của bạn",
        full_description="abc (nội dung sẽ được cập nhật sau)",
        key_features=[
            "Tùy biến 100% theo quy trình doanh nghiệp",
            "Tích hợp đa nền tảng",
            "Báo cáo thống kê thông minh",
            "Bảo mật cấp enterprise",
        ],
        differentiators=[
            "Đội ngũ có kinh nghiệm triển khai 50+ dự án ERP",
            "Phương pháp tùy biến linh hoạt, không bị gò bó template",
            "Hỗ trợ đào tạo và vận hành sau triển khai",
            "Bảo hành trọn đời, nâng cấp liên tục",
        ],
        process_stages=[
            {
                "stage": 1,
                "name": "Nghiên cứu - Tìm hiểu",
                "description": "Phân tích quy trình hiện tại, xác định yêu cầu và mục tiêu kinh doanh",
                "duration": "3-4 ngày",
            },
            {
                "stage": 2,
                "name": "Triển khai",
                "description": "Thiết kế hệ thống, phát triển các module theo yêu cầu",
                "duration": "6-7 ngày",
            },
            {
                "stage": 3,
                "name": "Chỉnh sửa - Bàn giao",
                "description": "Test, điều chỉnh theo feedback, đào tạo người dùng",
                "duration": "3-4 ngày",
            },
            {
                "stage": 4,
                "name": "Bảo hành - Nâng cấp",
                "description": "Hỗ trợ vận hành, sửa lỗi và nâng cấp tính năng mới",
                "duration": "Trọn đời",
            },
        ],
        team_structure={
            "Project Manager": 1,
            "Business Analyst": 1,
            "Backend Developer": 2,
            "Frontend Developer": 1,
        },
        estimated_team_size=5,
        estimated_duration_min=14,
        estimated_duration_max=14,
        price_range_min=12000000,
        price_range_max=12000000,
        icon="building",
        is_active=True,
        is_featured=True,
        technologies=["Django", "React", "PostgreSQL", "Redis"],
    )

    print(f"✅ Created service: {service.name}")
    print(f"   - ID: {service.id}")
    print(f"   - Slug: {service.slug}")
    print(f"   - Price: {service.price_range_min:,.0f} VNĐ")
    print(f"   - Duration: {service.estimated_duration_min} ngày")
    print(f"   - Team size: {service.estimated_team_size} người")

if __name__ == "__main__":
    create_custom_erp_service()
