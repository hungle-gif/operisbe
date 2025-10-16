'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { projectsAPI } from '@/lib/api'
import ChatBoxCompact from '@/components/projects/ChatBoxCompact'
import ProposalInline from '@/components/projects/ProposalInline'

interface Project {
  id: string
  name: string
  description: string
  status: string
  priority: string
  customer: {
    id: string
    company_name: string
    user_name: string
    user_email: string
  }
  project_manager?: {
    id: string
    full_name: string
    email: string
    role: string
  }
  created_at: string
}

interface Proposal {
  id: string
  status: string
  total_price: number
  currency: string
  created_at: string
}

export default function SalesProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState('')

  useEffect(() => {
    loadProject()
    // Get current user ID from localStorage
    const token = localStorage.getItem('access_token')
    if (token) {
      // Decode JWT to get user ID (simple base64 decode)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setCurrentUserId(payload.user_id)
      } catch (e) {
        console.error('Failed to decode token:', e)
      }
    }
  }, [projectId])

  const loadProject = async () => {
    try {
      const response = await projectsAPI.get(projectId)
      setProject(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load project:', error)
      setLoading(false)
    }
  }

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
      pending: 'Chờ triển khai',
      in_progress: 'Đang thực hiện',
      on_hold: 'Tạm dừng',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy'
    }
    return texts[status as keyof typeof texts] || status
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Project not found</p>
          <button
            onClick={() => router.push('/dashboard/sales')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Quay lại Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.push('/dashboard/sales')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Quay lại</span>
          </button>
          <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${getStatusColor(project.status)}`}>
            {getStatusText(project.status)}
          </span>
        </div>

        {/* Layout */}
        <div className="grid lg:grid-cols-2 gap-4 mb-6">
          {/* Left: Project Info */}
          <div>
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg p-5 text-white mb-4">
              <h1 className="text-2xl font-bold mb-2">{project.name}</h1>
              <p className="text-blue-100 text-sm mb-4">{project.description}</p>

              {/* Customer Info */}
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-3">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-semibold">{project.customer.company_name || 'N/A'}</p>
                    <p className="text-sm text-blue-100">{project.customer.user_name}</p>
                    <p className="text-sm text-blue-100">{project.customer.user_email}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right: Chat */}
          <div className="lg:sticky lg:top-4">
            <ChatBoxCompact projectId={projectId} currentUserId={currentUserId} />
          </div>
        </div>

        {/* Proposal Inline Editor */}
        <div className="mt-6">
          <ProposalInline projectId={projectId} userRole="sale" />
        </div>
      </div>
    </div>
  )
}
