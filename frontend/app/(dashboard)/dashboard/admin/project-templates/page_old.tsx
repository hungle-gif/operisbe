'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import OptionBuilder from '@/components/admin/OptionBuilder'

interface ProjectTemplate {
  id: string
  name: string
  description: string
  category: string
  icon: string | null
  price_min: number
  price_max: number | null
  estimated_duration_min: number
  estimated_duration_max: number | null
  key_features: string[]
  deliverables: string[]
  technologies: string[]
  phases: any[]
  team_structure: any
  options: any[]
  is_active: boolean
  display_order: number
  created_at: string
}

interface Category {
  value: string
  label: string
}

export default function AdminProjectTemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<ProjectTemplate[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'web_development',
    icon: '🌐',
    price_min: 0,
    price_max: null as number | null,
    estimated_duration_min: 14,
    estimated_duration_max: null as number | null,
    key_features: [] as string[],
    deliverables: [] as string[],
    technologies: [] as string[],
    phases: [] as any[],
    team_structure: {},
    options: [] as any[],
    is_active: true,
    display_order: 0
  })

  useEffect(() => {
    loadTemplates()
    loadCategories()
  }, [categoryFilter])

  const loadTemplates = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/project-templates/admin/all`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        let data = await response.json()

        // Filter by category if selected
        if (categoryFilter) {
          data = data.filter((t: ProjectTemplate) => t.category === categoryFilter)
        }

        setTemplates(data)
      }
    } catch (err) {
      console.error('Failed to load templates:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/project-templates/categories/list`)
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (err) {
      console.error('Failed to load categories:', err)
    }
  }

  const handleOpenCreateModal = () => {
    setIsEditing(false)
    setSelectedTemplate(null)
    setFormData({
      name: '',
      description: '',
      category: 'web_development',
      icon: '🌐',
      price_min: 0,
      price_max: null,
      estimated_duration_min: 14,
      estimated_duration_max: null,
      key_features: [],
      deliverables: [],
      technologies: [],
      phases: [],
      team_structure: {},
      options: [],
      is_active: true,
      display_order: 0
    })
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (template: ProjectTemplate) => {
    setIsEditing(true)
    setSelectedTemplate(template)
    setFormData({
      name: template.name,
      description: template.description,
      category: template.category,
      icon: template.icon || '🌐',
      price_min: template.price_min,
      price_max: template.price_max,
      estimated_duration_min: template.estimated_duration_min,
      estimated_duration_max: template.estimated_duration_max,
      key_features: template.key_features || [],
      deliverables: template.deliverables || [],
      technologies: template.technologies || [],
      phases: template.phases || [],
      team_structure: template.team_structure || {},
      options: template.options || [],
      is_active: template.is_active,
      display_order: template.display_order
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = isEditing && selectedTemplate
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/project-templates/${selectedTemplate.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/project-templates`

      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        alert(isEditing ? '✅ Cập nhật template thành công' : '✅ Tạo template thành công')
        setIsModalOpen(false)
        loadTemplates()
      } else {
        const error = await response.json()
        alert(`❌ Lỗi: ${error.detail || 'Không thể lưu template'}`)
      }
    } catch (err) {
      console.error('Failed to save template:', err)
      alert('❌ Lỗi kết nối server')
    }
  }

  const handleDelete = async (templateId: string, templateName: string) => {
    if (!confirm(`Bạn có chắc muốn xóa template "${templateName}"?`)) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/project-templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        alert('✅ Xóa template thành công')
        loadTemplates()
      } else {
        const error = await response.json()
        alert(`❌ Lỗi: ${error.detail || 'Không thể xóa template'}`)
      }
    } catch (err) {
      console.error('Failed to delete template:', err)
      alert('❌ Lỗi kết nối server')
    }
  }

  const getCategoryLabel = (category: string) => {
    const cat = categories.find(c => c.value === category)
    return cat ? cat.label : category
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const getPriceDisplay = (template: ProjectTemplate) => {
    if (template.price_max) {
      return `${formatCurrency(template.price_min)} - ${formatCurrency(template.price_max)}`
    }
    return `${formatCurrency(template.price_min)}`
  }

  const getDurationDisplay = (template: ProjectTemplate) => {
    if (template.estimated_duration_max) {
      return `${template.estimated_duration_min} - ${template.estimated_duration_max} ngày`
    }
    return `${template.estimated_duration_min} ngày`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản Lý Dự Án Mẫu</h1>
            <p className="text-gray-600">Tổng số: {templates.length} dự án mẫu</p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            + Tạo Dự Án Mẫu Mới
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">Danh mục:</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(template => (
            <div key={template.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              {/* Card Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{template.icon || '📋'}</span>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{template.name}</h3>
                      <span className="text-sm text-gray-500">{getCategoryLabel(template.category)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {template.is_active ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Hoạt động</span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Tắt</span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Giá dự kiến</div>
                  <div className="text-lg font-bold text-blue-600">{getPriceDisplay(template)}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-1">Thời gian</div>
                  <div className="text-md font-medium text-gray-900">{getDurationDisplay(template)}</div>
                </div>

                {template.key_features && template.key_features.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-500 mb-2">Tính năng chính</div>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {template.key_features.slice(0, 3).map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          <span className="line-clamp-1">{feature}</span>
                        </li>
                      ))}
                      {template.key_features.length > 3 && (
                        <li className="text-gray-400 text-xs">+{template.key_features.length - 3} tính năng khác...</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* Card Actions */}
              <div className="px-6 py-4 bg-gray-50 flex gap-2">
                <button
                  onClick={() => handleOpenEditModal(template)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Chỉnh sửa
                </button>
                <button
                  onClick={() => handleDelete(template.id, template.name)}
                  className="px-4 bg-red-600 hover:bg-red-700 text-white py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {templates.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500 text-lg mb-4">Chưa có dự án mẫu nào</p>
            <button
              onClick={handleOpenCreateModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Tạo dự án mẫu đầu tiên
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {isEditing ? 'Chỉnh Sửa Dự Án Mẫu' : 'Tạo Dự Án Mẫu Mới'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Thông tin cơ bản</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tên dự án mẫu *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Icon (emoji)</label>
                    <input
                      type="text"
                      value={formData.icon || ''}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="🌐"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing & Duration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Giá & Thời gian</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Giá tối thiểu (VNĐ) *</label>
                    <input
                      type="number"
                      value={formData.price_min}
                      onChange={(e) => setFormData({ ...formData, price_min: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      min="0"
                      step="1000000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Giá tối đa (VNĐ)</label>
                    <input
                      type="number"
                      value={formData.price_max || ''}
                      onChange={(e) => setFormData({ ...formData, price_max: e.target.value ? Number(e.target.value) : null })}
                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="1000000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Thời gian tối thiểu (ngày) *</label>
                    <input
                      type="number"
                      value={formData.estimated_duration_min}
                      onChange={(e) => setFormData({ ...formData, estimated_duration_min: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Thời gian tối đa (ngày)</label>
                    <input
                      type="number"
                      value={formData.estimated_duration_max || ''}
                      onChange={(e) => setFormData({ ...formData, estimated_duration_max: e.target.value ? Number(e.target.value) : null })}
                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Tính năng chính</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Danh sách tính năng (mỗi dòng một tính năng)
                  </label>
                  <textarea
                    value={formData.key_features.join('\n')}
                    onChange={(e) => setFormData({ ...formData, key_features: e.target.value.split('\n').filter(f => f.trim()) })}
                    rows={5}
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Quản lý nhân viên&#10;Quản lý dự án&#10;Báo cáo thống kê"
                  />
                </div>
              </div>

              {/* Dynamic Options */}
              <div className="border-t border-gray-200 pt-6">
                <OptionBuilder
                  options={formData.options}
                  onChange={(options) => setFormData({ ...formData, options })}
                />
              </div>

              {/* Status & Order */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                    Kích hoạt (hiển thị cho khách hàng)
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Thứ tự hiển thị</label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  {isEditing ? 'Cập nhật' : 'Tạo mới'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-medium transition-colors"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
