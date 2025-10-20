"""
Script to create sample project templates
Run: python manage.py shell < scripts/create_sample_templates.py
"""
import sys
import os
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.projects.models import ProjectTemplate, ProjectTemplateCategory
from decimal import Decimal

def create_sample_templates():
    """Create sample project templates"""

    # Template 1: Enterprise Management System
    template1, created1 = ProjectTemplate.objects.get_or_create(
        name="Xây dựng hệ thống quản trị doanh nghiệp thông minh tùy biến",
        defaults={
            'description': 'Giải pháp quản trị doanh nghiệp toàn diện, tùy biến theo nhu cầu riêng của bạn',
            'category': ProjectTemplateCategory.ENTERPRISE_SYSTEM,
            'icon': '🏢',
            'price_min': Decimal('12000000'),
            'price_max': None,  # Will show as "Liên hệ"
            'estimated_duration_min': 14,
            'estimated_duration_max': None,
            'key_features': [
                'Quản lý nhân sự và chấm công',
                'Quản lý dự án và công việc',
                'Quản lý tài chính và kế toán',
                'Báo cáo thống kê chi tiết',
                'Tích hợp với hệ thống hiện có',
                'Phân quyền người dùng linh hoạt',
                'Thông báo và nhắc nhở tự động',
                'Tùy biến theo quy trình doanh nghiệp'
            ],
            'deliverables': [
                'Mã nguồn đầy đủ',
                'Tài liệu hướng dẫn sử dụng',
                'Tài liệu kỹ thuật',
                'Đào tạo người dùng',
                'Bảo hành 6 tháng',
                'Hỗ trợ kỹ thuật 24/7'
            ],
            'technologies': [
                'React/Next.js',
                'Django/Python',
                'PostgreSQL',
                'Redis',
                'Docker',
                'AWS/Azure'
            ],
            'phases': [
                {
                    'name': 'Phân tích & Thiết kế',
                    'duration_days': 7,
                    'percentage': 20,
                    'description': 'Thu thập yêu cầu, phân tích nghiệp vụ, thiết kế hệ thống'
                },
                {
                    'name': 'Phát triển Backend',
                    'duration_days': 14,
                    'percentage': 30,
                    'description': 'Xây dựng API, database, business logic'
                },
                {
                    'name': 'Phát triển Frontend',
                    'duration_days': 14,
                    'percentage': 30,
                    'description': 'Xây dựng giao diện người dùng'
                },
                {
                    'name': 'Testing & Deployment',
                    'duration_days': 7,
                    'percentage': 20,
                    'description': 'Kiểm thử, sửa lỗi, triển khai production'
                }
            ],
            'team_structure': {
                'project_manager': 1,
                'developers': 3,
                'designers': 1,
                'testers': 1
            },
            'is_active': True,
            'display_order': 1
        }
    )

    if created1:
        print(f"✅ Created template: {template1.name}")
    else:
        print(f"ℹ️  Template already exists: {template1.name}")

    # Template 2: Professional Website
    template2, created2 = ProjectTemplate.objects.get_or_create(
        name="Phát triển Website",
        defaults={
            'description': 'Thiết kế và phát triển website chuyên nghiệp, responsive trên mọi thiết bị',
            'category': ProjectTemplateCategory.WEB_DEVELOPMENT,
            'icon': '🌐',
            'price_min': Decimal('50000000'),
            'price_max': None,
            'estimated_duration_min': 30,
            'estimated_duration_max': None,
            'key_features': [
                'Thiết kế UI/UX chuyên nghiệp',
                'Responsive trên mọi thiết bị',
                'Tối ưu SEO',
                'Tốc độ tải trang nhanh',
                'Bảo mật cao',
                'Quản trị nội dung dễ dàng',
                'Tích hợp Google Analytics',
                'Form liên hệ và newsletter'
            ],
            'deliverables': [
                'Website hoàn chỉnh',
                'Mã nguồn đầy đủ',
                'Tài liệu quản trị',
                'Hosting 1 năm',
                'Domain .com/.vn 1 năm',
                'SSL Certificate',
                'Bảo trì 3 tháng miễn phí',
                'Đào tạo quản trị viên'
            ],
            'technologies': [
                'Next.js 14',
                'React',
                'TailwindCSS',
                'TypeScript',
                'Vercel/Netlify',
                'Headless CMS'
            ],
            'phases': [
                {
                    'name': 'Khảo sát & Thiết kế',
                    'duration_days': 10,
                    'percentage': 25,
                    'description': 'Tìm hiểu yêu cầu, thiết kế mockup, prototype'
                },
                {
                    'name': 'Phát triển',
                    'duration_days': 15,
                    'percentage': 40,
                    'description': 'Code frontend, backend, tích hợp CMS'
                },
                {
                    'name': 'Nội dung & SEO',
                    'duration_days': 5,
                    'percentage': 15,
                    'description': 'Tối ưu nội dung, SEO on-page'
                },
                {
                    'name': 'Testing & Launch',
                    'duration_days': 5,
                    'percentage': 20,
                    'description': 'Kiểm thử, sửa lỗi, launch website'
                }
            ],
            'team_structure': {
                'project_manager': 1,
                'developers': 2,
                'designers': 1,
                'testers': 1
            },
            'is_active': True,
            'display_order': 2
        }
    )

    if created2:
        print(f"✅ Created template: {template2.name}")
    else:
        print(f"ℹ️  Template already exists: {template2.name}")

    print("\n🎉 Sample project templates created successfully!")
    print(f"Total active templates: {ProjectTemplate.objects.filter(is_active=True).count()}")

if __name__ == '__main__':
    create_sample_templates()
