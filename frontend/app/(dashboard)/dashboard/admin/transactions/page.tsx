'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Transaction {
  id: string
  project_id: string
  project_name: string
  customer_name: string
  customer_email: string
  transaction_type: string
  status: string
  amount: number
  phase_index: number | null
  phase_name: string | null
  payment_method: string
  transaction_reference: string | null
  description: string | null
  created_at: string
  completed_at: string | null
  processed_by: {
    id: string
    name: string
  } | null
}

export default function AdminTransactionsPage() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [projectFilter, setProjectFilter] = useState<string>('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Create transaction form state
  const [createForm, setCreateForm] = useState({
    project_id: '',
    transaction_type: 'deposit',
    amount: '',
    phase_index: '',
    payment_method: 'bank_transfer',
    transaction_reference: '',
    description: ''
  })

  useEffect(() => {
    loadTransactions()
  }, [statusFilter, projectFilter])

  const loadTransactions = async () => {
    try {
      let url = `${process.env.NEXT_PUBLIC_API_URL}/api/transactions/transactions`
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (projectFilter) params.append('project_id', projectFilter)
      if (params.toString()) url += `?${params.toString()}`

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setTransactions(data)
      }
    } catch (err) {
      console.error('Failed to load transactions:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTransaction = async () => {
    if (!createForm.project_id || !createForm.amount) {
      alert('⚠️ Vui lòng nhập Project ID và số tiền')
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transactions/transactions/manual`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_id: createForm.project_id,
          transaction_type: createForm.transaction_type,
          amount: parseFloat(createForm.amount),
          phase_index: createForm.phase_index ? parseInt(createForm.phase_index) : null,
          payment_method: createForm.payment_method,
          transaction_reference: createForm.transaction_reference || null,
          description: createForm.description || null
        })
      })

      if (response.ok) {
        alert('✅ Đã tạo giao dịch thành công')
        setShowCreateModal(false)
        setCreateForm({
          project_id: '',
          transaction_type: 'deposit',
          amount: '',
          phase_index: '',
          payment_method: 'bank_transfer',
          transaction_reference: '',
          description: ''
        })
        loadTransactions()
      } else {
        const error = await response.json()
        alert(`❌ Lỗi: ${error.detail || 'Không thể tạo giao dịch'}`)
      }
    } catch (err) {
      console.error('Failed to create transaction:', err)
      alert('❌ Lỗi kết nối server')
    }
  }

  const handleApproveTransaction = async (transactionId: string) => {
    if (!confirm('Xác nhận duyệt giao dịch này?')) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transactions/transactions/${transactionId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        alert('✅ Đã duyệt giao dịch')
        loadTransactions()
      } else {
        const error = await response.json()
        alert(`❌ Lỗi: ${error.detail}`)
      }
    } catch (err) {
      console.error('Failed to approve transaction:', err)
    }
  }

  const handleRejectTransaction = async (transactionId: string) => {
    const reason = prompt('Lý do từ chối:')
    if (!reason) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transactions/transactions/${transactionId}/reject?reason=${encodeURIComponent(reason)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        alert('✅ Đã từ chối giao dịch')
        loadTransactions()
      } else {
        const error = await response.json()
        alert(`❌ Lỗi: ${error.detail}`)
      }
    } catch (err) {
      console.error('Failed to reject transaction:', err)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN')
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    }
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'
  }

  const getTypeBadge = (type: string) => {
    const styles = {
      deposit: 'bg-blue-100 text-blue-800',
      phase: 'bg-purple-100 text-purple-800',
      refund: 'bg-orange-100 text-orange-800',
      adjustment: 'bg-indigo-100 text-indigo-800'
    }
    return styles[type as keyof typeof styles] || 'bg-gray-100 text-gray-800'
  }

  const getTypeLabel = (type: string) => {
    const labels = {
      deposit: 'Đặt cọc',
      phase: 'Giai đoạn',
      refund: 'Hoàn tiền',
      adjustment: 'Điều chỉnh'
    }
    return labels[type as keyof typeof labels] || type
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'Chờ duyệt',
      completed: 'Hoàn thành',
      failed: 'Thất bại',
      cancelled: 'Đã hủy'
    }
    return labels[status as keyof typeof labels] || status
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản Lý Giao Dịch</h1>
            <p className="text-gray-600">Quản lý tất cả giao dịch thanh toán của dự án</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            + Tạo Giao Dịch Thủ Công
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả</option>
                <option value="pending">Chờ duyệt</option>
                <option value="completed">Hoàn thành</option>
                <option value="failed">Thất bại</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project ID</label>
              <input
                type="text"
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                placeholder="Nhập Project ID"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setStatusFilter('')
                  setProjectFilter('')
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Xóa Bộ Lọc
              </button>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-4 px-4 font-semibold text-gray-600">Dự Án</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-600">Khách Hàng</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-600">Loại</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-600">Giai Đoạn</th>
                  <th className="text-right py-4 px-4 font-semibold text-gray-600">Số Tiền</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-600">Trạng Thái</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-600">Ngày Tạo</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-600">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-500">
                      Không có giao dịch nào
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <button
                          onClick={() => router.push(`/dashboard/admin/projects/${transaction.project_id}`)}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {transaction.project_name}
                        </button>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{transaction.customer_name}</div>
                          <div className="text-sm text-gray-500">{transaction.customer_email}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getTypeBadge(transaction.transaction_type)}`}>
                          {getTypeLabel(transaction.transaction_type)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {transaction.phase_index !== null ? (
                          <div>
                            <div className="font-medium">Giai đoạn {transaction.phase_index + 1}</div>
                            {transaction.phase_name && (
                              <div className="text-sm text-gray-500">{transaction.phase_name}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-gray-900">
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(transaction.status)}`}>
                          {getStatusLabel(transaction.status)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {formatDate(transaction.created_at)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
                          {transaction.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApproveTransaction(transaction.id)}
                                className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700"
                              >
                                Duyệt
                              </button>
                              <button
                                onClick={() => handleRejectTransaction(transaction.id)}
                                className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700"
                              >
                                Từ Chối
                              </button>
                            </>
                          )}
                          {transaction.status !== 'pending' && (
                            <button
                              onClick={() => router.push(`/dashboard/admin/projects/${transaction.project_id}/finance`)}
                              className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
                            >
                              Chi Tiết
                            </button>
                          )}
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

      {/* Create Transaction Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Tạo Giao Dịch Thủ Công</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project ID *</label>
                <input
                  type="text"
                  value={createForm.project_id}
                  onChange={(e) => setCreateForm({ ...createForm, project_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="UUID của dự án"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loại Giao Dịch *</label>
                <select
                  value={createForm.transaction_type}
                  onChange={(e) => setCreateForm({ ...createForm, transaction_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="deposit">Đặt cọc</option>
                  <option value="phase">Thanh toán giai đoạn</option>
                  <option value="refund">Hoàn tiền</option>
                  <option value="adjustment">Điều chỉnh</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Số Tiền (VND) *</label>
                <input
                  type="number"
                  value={createForm.amount}
                  onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ví dụ: 10000000"
                />
              </div>

              {createForm.transaction_type === 'phase' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Giai Đoạn (Index)</label>
                  <input
                    type="number"
                    value={createForm.phase_index}
                    onChange={(e) => setCreateForm({ ...createForm, phase_index: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ví dụ: 0 (giai đoạn 1), 1 (giai đoạn 2)"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phương Thức Thanh Toán</label>
                <select
                  value={createForm.payment_method}
                  onChange={(e) => setCreateForm({ ...createForm, payment_method: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="bank_transfer">Chuyển khoản</option>
                  <option value="cash">Tiền mặt</option>
                  <option value="credit_card">Thẻ tín dụng</option>
                  <option value="other">Khác</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mã Tham Chiếu</label>
                <input
                  type="text"
                  value={createForm.transaction_reference}
                  onChange={(e) => setCreateForm({ ...createForm, transaction_reference: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Mã giao dịch ngân hàng, số hoá đơn..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ghi Chú</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Ghi chú về giao dịch..."
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleCreateTransaction}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Tạo Giao Dịch
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
    </div>
  )
}
