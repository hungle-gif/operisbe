# Project Templates - Quản lý Dự án Mẫu

## Tổng quan

Tính năng **Project Templates** (Dự án Mẫu) cho phép Admin tạo và quản lý các dự án mẫu định sẵn mà khách hàng có thể chọn khi tạo yêu cầu dịch vụ. Điều này giúp:

- Tiêu chuẩn hóa các loại dự án phổ biến
- Hiển thị thông tin giá, thời gian, tính năng một cách rõ ràng
- Giúp khách hàng dễ dàng chọn lựa dịch vụ phù hợp
- Tăng tốc độ báo giá và bắt đầu dự án

## Kiến trúc

### 1. Backend Components

#### Model: `ProjectTemplate`
Đường dẫn: `backend/apps/projects/models/project_template.py`

**Các trường chính:**

```python
class ProjectTemplate(BaseModel):
    # Thông tin cơ bản
    name: str                           # Tên dự án mẫu
    description: str                    # Mô tả chi tiết
    category: str                       # Danh mục (choices)
    icon: str                          # Icon/emoji hiển thị

    # Giá & Thời gian
    price_min: Decimal                 # Giá tối thiểu (VNĐ)
    price_max: Decimal | None          # Giá tối đa (None = "Liên hệ")
    estimated_duration_min: int        # Thời gian tối thiểu (ngày)
    estimated_duration_max: int | None # Thời gian tối đa

    # Chi tiết dự án (JSON fields)
    key_features: list[str]            # Danh sách tính năng chính
    deliverables: list[str]            # Sản phẩm bàn giao
    technologies: list[str]            # Công nghệ sử dụng
    phases: list[dict]                 # Các giai đoạn thực hiện
    team_structure: dict               # Cấu trúc team

    # Trạng thái
    is_active: bool                    # Có hiển thị cho customer không
    display_order: int                 # Thứ tự hiển thị
```

**Danh mục (Categories):**

- `web_development` - Phát triển Website
- `mobile_app` - Ứng dụng Mobile
- `enterprise_system` - Hệ thống Doanh nghiệp
- `ecommerce` - Thương mại điện tử
- `crm_system` - Hệ thống CRM
- `erp_system` - Hệ thống ERP
- `ai_ml` - AI & Machine Learning
- `consulting` - Tư vấn
- `maintenance` - Bảo trì & Hỗ trợ

#### API Endpoints

**Base URL:** `/api/project-templates`

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/` | Public | Lấy danh sách templates active (cho customer) |
| GET | `/admin/all` | Admin | Lấy tất cả templates (bao gồm inactive) |
| GET | `/{id}` | Public | Lấy chi tiết 1 template |
| POST | `/` | Admin | Tạo template mới |
| PUT | `/{id}` | Admin | Cập nhật template |
| DELETE | `/{id}` | Admin | Xóa template |
| GET | `/categories/list` | Public | Lấy danh sách categories |

**Query Parameters:**

- `category` (string) - Lọc theo danh mục
- `is_active` (boolean) - Lọc theo trạng thái (mặc định: true)

**Example Request:**

```bash
# Lấy tất cả templates active
curl http://localhost:8000/api/project-templates/

# Lọc theo category
curl http://localhost:8000/api/project-templates/?category=web_development

# Admin: Lấy tất cả (bao gồm inactive)
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/project-templates/admin/all
```

**Example Response:**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Xây dựng hệ thống quản trị doanh nghiệp thông minh tùy biến",
    "description": "Giải pháp quản trị doanh nghiệp toàn diện...",
    "category": "enterprise_system",
    "icon": "🏢",
    "price_min": 12000000,
    "price_max": null,
    "estimated_duration_min": 14,
    "estimated_duration_max": null,
    "key_features": [
      "Quản lý nhân sự và chấm công",
      "Quản lý dự án và công việc",
      "..."
    ],
    "deliverables": ["Mã nguồn đầy đủ", "..."],
    "technologies": ["React/Next.js", "Django/Python", "..."],
    "phases": [...],
    "team_structure": {...},
    "is_active": true,
    "display_order": 1,
    "created_at": "2025-10-20T10:00:00Z",
    "updated_at": "2025-10-20T10:00:00Z"
  }
]
```

### 2. Frontend Components

#### Admin Page: Quản lý Dự án Mẫu
Đường dẫn: `frontend/app/(dashboard)/dashboard/admin/project-templates/page.tsx`

**URL:** `/dashboard/admin/project-templates`

**Tính năng:**

1. **Danh sách Templates (Grid View)**
   - Hiển thị dạng card với thông tin:
     - Icon, tên, danh mục
     - Giá và thời gian dự kiến
     - Tính năng chính (3 đầu tiên)
     - Trạng thái (Active/Inactive)
   - Filter theo danh mục
   - Sắp xếp theo `display_order`

2. **Modal Tạo/Chỉnh sửa Template**
   - Form đầy đủ với validation
   - Các section:
     - Thông tin cơ bản (tên, mô tả, danh mục, icon)
     - Giá & Thời gian
     - Tính năng chính (textarea, mỗi dòng 1 tính năng)
     - Trạng thái & Thứ tự hiển thị

3. **Hành động (Actions)**
   - Chỉnh sửa template
   - Xóa template (có confirm)

#### Navigation Menu
Menu "Dự án Mẫu" đã được thêm vào Admin navigation:
- Icon: Layers
- Vị trí: Sau menu "Dự án", trước menu "Dịch vụ"

### 3. Database Migration

**Migration file:** `apps/projects/migrations/0013_projecttemplate.py`

Tạo bảng `project_templates` với tất cả các trường cần thiết.

**Chạy migration:**

```bash
# Tạo migration
docker-compose exec backend python manage.py makemigrations projects

# Chạy migration
docker-compose exec backend python manage.py migrate projects
```

## Hướng dẫn sử dụng

### A. Dành cho Admin

#### 1. Tạo Dự án Mẫu Mới

1. Đăng nhập với tài khoản Admin
2. Vào menu **"Dự án Mẫu"** trên header
3. Click nút **"+ Tạo Dự Án Mẫu Mới"**
4. Điền thông tin:
   - **Tên dự án mẫu** *: Ví dụ "Xây dựng hệ thống quản trị doanh nghiệp"
   - **Mô tả** *: Mô tả chi tiết về dự án
   - **Danh mục** *: Chọn từ dropdown
   - **Icon**: Nhập emoji (🏢, 🌐, 📱, etc.)
   - **Giá tối thiểu (VNĐ)** *: Ví dụ 12000000
   - **Giá tối đa**: Để trống nếu muốn hiển thị "Liên hệ"
   - **Thời gian tối thiểu (ngày)** *: Ví dụ 14
   - **Thời gian tối đa**: Để trống hoặc nhập số ngày
   - **Tính năng chính**: Mỗi dòng một tính năng
   - **Kích hoạt**: Check để hiển thị cho khách hàng
   - **Thứ tự hiển thị**: Số càng nhỏ càng ưu tiên
5. Click **"Tạo mới"**

#### 2. Chỉnh sửa Dự án Mẫu

1. Trong danh sách, click nút **"Chỉnh sửa"** trên card template
2. Cập nhật thông tin cần thiết
3. Click **"Cập nhật"**

#### 3. Xóa Dự án Mẫu

1. Click nút **"Xóa"** trên card template
2. Xác nhận trong dialog
3. Template sẽ bị xóa vĩnh viễn

#### 4. Lọc và Tìm kiếm

- Sử dụng dropdown **"Danh mục"** để lọc theo category
- Chọn "Tất cả" để hiển thị toàn bộ

#### 5. Quản lý qua Django Admin

Ngoài giao diện frontend, Admin cũng có thể quản lý qua Django Admin:

```
URL: http://localhost:8000/admin/projects/projecttemplate/
```

Tính năng:
- List display: name, category, price_min, price_max, duration, is_active, display_order
- List editable: is_active, display_order (chỉnh sửa nhanh)
- Filters: category, is_active, created_at
- Search: name, description
- Fieldsets được nhóm rõ ràng

### B. Dành cho Developer

#### 1. Tạo Template qua Code

```python
from apps.projects.models import ProjectTemplate, ProjectTemplateCategory
from decimal import Decimal

template = ProjectTemplate.objects.create(
    name="Phát triển Mobile App",
    description="Ứng dụng mobile đa nền tảng với React Native",
    category=ProjectTemplateCategory.MOBILE_APP,
    icon="📱",
    price_min=Decimal('30000000'),
    price_max=Decimal('80000000'),
    estimated_duration_min=30,
    estimated_duration_max=60,
    key_features=[
        "iOS & Android",
        "Push Notifications",
        "In-app Purchases"
    ],
    deliverables=[
        "Source code",
        "App Store deployment",
        "Documentation"
    ],
    technologies=["React Native", "Firebase", "Redux"],
    phases=[
        {
            "name": "Design",
            "duration_days": 10,
            "percentage": 20,
            "description": "UI/UX Design"
        }
    ],
    team_structure={
        "project_manager": 1,
        "developers": 2,
        "designers": 1
    },
    is_active=True,
    display_order=3
)
```

#### 2. Query Templates

```python
# Lấy tất cả active templates
active_templates = ProjectTemplate.objects.filter(is_active=True)

# Lọc theo category
web_templates = ProjectTemplate.objects.filter(
    category=ProjectTemplateCategory.WEB_DEVELOPMENT,
    is_active=True
).order_by('display_order')

# Lấy template theo ID
template = ProjectTemplate.objects.get(id=template_id)

# Sử dụng helper methods
price_display = template.get_price_display()  # "12,000,000đ - 50,000,000đ"
duration_display = template.get_duration_display()  # "14 - 30 ngày"
```

#### 3. API Integration

**Frontend (Next.js):**

```typescript
// Fetch templates
const fetchTemplates = async () => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/project-templates/`
  )
  const data = await response.json()
  return data
}

// Create template (Admin only)
const createTemplate = async (templateData) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/project-templates/`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(templateData)
    }
  )
  return response.json()
}

// Update template (Admin only)
const updateTemplate = async (id, templateData) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/project-templates/${id}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(templateData)
    }
  )
  return response.json()
}

// Delete template (Admin only)
const deleteTemplate = async (id) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/project-templates/${id}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  )
  return response.json()
}
```

## Sample Data

Script tạo dữ liệu mẫu: `backend/scripts/create_sample_templates.py`

**Chạy script:**

```bash
docker-compose exec backend python scripts/create_sample_templates.py
```

**Templates mẫu đã tạo:**

1. **Xây dựng hệ thống quản trị doanh nghiệp thông minh tùy biến**
   - Danh mục: Hệ thống Doanh nghiệp
   - Giá: 12,000,000đ
   - Thời gian: 14 ngày
   - Chi phí TB: 12,000,000đ

2. **Phát triển Website**
   - Danh mục: Phát triển Website
   - Giá: 50,000,000đ
   - Thời gian: 30 ngày
   - Chi phí TB: 50,000,000đ

## Tích hợp với Service Request Flow (Tương lai)

Trong tương lai, Project Templates có thể được tích hợp vào form tạo Service Request:

1. Customer xem danh sách templates
2. Chọn template phù hợp
3. Form tạo yêu cầu tự động điền thông tin từ template
4. Customer có thể tùy chỉnh thêm yêu cầu riêng
5. Hệ thống tạo Service Request và Project dựa trên template

**Các bước triển khai:**

1. Thêm field `template_id` vào `ServiceRequest` model
2. Cập nhật form tạo yêu cầu để hiển thị danh sách templates
3. Auto-fill form data từ template khi customer chọn
4. Service tự động sử dụng template để tạo Proposal

## Kiểm thử

### Manual Testing Checklist

#### Backend API
- [ ] GET `/api/project-templates/` trả về danh sách templates active
- [ ] GET `/api/project-templates/?category=web_development` filter đúng
- [ ] GET `/api/project-templates/{id}` trả về chi tiết template
- [ ] POST `/api/project-templates/` (Admin) tạo template mới
- [ ] PUT `/api/project-templates/{id}` (Admin) cập nhật template
- [ ] DELETE `/api/project-templates/{id}` (Admin) xóa template
- [ ] GET `/api/project-templates/categories/list` trả về danh sách categories
- [ ] Auth: Endpoint admin bị chặn nếu không có token/không phải admin

#### Frontend
- [ ] Trang `/dashboard/admin/project-templates` hiển thị danh sách
- [ ] Filter theo category hoạt động
- [ ] Click "Tạo mới" mở modal với form trống
- [ ] Submit form tạo template mới thành công
- [ ] Click "Chỉnh sửa" mở modal với data đã có
- [ ] Submit form cập nhật template thành công
- [ ] Click "Xóa" hiển thị confirm và xóa được
- [ ] Menu "Dự án Mẫu" hiển thị trong header Admin
- [ ] Responsive trên mobile

#### Django Admin
- [ ] Truy cập `/admin/projects/projecttemplate/` được
- [ ] List display hiển thị đầy đủ các trường
- [ ] Có thể edit inline `is_active` và `display_order`
- [ ] Search hoạt động
- [ ] Filter hoạt động

### Automated Tests (TODO)

```python
# tests/test_project_templates.py
class ProjectTemplateAPITestCase(TestCase):
    def test_list_active_templates(self):
        # Test GET /api/project-templates/
        pass

    def test_create_template_admin_only(self):
        # Test POST requires admin auth
        pass

    def test_filter_by_category(self):
        # Test category filtering
        pass
```

## Troubleshooting

### Lỗi thường gặp

1. **Migration error**
   ```
   Giải pháp: Xóa migration và tạo lại
   docker-compose exec backend python manage.py migrate projects zero
   docker-compose exec backend python manage.py migrate projects
   ```

2. **API 404 Not Found**
   ```
   Kiểm tra: Router đã được register trong api/main.py chưa
   Kiểm tra: Backend container có đang chạy không
   ```

3. **Frontend không load được templates**
   ```
   Kiểm tra: NEXT_PUBLIC_API_URL trong .env
   Kiểm tra: CORS settings trong backend
   Kiểm tra: Network tab trong browser DevTools
   ```

4. **Permission denied khi tạo/sửa/xóa**
   ```
   Kiểm tra: User có role='admin' không
   Kiểm tra: Token hợp lệ và chưa expire
   ```

## Kết luận

Tính năng Project Templates đã được triển khai đầy đủ với:

✅ Backend model, API, schemas, routers
✅ Database migration
✅ Django Admin integration
✅ Frontend admin page (create, read, update, delete)
✅ Navigation menu integration
✅ Sample data script
✅ Comprehensive documentation

**Các bước tiếp theo đề xuất:**

1. Tích hợp templates vào Service Request flow
2. Thêm preview template cho customer
3. Thêm analytics (templates nào được chọn nhiều nhất)
4. Thêm versioning cho templates
5. Import/Export templates (JSON, Excel)
