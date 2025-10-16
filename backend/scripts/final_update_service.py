import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.services.models.service import Service

def final_update():
    """Final update for service content"""
    service = Service.objects.get(slug='xay-dung-he-thong-quan-tri-doanh-nghiep')

    # Restore differentiators as simple list (not challenges)
    service.differentiators = [
        "Đội ngũ 50+ dự án ERP thành công, hiểu rõ đặc thù từng ngành",
        "Phương pháp tùy biến 100% theo luồng công việc riêng của bạn",
        "Cam kết bồi thường khi chậm tiến độ (giảm 10-50% giá dự án)",
        "Hỗ trợ đào tạo nhân viên sử dụng hệ thống miễn phí",
        "Bảo hành trọn đời với gói Enterprise, nâng cấp liên tục"
    ]

    service.save()
    print("✅ Final update completed")
    print(f"   - Differentiators: {len(service.differentiators)}")
    print(f"   - Challenges: {len(service.key_features)}")

if __name__ == "__main__":
    final_update()
