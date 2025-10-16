'use client'

import { useState, useEffect } from 'react'
import { proposalsAPI } from '@/lib/api'

interface Proposal {
  id: string
  project_id: string
  created_by: {
    id: string
    full_name: string
    email: string
    role: string
  }
  project_analysis: string
  deposit_amount: number
  total_price: number
  currency: string
  estimated_duration_days: number
  phases: Array<{
    name: string
    days: number
    amount: number
    payment_percentage: number
    tasks: string
  }>
  team_members: Array<{
    name: string
    role: string
    rating: number
    age?: number
    experience_years?: number
  }>
  deliverables: Array<{
    description: string
    penalty: string
  }>
  status: string
  created_at: string
  updated_at: string
}

interface ProposalViewCustomerProps {
  projectId: string
}

export default function ProposalViewCustomer({ projectId }: ProposalViewCustomerProps) {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionMessage, setActionMessage] = useState('')

  useEffect(() => {
    loadProposals()
  }, [projectId])

  const loadProposals = async () => {
    try {
      const response = await proposalsAPI.list(projectId)
      console.log('📋 Proposals loaded:', response.data)
      console.log('📋 First proposal deposit_amount:', response.data[0]?.deposit_amount)
      setProposals(response.data)
      setLoading(false)
    } catch (err: any) {
      console.error('❌ Failed to load proposals:', err)
      setError('Không thể tải bản thương thảo')
      setLoading(false)
    }
  }

  const handleAccept = async (proposalId: string) => {
    if (!confirm('Bạn có chắc chắn đồng ý với bản thương thảo này?')) return

    setActionLoading(true)
    setActionMessage('')
    try {
      await proposalsAPI.accept(proposalId, {})
      setActionMessage('Đã chấp nhận bản thương thảo! Vui lòng thanh toán cọc để bắt đầu dự án.')
      loadProposals() // Reload to update status
    } catch (err: any) {
      console.error('Failed to accept proposal:', err)
      setActionMessage('Lỗi: ' + (err.response?.data?.detail || 'Không thể chấp nhận'))
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async (proposalId: string) => {
    const reason = prompt('Vui lòng nhập lý do yêu cầu chỉnh sửa:')
    if (!reason) return

    setActionLoading(true)
    setActionMessage('')
    try {
      await proposalsAPI.reject(proposalId, {
        rejection_reason: reason,
        customer_notes: reason
      })
      setActionMessage('Đã gửi yêu cầu chỉnh sửa. Sale sẽ liên hệ lại với bạn.')
      loadProposals()
    } catch (err: any) {
      console.error('Failed to reject proposal:', err)
      setActionMessage('Lỗi: ' + (err.response?.data?.detail || 'Không thể gửi yêu cầu'))
    } finally {
      setActionLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const generateQRCode = (proposal: Proposal) => {
    // VietQR format: https://img.vietqr.io/image/{BANK_ID}-{ACCOUNT_NUMBER}-{TEMPLATE}.png?amount={AMOUNT}&addInfo={INFO}
    const bankId = 'MB' // MB Bank - có thể config
    const accountNumber = '0123456789' // Số tài khoản công ty - có thể config
    const template = 'compact2'
    const amount = proposal.deposit_amount
    const info = `DU AN ${proposal.project_id.substring(0, 8).toUpperCase()}`

    return `https://img.vietqr.io/image/${bankId}-${accountNumber}-${template}.png?amount=${amount}&addInfo=${info}&accountName=CONG TY OPERIS`
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Đang tải bản thương thảo...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <svg className="w-12 h-12 text-red-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  if (proposals.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border-2 border-dashed border-gray-300 p-8 text-center">
        <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="text-lg font-bold text-gray-700 mb-2">Chưa có bản thương thảo</h3>
        <p className="text-sm text-gray-500">Sale sẽ gửi bản thương thảo chi tiết tại đây</p>
      </div>
    )
  }

  // Get the latest proposal
  const proposal = proposals[0]

  return (
    <div className="space-y-6">
      {/* Action Message */}
      {actionMessage && (
        <div className={`p-4 rounded-lg ${actionMessage.includes('Lỗi') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          <p className="font-medium">{actionMessage}</p>
        </div>
      )}

      {/* Proposal Card */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Bản Thương Thảo Dự Án</h2>
              {proposal.created_by && (
                <p className="text-blue-100">Từ: {proposal.created_by.full_name} ({proposal.created_by.role})</p>
              )}
              <p className="text-sm text-blue-100 mt-1">Ngày gửi: {new Date(proposal.created_at).toLocaleDateString('vi-VN')}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{formatCurrency(proposal.total_price)}</div>
              <div className="text-blue-100 text-sm">Tổng giá trị dự án</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Project Analysis */}
          {proposal.project_analysis && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Phân Tích Từ Operis AI
              </h3>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-gray-700 whitespace-pre-wrap">{proposal.project_analysis}</p>
              </div>
            </div>
          )}

          {/* Deposit & Duration */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Tiền cọc giai đoạn 1</div>
                  <div className="text-xl font-bold text-green-700">{formatCurrency(proposal.deposit_amount)}</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Thời gian thực hiện dự tính</div>
                  <div className="text-xl font-bold text-purple-700">{proposal.estimated_duration_days} ngày</div>
                  <div className="text-xs text-purple-600">Tính từ ngày xác nhận cọc</div>
                </div>
              </div>
            </div>
          </div>

          {/* Phases */}
          {proposal.phases && proposal.phases.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Các Giai Đoạn Thực Hiện</h3>
              <div className="space-y-3">
                {proposal.phases.map((phase, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </span>
                        <span className="font-bold text-gray-900">{phase.name}</span>
                      </div>
                      <span className="text-lg font-bold text-blue-600">{formatCurrency(phase.amount)}</span>
                    </div>
                    <div className="ml-10 text-sm text-gray-600">
                      <p><strong>Thời gian:</strong> {phase.days} ngày</p>
                      <p><strong>Thanh toán:</strong> {phase.payment_percentage}% khi hoàn thành</p>
                      {phase.tasks && <p className="mt-2"><strong>Công việc:</strong> {phase.tasks}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team Members */}
          {proposal.team_members && proposal.team_members.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Đội Ngũ Thực Hiện</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {proposal.team_members.map((member, index) => (
                  <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                        {member.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-600">{member.role}</div>
                        {member.age && member.experience_years && (
                          <div className="text-xs text-gray-500 mt-1">
                            {member.age} tuổi • {member.experience_years} năm KN
                          </div>
                        )}
                        <div className="flex items-center gap-1 mt-2">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-4 h-4 ${i < member.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Commitments */}
          {proposal.deliverables && proposal.deliverables.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Cam Kết Chất Lượng & Tiến Độ</h3>
              <div className="bg-orange-50 rounded-lg p-4 border-2 border-orange-200 space-y-2">
                {proposal.deliverables.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">{item.description}</span>
                      <span className="text-orange-600 ml-2">→ {item.penalty}</span>
                    </div>
                  </div>
                ))}
                <div className="mt-3 pt-3 border-t border-orange-200">
                  <p className="text-sm font-bold text-red-600">⚠️ Chậm quá 15 ngày sẽ hoàn lại 100% cọc</p>
                </div>
              </div>
            </div>
          )}

          {/* Status Actions */}
          <div className="pt-6 border-t border-gray-200">
            {proposal.status === 'sent' || proposal.status === 'viewed' ? (
              <div className="space-y-4">
                <p className="text-gray-700 mb-4">
                  Vui lòng xem xét kỹ bản thương thảo và cho chúng tôi biết quyết định của bạn:
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => handleAccept(proposal.id)}
                    disabled={actionLoading}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-lg font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    {actionLoading ? 'Đang xử lý...' : '✓ Đồng Ý Thương Thảo'}
                  </button>
                  <button
                    onClick={() => handleReject(proposal.id)}
                    disabled={actionLoading}
                    className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-4 rounded-lg font-bold text-lg hover:from-yellow-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    ↻ Yêu Cầu Chỉnh Sửa
                  </button>
                </div>
              </div>
            ) : proposal.status === 'accepted' ? (
              <div className="bg-green-50 rounded-lg p-6 border-2 border-green-300">
                <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Bạn Đã Đồng Ý Bản Thương Thảo
                </h3>

                <div className="bg-white rounded-lg p-6 mb-4">
                  <h4 className="font-bold text-gray-900 mb-3 text-center">Quét Mã QR Để Thanh Toán Cọc</h4>
                  <div className="flex justify-center mb-4">
                    <img
                      src={generateQRCode(proposal)}
                      alt="QR Code thanh toán"
                      className="w-64 h-64 border-4 border-gray-200 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><strong>Số tiền cần thanh toán:</strong> <span className="text-green-600 font-bold text-lg">{formatCurrency(proposal.deposit_amount)}</span></p>
                    <p><strong>Nội dung chuyển khoản:</strong> DU AN {proposal.project_id.substring(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-gray-500 italic">* Vui lòng giữ nguyên nội dung chuyển khoản để hệ thống tự động xác nhận</p>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h5 className="font-bold text-blue-900 mb-2">📋 Hướng dẫn thanh toán:</h5>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                    <li>Mở app ngân hàng của bạn và chọn chức năng quét QR</li>
                    <li>Quét mã QR ở trên, kiểm tra thông tin và xác nhận chuyển tiền</li>
                    <li>Sau khi chuyển tiền, admin sẽ xác nhận trong vòng 24h</li>
                    <li>Khi xác nhận thành công, dự án sẽ bắt đầu thực hiện</li>
                  </ol>
                </div>
              </div>
            ) : proposal.status === 'negotiating' ? (
              <div className="bg-yellow-50 rounded-lg p-6 border-2 border-yellow-300">
                <h3 className="text-xl font-bold text-yellow-800 mb-2 flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Đang Chờ Sale Chỉnh Sửa
                </h3>
                <p className="text-yellow-700">
                  Yêu cầu chỉnh sửa của bạn đã được gửi. Sale sẽ cập nhật bản thương thảo mới và liên hệ lại sớm nhất.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
