import os
import sys
import django

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.services.models.service import Service

def update_erp_service():
    """Update ERP service with detailed information"""

    service = Service.objects.get(slug='xay-dung-he-thong-quan-tri-doanh-nghiep')

    # Update process stages với nội dung chi tiết
    service.process_stages = [
        {
            "stage": 1,
            "name": "Tìm hiểu & Thống nhất",
            "duration": "1 ngày",
            "description": "Tìm hiểu nhu cầu, thống nhất quy trình, chi phí, thời gian thực hiện và điều khoản liên quan",
            "details": [
                "Phân tích quy trình hiện tại của doanh nghiệp",
                "Xác định mục tiêu và kỳ vọng của khách hàng",
                "Thống nhất chi phí dự án và phương thức thanh toán",
                "Thống nhất thời gian thực hiện từng giai đoạn",
                "Ký kết điều khoản hợp đồng và cam kết chất lượng"
            ],
            "commitment": {
                "delay_1_3_days": "Giảm 10% giá dự án",
                "delay_3_7_days": "Giảm 20% giá dự án",
                "delay_7_14_days": "Giảm 50% giá dự án"
            }
        },
        {
            "stage": 2,
            "name": "Triển khai",
            "duration": "10 ngày",
            "description": "Triển khai chi tiết từng đầu mục công việc có sự giám sát và thống nhất 2 bên",
            "details": [
                "Thiết kế database và kiến trúc hệ thống",
                "Phát triển các module theo đầu mục đã thống nhất",
                "Họp daily/weekly để cập nhật tiến độ",
                "Demo từng tính năng hoàn thành để khách hàng kiểm tra",
                "Điều chỉnh theo feedback trong quá trình triển khai"
            ],
            "supervision": "Có sự giám sát và xác nhận của cả 2 bên"
        },
        {
            "stage": 3,
            "name": "Chỉnh sửa & Bàn giao",
            "duration": "3 ngày",
            "description": "Chỉnh sửa và tối ưu hóa chức năng, bảo mật, tốc độ và bàn giao khách hàng",
            "details": [
                "Kiểm tra và tối ưu hóa toàn bộ chức năng",
                "Audit bảo mật và xử lý các lỗ hổng (nếu có)",
                "Tối ưu hóa performance và tốc độ load",
                "Đào tạo người dùng sử dụng hệ thống",
                "Bàn giao source code và tài liệu hướng dẫn"
            ]
        },
        {
            "stage": 4,
            "name": "Bảo hành & Nâng cấp",
            "duration": "Trọn đời",
            "description": "Bảo hành theo gói và nâng cấp theo yêu cầu thêm của khách hàng",
            "details": [
                "Hỗ trợ khắc phục lỗi phát sinh (nếu có)",
                "Tư vấn sử dụng và tối ưu quy trình",
                "Nâng cấp tính năng theo yêu cầu mới (tính phí riêng)",
                "Hỗ trợ backup và phục hồi dữ liệu",
                "Cập nhật bảo mật định kỳ"
            ],
            "warranty_packages": [
                "Gói cơ bản: 6 tháng bảo hành miễn phí",
                "Gói nâng cao: 12 tháng + ưu tiên hỗ trợ",
                "Gói doanh nghiệp: Trọn đời + tính năng mới"
            ]
        }
    ]

    # Update team structure với thông tin nhân viên mẫu
    service.team_structure = {
        "members": [
            {
                "role": "Chăm sóc khách hàng",
                "name": "Nguyễn Văn A",
                "avatar": "https://i.pravatar.cc/150?img=1",
                "rating": 4.8,
                "experience": "5 năm kinh nghiệm",
                "description": "Chuyên tư vấn và hỗ trợ khách hàng 24/7"
            },
            {
                "role": "Developer chính",
                "name": "Trần Thị B",
                "avatar": "https://i.pravatar.cc/150?img=5",
                "rating": 5.0,
                "experience": "7 năm kinh nghiệm",
                "description": "Senior Full-stack Developer, chuyên về ERP/CRM"
            },
            {
                "role": "Thiết kế giao diện",
                "name": "Lê Văn C",
                "avatar": "https://i.pravatar.cc/150?img=3",
                "rating": 4.9,
                "experience": "4 năm kinh nghiệm",
                "description": "UI/UX Designer, tạo giao diện thân thiện người dùng"
            },
            {
                "role": "Thiết kế bảo mật",
                "name": "Phạm Thị D",
                "avatar": "https://i.pravatar.cc/150?img=9",
                "rating": 4.7,
                "experience": "6 năm kinh nghiệm",
                "description": "Security Expert, đảm bảo hệ thống an toàn tuyệt đối"
            },
            {
                "role": "Test hệ thống",
                "name": "Hoàng Văn E",
                "avatar": "https://i.pravatar.cc/150?img=7",
                "rating": 4.6,
                "experience": "3 năm kinh nghiệm",
                "description": "QA Tester, kiểm tra kỹ lưỡng mọi tính năng"
            },
            {
                "role": "Giám sát dự án",
                "name": "Võ Thị F",
                "avatar": "https://i.pravatar.cc/150?img=10",
                "rating": 5.0,
                "experience": "8 năm kinh nghiệm",
                "description": "Project Manager, quản lý tiến độ và chất lượng"
            }
        ]
    }

    service.estimated_team_size = 6

    # Update differentiators
    service.differentiators = [
        "Đội ngũ 50+ dự án ERP thành công, hiểu rõ đặc thù từng ngành",
        "Phương pháp tùy biến 100% theo luồng công việc riêng của bạn",
        "Cam kết bồi thường khi chậm tiến độ (giảm 10-50% giá dự án)",
        "Hỗ trợ đào tạo nhân viên sử dụng hệ thống miễn phí",
        "Bảo hành trọn đời với gói Enterprise, nâng cấp liên tục"
    ]

    service.save()

    print(f"✅ Updated service: {service.name}")
    print(f"   - Process stages: {len(service.process_stages)} giai đoạn")
    print(f"   - Team members: {len(service.team_structure['members'])} người")
    print(f"   - Differentiators: {len(service.differentiators)} điểm khác biệt")

if __name__ == "__main__":
    update_erp_service()
