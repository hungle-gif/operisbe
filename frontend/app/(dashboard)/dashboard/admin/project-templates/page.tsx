'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import OptionBuilder from '@/components/admin/OptionBuilder'
import {
  Plus, Edit2, Trash2, Eye, Copy,
  Sparkles, Clock, DollarSign, Users,
  Settings, List, Layers, CheckCircle
} from 'lucide-react'

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
  const [activeTab, setActiveTab] = useState('basic')

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
    if (typeof window === 'undefined') return

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/project-templates/admin/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        let data = await response.json()
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
    setActiveTab('basic')
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
    setActiveTab('basic')
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

    if (typeof window === 'undefined') return

    try {
      const url = isEditing && selectedTemplate
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/project-templates/${selectedTemplate.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/project-templates`

      const method = isEditing ? 'PUT' : 'POST'
      const token = localStorage.getItem('token') || localStorage.getItem('access_token')

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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

    if (typeof window === 'undefined') return

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/project-templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
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
    return `Từ ${formatCurrency(template.price_min)}`
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Quản Lý Dự Án Mẫu
            </h1>
            <p className="text-gray-600 flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Tổng số: <span className="font-semibold text-blue-600">{templates.length}</span> dự án mẫu
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            Tạo Dự Án Mẫu Mới
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
          <div className="flex gap-4 items-center">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <List className="w-4 h-4" />
              Danh mục:
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <div key={template.id} className="bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 transform hover:-translate-y-1">
              {/* Card Header */}
              <div className="relative bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 p-6 text-white">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{template.icon || '📋'}</span>
                    <div>
                      <span className="text-xs px-2 py-1 bg-white/20 backdrop-blur rounded-full">
                        {getCategoryLabel(template.category)}
                      </span>
                    </div>
                  </div>
                  {template.is_active ? (
                    <CheckCircle className="w-5 h-5 text-green-300" />
                  ) : (
                    <span className="text-xs px-2 py-1 bg-red-500/50 rounded-full">Tắt</span>
                  )}
                </div>
                <h3 className="font-bold text-xl line-clamp-2">{template.name}</h3>
                <p className="text-sm text-blue-100 mt-2 line-clamp-2">{template.description}</p>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <div>
                      <div className="text-xs text-gray-500">Giá dự kiến</div>
                      <div className="font-semibold text-green-600 text-xs">{getPriceDisplay(template)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="text-xs text-gray-500">Thời gian</div>
                      <div className="font-semibold text-blue-600 text-xs">{getDurationDisplay(template)}</div>
                    </div>
                  </div>
                </div>

                {template.key_features && template.key_features.length > 0 && (
                  <div>
                    <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Tính năng nổi bật
                    </div>
                    <ul className="text-xs text-gray-700 space-y-1">
                      {template.key_features.slice(0, 3).map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="text-green-500 mr-1">✓</span>
                          <span className="line-clamp-1">{feature}</span>
                        </li>
                      ))}
                      {template.key_features.length > 3 && (
                        <li className="text-gray-400 text-xs">+{template.key_features.length - 3} tính năng khác</li>
                      )}
                    </ul>
                  </div>
                )}

                {template.options && template.options.length > 0 && (
                  <div className="pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <Settings className="w-3 h-3" />
                      Options động
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {template.options.slice(0, 3).map((opt, idx) => (
                        <span key={idx} className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                          {opt.label}
                        </span>
                      ))}
                      {template.options.length > 3 && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                          +{template.options.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Actions */}
              <div className="px-4 py-3 bg-gray-50 flex gap-2 border-t border-gray-100">
                <button
                  onClick={() => handleOpenEditModal(template)}
                  className="flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Sửa
                </button>
                <button
                  onClick={() => handleDelete(template.id, template.name)}
                  className="px-3 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {templates.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
            <Layers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
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

      {/* Create/Edit Modal - GIỐNG CUSTOMER VIEW */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-6xl w-full my-8 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="text-3xl">{formData.icon}</span>
                {isEditing ? 'Chỉnh Sửa Dự Án Mẫu' : 'Tạo Dự Án Mẫu Mới'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs - GIỐNG CUSTOMER */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              <button
                onClick={() => setActiveTab('basic')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'basic'
                    ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Thông tin cơ bản
              </button>
              <button
                onClick={() => setActiveTab('features')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'features'
                    ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Tính năng & Bàn giao
              </button>
              <button
                onClick={() => setActiveTab('process')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'process'
                    ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Quy trình & Team
              </button>
              <button
                onClick={() => setActiveTab('options')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'options'
                    ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Options động
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'settings'
                    ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Cài đặt
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Tab Content */}
              <div className="p-6 max-h-[calc(100vh-300px)] overflow-y-auto">
                {/* TAB: Thông tin cơ bản */}
                {activeTab === 'basic' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-6">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tên dự án mẫu *
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                          placeholder="Ví dụ: Xây dựng hệ thống quản trị doanh nghiệp"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Icon (emoji)
                        </label>
                        <input
                          type="text"
                          value={formData.icon || ''}
                          onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-center text-3xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="🏢"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mô tả chi tiết *
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={4}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        placeholder="Giải pháp quản trị doanh nghiệp toàn diện, tùy biến theo nhu cầu riêng của bạn..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Danh mục *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        {categories.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-900 mb-4">Giá & Thời gian</h3>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Giá tối thiểu (VNĐ) *
                          </label>
                          <input
                            type="number"
                            value={formData.price_min}
                            onChange={(e) => setFormData({ ...formData, price_min: Number(e.target.value) })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            min="0"
                            step="1000000"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Giá tối đa (VNĐ)
                          </label>
                          <input
                            type="number"
                            value={formData.price_max || ''}
                            onChange={(e) => setFormData({ ...formData, price_max: e.target.value ? Number(e.target.value) : null })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="0"
                            step="1000000"
                            placeholder="Để trống = Liên hệ"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Thời gian tối thiểu (ngày) *
                          </label>
                          <input
                            type="number"
                            value={formData.estimated_duration_min}
                            onChange={(e) => setFormData({ ...formData, estimated_duration_min: Number(e.target.value) })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            min="1"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Thời gian tối đa (ngày)
                          </label>
                          <input
                            type="number"
                            value={formData.estimated_duration_max || ''}
                            onChange={(e) => setFormData({ ...formData, estimated_duration_max: e.target.value ? Number(e.target.value) : null })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="1"
                            placeholder="Để trống nếu cố định"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: Tính năng & Bàn giao */}
                {activeTab === 'features' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tính năng chính
                      </label>
                      <textarea
                        value={formData.key_features.join('\n')}
                        onChange={(e) => setFormData({ ...formData, key_features: e.target.value.split('\n').filter(f => f.trim()) })}
                        rows={6}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        placeholder="Mỗi dòng một tính năng:&#10;Quản lý nhân sự và chấm công&#10;Quản lý dự án và công việc&#10;Báo cáo thống kê chi tiết"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sản phẩm bàn giao
                      </label>
                      <textarea
                        value={formData.deliverables.join('\n')}
                        onChange={(e) => setFormData({ ...formData, deliverables: e.target.value.split('\n').filter(f => f.trim()) })}
                        rows={5}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        placeholder="Mỗi dòng một deliverable:&#10;Mã nguồn đầy đủ&#10;Tài liệu hướng dẫn&#10;Bảo hành 6 tháng"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Công nghệ sử dụng
                      </label>
                      <textarea
                        value={formData.technologies.join('\n')}
                        onChange={(e) => setFormData({ ...formData, technologies: e.target.value.split('\n').filter(f => f.trim()) })}
                        rows={4}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        placeholder="Mỗi dòng một công nghệ:&#10;React/Next.js&#10;Django/Python&#10;PostgreSQL"
                      />
                    </div>
                  </div>
                )}

                {/* TAB: Quy trình & Team */}
                {activeTab === 'process' && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                      <h3 className="font-semibold text-purple-900 mb-4 text-lg">Các giai đoạn thực hiện (JSON)</h3>
                      <textarea
                        value={JSON.stringify(formData.phases, null, 2)}
                        onChange={(e) => {
                          try {
                            setFormData({ ...formData, phases: JSON.parse(e.target.value) })
                          } catch {}
                        }}
                        rows={12}
                        className="w-full border border-purple-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm bg-white"
                        placeholder={`[
  {
    "name": "Phân tích & Thiết kế",
    "duration_days": 7,
    "percentage": 20,
    "description": "Thu thập yêu cầu, phân tích nghiệp vụ"
  }
]`}
                      />
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                      <h3 className="font-semibold text-green-900 mb-4 text-lg">Cấu trúc team (JSON)</h3>
                      <textarea
                        value={JSON.stringify(formData.team_structure, null, 2)}
                        onChange={(e) => {
                          try {
                            setFormData({ ...formData, team_structure: JSON.parse(e.target.value) })
                          } catch {}
                        }}
                        rows={8}
                        className="w-full border border-green-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm bg-white"
                        placeholder={`{
  "project_manager": 1,
  "developers": 3,
  "designers": 1,
  "testers": 1
}`}
                      />
                    </div>
                  </div>
                )}

                {/* TAB: Options động */}
                {activeTab === 'options' && (
                  <div>
                    <OptionBuilder
                      options={formData.options}
                      onChange={(options) => setFormData({ ...formData, options })}
                    />
                  </div>
                )}

                {/* TAB: Cài đặt */}
                {activeTab === 'settings' && (
                  <div className="space-y-6">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <input
                          type="checkbox"
                          id="is_active"
                          checked={formData.is_active}
                          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                          className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="is_active" className="text-base font-medium text-gray-900">
                          Kích hoạt template (hiển thị cho khách hàng)
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Thứ tự hiển thị
                        </label>
                        <input
                          type="number"
                          value={formData.display_order}
                          onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="0"
                        />
                        <p className="text-sm text-gray-500 mt-1">Số càng nhỏ càng hiển thị ưu tiên</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-xl font-medium transition-all shadow-lg"
                >
                  {isEditing ? 'Cập nhật Template' : 'Tạo Template Mới'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl font-medium transition-colors"
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
