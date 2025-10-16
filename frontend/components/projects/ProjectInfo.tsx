'use client'

interface ProjectData {
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
  project_manager?: {
    id: string
    full_name: string
    email: string
    role: string
  }
  start_date?: string
  end_date?: string
  estimated_hours?: number
  budget?: number
  created_at: string
  updated_at: string
}

interface ProjectInfoProps {
  project: ProjectData
}

export default function ProjectInfo({ project }: ProjectInfoProps) {
  const getStatusColor = (status: string) => {
    const colors = {
      negotiation: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      pending: 'bg-blue-100 text-blue-800 border-blue-300',
      in_progress: 'bg-green-100 text-green-800 border-green-300',
      on_hold: 'bg-orange-100 text-orange-800 border-orange-300',
      completed: 'bg-gray-100 text-gray-800 border-gray-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300'
    }
    return colors[status as keyof typeof colors] || colors.pending
  }

  const getStatusText = (status: string) => {
    const texts = {
      negotiation: 'Đang thương thảo',
      pending: 'Chờ xử lý',
      in_progress: 'Đang thực hiện',
      on_hold: 'Tạm dừng',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy'
    }
    return texts[status as keyof typeof texts] || status
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-600',
      medium: 'bg-blue-100 text-blue-600',
      high: 'bg-orange-100 text-orange-600',
      urgent: 'bg-red-100 text-red-600'
    }
    return colors[priority as keyof typeof colors] || colors.medium
  }

  const getPriorityText = (priority: string) => {
    const texts = {
      low: 'Thấp',
      medium: 'Trung bình',
      high: 'Cao',
      urgent: 'Khẩn cấp'
    }
    return texts[priority as keyof typeof texts] || priority
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Chưa xác định'
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'Chưa xác định'
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{project.name}</h1>
            <p className="text-gray-500 text-sm">ID: {project.id}</p>
          </div>
          <div className="flex gap-2">
            <span className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${getStatusColor(project.status)}`}>
              {getStatusText(project.status)}
            </span>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getPriorityColor(project.priority)}`}>
              {getPriorityText(project.priority)}
            </span>
          </div>
        </div>

        {/* Description */}
        {project.description && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Mô tả dự án
            </h3>
            <div className="text-sm text-gray-600 whitespace-pre-wrap">{project.description}</div>
          </div>
        )}
      </div>

      {/* Project Manager */}
      {project.project_manager && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            Sale phụ trách
          </h3>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {project.project_manager.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{project.project_manager.full_name}</p>
              <p className="text-sm text-gray-500">{project.project_manager.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Project Details */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
          Chi tiết dự án
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Ngày tạo:</span>
            <span className="font-semibold text-gray-900">{formatDate(project.created_at)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Ngày bắt đầu:</span>
            <span className="font-semibold text-gray-900">{formatDate(project.start_date)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Ngày kết thúc:</span>
            <span className="font-semibold text-gray-900">{formatDate(project.end_date)}</span>
          </div>
          {project.estimated_hours && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Thời gian ước tính:</span>
              <span className="font-semibold text-gray-900">{project.estimated_hours} giờ</span>
            </div>
          )}
          {project.budget && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Ngân sách:</span>
              <span className="font-semibold text-gray-900">{formatCurrency(project.budget)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Customer Info */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
          </svg>
          Thông tin khách hàng
        </h3>
        <div className="space-y-2">
          <p className="text-gray-600">
            <span className="font-semibold">Công ty:</span> {project.customer.company_name || 'Chưa cập nhật'}
          </p>
          <p className="text-gray-600">
            <span className="font-semibold">Người liên hệ:</span> {project.customer.user_name}
          </p>
          <p className="text-gray-600">
            <span className="font-semibold">Email:</span> {project.customer.user_email}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Hướng dẫn sử dụng</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Sử dụng chat bên phải để trao đổi trực tiếp với sale phụ trách</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Sale sẽ trả lời trong vài phút và hỗ trợ bạn trong suốt quá trình thương thảo</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Theo dõi trạng thái dự án và tiến độ thực hiện tại đây</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
