'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Project {
  id: string
  name: string
  description: string
  status: string
  customer: {
    id: string
    name: string
    email: string
  }
  sales_person: {
    id: string
    name: string
  } | null
  budget: number
  start_date: string
  end_date: string | null
  created_at: string
}

export default function AdminProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')

  useEffect(() => {
    loadProjects()
  }, [statusFilter])

  const loadProjects = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/all`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        let data = await response.json()

        // Filter by status if selected
        if (statusFilter) {
          data = data.filter((p: Project) => p.status === statusFilter)
        }

        setProjects(data)
      }
    } catch (err) {
      console.error('Failed to load projects:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!confirm(`Bạn có chắc muốn xóa dự án "${projectName}"?`)) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        alert('✅ Xóa dự án thành công')
        loadProjects()
      } else {
        const error = await response.json()
        alert(`❌ Lỗi: ${error.detail || 'Không thể xóa dự án'}`)
      }
    } catch (err) {
      console.error('Failed to delete project:', err)
      alert('❌ Lỗi kết nối server')
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      planning: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      on_hold: 'bg-orange-100 text-orange-800',
      cancelled: 'bg-red-100 text-red-800',
      pending_acceptance: 'bg-purple-100 text-purple-800',
      revision_required: 'bg-pink-100 text-pink-800'
    }
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      planning: 'Lên kế hoạch',
      in_progress: 'Đang thực hiện',
      completed: 'Hoàn thành',
      on_hold: 'Tạm dừng',
      cancelled: 'Đã hủy',
      pending_acceptance: 'Chờ nghiệm thu',
      revision_required: 'Cần sửa đổi'
    }
    return labels[status as keyof typeof labels] || status
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('vi-VN')
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản Lý Dự Án</h1>
          <p className="text-gray-600">Tổng số: {projects.length} dự án</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả</option>
                <option value="planning">Lên kế hoạch</option>
                <option value="in_progress">Đang thực hiện</option>
                <option value="completed">Hoàn thành</option>
                <option value="on_hold">Tạm dừng</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setStatusFilter('')}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Xóa Bộ Lọc
              </button>
            </div>
          </div>
        </div>

        {/* Projects Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-4 px-4 font-semibold text-gray-600">Tên Dự Án</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-600">Khách Hàng</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-600">Nhân Viên</th>
                  <th className="text-right py-4 px-4 font-semibold text-gray-600">Ngân Sách</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-600">Trạng Thái</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-600">Ngày Bắt Đầu</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-600">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      Không có dự án nào
                    </td>
                  </tr>
                ) : (
                  projects.map((project) => (
                    <tr key={project.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <button
                          onClick={() => router.push(`/dashboard/admin/projects/${project.id}`)}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {project.name}
                        </button>
                        <p className="text-sm text-gray-500 mt-1">{project.description?.substring(0, 50)}...</p>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{project.customer.name}</div>
                          <div className="text-sm text-gray-500">{project.customer.email}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {project.sales_person ? project.sales_person.name : '-'}
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-gray-900">
                        {formatCurrency(project.budget)}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(project.status)}`}>
                          {getStatusLabel(project.status)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {formatDate(project.start_date)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => router.push(`/dashboard/admin/projects/${project.id}`)}
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
                          >
                            Chi Tiết
                          </button>
                          <button
                            onClick={() => router.push(`/dashboard/admin/projects/${project.id}/finance`)}
                            className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700"
                          >
                            Tài Chính
                          </button>
                          <button
                            onClick={() => handleDeleteProject(project.id, project.name)}
                            className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <p className="text-sm text-yellow-800 font-medium">Lên kế hoạch</p>
            <p className="text-2xl font-bold text-yellow-900">
              {projects.filter(p => p.status === 'planning').length}
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-800 font-medium">Đang thực hiện</p>
            <p className="text-2xl font-bold text-blue-900">
              {projects.filter(p => p.status === 'in_progress').length}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-sm text-green-800 font-medium">Hoàn thành</p>
            <p className="text-2xl font-bold text-green-900">
              {projects.filter(p => p.status === 'completed').length}
            </p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <p className="text-sm text-orange-800 font-medium">Tạm dừng</p>
            <p className="text-2xl font-bold text-orange-900">
              {projects.filter(p => p.status === 'on_hold').length}
            </p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <p className="text-sm text-red-800 font-medium">Đã hủy</p>
            <p className="text-2xl font-bold text-red-900">
              {projects.filter(p => p.status === 'cancelled').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
