'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  FolderKanban,
  Users,
  Briefcase,
  DollarSign,
  BarChart3,
  Package,
  MessageSquare,
  ChevronDown
} from 'lucide-react'

interface DashboardHeaderProps {
  user: {
    full_name: string
    email: string
    role: string
  }
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    router.push('/login')
  }

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-800 border-red-300',
      sale: 'bg-blue-100 text-blue-800 border-blue-300',
      sales: 'bg-blue-100 text-blue-800 border-blue-300',
      dev: 'bg-green-100 text-green-800 border-green-300',
      developer: 'bg-green-100 text-green-800 border-green-300',
      customer: 'bg-purple-100 text-purple-800 border-purple-300',
    }
    return colors[role] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Quản trị viên',
      sale: 'Nhân viên kinh doanh',
      sales: 'Nhân viên kinh doanh',
      dev: 'Lập trình viên',
      developer: 'Lập trình viên',
      customer: 'Khách hàng',
    }
    return labels[role] || role
  }

  const navigationItems = user.role === 'admin' ? [
    { icon: Home, label: 'Tổng quan', href: '/dashboard/admin' },
    { icon: Users, label: 'Người dùng', href: '/dashboard/admin/users' },
    { icon: FolderKanban, label: 'Dự án', href: '/dashboard/admin/projects' },
    { icon: Package, label: 'Dịch vụ', href: '/dashboard/admin/services' },
    { icon: DollarSign, label: 'Tài chính', href: '/dashboard/admin/finance' },
    { icon: BarChart3, label: 'Báo cáo', href: '/dashboard/admin/reports' },
  ] : (user.role === 'sale' || user.role === 'sales') ? [
    { icon: Home, label: 'Tổng quan', href: '/dashboard/sales' },
    { icon: Users, label: 'Khách hàng', href: '/dashboard/sales/customers' },
    { icon: FolderKanban, label: 'Dự án', href: '/dashboard/sales/projects' },
    { icon: Briefcase, label: 'Đề xuất', href: '/dashboard/sales/proposals' },
  ] : (user.role === 'dev' || user.role === 'developer') ? [
    { icon: Home, label: 'Tổng quan', href: '/dashboard/developer' },
    { icon: FolderKanban, label: 'Dự án', href: '/dashboard/developer/projects' },
    { icon: MessageSquare, label: 'Chat', href: '/dashboard/developer/chat' },
  ] : user.role === 'customer' ? [
    { icon: Home, label: 'Tổng quan', href: '/dashboard/customer' },
    { icon: FolderKanban, label: 'Dự án của tôi', href: '/dashboard/customer/projects' },
    { icon: MessageSquare, label: 'Hỗ trợ', href: '/dashboard/customer/support' },
  ] : [
    { icon: Home, label: 'Tổng quan', href: '/dashboard' },
    { icon: FolderKanban, label: 'Dự án', href: '/dashboard/projects' },
  ]

  // Mock notifications
  const notifications = [
    { id: 1, title: 'Dự án mới được tạo', time: '5 phút trước', unread: true },
    { id: 2, title: 'Thanh toán đã được xác nhận', time: '1 giờ trước', unread: true },
    { id: 3, title: 'Feedback mới từ khách hàng', time: '2 giờ trước', unread: false },
  ]

  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto">
        {/* Main Header */}
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          {/* Logo and Brand */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">O</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  OPERIS
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">Software Management System</p>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navigationItems.map((item) => (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all font-medium"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3">
                    <h3 className="font-bold">Thông báo</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`px-4 py-3 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                          notif.unread ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {notif.unread && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                          )}
                          <div className="flex-1">
                            <p className={`text-sm ${notif.unread ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                              {notif.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-3 bg-gray-50 text-center">
                    <button className="text-sm text-blue-600 hover:text-blue-800 font-semibold">
                      Xem tất cả thông báo
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {user.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-gray-900">{user.full_name}</p>
                  <p className="text-xs text-gray-500">{getRoleLabel(user.role)}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-600 hidden md:block" />
              </button>

              {/* Profile Dropdown */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {user.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold">{user.full_name}</p>
                        <p className="text-sm text-white/80">{user.email}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getRoleColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </div>
                  </div>

                  <div className="py-2">
                    <button
                      onClick={() => router.push('/dashboard/profile')}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <User className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700">Thông tin cá nhân</span>
                    </button>
                    <button
                      onClick={() => router.push('/dashboard/settings')}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700">Cài đặt</span>
                    </button>
                  </div>

                  <div className="border-t py-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 transition-colors text-red-600"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm font-semibold">Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t bg-white">
            <nav className="px-4 py-3 space-y-1">
              {navigationItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => {
                    router.push(item.href)
                    setIsMobileMenuOpen(false)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all font-medium"
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
