'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  MessageSquare,
  Search,
  FolderKanban,
  Clock,
  Users
} from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string
  status: string
  customer: {
    company_name: string
    user_name: string
    user_email: string
  }
  unread_count?: number
  last_message?: {
    message: string
    created_at: string
    sender_name: string
  }
}

export default function DeveloperChatPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    filterProjects()
  }, [searchTerm, projects])

  const loadProjects = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token')
      if (!token) {
        router.push('/login')
        return
      }

      // Load projects
      const projectsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json()

        // Load unread counts for each project
        const projectsWithUnread = await Promise.all(
          projectsData.map(async (project: Project) => {
            try {
              const unreadResponse = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/projects/${project.id}/unread-count`,
                { headers: { 'Authorization': `Bearer ${token}` } }
              )

              if (unreadResponse.ok) {
                const unreadData = await unreadResponse.json()

                // Also fetch last message
                const messagesResponse = await fetch(
                  `${process.env.NEXT_PUBLIC_API_URL}/api/projects/${project.id}/messages?limit=1`,
                  { headers: { 'Authorization': `Bearer ${token}` } }
                )

                let last_message = null
                if (messagesResponse.ok) {
                  const messages = await messagesResponse.json()
                  if (messages.length > 0) {
                    last_message = {
                      message: messages[0].message,
                      created_at: messages[0].created_at,
                      sender_name: messages[0].sender.full_name
                    }
                  }
                }

                return {
                  ...project,
                  unread_count: unreadData.count || 0,
                  last_message
                }
              }
              return { ...project, unread_count: 0 }
            } catch (err) {
              return { ...project, unread_count: 0 }
            }
          })
        )

        // Sort by unread count (desc) and then by last message time
        projectsWithUnread.sort((a, b) => {
          if (a.unread_count !== b.unread_count) {
            return (b.unread_count || 0) - (a.unread_count || 0)
          }
          if (a.last_message && b.last_message) {
            return new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime()
          }
          return 0
        })

        setProjects(projectsWithUnread)
        setFilteredProjects(projectsWithUnread)
      }
    } catch (err) {
      console.error('Failed to load projects:', err)
    } finally {
      setLoading(false)
    }
  }

  const filterProjects = () => {
    if (!searchTerm) {
      setFilteredProjects(projects)
      return
    }

    const filtered = projects.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.customer.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.customer.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredProjects(filtered)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Vừa xong'
    if (diffMins < 60) return `${diffMins} phút trước`
    if (diffHours < 24) return `${diffHours} giờ trước`
    if (diffDays < 7) return `${diffDays} ngày trước`
    return date.toLocaleDateString('vi-VN')
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      in_progress: 'bg-blue-100 text-blue-800',
      pending_acceptance: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      on_hold: 'bg-orange-100 text-orange-800',
      revision_required: 'bg-pink-100 text-pink-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      in_progress: 'Đang thực hiện',
      pending_acceptance: 'Chờ nghiệm thu',
      completed: 'Hoàn thành',
      on_hold: 'Tạm dừng',
      revision_required: 'Cần sửa đổi'
    }
    return labels[status] || status
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
            <MessageSquare className="w-10 h-10 text-blue-600" />
            Chat với khách hàng
          </h1>
          <p className="text-gray-600">Trao đổi với khách hàng về các dự án đang thực hiện</p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo tên dự án, khách hàng..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Hiển thị <span className="font-semibold">{filteredProjects.length}</span> / {projects.length} dự án
            </p>
            {projects.filter(p => p.unread_count && p.unread_count > 0).length > 0 && (
              <div className="text-sm">
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full font-semibold">
                  <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                  {projects.reduce((sum, p) => sum + (p.unread_count || 0), 0)} tin nhắn chưa đọc
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Projects List */}
        {filteredProjects.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <MessageSquare className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Không tìm thấy dự án nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => router.push(`/dashboard/developer/projects/${project.id}/chat`)}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer overflow-hidden border-l-4 border-blue-600"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FolderKanban className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <h3 className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors">
                          {project.name}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(project.status)}`}>
                          {getStatusLabel(project.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <Users className="w-4 h-4 flex-shrink-0" />
                        <span className="font-semibold">{project.customer.company_name || project.customer.user_name}</span>
                        <span className="text-gray-400">•</span>
                        <span>{project.customer.user_email}</span>
                      </div>
                    </div>
                    {project.unread_count && project.unread_count > 0 && (
                      <div className="ml-4">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-red-600 text-white rounded-full font-bold text-sm">
                          {project.unread_count > 9 ? '9+' : project.unread_count}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Last Message */}
                  {project.last_message ? (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-sm font-semibold text-gray-700">{project.last_message.sender_name}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {formatDate(project.last_message.created_at)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{project.last_message.message}</p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-center">
                      <p className="text-sm text-gray-500 italic">Chưa có tin nhắn nào</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
