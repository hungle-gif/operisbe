# OPERIS - Hệ thống quản lý công ty phần mềm

Hệ thống quản lý toàn diện cho công ty phát triển phần mềm, hỗ trợ quản lý khách hàng, dự án, công việc và quy trình bán hàng.

## 🎯 Tính năng chính

### Phân quyền người dùng
- **Admin**: Quản lý toàn bộ hệ thống, người dùng, cấu hình
- **Sale**: Quản lý leads, deals, khách hàng tiềm năng
- **Developer**: Quản lý tasks, dự án được giao
- **Customer**: Theo dõi dự án, giao tiếp với đội ngũ

### Các module chính
1. **Users & Authentication**: Quản lý người dùng và xác thực JWT
2. **Customers**: Quản lý hồ sơ khách hàng
3. **Projects**: Quản lý dự án phần mềm
4. **Tasks**: Quản lý công việc cho developers
5. **Sales**: Quản lý leads và deals

## 🛠️ Công nghệ sử dụng

### Backend
- Python 3.11
- Django 5.0
- Django Ninja (API framework)
- PostgreSQL 16 (UUID cho tất cả ID)
- Redis (cache)
- JWT Authentication

### Frontend
- Next.js 15
- TypeScript (strict mode)
- Tailwind CSS
- Zustand (state management)
- React Query (data fetching)

### Infrastructure
- Docker & Docker Compose
- PostgreSQL 16
- Redis 7

## 📦 Cài đặt

### Yêu cầu hệ thống
- Docker & Docker Compose
- Python 3.11+ (nếu chạy local)
- Node.js 20+ (nếu chạy local)

### Khởi động với Docker (Khuyến nghị)

1. **Clone repository**
```bash
git clone <repository-url>
cd "thực hiện lại hệ thống operis 15-10"
```

2. **Tạo file .env cho backend**
```bash
cd backend
cp .env.example .env
# Chỉnh sửa .env theo môi trường của bạn
```

3. **Tạo file .env cho frontend**
```bash
cd ../frontend
cp .env.example .env
```

4. **Khởi động toàn bộ hệ thống**
```bash
cd ..
docker-compose up -d
```

5. **Tạo superuser cho admin**
```bash
docker exec -it operis_backend python manage.py createsuperuser
```

6. **Truy cập ứng dụng**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/api/docs

### Cài đặt Local (Development)

#### Backend Setup

1. **Tạo virtual environment**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

2. **Cài đặt dependencies**
```bash
pip install -r requirements.txt
```

3. **Cấu hình database**
- Cài đặt PostgreSQL 16
- Tạo database: `operis_db`
- Cập nhật `.env` với thông tin database

4. **Chạy migrations**
```bash
python manage.py migrate
```

5. **Tạo superuser**
```bash
python manage.py createsuperuser
```

6. **Khởi động server**
```bash
python manage.py runserver
```

#### Frontend Setup

1. **Cài đặt dependencies**
```bash
cd frontend
npm install
```

2. **Khởi động development server**
```bash
npm run dev
```

## 📚 Cấu trúc dự án

### Backend Structure
```
backend/
├── config/              # Django settings
├── api/                 # API configuration
├── core/                # Core utilities
│   ├── database/        # Base models, mixins
│   ├── utils/           # Utilities
│   └── responses/       # API responses
└── apps/                # Application modules
    ├── users/           # User management
    ├── customers/       # Customer profiles
    ├── projects/        # Project management
    ├── tasks/           # Task management
    └── sales/           # Sales (leads, deals)
```

### Frontend Structure
```
frontend/
├── app/                 # Next.js App Router
│   ├── (auth)/         # Auth routes
│   ├── (dashboard)/    # Dashboard routes
│   └── (marketing)/    # Marketing pages
├── components/          # React components
├── lib/                # Utilities & API client
└── stores/             # State management
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký người dùng mới
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/refresh` - Refresh token

### Users
- `GET /api/users/me` - Lấy thông tin user hiện tại
- `GET /api/users` - Danh sách users
- `GET /api/users/{id}` - Chi tiết user
- `PUT /api/users/{id}` - Cập nhật user
- `DELETE /api/users/{id}` - Xóa user
- `POST /api/users/change-password` - Đổi mật khẩu

### Customers, Projects, Tasks, Sales
- RESTful API pattern tương tự

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm run test        # Unit tests
npm run e2e         # E2E tests
```

## 📝 Models Overview

### User Model
- Hỗ trợ 4 loại role: admin, sale, dev, customer
- UUID primary key
- JWT authentication
- Soft delete support

### Customer Model
- Mở rộng từ User
- Thông tin công ty, địa chỉ
- Tax ID

### Project Model
- Quản lý dự án phần mềm
- Trạng thái: pending, in_progress, on_hold, completed, cancelled
- Priority: low, medium, high, urgent
- Budget tracking
- Repository & deployment URLs

### Task Model
- Quản lý công việc development
- Trạng thái: todo, in_progress, in_review, testing, done, blocked
- Time tracking (estimated vs actual hours)
- Tags & attachments

### Lead & Deal Models
- Lead: Khách hàng tiềm năng
- Deal: Cơ hội kinh doanh
- Sales pipeline management

## 🔒 Security

- JWT-based authentication
- Password hashing với Django's built-in hasher
- CORS configuration
- Environment variables cho sensitive data
- Role-based access control (RBAC)

## 🚀 Deployment

### Production Checklist
- [ ] Cập nhật `SECRET_KEY` và `JWT_SECRET_KEY`
- [ ] Set `DEBUG=False`
- [ ] Cấu hình `ALLOWED_HOSTS`
- [ ] SSL/HTTPS configuration
- [ ] Database backups
- [ ] Monitoring setup
- [ ] CI/CD pipeline

## 📄 License

MIT License

## 👥 Contributors

Được phát triển bởi Claude Code

## 🤝 Contributing

Mọi đóng góp đều được chào đón! Vui lòng tạo issue hoặc pull request.

## 📧 Contact

Để biết thêm thông tin, vui lòng liên hệ qua email hoặc tạo issue trên GitHub.
