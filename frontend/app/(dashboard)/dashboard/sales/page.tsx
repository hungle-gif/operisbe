'use client'

import { useState, useEffect } from 'react'
import { projectsAPI } from '@/lib/api'
import Link from 'next/link'
import { useRoleProtection } from '@/hooks/useRoleProtection'

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
  created_at: string
}

export default function SalesDashboard() {
  // 🔒 PROTECTION: Only sales can access this dashboard
  useRoleProtection({ allowedRoles: ['sale', 'sales'] })

  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const response = await projectsAPI.list()
      setProjects(response.data)
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const filteredProjects = filter === 'all'
    ? projects
    : projects.filter(p => p.status === filter)

  const negotiationCount = projects.filter(p => p.status === 'negotiation').length
  const activeCount = projects.filter(p => p.status === 'in_progress').length
  const completedCount = projects.filter(p => p.status === 'completed').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sales Dashboard</h1>
          <p className="text-gray-600">Quản lý dự án và thương thảo với khách hàng</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium mb-1">Đang thương thảo</p>
                <p className="text-4xl font-bold">{negotiationCount}</p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                  <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium mb-1">Đang thực hiện</p>
                <p className="text-4xl font-bold">{activeCount}</p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">Hoàn thành</p>
                <p className="text-4xl font-bold">{completedCount}</p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-6">
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                filter === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Tất cả ({projects.length})
            </button>
            <button
              onClick={() => setFilter('negotiation')}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                filter === 'negotiation'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Thương thảo ({negotiationCount})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                filter === 'pending'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Chờ triển khai ({projects.filter(p => p.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilter('in_progress')}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                filter === 'in_progress'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Đang thực hiện ({activeCount})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                filter === 'completed'
                  ? 'bg-gray-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Hoàn thành ({completedCount})
            </button>
          </div>
        </div>

        {/* Projects List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="mt-4 text-lg text-gray-600">Chưa có dự án nào</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProjects.map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/sales/projects/${project.id}`}
                className="block bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{project.name}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{project.description}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(project.status)}`}>
                      {getStatusText(project.status)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPriorityColor(project.priority)}`}>
                      {getPriorityText(project.priority)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-600">{project.customer.company_name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-600">{project.customer.user_name}</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Tạo: {formatDate(project.created_at)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
