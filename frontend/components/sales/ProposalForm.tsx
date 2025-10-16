'use client'

import { useState, useEffect } from 'react'
import { proposalsAPI } from '@/lib/api'
import axios from 'axios'
import { getProposalTeamMembers } from '@/lib/default-team'

interface Phase {
  name: string
  days: number
  amount: number
  payment_percentage: number
  tasks: string
}

interface TeamMember {
  name: string
  role: string
  rating: number
}

interface Commitment {
  description: string
  penalty: string
}

interface ProposalFormProps {
  projectId: string
  onSuccess: () => void
  onCancel: () => void
}

export default function ProposalForm({ projectId, onSuccess, onCancel }: ProposalFormProps) {
  const [formData, setFormData] = useState({
    project_analysis: '',
    deposit_amount: '500000',
    estimated_implementation_days: '',
    currency: 'VND'
  })

  const [phases, setPhases] = useState<Phase[]>([
    { name: 'Giai đoạn 2', days: 0, amount: 0, payment_percentage: 100, tasks: '' }
  ])

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loadingTeam, setLoadingTeam] = useState(true)

  const [commitments] = useState<Commitment[]>([
    { description: 'Chậm 1-3 ngày', penalty: 'Giảm 10% tổng giá trị dự án' },
    { description: 'Chậm 4-7 ngày', penalty: 'Giảm 30% tổng giá trị dự án' },
    { description: 'Chậm 8-15 ngày', penalty: 'Giảm 50% tổng giá trị dự án' }
  ])

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Auto-load team members from service when component mounts
  useEffect(() => {
    loadTeamFromService()
  }, [projectId])

  const loadTeamFromService = async () => {
    try {
      setLoadingTeam(true)

      // Load default team members (mix of real and virtual staff)
      const defaultTeam = getProposalTeamMembers()

      // Always use the default 6-member team
      setTeamMembers(defaultTeam)

      setLoadingTeam(false)
    } catch (err) {
      console.error('Failed to load team:', err)
      // Fallback: use default team
      setTeamMembers(getProposalTeamMembers())
      setLoadingTeam(false)
    }
  }

  const addPhase = () => {
    const nextNumber = phases.length + 2
    setPhases([...phases, {
      name: `Giai đoạn ${nextNumber}`,
      days: 0,
      amount: 0,
      payment_percentage: 100,
      tasks: ''
    }])
  }

  const removePhase = (index: number) => {
    setPhases(phases.filter((_, i) => i !== index))
  }

  const updatePhase = (index: number, field: keyof Phase, value: string | number) => {
    const updated = [...phases]
    updated[index] = { ...updated[index], [field]: value }
    setPhases(updated)
  }

  const addTeamMember = () => {
    setTeamMembers([...teamMembers, { name: '', role: '', rating: 5 }])
  }

  const removeTeamMember = (index: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index))
  }

  const updateTeamMember = (index: number, field: keyof TeamMember, value: string | number) => {
    const updated = [...teamMembers]
    updated[index] = { ...updated[index], [field]: value }
    setTeamMembers(updated)
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const depositAmount = parseFloat(formData.deposit_amount)
    if (depositAmount < 500000) {
      setError('Số tiền cọc tối thiểu là 500,000 VND')
      setSubmitting(false)
      return
    }

    const implementationDays = parseInt(formData.estimated_implementation_days)
    if (!implementationDays || implementationDays < 1) {
      setError('Vui lòng nhập số ngày thực hiện dự tính (tối thiểu 1 ngày)')
      setSubmitting(false)
      return
    }

    try {
      // Calculate totals from phases
      const phasesTotal = phases.reduce((sum, phase) => sum + (phase.amount || 0), 0)
      const phasesDays = phases.reduce((sum, phase) => sum + (phase.days || 0), 0)
      const totalPrice = depositAmount + phasesTotal

      const payload = {
        project_analysis: formData.project_analysis,
        deposit_amount: depositAmount,
        total_price: totalPrice,
        estimated_duration_days: parseInt(formData.estimated_implementation_days) || phasesDays,
        currency: formData.currency,
        phases: phases.filter(p => p.amount > 0),
        team_members: teamMembers.filter(tm => tm.name && tm.role),
        deliverables: commitments
      }

      const response = await proposalsAPI.create(projectId, payload)
      const proposalId = response.data.id

      // Send the proposal (change status from DRAFT to SENT)
      await proposalsAPI.send(proposalId)

      // Send proposal notification to chat
      try {
        const token = localStorage.getItem('access_token')
        await axios.post(
          `http://localhost:8000/api/projects/${projectId}/messages`,
          {
            message: `📋 *Deal thương thảo mới đã được gửi*\n\n💰 Tổng giá trị: ${totalPrice.toLocaleString('vi-VN')} VND\n⏱️ Thời gian thực hiện: ${implementationDays} ngày\n\n👉 Vui lòng xem xét và phản hồi để chúng tôi triển khai dự án.`,
            message_type: 'system'
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        )
      } catch (chatErr) {
        console.error('Failed to send chat notification:', chatErr)
        // Continue even if chat fails
      }

      onSuccess()
    } catch (err: any) {
      console.error('Proposal creation error:', err)

      // Handle different error formats
      let errorMessage = 'Có lỗi xảy ra, vui lòng thử lại'

      if (err.response?.data) {
        const errorData = err.response.data

        // Django Ninja validation error format
        if (Array.isArray(errorData) && errorData.length > 0) {
          errorMessage = errorData.map((e: any) =>
            `${e.loc?.join?.(' > ') || 'Error'}: ${e.msg || JSON.stringify(e)}`
          ).join('\n')
        }
        // Simple string error
        else if (typeof errorData === 'string') {
          errorMessage = errorData
        }
        // Detail field
        else if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string'
            ? errorData.detail
            : JSON.stringify(errorData.detail)
        }
        // Fallback: stringify the error
        else {
          errorMessage = JSON.stringify(errorData)
        }
      }

      setError(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  // Calculate totals for display at bottom
  const getTotals = () => {
    const depositAmount = parseFloat(formData.deposit_amount) || 0
    const phasesTotal = phases.reduce((sum, phase) => sum + (phase.amount || 0), 0)
    const phasesDays = phases.reduce((sum, phase) => sum + (phase.days || 0), 0)
    return {
      totalPrice: depositAmount + phasesTotal,
      totalDays: phasesDays
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border-2 border-blue-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Tạo báo giá mới</h2>
        <button
          onClick={onCancel}
          type="button"
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <pre className="text-sm whitespace-pre-wrap font-sans">{error}</pre>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Analysis */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Chi tiết phân tích dự án từ Operis</h3>
          <textarea
            value={formData.project_analysis}
            onChange={(e) => setFormData({ ...formData, project_analysis: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={6}
            placeholder="Phân tích chi tiết về yêu cầu, giải pháp, công nghệ sử dụng..."
          />
        </div>

        {/* Deposit Section */}
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-300">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
              <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
            </svg>
            <h3 className="text-lg font-bold text-gray-900">Giai đoạn 1: Cọc thực hiện dự án</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số tiền cọc (tối thiểu 500,000 VND) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="500000"
                value={formData.deposit_amount}
                onChange={(e) => setFormData({ ...formData, deposit_amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="500000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số ngày thực hiện dự tính <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.estimated_implementation_days}
                onChange={(e) => setFormData({ ...formData, estimated_implementation_days: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="VD: 30"
              />
              <p className="text-xs text-gray-500 mt-1">Bắt đầu tính từ ngày xác nhận cọc thành công</p>
            </div>
          </div>
          <p className="text-sm text-yellow-700 mt-3">
            ⚠️ Sau khi khách hàng đồng ý báo giá, họ sẽ cần cọc để bắt đầu triển khai. Admin sẽ duyệt cọc.
          </p>
        </div>

        {/* Phases Section */}
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Các giai đoạn thực hiện</h3>
            <button
              type="button"
              onClick={addPhase}
              className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600"
            >
              + Thêm giai đoạn
            </button>
          </div>

          <div className="space-y-4">
            {phases.map((phase, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <input
                    type="text"
                    value={phase.name}
                    onChange={(e) => updatePhase(index, 'name', e.target.value)}
                    className="font-semibold text-gray-900 border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 px-2 py-1 outline-none"
                    placeholder="Tên giai đoạn"
                  />
                  {phases.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePhase(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Số ngày</label>
                    <input
                      type="number"
                      placeholder="VD: 15"
                      value={phase.days || ''}
                      onChange={(e) => updatePhase(index, 'days', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tổng tiền (VND)</label>
                    <input
                      type="number"
                      placeholder="VD: 10000000"
                      value={phase.amount || ''}
                      onChange={(e) => updatePhase(index, 'amount', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tỉ lệ thanh toán (%)</label>
                    <input
                      type="number"
                      placeholder="100"
                      min="0"
                      max="100"
                      value={phase.payment_percentage || ''}
                      onChange={(e) => updatePhase(index, 'payment_percentage', parseInt(e.target.value) || 100)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Chi tiết nhiệm vụ</label>
                  <textarea
                    placeholder="Mô tả chi tiết các nhiệm vụ cần hoàn thành trong giai đoạn này..."
                    value={phase.tasks}
                    onChange={(e) => updatePhase(index, 'tasks', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    rows={3}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Members Section - Auto-loaded */}
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Danh sách nhân sự thực hiện
              </h3>
              {loadingTeam && <p className="text-sm text-gray-600">⏳ Đang tải từ hệ thống...</p>}
              {!loadingTeam && teamMembers.length > 0 && (
                <p className="text-sm text-green-600">✓ Đã tải {teamMembers.length} nhân sự từ hệ thống</p>
              )}
            </div>
            <button
              type="button"
              onClick={addTeamMember}
              className="px-3 py-1 bg-purple-500 text-white rounded-lg text-sm font-semibold hover:bg-purple-600"
            >
              + Thêm nhân sự
            </button>
          </div>

          <div className="space-y-3">
            {teamMembers.map((member, index) => (
              <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                  <input
                    type="text"
                    placeholder="Họ tên"
                    value={member.name}
                    onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Chức vụ (VD: Backend Developer)"
                    value={member.role}
                    onChange={(e) => updateTeamMember(index, 'role', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <div className="flex items-center gap-2">
                    <select
                      value={member.rating}
                      onChange={(e) => updateTeamMember(index, 'rating', parseInt(e.target.value))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      {[1, 2, 3, 4, 5].map(r => (
                        <option key={r} value={r}>{r} ⭐</option>
                      ))}
                    </select>
                    {teamMembers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTeamMember(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Commitments Section - Fixed commitments */}
        <div className="bg-orange-50 rounded-lg p-4 border-2 border-orange-300">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Cam kết Operis về thời gian
            </h3>
            <p className="text-sm text-gray-700 mt-2">
              Chậm tiến độ sẽ bị <strong>giảm giá trị thanh toán</strong> theo cam kết bên dưới:
            </p>
          </div>

          <div className="space-y-2">
            {commitments.map((commitment, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border-l-4 border-orange-500">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 mb-1">{commitment.description}</p>
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {commitment.penalty}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-xs text-red-700 flex items-start gap-2">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>
                <strong>Lưu ý:</strong> Thời gian được tính từ ngày Admin xác nhận cọc thành công.
                Chậm quá 15 ngày sẽ được xem xét hoàn lại 100% cọc cho khách hàng.
              </span>
            </p>
          </div>
        </div>


        {/* Actions with totals display */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div>
              <p className="text-sm text-gray-600">Tổng giá trị dự án</p>
              <p className="text-2xl font-bold text-blue-600">{getTotals().totalPrice.toLocaleString('vi-VN')} VND</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng thời gian thực hiện</p>
              <p className="text-2xl font-bold text-indigo-600">{getTotals().totalDays} ngày</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || parseFloat(formData.deposit_amount) < 500000 || !formData.estimated_implementation_days}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Đang gửi...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span>Gửi deal thương thảo</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
