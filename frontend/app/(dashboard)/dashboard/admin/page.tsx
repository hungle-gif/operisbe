'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useRoleProtection } from '@/hooks/useRoleProtection'

export default function AdminDashboard() {
  const router = useRouter()

  // 🔒 PROTECTION: Only admin can access this dashboard
  useRoleProtection({ allowedRoles: ['admin'] })

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    totalServices: 0,
    totalCustomers: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('No token found')
        setLoading(false)
        return
      }

      // Load users count
      try {
        const usersResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users?page=1&page_size=100`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (usersResponse.ok) {
          const users = await usersResponse.json()
          setStats(prev => ({
            ...prev,
            totalUsers: users.length,
            totalCustomers: users.filter((u: any) => u.role === 'customer').length
          }))
        }
      } catch (err) {
        console.error('Failed to load users:', err)
      }

      // Load projects count
      try {
        const projectsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/all`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (projectsResponse.ok) {
          const projects = await projectsResponse.json()
          setStats(prev => ({ ...prev, totalProjects: projects.length }))
        }
      } catch (err) {
        console.error('Failed to load projects:', err)
      }

      // Load services count
      try {
        const servicesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (servicesResponse.ok) {
          const services = await servicesResponse.json()
          setStats(prev => ({ ...prev, totalServices: services.length }))
        }
      } catch (err) {
        console.error('Failed to load services:', err)
      }
    } catch (err) {
      console.error('Failed to load stats:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Stats Cards */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Tổng người dùng</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalUsers}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Tổng dự án</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalProjects}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Tổng dịch vụ</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalServices}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Tổng khách hàng</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalCustomers}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Thao tác nhanh</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <button
            onClick={() => router.push('/dashboard/admin/users')}
            className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left"
          >
            <h3 className="font-semibold text-gray-900">Quản lý người dùng</h3>
            <p className="text-sm text-gray-600 mt-1">Thêm, sửa, xóa người dùng</p>
          </button>
          <button
            onClick={() => router.push('/dashboard/admin/projects')}
            className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left"
          >
            <h3 className="font-semibold text-gray-900">Quản lý dự án</h3>
            <p className="text-sm text-gray-600 mt-1">Xem và quản lý tất cả dự án</p>
          </button>
          <button
            onClick={() => router.push('/dashboard/admin/reports')}
            className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left"
          >
            <h3 className="font-semibold text-gray-900">Báo cáo</h3>
            <p className="text-sm text-gray-600 mt-1">Xem báo cáo và thống kê</p>
          </button>
          <button
            onClick={() => router.push('/dashboard/admin/finance')}
            className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left"
          >
            <h3 className="font-semibold text-gray-900">Tài chính</h3>
            <p className="text-sm text-gray-600 mt-1">Quản lý tài chính và doanh thu</p>
          </button>
          <button
            onClick={() => router.push('/dashboard/admin/transactions')}
            className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left"
          >
            <h3 className="font-semibold text-gray-900">Giao dịch</h3>
            <p className="text-sm text-gray-600 mt-1">Quản lý giao dịch thanh toán</p>
          </button>
        </div>
      </div>
    </div>
  )
}
