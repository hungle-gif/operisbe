'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { projectsAPI } from '@/lib/api'
import ProjectInfoCompact from '@/components/projects/ProjectInfoCompact'
import ChatBoxCompact from '@/components/projects/ChatBoxCompact'
import ProposalInline from '@/components/projects/ProposalInline'

interface ProjectData {
  id: string
  name: string
  description: string
  status: string
  priority: string
  customer: {
    id: string
    company_name: string
    phone: string
    email: string
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

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<ProjectData | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Get current user from localStorage
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      setCurrentUserId(user.id)
    }

    loadProject()
  }, [projectId])

  const loadProject = async () => {
    try {
      const response = await projectsAPI.get(projectId)
      setProject(response.data)
      setLoading(false)
    } catch (err: any) {
      console.error('Failed to load project:', err)
      setError(err.response?.data?.detail || 'Không thể tải thông tin dự án')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[500px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Đang tải thông tin dự án...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[500px]">
            <div className="text-center">
              <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Lỗi</h2>
              <p className="text-gray-600 mb-4">{error || 'Không tìm thấy dự án'}</p>
              <button
                onClick={() => router.push('/dashboard/customer')}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Quay lại Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.push('/dashboard/customer')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-semibold">Dashboard</span>
          </button>
          <div className="text-right">
            <h1 className="text-xl font-bold text-gray-900">Chi tiết dự án</h1>
            <p className="text-sm text-gray-500">Thương thảo & theo dõi</p>
          </div>
        </div>

        {/* Completed Banner - Show if COMPLETED */}
        {project.status === 'completed' && (
          <div className="mb-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-1">✅ Dự Án Hoàn Thành</h3>
                  <p className="text-green-100 text-lg">
                    Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ. Hãy đánh giá và cho chúng tôi biết ý kiến của bạn!
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push(`/dashboard/customer/projects/${projectId}/handover`)}
                className="px-8 py-4 bg-white text-green-700 rounded-xl font-bold text-lg hover:bg-green-50 transition-all duration-200 shadow-lg hover:scale-105 flex items-center gap-3 flex-shrink-0"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                Đánh Giá & Phản Hồi
              </button>
            </div>
          </div>
        )}

        {/* Optimized Layout - Split 50/50 */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Left - Project Info (Compact) */}
          <div>
            <ProjectInfoCompact project={project} />
          </div>

          {/* Right - Chat (Full height) */}
          <div className="lg:sticky lg:top-4" style={{ height: 'fit-content' }}>
            <ChatBoxCompact projectId={projectId} currentUserId={currentUserId} />
          </div>
        </div>

        {/* Proposal Inline */}
        <div className="mt-6">
          <ProposalInline projectId={projectId} userRole="customer" />
        </div>
      </div>
    </div>
  )
}
