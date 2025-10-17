'use client'

import { useEffect, useState } from 'react'
import { X, Building2, User, Calendar, Clock, GitBranch, Globe, FileText, MessageSquare, Code, CheckCircle, AlertTriangle } from 'lucide-react'

interface ProjectDetailModalProps {
  projectId: string
  isOpen: boolean
  onClose: () => void
}

interface Phase {
  name: string
  days: number
  amount: number
  payment_percentage: number
  tasks: string
  completed?: boolean
  completed_at?: string
  completed_by?: string
  payment_submitted?: boolean
  payment_approved?: boolean
}

interface Proposal {
  id: string
  phases: Phase[]
  status: string
}

interface ProjectDetail {
  id: string
  name: string
  description: string
  status: string
  priority: string
  customer: {
    id: string
    company_name: string
    user_email: string
    user_name: string
  }
  project_manager: {
    id: string
    full_name: string
    email: string
    role: string
  } | null
  start_date: string | null
  end_date: string | null
  estimated_hours: number | null
  repository_url: string | null
  staging_url: string | null
  production_url: string | null
  created_at: string
  updated_at: string
}

export default function ProjectDetailModal({ projectId, isOpen, onClose }: ProjectDetailModalProps) {
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'tech' | 'chat'>('overview')

  useEffect(() => {
    if (isOpen && projectId) {
      loadProjectDetails()
    }
  }, [isOpen, projectId])

  const loadProjectDetails = async () => {
    setLoading(true)
    const token = localStorage.getItem('token') || localStorage.getItem('access_token')

    try {
      // Load project details
      const projectRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (projectRes.ok) {
        const projectData = await projectRes.json()
        setProject(projectData)
      }

      // Load proposals to get phases
      const proposalRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/proposals`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (proposalRes.ok) {
        const proposalData = await proposalRes.json()
        if (proposalData && proposalData.length > 0) {
          setProposal(proposalData[0])
        }
      }
    } catch (err) {
      console.error('Failed to load project details:', err)
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
      cancelled: 'bg-red-100 text-red-800 border-red-300',
      pending_acceptance: 'bg-purple-100 text-purple-800 border-purple-300',
      revision_required: 'bg-pink-100 text-pink-800 border-pink-300',
    }
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      planning: 'Lên kế hoạch',
      in_progress: 'Đang thực hiện',
      completed: 'Hoàn thành',
      on_hold: 'Tạm dừng',
      cancelled: 'Đã hủy',
      pending_acceptance: 'Chờ nghiệm thu',
      revision_required: 'Cần sửa đổi',
    }
    return labels[status] || status
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-green-100 text-green-800 border-green-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      high: 'bg-orange-100 text-orange-800 border-orange-300',
      urgent: 'bg-red-100 text-red-800 border-red-300',
    }
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      low: 'Thấp',
      medium: 'Trung bình',
      high: 'Cao',
      urgent: 'Khẩn cấp',
    }
    return labels[priority] || priority
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Chưa xác định'
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-8 py-6">
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {loading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-white/20 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-white/20 rounded w-1/4"></div>
              </div>
            ) : project ? (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Code className="w-8 h-8" />
                  <h2 className="text-3xl font-bold">{project.name}</h2>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold border-2 border-white ${getStatusColor(project.status)}`}>
                    {getStatusLabel(project.status)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold border-2 border-white ${getPriorityColor(project.priority)}`}>
                    {getPriorityLabel(project.priority)}
                  </span>
                  <span className="text-white/80 text-sm">
                    ID: {project.id.substring(0, 8)}
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          {/* Tabs */}
          <div className="border-b bg-gray-50">
            <div className="flex gap-1 px-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-4 font-semibold transition-colors ${
                  activeTab === 'overview'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                Tổng quan
              </button>
              <button
                onClick={() => setActiveTab('tech')}
                className={`px-6 py-4 font-semibold transition-colors ${
                  activeTab === 'tech'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                Kỹ thuật
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-6 py-4 font-semibold transition-colors ${
                  activeTab === 'chat'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                Chat
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
              </div>
            ) : project ? (
              <div className="px-8 py-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="bg-white border-2 rounded-xl p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Thông tin dự án
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-start">
                          <span className="text-gray-600 w-40 font-medium">Mô tả:</span>
                          <span className="text-gray-900 flex-1">{project.description || 'Chưa có mô tả'}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-600 w-40 font-medium">Ngày tạo:</span>
                          <span className="text-gray-900">{formatDateTime(project.created_at)}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-600 w-40 font-medium">Cập nhật:</span>
                          <span className="text-gray-900">{formatDateTime(project.updated_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Customer & Manager */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                          <Building2 className="w-5 h-5" />
                          Khách hàng
                        </h3>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <span className="text-blue-700 font-medium">Công ty:</span>
                            <span className="ml-2 text-blue-900 font-semibold">{project.customer.company_name || 'N/A'}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-blue-700 font-medium">Người đại diện:</span>
                            <span className="ml-2 text-blue-900">{project.customer.user_name}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-blue-700 font-medium">Email:</span>
                            <span className="ml-2 text-blue-900">{project.customer.user_email}</span>
                          </div>
                        </div>
                      </div>

                      {project.project_manager && (
                        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6">
                          <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Quản lý dự án
                          </h3>
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <span className="text-green-700 font-medium">Họ tên:</span>
                              <span className="ml-2 text-green-900 font-semibold">{project.project_manager.full_name}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-green-700 font-medium">Email:</span>
                              <span className="ml-2 text-green-900">{project.project_manager.email}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-green-700 font-medium">Vai trò:</span>
                              <span className="ml-2 text-green-900 uppercase">{project.project_manager.role}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Timeline */}
                    <div className="bg-white border-2 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-purple-600" />
                        Thời gian thực hiện
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
                          <p className="text-sm text-purple-700 font-semibold mb-1">Ngày bắt đầu</p>
                          <p className="text-lg font-bold text-purple-900">{formatDate(project.start_date)}</p>
                        </div>
                        <div className="bg-indigo-50 rounded-lg p-4 border-2 border-indigo-200">
                          <p className="text-sm text-indigo-700 font-semibold mb-1">Ngày kết thúc</p>
                          <p className="text-lg font-bold text-indigo-900">{formatDate(project.end_date)}</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                          <p className="text-sm text-blue-700 font-semibold mb-1">Ước tính</p>
                          <p className="text-lg font-bold text-blue-900">{project.estimated_hours || 'N/A'} giờ</p>
                        </div>
                      </div>
                    </div>

                    {/* Important Note */}
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-6">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                        <div>
                          <h3 className="text-lg font-bold text-amber-900 mb-2">Lưu ý quan trọng</h3>
                          <p className="text-amber-800">
                            Thông tin về ngân sách, đề xuất và các giai đoạn thanh toán được quản lý bởi Sales/Admin.
                            Developer tập trung vào thực hiện công việc kỹ thuật và giao tiếp với khách hàng.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tech Tab */}
                {activeTab === 'tech' && (
                  <div className="space-y-6">
                    {/* Project Phases & Tasks */}
                    {proposal && proposal.phases && proposal.phases.length > 0 && (
                      <div className="bg-white border-2 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-purple-600" />
                          Các giai đoạn thực hiện
                        </h3>
                        <div className="space-y-4">
                          {proposal.phases.map((phase, index) => {
                            const isCompleted = phase.completed || false
                            const isPaid = phase.payment_approved || false
                            return (
                              <div
                                key={index}
                                className={`border-2 rounded-xl p-5 transition-all ${
                                  isPaid
                                    ? 'border-green-400 bg-gradient-to-br from-green-50 to-emerald-50'
                                    : isCompleted
                                    ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-cyan-50'
                                    : 'border-gray-300 bg-white'
                                }`}
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h4 className="text-lg font-bold text-gray-900">
                                        Giai đoạn {index + 1}: {phase.name}
                                      </h4>
                                      {isPaid ? (
                                        <span className="px-3 py-1 bg-green-600 text-white rounded-full text-xs font-bold">
                                          ✓ Đã thanh toán
                                        </span>
                                      ) : isCompleted ? (
                                        <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-bold">
                                          ✓ Hoàn thành
                                        </span>
                                      ) : (
                                        <span className="px-3 py-1 bg-yellow-500 text-white rounded-full text-xs font-bold">
                                          🔄 Đang thực hiện
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        {phase.days} ngày
                                      </span>
                                      <span className="flex items-center gap-1">
                                        💰 {new Intl.NumberFormat('vi-VN', {
                                          style: 'currency',
                                          currency: 'VND'
                                        }).format(Number(phase.amount) || 0)}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        📊 {phase.payment_percentage}% thanh toán
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Tasks/Work Description */}
                                <div className="bg-white border-2 border-indigo-200 rounded-lg p-4">
                                  <h5 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-indigo-600" />
                                    Công việc cần thực hiện:
                                  </h5>
                                  <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                    {phase.tasks || 'Chưa có mô tả công việc'}
                                  </div>
                                </div>

                                {/* Completion Status */}
                                {phase.completed_at && (
                                  <div className="mt-3 px-4 py-2 bg-blue-100 border border-blue-300 rounded-lg text-sm">
                                    <span className="font-semibold text-blue-900">
                                      ✓ Hoàn thành vào: {new Date(phase.completed_at).toLocaleString('vi-VN')}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Technical Resources */}
                    <div className="bg-white border-2 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Code className="w-5 h-5 text-indigo-600" />
                        Tài nguyên kỹ thuật
                      </h3>
                      <div className="space-y-4">
                        {project.repository_url ? (
                          <div className="flex items-center justify-between p-4 bg-gray-900 text-white rounded-lg">
                            <div className="flex items-center gap-3">
                              <GitBranch className="w-5 h-5" />
                              <div>
                                <p className="font-semibold">Repository</p>
                                <p className="text-sm text-gray-300">{project.repository_url}</p>
                              </div>
                            </div>
                            <a
                              href={project.repository_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                            >
                              Mở Repository
                            </a>
                          </div>
                        ) : (
                          <div className="p-4 bg-gray-100 text-gray-600 rounded-lg text-center">
                            Chưa có repository
                          </div>
                        )}

                        {project.staging_url ? (
                          <div className="flex items-center justify-between p-4 bg-orange-500 text-white rounded-lg">
                            <div className="flex items-center gap-3">
                              <Globe className="w-5 h-5" />
                              <div>
                                <p className="font-semibold">Staging Environment</p>
                                <p className="text-sm text-orange-100">{project.staging_url}</p>
                              </div>
                            </div>
                            <a
                              href={project.staging_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-white text-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
                            >
                              Xem Staging
                            </a>
                          </div>
                        ) : (
                          <div className="p-4 bg-gray-100 text-gray-600 rounded-lg text-center">
                            Chưa có staging URL
                          </div>
                        )}

                        {project.production_url ? (
                          <div className="flex items-center justify-between p-4 bg-green-600 text-white rounded-lg">
                            <div className="flex items-center gap-3">
                              <CheckCircle className="w-5 h-5" />
                              <div>
                                <p className="font-semibold">Production Environment</p>
                                <p className="text-sm text-green-100">{project.production_url}</p>
                              </div>
                            </div>
                            <a
                              href={project.production_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-white text-green-700 rounded-lg font-semibold hover:bg-green-50 transition-colors"
                            >
                              Xem Production
                            </a>
                          </div>
                        ) : (
                          <div className="p-4 bg-gray-100 text-gray-600 rounded-lg text-center">
                            Chưa có production URL
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Development Guidelines */}
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                        <Code className="w-5 h-5" />
                        Hướng dẫn phát triển
                      </h3>
                      <ul className="space-y-2 text-indigo-800">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                          <span>Tuân thủ coding standards và best practices của team</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                          <span>Commit code thường xuyên với message rõ ràng</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                          <span>Test kỹ trước khi push lên staging</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                          <span>Trao đổi với khách hàng qua chat khi cần clarification</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                          <span>Báo cáo tiến độ cho Project Manager định kỳ</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Chat Tab */}
                {activeTab === 'chat' && (
                  <div className="space-y-6">
                    <div className="bg-white border-2 rounded-xl p-6 text-center">
                      <MessageSquare className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Tính năng Chat</h3>
                      <p className="text-gray-600 mb-6">
                        Trao đổi trực tiếp với khách hàng về các yêu cầu kỹ thuật và tiến độ dự án
                      </p>
                      <button
                        onClick={() => window.location.href = `/dashboard/developer/projects/${project.id}/chat`}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all"
                      >
                        Mở Chat
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Không thể tải thông tin dự án</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
