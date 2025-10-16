import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.services.models.service import Service

def update_service_content():
    """Update service with new content"""
    service = Service.objects.get(slug='xay-dung-he-thong-quan-tri-doanh-nghiep')

    # Update process stages - FIX commitment text
    service.process_stages[0]['commitment'] = {
        "delay_1_3_days": "Giảm 10% giá dự án (chậm tiến độ 1-3 ngày so với cam kết)",
        "delay_4_7_days": "Giảm 20% giá dự án (chậm tiến độ 4-7 ngày so với cam kết)",
        "delay_8_14_days": "Giảm 50% giá dự án (chậm tiến độ 8-14 ngày so với cam kết)"
    }

    # Add challenges section before differentiators
    service.key_features = [
        "Tùy biến 100% theo quy trình doanh nghiệp",
        "Tích hợp đa nền tảng",
        "Báo cáo thống kê thông minh",
        "Bảo mật cấp enterprise",
    ]

    # Add new field for challenges
    if not hasattr(service, 'challenges'):
        service.challenges = []

    service.save()

    print(f"✅ Updated service content")
    print(f"   - Commitment text updated")
    print(f"   - Process stages: {len(service.process_stages)}")

if __name__ == "__main__":
    update_service_content()
