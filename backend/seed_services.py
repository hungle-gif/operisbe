import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.services.models import Service, ServiceCategory

services_data = [
    {
        'name': 'Phát triển Website',
        'slug': 'phat-trien-website',
        'category': ServiceCategory.WEB_DEVELOPMENT,
        'short_description': 'Thiết kế và phát triển website chuyên nghiệp, responsive trên mọi thiết bị',
        'full_description': 'Operis cung cấp dịch vụ phát triển website toàn diện từ A-Z',
        'key_features': [
            'Thiết kế responsive, tương thích mọi thiết bị',
            'Tối ưu SEO chuẩn Google',
            'Bảo mật cao cấp với SSL',
            'Tốc độ tải trang nhanh'
        ],
        'differentiators': [
            'Đội ngũ developer 5+ năm kinh nghiệm',
            'Quy trình Agile linh hoạt',
            'Bảo hành 12 tháng miễn phí'
        ],
        'process_stages': [
            {'stage': 1, 'name': 'Phân tích', 'duration': '3-5 ngày'},
            {'stage': 2, 'name': 'Thiết kế', 'duration': '5-7 ngày'},
            {'stage': 3, 'name': 'Phát triển', 'duration': '15-20 ngày'}
        ],
        'team_structure': {'PM': 1, 'Developer': 2, 'Designer': 1},
        'estimated_team_size': 4,
        'estimated_duration_min': 30,
        'estimated_duration_max': 45,
        'price_range_min': 50000000,
        'price_range_max': 150000000,
        'icon': 'globe',
        'technologies': ['React', 'Next.js', 'Django'],
        'is_active': True,
        'is_featured': True,
        'order': 1
    }
]

for data in services_data:
    service, created = Service.objects.get_or_create(slug=data['slug'], defaults=data)
    print(f"Created: {service.name}" if created else f"Exists: {service.name}")
