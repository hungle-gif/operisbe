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

export default function ProjectInfoCompact({ project }: ProjectInfoProps) {
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Chưa xác định'
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-4">
      {/* Compact Project Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg p-5 text-white">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h1 className="text-xl font-bold mb-1">{project.name}</h1>
            <p className="text-blue-100 text-sm">Tạo: {formatDate(project.created_at)}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(project.status)} bg-white`}>
            {getStatusText(project.status)}
          </span>
        </div>

        {/* Sale Info Inline */}
        {project.project_manager && (
          <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3 backdrop-blur-sm">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold">
              {project.project_manager.full_name.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{project.project_manager.full_name}</p>
              <p className="text-xs text-blue-100">Sale phụ trách • {project.project_manager.email}</p>
            </div>
          </div>
        )}
      </div>

      {/* Compact Description */}
      {project.description && (
        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
          <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Thông tin dự án
          </h3>
          <div className="text-sm text-gray-600 whitespace-pre-wrap max-h-60 overflow-y-auto">
            {project.description}
          </div>
        </div>
      )}

      {/* Quick Info Grid */}
      <div className="grid grid-cols-2 gap-3">
        {project.estimated_hours && (
          <div className="bg-white rounded-lg shadow-md p-3 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-semibold text-gray-500">Thời gian</span>
            </div>
            <p className="text-base font-bold text-gray-900">{project.estimated_hours}h</p>
          </div>
        )}

        {project.budget && (
          <div className="bg-white rounded-lg shadow-md p-3 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-semibold text-gray-500">Ngân sách</span>
            </div>
            <p className="text-base font-bold text-gray-900">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', notation: 'compact' }).format(project.budget)}
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-3 border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-semibold text-gray-500">Bắt đầu</span>
          </div>
          <p className="text-sm font-bold text-gray-900">{formatDate(project.start_date)}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-3 border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-semibold text-gray-500">Kết thúc</span>
          </div>
          <p className="text-sm font-bold text-gray-900">{formatDate(project.end_date)}</p>
        </div>
      </div>

      {/* Help Card - Compact */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 text-sm mb-2">Hướng dẫn nhanh</h4>
            <ul className="space-y-1 text-xs text-gray-700">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                <span>Chat bên phải để trao đổi trực tiếp</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                <span>Sale sẽ gửi form thương thảo cho bạn</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                <span>Xác nhận để bắt đầu triển khai</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
