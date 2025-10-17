'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  FolderKanban,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Calendar,
  Users,
  MessageSquare,
  Code,
  GitBranch
} from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string
  status: string
  priority: string
  customer: {
    company_name: string
    user_name: string
    user_email: string
  }
  project_manager: {
    full_name: string
    email: string
  } | null
  start_date: string
  end_date: string
  estimated_hours: number
  repository_url: string
  staging_url: string
  production_url: string
  created_at: string
}

export default function DeveloperDashboard() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    completed: 0,
    pending: 0
  })

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setProjects(data)

        // Calculate stats
        setStats({
          total: data.length,
          inProgress: data.filter((p: Project) => p.status === 'in_progress').length,
          completed: data.filter((p: Project) => p.status === 'completed').length,
          pending: data.filter((p: Project) =>
            p.status === 'planning' || p.status === 'pending_acceptance'
          ).length
        })
      }
    } catch (err) {
      console.error('Failed to load projects:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-300',
      completed: 'bg-green-100 text-green-800 border-green-300',
      on_hold: 'bg-orange-100 text-orange-800 border-orange-300',
      pending_acceptance: 'bg-purple-100 text-purple-800 border-purple-300',
      revision_required: 'bg-pink-100 text-pink-800 border-pink-300'
    }
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      planning: 'Lên kế hoạch',
      in_progress: 'Đang thực hiện',
      completed: 'Hoàn thành',
      on_hold: 'Tạm dừng',
      pending_acceptance: 'Chờ nghiệm thu',
      revision_required: 'Cần sửa đổi'
    }
    return labels[status] || status
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      urgent: 'text-red-600'
    }
    return colors[priority] || 'text-gray-600'
  }

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      low: 'Thấp',
      medium: 'Trung bình',
      high: 'Cao',
      urgent: 'Khẩn cấp'
    }
    return labels[priority] || priority
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Chưa xác định'
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Code className="w-10 h-10 text-blue-600" />
            Developer Dashboard
          </h1>
          <p className="text-gray-600">Quản lý và theo dõi các dự án được giao</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-600 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Tổng dự án</p>
                <p className="text-4xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                <FolderKanban className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-yellow-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Đang thực hiện</p>
                <p className="text-4xl font-bold text-gray-900">{stats.inProgress}</p>
              </div>
              <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-600 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Hoàn thành</p>
                <p className="text-4xl font-bold text-gray-900">{stats.completed}</p>
              </div>
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-600 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Chờ xử lý</p>
                <p className="text-4xl font-bold text-gray-900">{stats.pending}</p>
              </div>
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            Thao tác nhanh
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/dashboard/developer/projects')}
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all border border-blue-200"
            >
              <FolderKanban className="w-6 h-6 text-blue-600" />
              <div className="text-left">
                <p className="font-semibold text-gray-900">Xem tất cả dự án</p>
                <p className="text-sm text-gray-600">Danh sách dự án được giao</p>
              </div>
            </button>

            <button
              onClick={() => router.push('/dashboard/developer/tasks')}
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl hover:from-green-100 hover:to-emerald-100 transition-all border border-green-200"
            >
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <div className="text-left">
                <p className="font-semibold text-gray-900">Quản lý công việc</p>
                <p className="text-sm text-gray-600">Theo dõi tasks và deadlines</p>
              </div>
            </button>

            <button
              onClick={() => router.push('/dashboard/developer/chat')}
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:from-purple-100 hover:to-pink-100 transition-all border border-purple-200"
            >
              <MessageSquare className="w-6 h-6 text-purple-600" />
              <div className="text-left">
                <p className="font-semibold text-gray-900">Chat với khách hàng</p>
                <p className="text-sm text-gray-600">Trao đổi trực tiếp</p>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Projects */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FolderKanban className="w-6 h-6" />
              Dự án gần đây
            </h2>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-16">
              <FolderKanban className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Chưa có dự án nào được giao</p>
            </div>
          ) : (
            <div className="divide-y">
              {projects.slice(0, 5).map((project) => (
                <div
                  key={project.id}
                  className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/developer/projects/${project.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors">
                          {project.name}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(project.status)}`}>
                          {getStatusLabel(project.status)}
                        </span>
                        <span className={`font-semibold text-sm ${getPriorityColor(project.priority)}`}>
                          {getPriorityLabel(project.priority)}
                        </span>
                      </div>

                      <p className="text-gray-600 mb-3 line-clamp-2">{project.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>Khách hàng: <span className="font-semibold">{project.customer.company_name || project.customer.user_name}</span></span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>Bắt đầu: <span className="font-semibold">{formatDate(project.start_date)}</span></span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>Ước tính: <span className="font-semibold">{project.estimated_hours || 'N/A'} giờ</span></span>
                        </div>
                      </div>

                      {/* Tech Links */}
                      <div className="flex gap-3 mt-3">
                        {project.repository_url && (
                          <a
                            href={project.repository_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition-colors"
                          >
                            <GitBranch className="w-4 h-4" />
                            Repository
                          </a>
                        )}
                        {project.staging_url && (
                          <a
                            href={project.staging_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500 text-white rounded-lg text-xs font-semibold hover:bg-orange-600 transition-colors"
                          >
                            Staging
                          </a>
                        )}
                        {project.production_url && (
                          <a
                            href={project.production_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors"
                          >
                            Production
                          </a>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/dashboard/developer/projects/${project.id}/chat`)
                      }}
                      className="ml-4 p-3 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      <MessageSquare className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {projects.length > 5 && (
            <div className="px-6 py-4 bg-gray-50 text-center">
              <button
                onClick={() => router.push('/dashboard/developer/projects')}
                className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
              >
                Xem tất cả {projects.length} dự án →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
