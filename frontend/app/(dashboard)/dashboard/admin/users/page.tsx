'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRoleProtection } from '@/hooks/useRoleProtection'

interface User {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  created_at: string
}

export default function AdminUsersPage() {
  const router = useRouter()

  // 🔒 PROTECTION: Only admin can access user management
  useRoleProtection({ allowedRoles: ['admin'] })

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Create user form
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'customer'
  })

  // Edit user form
  const [editForm, setEditForm] = useState({
    full_name: '',
    role: '',
    is_active: true
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users?page=1&page_size=100`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (err) {
      console.error('Failed to load users:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async () => {
    if (!createForm.email || !createForm.password || !createForm.full_name) {
      alert('⚠️ Vui lòng điền đầy đủ thông tin')
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createForm)
      })

      if (response.ok) {
        alert('✅ Tạo người dùng thành công')
        setShowCreateModal(false)
        setCreateForm({ email: '', password: '', full_name: '', role: 'customer' })
        loadUsers()
      } else {
        const error = await response.json()
        alert(`❌ Lỗi: ${error.detail || 'Không thể tạo người dùng'}`)
      }
    } catch (err) {
      console.error('Failed to create user:', err)
      alert('❌ Lỗi kết nối server')
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser || !editForm.full_name) {
      alert('⚠️ Vui lòng điền đầy đủ thông tin')
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      })

      if (response.ok) {
        alert('✅ Cập nhật người dùng thành công')
        setShowEditModal(false)
        setSelectedUser(null)
        loadUsers()
      } else {
        const error = await response.json()
        alert(`❌ Lỗi: ${error.detail || 'Không thể cập nhật người dùng'}`)
      }
    } catch (err) {
      console.error('Failed to update user:', err)
      alert('❌ Lỗi kết nối server')
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Bạn có chắc muốn xóa người dùng "${userName}"?`)) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        alert('✅ Xóa người dùng thành công')
        loadUsers()
      } else {
        const error = await response.json()
        alert(`❌ Lỗi: ${error.detail || 'Không thể xóa người dùng'}`)
      }
    } catch (err) {
      console.error('Failed to delete user:', err)
      alert('❌ Lỗi kết nối server')
    }
  }

  const openEditModal = (user: User) => {
    setSelectedUser(user)
    setEditForm({
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active
    })
    setShowEditModal(true)
  }

  const getRoleBadge = (role: string) => {
    const styles = {
      admin: 'bg-red-100 text-red-800',
      sales: 'bg-blue-100 text-blue-800',
      developer: 'bg-green-100 text-green-800',
      customer: 'bg-purple-100 text-purple-800'
    }
    return styles[role as keyof typeof styles] || 'bg-gray-100 text-gray-800'
  }

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: 'Quản trị viên',
      sales: 'Nhân viên bán hàng',
      developer: 'Lập trình viên',
      customer: 'Khách hàng'
    }
    return labels[role as keyof typeof labels] || role
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản Lý Người Dùng</h1>
            <p className="text-gray-600">Tổng số: {users.length} người dùng</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            + Thêm Người Dùng
          </button>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-4 px-4 font-semibold text-gray-600">Tên</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-600">Email</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-600">Vai trò</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-600">Trạng thái</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-600">Ngày tạo</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-600">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      Không có người dùng nào
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4 font-medium text-gray-900">{user.full_name}</td>
                      <td className="py-4 px-4 text-gray-600">{user.email}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getRoleBadge(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {user.is_active ? (
                          <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-semibold">
                            <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                            Ngừng hoạt động
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-gray-600">{formatDate(user.created_at)}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.full_name)}
                            className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Thêm Người Dùng Mới</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu *</label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên *</label>
                <input
                  type="text"
                  value={createForm.full_name}
                  onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Nguyễn Văn A"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vai trò *</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="customer">Khách hàng</option>
                  <option value="sales">Nhân viên bán hàng</option>
                  <option value="developer">Lập trình viên</option>
                  <option value="admin">Quản trị viên</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleCreateUser}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Tạo Người Dùng
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Chỉnh Sửa Người Dùng</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={selectedUser.email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">Email không thể thay đổi</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên *</label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vai trò *</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="customer">Khách hàng</option>
                  <option value="sales">Nhân viên bán hàng</option>
                  <option value="developer">Lập trình viên</option>
                  <option value="admin">Quản trị viên</option>
                </select>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editForm.is_active}
                    onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Tài khoản đang hoạt động</span>
                </label>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleEditUser}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Cập Nhật
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
