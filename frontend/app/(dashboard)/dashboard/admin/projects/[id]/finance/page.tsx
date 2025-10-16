'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

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

interface FinancialSummary {
  project_id: string
  project_name: string
  project_status: string
  customer: {
    id: string
    name: string
    email: string
  }
  financial_summary: {
    contract_value: number
    total_received: number
    total_refunded: number
    net_received: number
    pending_amount: number
  }
  deposit: {
    amount: number
    paid: boolean
    paid_at: string | null
  }
  phases: Array<{
    phase_index: number
    phase_name: string
    phase_amount: number
    paid_amount: number
    completed: boolean
    payment_approved: boolean
    transaction_count: number
  }>
  transaction_summary: {
    total_transactions: number
    completed: number
    pending: number
    failed: number
  }
}

export default function ProjectFinancePage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    transaction_type: 'deposit',
    amount: '',
    phase_index: '',
    payment_method: 'bank_transfer',
    transaction_reference: '',
    description: ''
  })

  useEffect(() => {
    if (projectId) {
      loadFinancialData()
    }
  }, [projectId])

  const loadFinancialData = async () => {
    try {
      // Load financial summary
      const summaryResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/transactions/projects/${projectId}/financial-summary`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      )
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json()
        setSummary(summaryData)
      }

      // Load transactions
      const transactionsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/transactions/projects/${projectId}/transactions`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      )
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json()
        setTransactions(transactionsData)
      }
    } catch (err) {
      console.error('Failed to load financial data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePayment = async () => {
    if (!paymentForm.amount) {
      alert('⚠️ Vui lòng nhập số tiền')
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
          project_id: projectId,
          transaction_type: paymentForm.transaction_type,
          amount: parseFloat(paymentForm.amount),
          phase_index: paymentForm.phase_index ? parseInt(paymentForm.phase_index) : null,
          payment_method: paymentForm.payment_method,
          transaction_reference: paymentForm.transaction_reference || null,
          description: paymentForm.description || null
        })
      })

      if (response.ok) {
        alert('✅ Đã ghi nhận thanh toán thành công')
        setShowPaymentModal(false)
        setPaymentForm({
          transaction_type: 'deposit',
          amount: '',
          phase_index: '',
          payment_method: 'bank_transfer',
          transaction_reference: '',
          description: ''
        })
        loadFinancialData()
      } else {
        const error = await response.json()
        alert(`❌ Lỗi: ${error.detail || 'Không thể tạo giao dịch'}`)
      }
    } catch (err) {
      console.error('Failed to create payment:', err)
      alert('❌ Lỗi kết nối server')
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

  if (!summary) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-xl text-gray-600">Không tìm thấy thông tin tài chính</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Quay Lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-4 text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Quay lại
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Quản Lý Tài Chính: {summary.project_name}
              </h1>
              <p className="text-gray-600">
                Khách hàng: {summary.customer.name} ({summary.customer.email})
              </p>
            </div>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              + Ghi Nhận Thanh Toán
            </button>
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Contract Value */}
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
            <h3 className="text-sm font-medium opacity-90 mb-2">Giá Trị Hợp Đồng</h3>
            <p className="text-3xl font-bold">{formatCurrency(summary.financial_summary.contract_value)}</p>
          </div>

          {/* Total Received */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
            <h3 className="text-sm font-medium opacity-90 mb-2">Đã Thu</h3>
            <p className="text-3xl font-bold">{formatCurrency(summary.financial_summary.total_received)}</p>
          </div>

          {/* Total Refunded */}
          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
            <h3 className="text-sm font-medium opacity-90 mb-2">Đã Hoàn</h3>
            <p className="text-3xl font-bold">{formatCurrency(summary.financial_summary.total_refunded)}</p>
          </div>

          {/* Pending Amount */}
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-6 text-white shadow-lg">
            <h3 className="text-sm font-medium opacity-90 mb-2">Còn Lại</h3>
            <p className="text-3xl font-bold">{formatCurrency(summary.financial_summary.pending_amount)}</p>
          </div>
        </div>

        {/* Deposit Status */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Tiền Đặt Cọc</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(summary.deposit.amount)}</p>
              <p className="text-sm text-gray-500 mt-1">
                {summary.deposit.paid_at ? `Đã thanh toán: ${formatDate(summary.deposit.paid_at)}` : 'Chưa thanh toán'}
              </p>
            </div>
            <div>
              {summary.deposit.paid ? (
                <span className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg font-semibold">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Đã Thanh Toán
                </span>
              ) : (
                <span className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg font-semibold">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Chưa Thanh Toán
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Phases Breakdown */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Chi Tiết Giai Đoạn</h2>
          <div className="space-y-4">
            {summary.phases.map((phase) => (
              <div key={phase.phase_index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900">
                      Giai Đoạn {phase.phase_index + 1}: {phase.phase_name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {phase.transaction_count} giao dịch
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {phase.completed && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                        Hoàn thành
                      </span>
                    )}
                    {phase.payment_approved && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                        Đã thanh toán
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-gray-500">Giá trị giai đoạn</p>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(phase.phase_amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Đã thanh toán</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(phase.paid_amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Còn lại</p>
                    <p className="text-lg font-bold text-orange-600">
                      {formatCurrency(phase.phase_amount - phase.paid_amount)}
                    </p>
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>Tiến độ thanh toán</span>
                    <span>{Math.round((phase.paid_amount / phase.phase_amount) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-600 h-3 rounded-full transition-all"
                      style={{ width: `${Math.min((phase.paid_amount / phase.phase_amount) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction Statistics */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Thống Kê Giao Dịch</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Tổng giao dịch</p>
              <p className="text-3xl font-bold text-gray-900">{summary.transaction_summary.total_transactions}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Hoàn thành</p>
              <p className="text-3xl font-bold text-green-600">{summary.transaction_summary.completed}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Chờ duyệt</p>
              <p className="text-3xl font-bold text-yellow-600">{summary.transaction_summary.pending}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Thất bại</p>
              <p className="text-3xl font-bold text-red-600">{summary.transaction_summary.failed}</p>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">Lịch Sử Giao Dịch</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-4 px-4 font-semibold text-gray-600">Loại</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-600">Giai Đoạn</th>
                  <th className="text-right py-4 px-4 font-semibold text-gray-600">Số Tiền</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-600">Phương Thức</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-600">Trạng Thái</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-600">Ngày</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-600">Người Xử Lý</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      Chưa có giao dịch nào
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b hover:bg-gray-50">
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
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {transaction.payment_method}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(transaction.status)}`}>
                          {getStatusLabel(transaction.status)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {formatDate(transaction.created_at)}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {transaction.processed_by ? transaction.processed_by.name : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Ghi Nhận Thanh Toán</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loại Thanh Toán *</label>
                <select
                  value={paymentForm.transaction_type}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transaction_type: e.target.value })}
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
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ví dụ: 10000000"
                />
              </div>

              {paymentForm.transaction_type === 'phase' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Giai Đoạn *</label>
                  <select
                    value={paymentForm.phase_index}
                    onChange={(e) => setPaymentForm({ ...paymentForm, phase_index: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Chọn giai đoạn</option>
                    {summary.phases.map((phase) => (
                      <option key={phase.phase_index} value={phase.phase_index}>
                        Giai đoạn {phase.phase_index + 1}: {phase.phase_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phương Thức Thanh Toán</label>
                <select
                  value={paymentForm.payment_method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
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
                  value={paymentForm.transaction_reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transaction_reference: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Mã giao dịch ngân hàng, số hoá đơn..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ghi Chú</label>
                <textarea
                  value={paymentForm.description}
                  onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Ghi chú về thanh toán..."
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleCreatePayment}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Ghi Nhận Thanh Toán
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
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
