"""
Script to update all services with default team structure
Mix of real staff and virtual specialists
"""

import os
import sys
import django

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.services.models import Service

# Default team structure - same as frontend
DEFAULT_TEAM_MEMBERS = [
    # Real staff - Sale (Customer Care)
    {
        "name": "Nguyễn Minh Tuấn",
        "role": "Chăm sóc khách hàng & Tư vấn",
        "rating": 5,
        "avatar": "/avatars/default-nguyen.png",
        "experience": "7 năm kinh nghiệm",
        "description": "Chuyên viên tư vấn và chăm sóc khách hàng"
    },

    # Real staff - Lead Developer
    {
        "name": "Trần Văn Hùng",
        "role": "Trưởng nhóm phát triển",
        "rating": 5,
        "avatar": "/avatars/default-tran.png",
        "experience": "10 năm kinh nghiệm",
        "description": "Lập trình viên chính, quản lý kỹ thuật"
    },

    # Real staff - Admin/Project Supervisor
    {
        "name": "Phạm Thị Mai Anh",
        "role": "Giám sát dự án",
        "rating": 5,
        "avatar": "/avatars/default-pham.png",
        "experience": "12 năm kinh nghiệm",
        "description": "Quản lý tiến độ và chất lượng dự án"
    },

    # Virtual staff - UI/UX Designer
    {
        "name": "Lê Hoàng Minh",
        "role": "Thiết kế giao diện UI/UX",
        "rating": 4,
        "avatar": "/avatars/default-le.png",
        "experience": "5 năm kinh nghiệm",
        "description": "Chuyên gia thiết kế trải nghiệm người dùng"
    },

    # Virtual staff - Security Specialist
    {
        "name": "Đỗ Quang Hải",
        "role": "Chuyên gia bảo mật",
        "rating": 5,
        "avatar": "/avatars/default-do.png",
        "experience": "8 năm kinh nghiệm",
        "description": "Đảm bảo an toàn và bảo mật hệ thống"
    },

    # Virtual staff - QA/Tester
    {
        "name": "Vũ Thị Thanh Hương",
        "role": "Kiểm thử hệ thống (QA)",
        "rating": 4,
        "avatar": "/avatars/default-vu.png",
        "experience": "4 năm kinh nghiệm",
        "description": "Kiểm tra chất lượng và tìm lỗi hệ thống"
    }
]

def update_all_services():
    """Update all services with default team structure"""
    services = Service.objects.all()

    print(f"Found {services.count()} services to update...")

    for service in services:
        # Update team structure
        service.team_structure = {
            "members": DEFAULT_TEAM_MEMBERS
        }
        service.estimated_team_size = len(DEFAULT_TEAM_MEMBERS)
        service.save()

        print(f"✓ Updated service: {service.name}")

    print(f"\n✅ Successfully updated {services.count()} services with default team structure!")
    print(f"   - 3 real staff members (Sale, Dev Lead, Admin)")
    print(f"   - 3 virtual specialists (UI/UX, Security, QA)")

if __name__ == '__main__':
    update_all_services()
