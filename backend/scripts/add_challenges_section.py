import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.services.models.service import Service

def add_challenges():
    """Add challenges section to service"""
    service = Service.objects.get(slug='xay-dung-he-thong-quan-tri-doanh-nghiep')

    # Add challenges as part of key_features for now (will display separately in UI)
    service.full_description = """
Operis cung cấp dịch vụ xây dựng hệ thống quản trị doanh nghiệp thông minh, tùy biến 100% theo quy trình riêng của từng khách hàng.

**Những vấn đề khó giải quyết khi làm hệ thống tùy biến:**

1. **Logic phức tạp**: Mỗi doanh nghiệp có quy trình riêng, không thể dùng template có sẵn
2. **Tích hợp đa hệ thống**: Cần kết nối với nhiều phần mềm, thiết bị khác nhau
3. **Bảo mật dữ liệu**: Đảm bảo an toàn tuyệt đối cho thông tin nhạy cảm
4. **Hiệu năng**: Xử lý khối lượng lớn dữ liệu mà vẫn đảm bảo tốc độ
5. **Đào tạo nhân viên**: Người dùng cần thời gian làm quen với hệ thống mới
6. **Mở rộng trong tương lai**: Hệ thống phải dễ dàng thêm tính năng mới
"""

    # Store challenges as JSON for structured display
    service.key_features = [
        {
            "type": "challenge",
            "title": "Logic phức tạp",
            "description": "Mỗi doanh nghiệp có quy trình riêng, không thể dùng template có sẵn",
            "solution": "Operis phân tích sâu quy trình của bạn và code từng bước theo đúng logic"
        },
        {
            "type": "challenge",
            "title": "Tích hợp đa hệ thống",
            "description": "Cần kết nối với nhiều phần mềm, thiết bị khác nhau",
            "solution": "Đội ngũ có kinh nghiệm tích hợp 50+ loại API và thiết bị khác nhau"
        },
        {
            "type": "challenge",
            "title": "Bảo mật dữ liệu",
            "description": "Đảm bảo an toàn tuyệt đối cho thông tin nhạy cảm",
            "solution": "Áp dụng chuẩn bảo mật Enterprise với mã hóa AES-256"
        },
        {
            "type": "challenge",
            "title": "Hiệu năng cao",
            "description": "Xử lý khối lượng lớn dữ liệu mà vẫn đảm bảo tốc độ",
            "solution": "Tối ưu database, sử dụng cache và load balancing"
        },
        {
            "type": "challenge",
            "title": "Đào tạo nhân viên",
            "description": "Người dùng cần thời gian làm quen với hệ thống mới",
            "solution": "Giao diện trực quan + đào tạo 1-1 + tài liệu chi tiết"
        },
        {
            "type": "challenge",
            "title": "Mở rộng linh hoạt",
            "description": "Hệ thống phải dễ dàng thêm tính năng mới",
            "solution": "Kiến trúc module hóa, dễ dàng thêm chức năng mới"
        }
    ]

    service.save()
    print("✅ Added challenges section")
    print(f"   - {len(service.key_features)} challenges added")

if __name__ == "__main__":
    add_challenges()
