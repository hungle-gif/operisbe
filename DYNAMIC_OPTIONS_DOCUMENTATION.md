# Dynamic Options System - Hệ thống Options Động

## Tổng quan

**Dynamic Options** là hệ thống cho phép Admin tự định nghĩa các tùy chọn linh hoạt cho mỗi Project Template. Khách hàng có thể chọn/tùy chỉnh các options này khi tạo yêu cầu dịch vụ, giúp:

- **Tùy biến cao**: Mỗi dự án có options riêng phù hợp với đặc thù
- **Tính giá linh hoạt**: Options có thể thay đổi giá, thời gian tự động
- **Trải nghiệm tốt**: Giao diện trực quan, dễ hiểu cho customer
- **Quản lý dễ dàng**: Admin không cần code để thêm/sửa options

## Các loại Options hỗ trợ

### 1. Package (Gói dịch vụ)

Cho phép customer chọn 1 trong các gói dịch vụ với giá và tính năng khác nhau.

**Cấu trúc:**
```json
{
  "id": "package",
  "type": "package",
  "label": "Gói dịch vụ",
  "description": "Chọn gói phù hợp với nhu cầu",
  "required": true,
  "choices": [
    {
      "value": "basic",
      "label": "Basic",
      "price": 30000000,
      "duration_days": 30,
      "features": ["Tính năng 1", "Tính năng 2"]
    },
    {
      "value": "standard",
      "label": "Standard",
      "price": 50000000,
      "duration_days": 45,
      "features": ["Tính năng 1", "Tính năng 2", "Tính năng 3"]
    }
  ]
}
```

**Use case:**
- Website: Landing Page / Corporate / Professional
- Hệ thống: Small Business / Enterprise
- App: Basic / Premium / Ultimate

**Đặc điểm:**
- Mỗi package có giá riêng (không phụ phí)
- Có duration riêng
- Danh sách features để customer so sánh
- Chỉ chọn được 1 package (radio button)

---

### 2. Single Select (Chọn 1)

Customer chọn 1 option từ nhiều lựa chọn. Mỗi lựa chọn có thể có phụ phí.

**Cấu trúc:**
```json
{
  "id": "language",
  "type": "single_select",
  "label": "Ngôn ngữ",
  "description": "Chọn ngôn ngữ cho website",
  "required": true,
  "choices": [
    {
      "value": "vi",
      "label": "Tiếng Việt",
      "price_modifier": 0
    },
    {
      "value": "en",
      "label": "Tiếng Anh",
      "price_modifier": 3000000
    },
    {
      "value": "multi",
      "label": "Đa ngôn ngữ",
      "price_modifier": 8000000
    }
  ]
}
```

**Use case:**
- Ngôn ngữ: Việt / Anh / Đa ngôn ngữ
- Hình thức triển khai: Cloud / On-premise / Hybrid
- Framework: React / Vue / Angular
- Database: MySQL / PostgreSQL / MongoDB

**Đặc điểm:**
- Radio button (chọn 1)
- `price_modifier`: Phụ phí cộng thêm vào giá cơ bản
- `price_modifier = 0`: Không phụ phí

---

### 3. Multi Select (Chọn nhiều)

Customer có thể chọn nhiều options. Mỗi option được chọn sẽ cộng phụ phí.

**Cấu trúc:**
```json
{
  "id": "features",
  "type": "multi_select",
  "label": "Tính năng bổ sung",
  "description": "Chọn các tính năng muốn thêm",
  "required": false,
  "choices": [
    {
      "value": "seo",
      "label": "SEO Nâng cao",
      "price_modifier": 5000000
    },
    {
      "value": "analytics",
      "label": "Google Analytics",
      "price_modifier": 2000000
    },
    {
      "value": "chat",
      "label": "Live Chat",
      "price_modifier": 3000000
    }
  ]
}
```

**Use case:**
- Tính năng bổ sung: SEO, Analytics, Chat, Payment
- Modules: CRM, Inventory, Accounting, HR
- Integrations: Facebook, Google, Zalo
- Platforms: iOS + Android, Web + Mobile

**Đặc điểm:**
- Checkbox (chọn nhiều)
- Tổng phụ phí = Tổng `price_modifier` của các lựa chọn

---

### 4. Number Range (Chọn số lượng)

Customer nhập/chọn một số lượng trong khoảng min-max.

**Cấu trúc:**
```json
{
  "id": "product_count",
  "type": "number_range",
  "label": "Số lượng sản phẩm",
  "description": "Số sản phẩm tối đa trên hệ thống",
  "required": true,
  "min": 100,
  "max": 10000,
  "step": 100,
  "default": 500,
  "price_per_unit": 1000
}
```

**Use case:**
- Số lượng sản phẩm: 100 - 10,000
- Số người dùng: 10 - 1,000
- Dung lượng storage: 10GB - 1TB
- Số trang: 5 - 50

**Đặc điểm:**
- Input number hoặc slider
- `price_per_unit`: Giá cho mỗi đơn vị
- Tổng phụ phí = `(value - min) * price_per_unit`
- Ví dụ: Chọn 700 sản phẩm, min=100, price_per_unit=1000
  - Phụ phí = (700 - 100) * 1000 = 600,000 VNĐ

---

### 5. Text Input (Nhập văn bản)

Customer nhập văn bản tự do (yêu cầu đặc biệt, ghi chú).

**Cấu trúc:**
```json
{
  "id": "custom_note",
  "type": "text_input",
  "label": "Yêu cầu đặc biệt",
  "description": "Nhập yêu cầu tùy chỉnh của bạn",
  "required": false,
  "placeholder": "Ví dụ: Tích hợp với hệ thống ERP hiện có..."
}
```

**Use case:**
- Yêu cầu đặc biệt
- Ghi chú thêm
- Mô tả chi tiết
- Domain name mong muốn

**Đặc điểm:**
- Textarea hoặc input text
- Không ảnh hưởng giá (dùng để thu thập thông tin)
- Admin xem và báo giá sau

---

## Ví dụ thực tế

### Ví dụ 1: Website Thương mại điện tử

```json
{
  "options": [
    {
      "id": "package",
      "type": "package",
      "label": "Gói website",
      "required": true,
      "choices": [
        {
          "value": "starter",
          "label": "Starter",
          "price": 50000000,
          "duration_days": 45,
          "features": [
            "100 sản phẩm",
            "Thanh toán COD",
            "1 kho hàng",
            "SEO cơ bản"
          ]
        },
        {
          "value": "business",
          "label": "Business",
          "price": 100000000,
          "duration_days": 60,
          "features": [
            "1,000 sản phẩm",
            "Thanh toán online",
            "Nhiều kho hàng",
            "SEO nâng cao",
            "Marketing tools"
          ]
        }
      ]
    },
    {
      "id": "language",
      "type": "single_select",
      "label": "Ngôn ngữ",
      "required": true,
      "choices": [
        {"value": "vi", "label": "Tiếng Việt", "price_modifier": 0},
        {"value": "bilingual", "label": "Việt + Anh", "price_modifier": 8000000}
      ]
    },
    {
      "id": "addons",
      "type": "multi_select",
      "label": "Tính năng bổ sung",
      "required": false,
      "choices": [
        {"value": "mobile_app", "label": "Mobile App", "price_modifier": 30000000},
        {"value": "vendor", "label": "Multi-vendor", "price_modifier": 15000000},
        {"value": "crm", "label": "CRM tích hợp", "price_modifier": 10000000}
      ]
    },
    {
      "id": "products",
      "type": "number_range",
      "label": "Số sản phẩm (ngoài gói)",
      "required": false,
      "min": 0,
      "max": 10000,
      "step": 100,
      "price_per_unit": 5000
    }
  ]
}
```

**Tính giá:**
- Customer chọn:
  - Package: Business = 100,000,000đ
  - Language: Việt + Anh = +8,000,000đ
  - Addons: Mobile App + CRM = +30,000,000 + 10,000,000đ
  - Products: 500 thêm = 500 × 5,000 = +2,500,000đ
- **Tổng: 150,500,000đ**

### Ví dụ 2: Hệ thống quản trị doanh nghiệp

```json
{
  "options": [
    {
      "id": "package",
      "type": "package",
      "label": "Gói dịch vụ",
      "required": true,
      "choices": [
        {
          "value": "basic",
          "label": "Basic - Doanh nghiệp nhỏ",
          "price": 12000000,
          "duration_days": 14,
          "features": [
            "Tối đa 10 nhân viên",
            "Quản lý nhân sự cơ bản",
            "Quản lý công việc",
            "Báo cáo cơ bản"
          ]
        },
        {
          "value": "enterprise",
          "label": "Enterprise - Doanh nghiệp lớn",
          "price": 50000000,
          "duration_days": 30,
          "features": [
            "Không giới hạn nhân viên",
            "Toàn bộ tính năng",
            "Tích hợp bên ngoài",
            "Báo cáo nâng cao & BI"
          ]
        }
      ]
    },
    {
      "id": "modules",
      "type": "multi_select",
      "label": "Modules bổ sung",
      "required": false,
      "choices": [
        {"value": "crm", "label": "CRM", "price_modifier": 8000000},
        {"value": "inventory", "label": "Quản lý kho", "price_modifier": 6000000},
        {"value": "accounting", "label": "Kế toán", "price_modifier": 10000000}
      ]
    },
    {
      "id": "deployment",
      "type": "single_select",
      "label": "Hình thức triển khai",
      "required": true,
      "choices": [
        {"value": "cloud", "label": "Cloud", "price_modifier": 0},
        {"value": "on_premise", "label": "On-premise", "price_modifier": 5000000}
      ]
    },
    {
      "id": "custom",
      "type": "text_input",
      "label": "Yêu cầu tùy chỉnh",
      "required": false,
      "placeholder": "Mô tả yêu cầu đặc biệt..."
    }
  ]
}
```

---

## Cách sử dụng - Admin

### 1. Thêm Options cho Template

1. Vào trang **"Dự án Mẫu"** trong Admin Dashboard
2. Click **"Tạo mới"** hoặc **"Chỉnh sửa"** một template
3. Scroll xuống phần **"Options động cho dự án"**
4. Click **"+ Thêm Option"**

### 2. Cấu hình Option

**Bước 1: Chọn loại option**
- Chọn type: Package / Single Select / Multi Select / Number Range / Text Input

**Bước 2: Điền thông tin cơ bản**
- **Tên option**: Ví dụ "Gói dịch vụ", "Ngôn ngữ"
- **Mô tả**: Giải thích ngắn gọn
- **Bắt buộc**: Check nếu customer phải chọn

**Bước 3: Thêm lựa chọn** (cho Package, Single Select, Multi Select)
- Click **"+ Thêm lựa chọn"**
- Điền tên lựa chọn
- Với Package: Nhập giá, thời gian, features
- Với Single/Multi Select: Nhập phụ phí

**Bước 4: Cấu hình thêm** (cho Number Range)
- Min, Max, Step
- Giá mỗi đơn vị

### 3. Ví dụ cấu hình Package option

```
Tên option: Gói dịch vụ
Loại: Package
Mô tả: Chọn gói phù hợp với quy mô doanh nghiệp
Bắt buộc: ✓

Lựa chọn 1:
  - Tên: Basic - Doanh nghiệp nhỏ
  - Giá: 12,000,000
  - Thời gian: 14 ngày
  - Features:
    Tối đa 10 nhân viên
    Quản lý nhân sự cơ bản
    Quản lý công việc

Lựa chọn 2:
  - Tên: Enterprise - Doanh nghiệp lớn
  - Giá: 50,000,000
  - Thời gian: 30 ngày
  - Features:
    Không giới hạn nhân viên
    Toàn bộ tính năng
    Tích hợp bên ngoài
```

---

## Cách sử dụng - Customer (Future)

Trong tương lai, khi customer chọn một Project Template:

### 1. Xem Template & Options

Customer sẽ thấy:
- Thông tin cơ bản của template
- Danh sách các options có thể tùy chỉnh
- Giá khởi điểm

### 2. Tùy chỉnh Options

**Package option:**
```
○ Basic - Doanh nghiệp nhỏ (12,000,000đ - 14 ngày)
  ✓ Tối đa 10 nhân viên
  ✓ Quản lý nhân sự cơ bản
  ✓ Quản lý công việc

● Enterprise - Doanh nghiệp lớn (50,000,000đ - 30 ngày)
  ✓ Không giới hạn nhân viên
  ✓ Toàn bộ tính năng
  ✓ Tích hợp bên ngoài
```

**Multi-select option:**
```
Modules bổ sung:
☑ CRM (+8,000,000đ)
☐ Quản lý kho (+6,000,000đ)
☑ Kế toán (+10,000,000đ)
```

**Number range option:**
```
Số nhân viên: [=====○=====] 50
(Mỗi nhân viên thêm: +100,000đ)
```

### 3. Xem tính giá tự động

```
┌─────────────────────────────────────┐
│ Tổng quan báo giá                   │
├─────────────────────────────────────┤
│ Gói cơ bản:        50,000,000đ      │
│ + CRM:             8,000,000đ       │
│ + Kế toán:         10,000,000đ      │
│ + Cloud:           0đ               │
├─────────────────────────────────────┤
│ Tổng cộng:         68,000,000đ      │
│ Thời gian:         30 ngày          │
└─────────────────────────────────────┘
```

### 4. Gửi yêu cầu

Customer submit form → Tạo Service Request với options đã chọn

---

## Technical Implementation

### Backend Model

```python
class ProjectTemplate(BaseModel):
    # ... other fields ...

    options = models.JSONField(
        default=list,
        blank=True,
        help_text="Dynamic options configuration"
    )
```

### Option Schema

```typescript
interface DynamicOption {
  id: string
  type: 'single_select' | 'multi_select' | 'package' | 'number_range' | 'text_input'
  label: string
  description?: string
  required: boolean

  // For select/package types
  choices?: {
    value: string
    label: string
    price_modifier?: number  // For single/multi select
    price?: number           // For package
    duration_days?: number   // For package
    features?: string[]      // For package
  }[]

  // For number_range type
  min?: number
  max?: number
  step?: number
  default?: number
  price_per_unit?: number

  // For text_input type
  placeholder?: string
}
```

### API Response

```json
{
  "id": "uuid",
  "name": "Phát triển Website",
  "price_min": 50000000,
  "options": [
    {
      "id": "package",
      "type": "package",
      "label": "Gói website",
      "required": true,
      "choices": [...]
    },
    {
      "id": "language",
      "type": "single_select",
      "label": "Ngôn ngữ",
      "required": true,
      "choices": [...]
    }
  ]
}
```

### Frontend Components

**OptionBuilder** (`/components/admin/OptionBuilder.tsx`):
- Component để admin tạo/sửa options
- Drag & drop để sắp xếp
- Expand/collapse từng option
- Validate input

**OptionSelector** (Future - for customers):
- Component để customer chọn options
- Real-time price calculator
- Show/hide conditional options
- Summary panel

---

## Price Calculation Logic

### Formula

```javascript
function calculateTotalPrice(template, selectedOptions) {
  let basePrice = 0
  let totalModifier = 0
  let duration = template.estimated_duration_min

  selectedOptions.forEach(option => {
    const optionConfig = template.options.find(o => o.id === option.id)

    switch (optionConfig.type) {
      case 'package':
        const pkg = optionConfig.choices.find(c => c.value === option.value)
        basePrice = pkg.price
        duration = pkg.duration_days
        break

      case 'single_select':
        const choice = optionConfig.choices.find(c => c.value === option.value)
        totalModifier += choice.price_modifier
        break

      case 'multi_select':
        option.values.forEach(val => {
          const choice = optionConfig.choices.find(c => c.value === val)
          totalModifier += choice.price_modifier
        })
        break

      case 'number_range':
        const extraUnits = option.value - optionConfig.min
        totalModifier += extraUnits * optionConfig.price_per_unit
        break

      case 'text_input':
        // No price impact
        break
    }
  })

  return {
    totalPrice: basePrice + totalModifier,
    duration: duration
  }
}
```

### Example Calculation

```javascript
// Template
{
  name: "Website",
  price_min: 30000000,
  options: [
    {
      id: "package",
      type: "package",
      choices: [
        {value: "basic", price: 30000000, duration_days: 30},
        {value: "pro", price: 50000000, duration_days: 45}
      ]
    },
    {
      id: "language",
      type: "single_select",
      choices: [
        {value: "vi", price_modifier: 0},
        {value: "multi", price_modifier: 8000000}
      ]
    },
    {
      id: "features",
      type: "multi_select",
      choices: [
        {value: "seo", price_modifier: 5000000},
        {value: "chat", price_modifier: 3000000}
      ]
    }
  ]
}

// Customer selections
{
  package: "pro",
  language: "multi",
  features: ["seo", "chat"]
}

// Calculation
basePrice = 50,000,000 (from package "pro")
duration = 45 days
totalModifier = 8,000,000 (language)
              + 5,000,000 (seo)
              + 3,000,000 (chat)
              = 16,000,000

totalPrice = 50,000,000 + 16,000,000 = 66,000,000đ
```

---

## Scripts

### Create sample options
```bash
docker-compose exec backend python scripts/add_sample_options.py
```

### Validate options JSON
```python
from apps.projects.models import ProjectTemplate

# Get template
template = ProjectTemplate.objects.first()

# Check options structure
for option in template.options:
    print(f"Option: {option['label']}")
    print(f"  Type: {option['type']}")
    print(f"  Required: {option['required']}")
    if 'choices' in option:
        print(f"  Choices: {len(option['choices'])}")
```

---

## Best Practices

### 1. Thiết kế Options

✅ **DO:**
- Nhóm options có liên quan
- Đặt tên rõ ràng, dễ hiểu
- Cung cấp mô tả chi tiết
- Sắp xếp theo thứ tự quan trọng (Package → Features → Details)
- Sử dụng `required=true` cho options quan trọng

❌ **DON'T:**
- Tạo quá nhiều options (tối đa 5-7)
- Options chồng chéo, mâu thuẫn
- Dùng technical terms khó hiểu
- Bỏ trống mô tả

### 2. Pricing

✅ **DO:**
- Giá package làm tròn (50tr, 100tr)
- Phụ phí hợp lý (5-20% giá gói)
- Hiển thị rõ tổng giá cuối cùng
- Giải thích cách tính giá

❌ **DON'T:**
- Giá lẻ phức tạp (12,345,678đ)
- Phụ phí quá cao (> 50% giá gói)
- Ẩn chi phí

### 3. User Experience

✅ **DO:**
- Mặc định chọn option phổ biến nhất
- Highlight gói được khuyên dùng
- So sánh rõ ràng giữa các gói
- Responsive trên mobile

❌ **DON'T:**
- Bắt buộc quá nhiều options
- Form quá dài, phức tạp
- Không có giá tham khảo

---

## Future Enhancements

### Phase 1 (Current)
- ✅ Admin có thể tạo/sửa options
- ✅ 5 loại options cơ bản
- ✅ Lưu trữ JSON flexible

### Phase 2 (Next)
- [ ] Customer UI để chọn options
- [ ] Real-time price calculator
- [ ] Option dependencies (nếu chọn A thì hiện B)
- [ ] Conditional options

### Phase 3 (Future)
- [ ] Option templates (re-use across projects)
- [ ] Analytics: Options nào được chọn nhiều nhất
- [ ] A/B testing options
- [ ] Dynamic pricing (giá thay đổi theo thời điểm)
- [ ] Coupon/discount cho options
- [ ] Option bundles (chọn 3 tính năng giảm 10%)

---

## Troubleshooting

### Lỗi: Options không lưu

**Nguyên nhân:** JSON không hợp lệ

**Giải pháp:**
```python
# Validate JSON before save
import json
try:
    json.dumps(template.options)
except:
    print("Invalid JSON structure")
```

### Lỗi: Không tính được giá

**Nguyên nhân:** Thiếu `price` hoặc `price_modifier`

**Giải pháp:** Đảm bảo:
- Package có `price`
- Single/Multi select có `price_modifier`
- Number range có `price_per_unit`

### Frontend không hiện options

**Kiểm tra:**
1. API trả về options? `GET /api/project-templates/{id}`
2. Component OptionBuilder được import?
3. formData.options được khởi tạo?

---

## Kết luận

Hệ thống Dynamic Options giúp:

✅ **Tăng tính linh hoạt**: Mỗi template có options riêng
✅ **Tự động hóa**: Tính giá, thời gian tự động
✅ **Dễ quản lý**: Admin không cần code
✅ **Trải nghiệm tốt**: Customer dễ tùy chỉnh
✅ **Scalable**: Dễ dàng mở rộng thêm loại options mới

Với 5 loại options hiện tại, bạn có thể tạo ra hầu hết các kịch bản pricing phức tạp cho bất kỳ loại dự án nào!
