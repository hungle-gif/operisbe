'use client'

import { useEffect, useState } from 'react'
import { X, Building2, User, Calendar, DollarSign, Clock, GitBranch, Globe, AlertCircle, CheckCircle, FileText, MessageSquare, TrendingUp, CreditCard } from 'lucide-react'

interface ProjectDetailModalProps {
  projectId: string
  isOpen: boolean
  onClose: () => void
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
  budget: number | null
  repository_url: string | null
  staging_url: string | null
  production_url: string | null
  created_at: string
  updated_at: string
}

interface Phase {
  name: string
  days: number
  amount: number
  payment_percentage: number
  tasks: string
  completed: boolean
  completed_at: string | null
  payment_submitted: boolean
  payment_submitted_at: string | null
  payment_approved: boolean
  payment_approved_at: string | null
  payment_proof: any
}

interface Proposal {
  id: string
  project_analysis: string
  total_price: number
  deposit_amount: number
  deposit_paid: boolean
  deposit_paid_at: string | null
  payment_submitted: boolean
  payment_submitted_at: string | null
  status: string
  phases: Phase[]
  team_members: any[]
  deliverables: any[]
  estimated_start_date: string | null
  estimated_end_date: string | null
  estimated_duration_days: number
  created_at: string
}

interface Feedback {
  id: string
  content: string
  rating: number
  acceptance_status: string
  created_at: string
}

interface Transaction {
  id: string
  transaction_type: string
  amount: number
  description: string
  status: string
  payment_method: string
  created_at: string
}

export default function ProjectDetailModal({ projectId, isOpen, onClose }: ProjectDetailModalProps) {
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'proposals' | 'feedback' | 'finance'>('overview')

  useEffect(() => {
    if (isOpen && projectId) {
      loadProjectDetails()
    }
  }, [isOpen, projectId])

  const loadProjectDetails = async () => {
    setLoading(true)
    const token = localStorage.getItem('token')

    try {
      // Load project details
      const projectRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (projectRes.ok) {
        const projectData = await projectRes.json()
        setProject(projectData)
      }

      // Load proposals
      const proposalsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/proposals?project_id=${projectId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (proposalsRes.ok) {
        const proposalsData = await proposalsRes.json()
        setProposals(proposalsData)
      }

      // Load feedback
      const feedbackRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/feedback?project_id=${projectId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (feedbackRes.ok) {
        const feedbackData = await feedbackRes.json()
        setFeedbacks(feedbackData)
      }

      // Load transactions
      const transactionsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transactions?project_id=${projectId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json()
        setTransactions(transactionsData)
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
      negotiation: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      draft: 'bg-gray-100 text-gray-800 border-gray-300',
      sent: 'bg-cyan-100 text-cyan-800 border-cyan-300',
      approved: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      rejected: 'bg-rose-100 text-rose-800 border-rose-300',
      paid: 'bg-teal-100 text-teal-800 border-teal-300',
      pending: 'bg-amber-100 text-amber-800 border-amber-300',
      failed: 'bg-red-100 text-red-800 border-red-300',
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
      negotiation: 'Đang thương lượng',
      draft: 'Bản nháp',
      sent: 'Đã gửi',
      approved: 'Đã duyệt',
      rejected: 'Từ chối',
      paid: 'Đã thanh toán',
      pending: 'Chờ xử lý',
      failed: 'Thất bại',
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
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

  const calculateFinanceStats = () => {
    const totalProposed = proposals.reduce((sum, p) => sum + p.total_price, 0)
    const totalPaid = transactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.amount, 0)
    const totalPending = transactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0)
    const depositPaid = proposals.reduce((sum, p) => p.deposit_paid ? sum + p.deposit_amount : sum, 0)

    return { totalProposed, totalPaid, totalPending, depositPaid }
  }

  const getPhaseStatus = (phase: Phase) => {
    if (phase.payment_approved) return 'completed'
    if (phase.payment_submitted) return 'pending_payment'
    if (phase.completed) return 'completed_work'
    return 'in_progress'
  }

  const getPhaseStatusLabel = (phase: Phase) => {
    if (phase.payment_approved) return 'Đã thanh toán'
    if (phase.payment_submitted) return 'Chờ duyệt thanh toán'
    if (phase.completed) return 'Hoàn thành - Chờ thanh toán'
    return 'Đang thực hiện'
  }

  const getPhaseStatusColor = (phase: Phase) => {
    if (phase.payment_approved) return 'bg-green-100 text-green-800 border-green-300'
    if (phase.payment_submitted) return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    if (phase.completed) return 'bg-blue-100 text-blue-800 border-blue-300'
    return 'bg-gray-100 text-gray-800 border-gray-300'
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
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-blue-800 text-white px-8 py-6">
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
                <h2 className="text-3xl font-bold mb-2">{project.name}</h2>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(project.status)}`}>
                    {getStatusLabel(project.status)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getPriorityColor(project.priority)}`}>
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
                onClick={() => setActiveTab('proposals')}
                className={`px-6 py-4 font-semibold transition-colors ${
                  activeTab === 'proposals'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                Đề xuất ({proposals.length})
              </button>
              <button
                onClick={() => setActiveTab('feedback')}
                className={`px-6 py-4 font-semibold transition-colors ${
                  activeTab === 'feedback'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                Đánh giá ({feedbacks.length})
              </button>
              <button
                onClick={() => setActiveTab('finance')}
                className={`px-6 py-4 font-semibold transition-colors ${
                  activeTab === 'finance'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                Tài chính ({transactions.length})
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
                    <div className="bg-white border rounded-xl p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Thông tin cơ bản
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
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
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
                        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
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

                    {/* Timeline & Budget */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white border rounded-xl p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-purple-600" />
                          Thời gian
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <span className="text-gray-600 w-32 font-medium">Bắt đầu:</span>
                            <span className="text-gray-900 font-semibold">{formatDate(project.start_date)}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-gray-600 w-32 font-medium">Kết thúc:</span>
                            <span className="text-gray-900 font-semibold">{formatDate(project.end_date)}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-5 h-5 text-gray-600 mr-2" />
                            <span className="text-gray-600 w-32 font-medium">Ước tính:</span>
                            <span className="text-gray-900 font-semibold">{project.estimated_hours || 'N/A'} giờ</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-yellow-900 mb-4 flex items-center gap-2">
                          <DollarSign className="w-5 h-5" />
                          Ngân sách
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <span className="text-yellow-700 font-medium">Tổng ngân sách:</span>
                            <span className="ml-2 text-yellow-900 text-2xl font-bold">
                              {project.budget ? formatCurrency(project.budget) : 'Chưa xác định'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Technical Info */}
                    <div className="bg-white border rounded-xl p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <GitBranch className="w-5 h-5 text-indigo-600" />
                        Thông tin kỹ thuật
                      </h3>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-center">
                          <GitBranch className="w-5 h-5 text-gray-600 mr-2" />
                          <span className="text-gray-600 w-40 font-medium">Repository:</span>
                          {project.repository_url ? (
                            <a
                              href={project.repository_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {project.repository_url}
                            </a>
                          ) : (
                            <span className="text-gray-400">Chưa có</span>
                          )}
                        </div>
                        <div className="flex items-center">
                          <Globe className="w-5 h-5 text-gray-600 mr-2" />
                          <span className="text-gray-600 w-40 font-medium">Staging URL:</span>
                          {project.staging_url ? (
                            <a
                              href={project.staging_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {project.staging_url}
                            </a>
                          ) : (
                            <span className="text-gray-400">Chưa có</span>
                          )}
                        </div>
                        <div className="flex items-center">
                          <Globe className="w-5 h-5 text-gray-600 mr-2" />
                          <span className="text-gray-600 w-40 font-medium">Production URL:</span>
                          {project.production_url ? (
                            <a
                              href={project.production_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {project.production_url}
                            </a>
                          ) : (
                            <span className="text-gray-400">Chưa có</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Proposals Tab */}
                {activeTab === 'proposals' && (
                  <div className="space-y-6">
                    {proposals.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p>Chưa có đề xuất nào</p>
                      </div>
                    ) : (
                      proposals.map((proposal) => (
                        <div key={proposal.id} className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden">
                          {/* Proposal Header */}
                          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-2xl font-bold mb-2">Đề xuất #{proposal.id.substring(0, 8)}</h4>
                                <p className="text-white/90 text-sm">
                                  Ngày tạo: {formatDate(proposal.created_at)}
                                </p>
                              </div>
                              <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 border-white ${getStatusColor(proposal.status)}`}>
                                {getStatusLabel(proposal.status)}
                              </span>
                            </div>
                          </div>

                          {/* Proposal Summary */}
                          <div className="p-6 bg-gray-50">
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                              <div className="bg-white rounded-xl p-4 border-2 border-blue-200">
                                <p className="text-xs text-blue-600 font-semibold mb-1">Tổng giá trị</p>
                                <p className="text-xl font-bold text-blue-900">{formatCurrency(proposal.total_price)}</p>
                              </div>
                              <div className="bg-white rounded-xl p-4 border-2 border-purple-200">
                                <p className="text-xs text-purple-600 font-semibold mb-1">Đặt cọc</p>
                                <p className="text-xl font-bold text-purple-900">{formatCurrency(proposal.deposit_amount)}</p>
                              </div>
                              <div className="bg-white rounded-xl p-4 border-2 border-green-200">
                                <p className="text-xs text-green-600 font-semibold mb-1">Trạng thái cọc</p>
                                <p className="text-sm font-bold text-green-900">
                                  {proposal.deposit_paid ? '✓ Đã thanh toán' : '✗ Chưa thanh toán'}
                                </p>
                              </div>
                              <div className="bg-white rounded-xl p-4 border-2 border-orange-200">
                                <p className="text-xs text-orange-600 font-semibold mb-1">Thời gian</p>
                                <p className="text-xl font-bold text-orange-900">{proposal.estimated_duration_days} ngày</p>
                              </div>
                              <div className="bg-white rounded-xl p-4 border-2 border-indigo-200">
                                <p className="text-xs text-indigo-600 font-semibold mb-1">Giai đoạn</p>
                                <p className="text-xl font-bold text-indigo-900">{proposal.phases.length} phases</p>
                              </div>
                            </div>
                          </div>

                          {/* Phases Timeline */}
                          <div className="p-6">
                            <h5 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                              <Clock className="w-5 h-5 text-indigo-600" />
                              Các giai đoạn thực hiện
                            </h5>

                            {proposal.phases.length === 0 ? (
                              <p className="text-gray-500 text-center py-8">Chưa có giai đoạn nào</p>
                            ) : (
                              <div className="space-y-4">
                                {proposal.phases.map((phase, index) => (
                                  <div
                                    key={index}
                                    className="bg-white border-2 rounded-xl p-5 hover:shadow-lg transition-all"
                                  >
                                    {/* Phase Header */}
                                    <div className="flex justify-between items-start mb-4">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                          <span className="text-indigo-700 font-bold text-lg">{index + 1}</span>
                                        </div>
                                        <div>
                                          <h6 className="text-lg font-bold text-gray-900">{phase.name}</h6>
                                          <p className="text-sm text-gray-600">{phase.days} ngày</p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-2xl font-bold text-indigo-900">{formatCurrency(phase.amount)}</p>
                                        <p className="text-xs text-gray-600">Thanh toán {phase.payment_percentage}%</p>
                                      </div>
                                    </div>

                                    {/* Phase Tasks */}
                                    <div className="mb-4">
                                      <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg">
                                        {phase.tasks}
                                      </p>
                                    </div>

                                    {/* Phase Status Indicators */}
                                    <div className="grid grid-cols-3 gap-3">
                                      <div className={`rounded-lg p-3 border-2 ${
                                        phase.completed
                                          ? 'bg-green-50 border-green-300'
                                          : 'bg-gray-50 border-gray-200'
                                      }`}>
                                        <div className="flex items-center gap-2 mb-1">
                                          <CheckCircle className={`w-4 h-4 ${phase.completed ? 'text-green-600' : 'text-gray-400'}`} />
                                          <p className="text-xs font-semibold text-gray-700">Hoàn thành</p>
                                        </div>
                                        <p className={`text-sm font-bold ${phase.completed ? 'text-green-900' : 'text-gray-500'}`}>
                                          {phase.completed ? '✓ Đã hoàn thành' : 'Chưa hoàn thành'}
                                        </p>
                                        {phase.completed_at && (
                                          <p className="text-xs text-gray-600 mt-1">{formatDate(phase.completed_at)}</p>
                                        )}
                                      </div>

                                      <div className={`rounded-lg p-3 border-2 ${
                                        phase.payment_submitted
                                          ? 'bg-yellow-50 border-yellow-300'
                                          : 'bg-gray-50 border-gray-200'
                                      }`}>
                                        <div className="flex items-center gap-2 mb-1">
                                          <Clock className={`w-4 h-4 ${phase.payment_submitted ? 'text-yellow-600' : 'text-gray-400'}`} />
                                          <p className="text-xs font-semibold text-gray-700">Thanh toán</p>
                                        </div>
                                        <p className={`text-sm font-bold ${phase.payment_submitted ? 'text-yellow-900' : 'text-gray-500'}`}>
                                          {phase.payment_submitted ? 'Đã gửi' : 'Chưa gửi'}
                                        </p>
                                        {phase.payment_submitted_at && (
                                          <p className="text-xs text-gray-600 mt-1">{formatDate(phase.payment_submitted_at)}</p>
                                        )}
                                      </div>

                                      <div className={`rounded-lg p-3 border-2 ${
                                        phase.payment_approved
                                          ? 'bg-blue-50 border-blue-300'
                                          : 'bg-gray-50 border-gray-200'
                                      }`}>
                                        <div className="flex items-center gap-2 mb-1">
                                          <CreditCard className={`w-4 h-4 ${phase.payment_approved ? 'text-blue-600' : 'text-gray-400'}`} />
                                          <p className="text-xs font-semibold text-gray-700">Duyệt TT</p>
                                        </div>
                                        <p className={`text-sm font-bold ${phase.payment_approved ? 'text-blue-900' : 'text-gray-500'}`}>
                                          {phase.payment_approved ? '✓ Đã duyệt' : 'Chưa duyệt'}
                                        </p>
                                        {phase.payment_approved_at && (
                                          <p className="text-xs text-gray-600 mt-1">{formatDate(phase.payment_approved_at)}</p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Overall Phase Status Badge */}
                                    <div className="mt-4 pt-4 border-t">
                                      <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold border-2 ${getPhaseStatusColor(phase)}`}>
                                        {getPhaseStatusLabel(phase)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Team Members */}
                          {proposal.team_members && proposal.team_members.length > 0 && (
                            <div className="px-6 pb-6">
                              <h5 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <User className="w-5 h-5 text-green-600" />
                                Đội ngũ thực hiện
                              </h5>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {proposal.team_members.map((member: any, idx: number) => (
                                  <div key={idx} className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-3">
                                    <p className="font-bold text-gray-900">{member.name}</p>
                                    <p className="text-xs text-gray-600">{member.role}</p>
                                    <div className="flex items-center gap-1 mt-1">
                                      {[...Array(5)].map((_, i) => (
                                        <span key={i} className={`text-sm ${i < member.rating ? 'text-yellow-500' : 'text-gray-300'}`}>★</span>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Feedback Tab */}
                {activeTab === 'feedback' && (
                  <div className="space-y-4">
                    {feedbacks.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p>Chưa có đánh giá nào</p>
                      </div>
                    ) : (
                      feedbacks.map((feedback) => (
                        <div key={feedback.id} className="bg-white border rounded-xl p-6 hover:shadow-lg transition-shadow">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <span
                                    key={i}
                                    className={`text-2xl ${
                                      i < feedback.rating ? 'text-yellow-400' : 'text-gray-300'
                                    }`}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                              <span className="text-lg font-bold text-gray-900">
                                {feedback.rating}/5
                              </span>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(feedback.acceptance_status)}`}>
                              {getStatusLabel(feedback.acceptance_status)}
                            </span>
                          </div>

                          <p className="text-gray-700 mb-4 leading-relaxed">{feedback.content}</p>

                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDateTime(feedback.created_at)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Finance Tab */}
                {activeTab === 'finance' && (
                  <div className="space-y-6">
                    {/* Finance Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <TrendingUp className="w-6 h-6 text-blue-600" />
                          <span className="text-xs text-blue-600 font-medium">Tổng đề xuất</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-900">{formatCurrency(calculateFinanceStats().totalProposed)}</p>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                          <span className="text-xs text-green-600 font-medium">Đã thanh toán</span>
                        </div>
                        <p className="text-2xl font-bold text-green-900">{formatCurrency(calculateFinanceStats().totalPaid)}</p>
                      </div>

                      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Clock className="w-6 h-6 text-yellow-600" />
                          <span className="text-xs text-yellow-600 font-medium">Chờ xử lý</span>
                        </div>
                        <p className="text-2xl font-bold text-yellow-900">{formatCurrency(calculateFinanceStats().totalPending)}</p>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <CreditCard className="w-6 h-6 text-purple-600" />
                          <span className="text-xs text-purple-600 font-medium">Đã đặt cọc</span>
                        </div>
                        <p className="text-2xl font-bold text-purple-900">{formatCurrency(calculateFinanceStats().depositPaid)}</p>
                      </div>
                    </div>

                    {/* Transactions List */}
                    <div className="bg-white border rounded-xl overflow-hidden">
                      <div className="bg-gray-50 px-6 py-4 border-b">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          <CreditCard className="w-5 h-5 text-gray-600" />
                          Lịch sử giao dịch
                        </h3>
                      </div>

                      {transactions.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                          <p>Chưa có giao dịch nào</p>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {transactions.map((transaction) => (
                            <div key={transaction.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(transaction.transaction_type)}`}>
                                      {transaction.transaction_type === 'deposit' ? 'Đặt cọc' :
                                       transaction.transaction_type === 'payment' ? 'Thanh toán' :
                                       transaction.transaction_type === 'refund' ? 'Hoàn tiền' : transaction.transaction_type}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(transaction.status)}`}>
                                      {getStatusLabel(transaction.status)}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                      {transaction.payment_method === 'bank_transfer' ? 'Chuyển khoản' :
                                       transaction.payment_method === 'cash' ? 'Tiền mặt' :
                                       transaction.payment_method === 'credit_card' ? 'Thẻ tín dụng' : transaction.payment_method}
                                    </span>
                                  </div>
                                  <p className="text-gray-700">{transaction.description}</p>
                                  <p className="text-xs text-gray-500 mt-1">{formatDateTime(transaction.created_at)}</p>
                                </div>
                                <div className="text-right">
                                  <p className={`text-2xl font-bold ${
                                    transaction.transaction_type === 'refund' ? 'text-red-600' : 'text-green-600'
                                  }`}>
                                    {transaction.transaction_type === 'refund' ? '-' : '+'}{formatCurrency(transaction.amount)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Không thể tải thông tin dự án</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
