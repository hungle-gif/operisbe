'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Dashboard {
  summary: {
    total_revenue: number
    total_deposit: number
    total_phase_payments: number
    pending_revenue: number
    total_projects: number
    completed_projects: number
  }
  deposit_status: {
    total_projects: number
    paid: number
    pending: number
    paid_rate: number
    total_deposit_amount: number
    collected_deposit: number
  }
  phase_payment_status: {
    total_phases: number
    completed_phases: number
    paid_phases: number
    pending_payment: number
    completion_rate: number
    payment_rate: number
    total_phase_value: number
    collected_phase_payment: number
  }
  top_customers: Array<{
    customer_id: string
    customer_name: string
    customer_email: string
    total_projects: number
    total_revenue: number
  }>
}

interface Project {
  id: string
  name: string
  status: string
  budget: number
  created_at: string
}

export default function AdminReportsPage() {
  const router = useRouter()
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'month' | 'quarter' | 'year'>('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token')

      // Load finance dashboard
      const dashboardResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/finance/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (dashboardResponse.ok) {
        const data = await dashboardResponse.json()
        setDashboard(data)
      }

      // Load all projects
      const projectsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (projectsResponse.ok) {
        const data = await projectsResponse.json()
        setProjects(data)
      }
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const getRecentProjects = () => {
    return projects
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
  }

  const getProjectsByStatus = () => {
    const statusCounts: { [key: string]: number } = {}
    projects.forEach(p => {
      statusCounts[p.status] = (statusCounts[p.status] || 0) + 1
    })
    return statusCounts
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const statusCounts = getProjectsByStatus()

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Báo Cáo & Thống Kê</h1>
          <p className="text-gray-600">Tổng quan về hoạt động kinh doanh</p>
        </div>

        {/* Financial Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Tổng Quan Tài Chính</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium opacity-90">Tổng Doanh Thu</h3>
                <svg className="w-8 h-8 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-3xl font-bold">{formatCurrency(dashboard?.summary.total_revenue || 0)}</p>
              <p className="text-sm mt-2 opacity-90">
                Từ {dashboard?.summary.completed_projects || 0} dự án hoàn thành
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium opacity-90">Tiền Đặt Cọc</h3>
                <svg className="w-8 h-8 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-3xl font-bold">{formatCurrency(dashboard?.summary.total_deposit || 0)}</p>
              <p className="text-sm mt-2 opacity-90">
                Tỷ lệ: {formatPercent(dashboard?.deposit_status.paid_rate || 0)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium opacity-90">Thanh Toán Giai Đoạn</h3>
                <svg className="w-8 h-8 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-3xl font-bold">{formatCurrency(dashboard?.summary.total_phase_payments || 0)}</p>
              <p className="text-sm mt-2 opacity-90">
                Tỷ lệ: {formatPercent(dashboard?.phase_payment_status.payment_rate || 0)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium opacity-90">Doanh Thu Chờ Thu</h3>
                <svg className="w-8 h-8 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-3xl font-bold">{formatCurrency(dashboard?.summary.pending_revenue || 0)}</p>
              <p className="text-sm mt-2 opacity-90">
                Từ {dashboard?.summary.total_projects - (dashboard?.summary.completed_projects || 0) || 0} dự án đang chạy
              </p>
            </div>
          </div>
        </div>

        {/* Project Status */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Trạng Thái Dự Án</h2>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-yellow-600">{statusCounts['planning'] || 0}</div>
                <div className="text-sm text-gray-600 mt-2">Lên kế hoạch</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600">{statusCounts['in_progress'] || 0}</div>
                <div className="text-sm text-gray-600 mt-2">Đang thực hiện</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600">{statusCounts['completed'] || 0}</div>
                <div className="text-sm text-gray-600 mt-2">Hoàn thành</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-600">{statusCounts['on_hold'] || 0}</div>
                <div className="text-sm text-gray-600 mt-2">Tạm dừng</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-red-600">{statusCounts['cancelled'] || 0}</div>
                <div className="text-sm text-gray-600 mt-2">Đã hủy</div>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="mt-6">
              <div className="flex h-4 rounded-full overflow-hidden">
                {Object.keys(statusCounts).length > 0 && (
                  <>
                    <div
                      className="bg-yellow-500"
                      style={{ width: `${((statusCounts['planning'] || 0) / projects.length) * 100}%` }}
                    />
                    <div
                      className="bg-blue-500"
                      style={{ width: `${((statusCounts['in_progress'] || 0) / projects.length) * 100}%` }}
                    />
                    <div
                      className="bg-green-500"
                      style={{ width: `${((statusCounts['completed'] || 0) / projects.length) * 100}%` }}
                    />
                    <div
                      className="bg-orange-500"
                      style={{ width: `${((statusCounts['on_hold'] || 0) / projects.length) * 100}%` }}
                    />
                    <div
                      className="bg-red-500"
                      style={{ width: `${((statusCounts['cancelled'] || 0) / projects.length) * 100}%` }}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Top Customers */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Khách Hàng Hàng Đầu</h2>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-4 px-4 font-semibold text-gray-600">Hạng</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-600">Khách Hàng</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-600">Email</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-600">Số Dự Án</th>
                  <th className="text-right py-4 px-4 font-semibold text-gray-600">Tổng Doanh Thu</th>
                </tr>
              </thead>
              <tbody>
                {dashboard?.top_customers && dashboard.top_customers.length > 0 ? (
                  dashboard.top_customers.map((customer, index) => (
                    <tr key={customer.customer_id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white font-bold">
                          {index + 1}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-medium text-gray-900">{customer.customer_name}</td>
                      <td className="py-4 px-4 text-gray-600">{customer.customer_email}</td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                          {customer.total_projects}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-green-600">
                        {formatCurrency(customer.total_revenue)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                      Chưa có dữ liệu khách hàng
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Projects */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Dự Án Gần Đây</h2>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-4 px-4 font-semibold text-gray-600">Tên Dự Án</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-600">Trạng Thái</th>
                  <th className="text-right py-4 px-4 font-semibold text-gray-600">Ngân Sách</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-600">Ngày Tạo</th>
                </tr>
              </thead>
              <tbody>
                {getRecentProjects().map((project) => (
                  <tr key={project.id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <button
                        onClick={() => router.push(`/dashboard/admin/projects/${project.id}`)}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {project.name}
                      </button>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        project.status === 'completed' ? 'bg-green-100 text-green-800' :
                        project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        project.status === 'planning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-gray-900">
                      {formatCurrency(project.budget)}
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {new Date(project.created_at).toLocaleDateString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => router.push('/dashboard/admin/finance')}
            className="bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition-shadow"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-2">Tài Chính Chi Tiết</h3>
            <p className="text-gray-600 text-sm">Xem báo cáo tài chính chi tiết và thống kê doanh thu</p>
          </button>
          <button
            onClick={() => router.push('/dashboard/admin/transactions')}
            className="bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition-shadow"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-2">Quản Lý Giao Dịch</h3>
            <p className="text-gray-600 text-sm">Xem và quản lý tất cả giao dịch thanh toán</p>
          </button>
          <button
            onClick={() => router.push('/dashboard/admin/projects')}
            className="bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl transition-shadow"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-2">Quản Lý Dự Án</h3>
            <p className="text-gray-600 text-sm">Xem và quản lý tất cả dự án trong hệ thống</p>
          </button>
        </div>
      </div>
    </div>
  )
}
