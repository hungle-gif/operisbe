'use client'

import { useState, useEffect } from 'react'
import { proposalsAPI, projectsAPI } from '@/lib/api'
import ApprovalModal from './ApprovalModal'
// React Icons
import {
  FiCheckCircle, FiXCircle, FiEdit2, FiSave, FiTrash2, FiPlus,
  FiCreditCard, FiLock, FiClock, FiDollarSign, FiUsers,
  FiAlertCircle, FiCheck, FiX
} from 'react-icons/fi'
import { AiFillStar, AiOutlineStar } from 'react-icons/ai'
import { BsBuilding, BsClock } from 'react-icons/bs'
import { MdPayment, MdPending } from 'react-icons/md'

interface Project {
  id: string
  name: string
  description: string
  status: string
  priority: string
  customer: {
    id: string
    company_name: string
    phone: string
    email: string
  }
  project_manager?: {
    id: string
    full_name: string
    email: string
    role: string
  }
  start_date?: string
  end_date?: string
  estimated_hours?: number
  budget?: number
  created_at: string
  updated_at: string
}

interface Proposal {
  id?: string
  project_id: string
  project_analysis: string
  deposit_amount: number
  deposit_paid?: boolean
  deposit_paid_at?: string
  payment_submitted?: boolean
  payment_submitted_at?: string
  total_price: number
  estimated_duration_days: number
  phases: Array<{
    name: string
    days: number
    amount: number
    payment_percentage: number
    tasks: string
    // Payment tracking fields
    completed?: boolean
    completed_at?: string
    completed_by?: string
    payment_submitted?: boolean
    payment_submitted_at?: string
    payment_approved?: boolean
    payment_approved_at?: string
    payment_approved_by?: string
    payment_proof?: any
  }>
  team_members: Array<{
    name: string
    role: string
    rating: number
  }>
  deliverables: Array<{
    description: string
    penalty: string
  }>
  status?: string
  customer_approvals?: {
    analysis: boolean
    deposit: boolean
    phases: boolean
    team: boolean
    commitments: boolean
  }
}

interface ProposalInlineProps {
  projectId: string
  userRole: 'sale' | 'customer'
}

export default function ProposalInline({ projectId, userRole }: ProposalInlineProps) {
  const [project, setProject] = useState<Project | null>(null)
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [submittingPayment, setSubmittingPayment] = useState(false)
  const [showPhasePaymentModal, setShowPhasePaymentModal] = useState<number | null>(null)
  const [processingPhase, setProcessingPhase] = useState(false)

  // Approval modal state
  const [showApprovalModal, setShowApprovalModal] = useState<string | null>(null)
  const [pendingApproval, setPendingApproval] = useState<keyof typeof approvals | null>(null)

  // Form states
  const [analysis, setAnalysis] = useState('')
  const [depositAmount, setDepositAmount] = useState(0)
  const [duration, setDuration] = useState(0)
  const [phases, setPhases] = useState<Proposal['phases']>([])
  const [teamMembers, setTeamMembers] = useState<Proposal['team_members']>([])
  const [deliverables, setDeliverables] = useState<Proposal['deliverables']>([])
  const [approvals, setApprovals] = useState({
    analysis: false,
    deposit: false,
    phases: false,
    team: false,
    commitments: false
  })

  useEffect(() => {
    loadData()
  }, [projectId])

  // Load both Project and Proposal data
  const loadData = async () => {
    try {
      console.log('🔵 ===== STARTING DATA LOAD =====')
      console.log('📥 Loading data for project:', projectId)

      // Load Project data first
      console.log('📥 Step 1: Fetching Project data...')
      const projectResponse = await projectsAPI.get(projectId)
      console.log('✅ Project API response:', projectResponse.data)
      setProject(projectResponse.data)

      // Pre-fill some data from Project if available
      const projectData = projectResponse.data
      console.log('📊 Project details:', {
        name: projectData.name,
        description: projectData.description,
        budget: projectData.budget,
        estimated_hours: projectData.estimated_hours,
        status: projectData.status
      })

      // Load Proposal data
      console.log('📥 Step 2: Fetching Proposal data...')
      const proposalResponse = await proposalsAPI.list(projectId)
      console.log('✅ Proposals API response:', proposalResponse.data)

      if (proposalResponse.data && proposalResponse.data.length > 0) {
        const p = proposalResponse.data[0]
        console.log('📋 First proposal found:', p)
        console.log('  - id:', p.id)
        console.log('  - status:', p.status)
        console.log('  - deposit_amount:', p.deposit_amount)
        console.log('  - deposit_paid:', p.deposit_paid)
        console.log('  - payment_submitted:', p.payment_submitted)
        console.log('  - estimated_duration_days:', p.estimated_duration_days)
        console.log('  - project_analysis:', p.project_analysis?.substring(0, 50))
        console.log('  - phases count:', p.phases?.length || 0)
        console.log('  - team_members count:', p.team_members?.length || 0)

        setProposal(p)
        setAnalysis(p.project_analysis || '')
        setDepositAmount(p.deposit_amount || 0)
        setDuration(p.estimated_duration_days || 0)
        setPhases(p.phases || [])
        setTeamMembers(p.team_members || [])
        setDeliverables(p.deliverables || [])
        setApprovals(p.customer_approvals || approvals)

        console.log('✅ Proposal state updated with values:', {
          proposalId: p.id,
          depositAmount: p.deposit_amount,
          depositPaid: p.deposit_paid,
          paymentSubmitted: p.payment_submitted,
          duration: p.estimated_duration_days,
          analysis: p.project_analysis?.substring(0, 30),
          phasesCount: p.phases?.length || 0,
          teamCount: p.team_members?.length || 0
        })
      } else {
        console.log('⚠️ No proposals found - will create new one when saving')

        // Pre-fill with Project data if no proposal exists
        if (projectData.description) {
          console.log('📝 Pre-filling analysis with project description')
          setAnalysis(projectData.description)
        }
        if (projectData.budget) {
          console.log('💰 Pre-filling deposit amount (30% of budget)')
          setDepositAmount(Number(projectData.budget) * 0.3)
        }
        if (projectData.estimated_hours) {
          console.log('⏱️ Pre-filling duration based on estimated hours')
          setDuration(Math.ceil(Number(projectData.estimated_hours) / 8)) // Convert hours to days
        }

        // Pre-fill with 6 default team members (3 real + 3 virtual)
        console.log('👥 Pre-filling 6 default team members')
        const defaultTeam = [
          { name: 'Admin User', role: 'Giám sát dự án', rating: 5 },
          { name: 'Sale User', role: 'Chăm sóc khách hàng', rating: 4.8 },
          { name: 'Developer User', role: 'Dev chính', rating: 4.9 },
          { name: 'UI/UX Designer', role: 'Thiết kế giao diện', rating: 4.7 },
          { name: 'Security Expert', role: 'Chuyên viên bảo mật', rating: 4.6 },
          { name: 'QA Tester', role: 'Test hệ thống', rating: 4.5 }
        ]
        setTeamMembers(defaultTeam)
      }

      console.log('🔵 ===== DATA LOAD COMPLETED =====')
      setLoading(false)
    } catch (err: any) {
      console.error('❌ Failed to load data:', err)
      console.error('❌ Error details:', err.response?.data || err.message)
      setLoading(false)
    }
  }

  const saveSection = async (section: string) => {
    console.log('🔵 SAVING SECTION:', section)
    console.log('📝 Current values:', {
      analysis,
      depositAmount,
      duration,
      phasesCount: phases.length,
      teamCount: teamMembers.length,
      deliverablesCount: deliverables.length
    })

    setSaving(true)
    try {
      const payload: any = {
        project_analysis: analysis,
        deposit_amount: depositAmount,
        total_price: phases.reduce((sum, p) => sum + p.amount, 0),
        estimated_duration_days: duration,
        phases: phases,
        team_members: teamMembers,
        deliverables: deliverables,
        customer_approvals: approvals
      }

      console.log('📦 Payload:', payload)

      if (proposal?.id) {
        console.log('✏️ Updating proposal:', proposal.id)
        const response = await proposalsAPI.update(proposal.id, payload)
        console.log('✅ Update response:', response.data)
      } else {
        console.log('➕ Creating new proposal')
        const response = await proposalsAPI.create(projectId, payload)
        console.log('✅ Create response:', response.data)
        setProposal(response.data)
      }

      console.log('🔄 Reloading data...')
      setEditMode(null)
      await loadData()
      console.log('✅ Save completed!')
    } catch (err) {
      console.error('❌ Failed to save:', err)
      alert('Lỗi khi lưu. Vui lòng thử lại.')
    } finally {
      setSaving(false)
    }
  }

  const toggleApproval = async (section: keyof typeof approvals) => {
    // If already approved, don't allow change
    if (approvals[section]) {
      alert('⚠️ Bạn đã đồng ý với mục này. Không thể thay đổi.')
      return
    }

    // Show confirmation modal
    setPendingApproval(section)
    setShowApprovalModal(section)
  }

  const confirmApproval = async () => {
    console.log('🔵 ===== confirmApproval CALLED =====')
    console.log('📋 pendingApproval:', pendingApproval)
    console.log('📋 current approvals:', approvals)

    if (!pendingApproval) return

    const newApprovals = { ...approvals, [pendingApproval]: true }
    console.log('📋 NEW approvals after this click:', newApprovals)
    setApprovals(newApprovals)

    if (proposal?.id) {
      try {
        // Update approvals
        console.log('📤 Updating proposal with new approvals...')
        await proposalsAPI.update(proposal.id, { customer_approvals: newApprovals })
        console.log('✅ Approvals updated successfully!')

        // Check if all 5 items are now approved
        const allApproved = Object.values(newApprovals).every(v => v === true)
        console.log('🔍 allApproved check:', allApproved)
        console.log('🔍 newApprovals values:', Object.values(newApprovals))
        console.log('🔍 proposal.status:', proposal.status)

        // If all approved AND proposal is not yet ACCEPTED, automatically accept it
        if (allApproved && proposal.status !== 'accepted') {
          console.log('🎯 All items approved! Auto-accepting proposal...')
          console.log('📤 Calling proposalsAPI.accept with proposal ID:', proposal.id)
          try {
            const acceptResponse = await proposalsAPI.accept(proposal.id, { customer_notes: 'Đã đồng ý tất cả các mục' })
            console.log('✅ Proposal accepted successfully! Response:', acceptResponse.data)
            alert('✅ Bạn đã đồng ý tất cả các mục!\n\nBạn có thể thanh toán tiền cọc để bắt đầu dự án.')
            console.log('🔄 Reloading data to get updated status...')
            await loadData() // Reload to get updated status
            console.log('✅ Data reloaded!')
          } catch (err: any) {
            console.error('❌ Failed to accept proposal:', err)
            console.error('❌ Error response:', err.response?.data)
            alert('Lỗi khi chấp nhận đề xuất: ' + (err.response?.data?.detail || err.message))
          }
        } else {
          console.log('ℹ️ NOT auto-accepting because:')
          console.log('   - allApproved:', allApproved)
          console.log('   - proposal.status:', proposal.status)
          console.log('   - status !== "accepted":', proposal.status !== 'accepted')
        }
      } catch (err) {
        console.error('❌ Failed to update approval:', err)
        alert('Lỗi khi cập nhật đồng ý. Vui lòng thử lại.')
        // Revert on error
        setApprovals(approvals)
      }
    }

    // Reset state
    setPendingApproval(null)
    setShowApprovalModal(null)
    console.log('🔵 ===== confirmApproval COMPLETED =====')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  // Get section title for modal
  const getSectionTitle = (section: string): string => {
    const titles: Record<string, string> = {
      analysis: 'Phân Tích Dự Án',
      deposit: 'Tiền Cọc & Thời Gian',
      phases: 'Các Giai Đoạn Thực Hiện',
      team: 'Đội Ngũ Thực Hiện',
      commitments: 'Cam Kết & Phạt Vi Phạm'
    }
    return titles[section] || section
  }

  const handleSubmitPayment = async () => {
    console.log('💳 handleSubmitPayment called!', { proposalId: proposal?.id })

    if (!proposal?.id) {
      console.error('❌ No proposal ID found!')
      alert('Lỗi: Không tìm thấy thông tin proposal')
      return
    }

    // Check if already submitted
    if (proposal.payment_submitted || proposal.deposit_paid) {
      console.warn('⚠️ Payment already submitted or paid!')
      alert('Thanh toán đã được gửi hoặc đã được duyệt!')
      setShowPaymentModal(false)
      return
    }

    setSubmittingPayment(true)
    try {
      console.log('🔄 Calling API submitPayment...')
      const response = await proposalsAPI.submitPayment(proposal.id)
      console.log('✅ API Response:', response)

      // Close modal IMMEDIATELY before showing alert
      setShowPaymentModal(false)

      alert('✅ Thanh toán cọc thành công!\n\nDự án đã chính thức bắt đầu. Chúng tôi sẽ liên hệ và triển khai ngay!')
      await loadData() // Reload to get updated status
    } catch (err: any) {
      console.error('❌ Failed to submit payment:', err)
      console.error('❌ Error response:', err.response?.data)
      const errorMsg = err.response?.data?.detail || err.response?.data?.message || err.message
      alert('Lỗi khi xác nhận thanh toán: ' + errorMsg)
    } finally {
      setSubmittingPayment(false)
    }
  }

  const generateQRCodeURL = (phaseIndex?: number) => {
    if (!proposal) return ''

    const accountNo = '6868688868888'
    const accountName = 'LE TIEN HUNG'
    const bankCode = 'MB' // MB Bank

    let amount: number
    let description: string

    if (phaseIndex !== undefined && phaseIndex !== null) {
      // Phase payment
      amount = phases[phaseIndex]?.amount || 0
      description = `GD${phaseIndex + 1} ${projectId.substring(0, 8)}`
    } else {
      // Deposit payment
      amount = depositAmount
      description = `Coc DuAn ${projectId.substring(0, 8)}`
    }

    return `https://img.vietqr.io/image/${bankCode}-${accountNo}-compact.jpg?amount=${amount}&addInfo=${encodeURIComponent(description)}&accountName=${encodeURIComponent(accountName)}`
  }

  // ========== PHASE PAYMENT HANDLERS ==========

  const handleMarkPhaseComplete = async (phaseIndex: number) => {
    if (!proposal?.id) return

    if (!confirm(`Bạn có chắc đã hoàn thành "${phases[phaseIndex].name}"?`)) return

    setProcessingPhase(true)
    try {
      await proposalsAPI.markPhaseComplete(proposal.id, phaseIndex)
      alert('Đã đánh dấu giai đoạn hoàn thành!')
      await loadData()
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message
      alert('Lỗi: ' + errorMsg)
    } finally {
      setProcessingPhase(false)
    }
  }

  const handleSubmitPhasePayment = async (phaseIndex: number) => {
    if (!proposal?.id) return

    // Check if already submitted
    const phase = phases[phaseIndex]
    if (phase?.payment_submitted || phase?.payment_approved) {
      console.warn('⚠️ Phase payment already submitted or approved!')
      alert('Thanh toán giai đoạn này đã được gửi hoặc đã được duyệt!')
      setShowPhasePaymentModal(null)
      return
    }

    setProcessingPhase(true)
    try {
      await proposalsAPI.submitPhasePayment(proposal.id, phaseIndex)

      // Close modal IMMEDIATELY before showing alert
      setShowPhasePaymentModal(null)

      alert(`✅ Thanh toán "${phase.name}" thành công!\n\nGiai đoạn đã hoàn thành và thanh toán. Giai đoạn tiếp theo có thể bắt đầu.`)
      await loadData()
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message
      alert('Lỗi: ' + errorMsg)
    } finally {
      setProcessingPhase(false)
    }
  }

  const addPhase = () => {
    setPhases([...phases, { name: '', days: 0, amount: 0, payment_percentage: 0, tasks: '' }])
  }

  const updatePhase = (index: number, field: string, value: any) => {
    const newPhases = [...phases]
    newPhases[index] = { ...newPhases[index], [field]: value }
    setPhases(newPhases)
  }

  const removePhase = (index: number) => {
    setPhases(phases.filter((_, i) => i !== index))
  }

  const addTeamMember = () => {
    setTeamMembers([...teamMembers, { name: '', role: '', rating: 0 }])
  }

  const updateTeamMember = (index: number, field: string, value: any) => {
    const newMembers = [...teamMembers]
    newMembers[index] = { ...newMembers[index], [field]: value }
    setTeamMembers(newMembers)
  }

  const removeTeamMember = (index: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index))
  }

  const addDeliverable = () => {
    setDeliverables([...deliverables, { description: '', penalty: '' }])
  }

  const updateDeliverable = (index: number, field: string, value: any) => {
    const newDeliverables = [...deliverables]
    newDeliverables[index] = { ...newDeliverables[index], [field]: value }
    setDeliverables(newDeliverables)
  }

  const removeDeliverable = (index: number) => {
    setDeliverables(deliverables.filter((_, i) => i !== index))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // Check if proposal is empty or still in draft (for customer)
  // IMPORTANT: Only show waiting banner if status is 'draft' or proposal doesn't exist
  // If status is 'sent' or later, always show the content (even if empty)
  if (userRole === 'customer' && (!proposal || proposal?.status === 'draft')) {
    return (
      <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-400 rounded-2xl shadow-xl p-8 animate-fadeIn">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">⏳</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Đang chờ Sale chuẩn bị đề xuất</h3>
          <p className="text-gray-700 text-lg mb-4">
            Sale đang phân tích dự án và chuẩn bị bản thương thảo chi tiết cho bạn.
          </p>
          <div className="bg-white rounded-xl p-6 mb-6 max-w-md mx-auto">
            <div className="space-y-3 text-left">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">1</div>
                <div>
                  <p className="font-semibold text-gray-900">Sale phân tích yêu cầu</p>
                  <p className="text-sm text-gray-600">Xác định scope, công nghệ, timeline</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">2</div>
                <div>
                  <p className="font-semibold text-gray-900">Lên kế hoạch chi tiết</p>
                  <p className="text-sm text-gray-600">Chia giai đoạn, phân công team</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">3</div>
                <div>
                  <p className="font-semibold text-gray-900">Gửi đề xuất cho bạn</p>
                  <p className="text-sm text-gray-600">Bạn sẽ nhận thông báo ngay lập tức</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 inline-flex items-center gap-3 text-blue-700">
            <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            <span className="font-semibold">Trong lúc chờ, bạn có thể chat với Sale để trao đổi thêm về dự án</span>
          </div>
        </div>
      </div>
    )
  }

  const allApproved = Object.values(approvals).every(v => v === true)

  // Debug payment button visibility
  console.log('🔍 Payment Button Debug:', {
    userRole,
    allApproved,
    depositPaid: proposal?.deposit_paid,
    paymentSubmitted: proposal?.payment_submitted,
    shouldShowDepositButton: userRole === 'customer' && allApproved && !proposal?.payment_submitted && !proposal?.deposit_paid,
    shouldShowWaitingState: userRole === 'customer' && allApproved && proposal?.payment_submitted && !proposal?.deposit_paid,
    shouldShowApprovedState: userRole === 'customer' && allApproved && proposal?.deposit_paid,
    approvals,
    proposalStatus: proposal?.status
  })

  const getStatusBadge = () => {
    if (!proposal?.status) return null

    const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
      draft: { label: 'Bản thảo', color: 'bg-gray-100 text-gray-700 border-gray-300', icon: '📝' },
      sent: { label: 'Đã gửi', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: '📤' },
      viewed: { label: 'Đã xem', color: 'bg-purple-100 text-purple-700 border-purple-300', icon: '👁️' },
      accepted: { label: 'Đã chấp nhận', color: 'bg-green-100 text-green-700 border-green-300', icon: '✅' },
      rejected: { label: 'Từ chối', color: 'bg-red-100 text-red-700 border-red-300', icon: '❌' },
      negotiating: { label: 'Đang thương thảo', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: '💬' }
    }

    const config = statusConfig[proposal.status] || statusConfig.draft
    return (
      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold border-2 ${config.color}`}>
        <span>{config.icon}</span>
        <span>{config.label}</span>
      </span>
    )
  }

  const handleFinalizeProposal = async () => {
    if (!proposal?.id) {
      alert('Lỗi: Chưa có proposal để hoàn tất')
      return
    }

    // Validate proposal has required data
    if (!analysis || depositAmount === 0 || duration === 0 || phases.length === 0 || teamMembers.length === 0) {
      alert('⚠️ Vui lòng điền đầy đủ tất cả các mục trước khi gửi cho khách hàng:\n\n✅ Phân tích dự án\n✅ Tiền cọc & Thời gian\n✅ Các giai đoạn (ít nhất 1)\n✅ Đội ngũ thực hiện\n✅ Cam kết & phạt vi phạm')
      return
    }

    if (!confirm('🚀 Bạn có chắc chắn muốn GỬI BẢN ĐỀ XUẤT này cho khách hàng?\n\nSau khi gửi:\n- Khách hàng sẽ nhận được và có thể xem\n- Bạn vẫn có thể chỉnh sửa nếu cần\n- Khách hàng có thể đồng ý hoặc yêu cầu thương thảo')) {
      return
    }

    setSaving(true)
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/proposals/${proposal.id}/send`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      )

      if (response.ok) {
        alert('✅ Đã gửi đề xuất cho khách hàng thành công!\n\nKhách hàng sẽ nhận được thông báo và có thể xem xét đề xuất của bạn.')
        await loadData() // Reload to get updated status
      } else {
        const error = await response.json()
        alert('Lỗi: ' + (error.detail || error.message || 'Không thể gửi đề xuất'))
      }
    } catch (err) {
      console.error('Failed to finalize proposal:', err)
      alert('Lỗi khi gửi đề xuất. Vui lòng thử lại.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-2">📋 Bản Thương Thảo Dự Án</h2>
            {project && (
              <div className="mb-2 text-blue-100">
                <span className="font-semibold text-white">{project.name}</span>
                {project.customer && (
                  <span className="ml-3">- Khách hàng: {project.customer.company_name}</span>
                )}
              </div>
            )}
          </div>
          <div className="ml-4">
            {getStatusBadge()}
          </div>
        </div>

        <p className="text-blue-100">
          {userRole === 'sale'
            ? proposal?.status === 'draft'
              ? 'Điền thông tin từng phần, sau đó hoàn tất để gửi cho khách hàng'
              : proposal?.status === 'sent'
              ? 'Đã gửi cho khách hàng. Chờ khách hàng xem và phản hồi.'
              : proposal?.status === 'viewed'
              ? 'Khách hàng đã xem. Chờ khách hàng đồng ý các mục.'
              : 'Khách hàng đang xem xét đề xuất'
            : 'Xem xét và đồng ý từng phần để tiến hành dự án'}
        </p>

        {userRole === 'customer' && (
          <div className="mt-4 bg-white/20 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <span>Tiến độ đồng ý:</span>
              <span className="font-bold">
                {Object.values(approvals).filter(v => v).length}/5 mục
              </span>
            </div>
            <div className="mt-2 bg-white/30 rounded-full h-2">
              <div
                className="bg-green-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(Object.values(approvals).filter(v => v).length / 5) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Finalize Button for Sale (Draft status only) */}
        {userRole === 'sale' && proposal?.status === 'draft' && (
          <div className="mt-4 pt-4 border-t border-white/30">
            <button
              onClick={handleFinalizeProposal}
              disabled={saving}
              className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
            >
              {saving ? (
                <>
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang gửi...</span>
                </>
              ) : (
                <>
                  <span className="text-2xl">🚀</span>
                  <span>Hoàn tất & Gửi cho Khách Hàng</span>
                </>
              )}
            </button>
            <p className="text-center text-blue-100 text-sm mt-2">
              Đảm bảo đã điền đầy đủ tất cả các mục trước khi gửi
            </p>
          </div>
        )}
      </div>

      {/* Section 1: Project Analysis */}
      <div className={`border-2 rounded-xl p-6 bg-white shadow-lg transition-all duration-300 ${
        approvals.analysis ? 'border-green-500' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              approvals.analysis ? 'bg-green-500 text-white' : 'bg-blue-100 text-blue-600'
            }`}>
              {approvals.analysis ? '✓' : '1'}
            </div>
            <h3 className="text-xl font-bold text-gray-800">Phân Tích Dự Án</h3>
          </div>
          <div className="flex items-center gap-3">
            {userRole === 'customer' && (
              <label className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                approvals.analysis
                  ? 'bg-green-100 cursor-not-allowed opacity-75'
                  : 'bg-green-50 hover:bg-green-100 cursor-pointer'
              }`}>
                <input
                  type="checkbox"
                  checked={approvals.analysis}
                  onChange={() => toggleApproval('analysis')}
                  disabled={approvals.analysis}
                  className="w-5 h-5 text-green-600 disabled:cursor-not-allowed"
                />
                <span className="text-sm font-semibold text-green-700">
                  {approvals.analysis ? 'Đã đồng ý ✓' : 'Đồng ý'}
                </span>
              </label>
            )}
            {userRole === 'sale' && (
              <button
                onClick={() => setEditMode(editMode === 'analysis' ? null : 'analysis')}
                disabled={proposal?.status === 'accepted'}
                className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                  proposal?.status === 'accepted'
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
                title={proposal?.status === 'accepted' ? '🔒 Không thể sửa - Khách hàng đã chấp nhận' : ''}
              >
                {proposal?.status === 'accepted' ? '🔒 Đã khóa' : (editMode === 'analysis' ? '✕ Hủy' : '✏️ Chỉnh sửa')}
              </button>
            )}
          </div>
        </div>

        {editMode === 'analysis' && userRole === 'sale' ? (
          <div className="space-y-3 animate-fadeIn">
            <textarea
              value={analysis}
              onChange={(e) => setAnalysis(e.target.value)}
              className="w-full border-2 border-blue-200 rounded-lg p-4 h-32 focus:border-blue-500 focus:outline-none"
              placeholder="Nhập phân tích dự án chi tiết..."
            />
            <button
              onClick={() => saveSection('analysis')}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? '💾 Đang lưu...' : '💾 Lưu'}
            </button>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-gray-700 leading-relaxed">
            {analysis || <span className="text-gray-400 italic">Chưa có phân tích</span>}
          </div>
        )}
      </div>

      {/* Section 2: Deposit & Duration */}
      <div className={`border-2 rounded-xl p-6 bg-white shadow-lg transition-all duration-300 ${
        approvals.deposit ? 'border-green-500' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              approvals.deposit ? 'bg-green-500 text-white' : 'bg-blue-100 text-blue-600'
            }`}>
              {approvals.deposit ? '✓' : '2'}
            </div>
            <h3 className="text-xl font-bold text-gray-800">Tiền Cọc & Thời Gian</h3>
          </div>
          <div className="flex items-center gap-3">
            {userRole === 'customer' && (
              <label className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                approvals.deposit
                  ? 'bg-green-100 cursor-not-allowed opacity-75'
                  : 'bg-green-50 hover:bg-green-100 cursor-pointer'
              }`}>
                <input
                  type="checkbox"
                  checked={approvals.deposit}
                  onChange={() => toggleApproval('deposit')}
                  disabled={approvals.deposit}
                  className="w-5 h-5 text-green-600 disabled:cursor-not-allowed"
                />
                <span className="text-sm font-semibold text-green-700">
                  {approvals.deposit ? 'Đã đồng ý ✓' : 'Đồng ý'}
                </span>
              </label>
            )}
            {userRole === 'sale' && (
              <button
                onClick={() => setEditMode(editMode === 'deposit' ? null : 'deposit')}
                disabled={proposal?.status === 'accepted'}
                className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                  proposal?.status === 'accepted'
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
                title={proposal?.status === 'accepted' ? '🔒 Không thể sửa - Khách hàng đã chấp nhận' : ''}
              >
                {proposal?.status === 'accepted' ? '🔒 Đã khóa' : (editMode === 'deposit' ? '✕ Hủy' : '✏️ Chỉnh sửa')}
              </button>
            )}
          </div>
        </div>

        {editMode === 'deposit' && userRole === 'sale' ? (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">💰 Tiền cọc (VND)</label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(Number(e.target.value))}
                className="w-full border-2 border-blue-200 rounded-lg p-3 focus:border-blue-500 focus:outline-none"
                placeholder="Nhập số tiền cọc..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">⏱️ Thời gian thực hiện (ngày)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full border-2 border-blue-200 rounded-lg p-3 focus:border-blue-500 focus:outline-none"
                placeholder="Nhập số ngày..."
              />
            </div>
            <button
              onClick={() => saveSection('deposit')}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-semibold disabled:opacity-50"
            >
              {saving ? '💾 Đang lưu...' : '💾 Lưu'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="text-sm text-gray-600 mb-1">💰 Tiền cọc</div>
              <div className="text-2xl font-bold text-green-700">
                {depositAmount > 0 ? formatCurrency(depositAmount) : 'Chưa xác định'}
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="text-sm text-gray-600 mb-1">⏱️ Thời gian thực hiện</div>
              <div className="text-2xl font-bold text-blue-700">
                {duration > 0 ? `${duration} ngày` : 'Chưa xác định'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section 3: Phases */}
      <div className={`border-2 rounded-xl p-6 bg-white shadow-lg transition-all duration-300 ${
        approvals.phases ? 'border-green-500' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              approvals.phases ? 'bg-green-500 text-white' : 'bg-blue-100 text-blue-600'
            }`}>
              {approvals.phases ? '✓' : '3'}
            </div>
            <h3 className="text-xl font-bold text-gray-800">Các Giai Đoạn Thực Hiện</h3>
          </div>
          <div className="flex items-center gap-3">
            {userRole === 'customer' && (
              <label className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                approvals.phases
                  ? 'bg-green-100 cursor-not-allowed opacity-75'
                  : 'bg-green-50 hover:bg-green-100 cursor-pointer'
              }`}>
                <input
                  type="checkbox"
                  checked={approvals.phases}
                  onChange={() => toggleApproval('phases')}
                  disabled={approvals.phases}
                  className="w-5 h-5 text-green-600 disabled:cursor-not-allowed"
                />
                <span className="text-sm font-semibold text-green-700">
                  {approvals.phases ? 'Đã đồng ý ✓' : 'Đồng ý'}
                </span>
              </label>
            )}
            {userRole === 'sale' && (
              <button
                onClick={() => setEditMode(editMode === 'phases' ? null : 'phases')}
                disabled={proposal?.status === 'accepted' || proposal?.status !== 'draft'}
                className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                  proposal?.status === 'accepted' || proposal?.status !== 'draft'
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
                title={
                  proposal?.status === 'accepted'
                    ? '🔒 Không thể sửa - Khách hàng đã chấp nhận'
                    : proposal?.status !== 'draft'
                    ? '🔒 Không thể sửa giai đoạn sau khi gửi cho khách hàng'
                    : ''
                }
              >
                {editMode === 'phases' ? '✕ Hủy' : (proposal?.status === 'accepted' || proposal?.status !== 'draft') ? '🔒 Đã khóa' : '✏️ Chỉnh sửa'}
              </button>
            )}
          </div>
        </div>

        {editMode === 'phases' && userRole === 'sale' ? (
          <div className="space-y-4 animate-fadeIn">
            {phases.map((phase, index) => {
              const isPhasePaid = phase.payment_approved || false
              return (
                <div key={index} className={`border-2 rounded-lg p-4 ${
                  isPhasePaid
                    ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50'
                    : 'border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50'
                }`}>
                  {isPhasePaid && (
                    <div className="mb-3 px-3 py-2 bg-green-100 border border-green-300 rounded-lg text-sm text-green-800 font-semibold">
                      🔒 Giai đoạn này đã được thanh toán - Không thể chỉnh sửa
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Tên giai đoạn</label>
                      <input
                        type="text"
                        value={phase.name}
                        onChange={(e) => updatePhase(index, 'name', e.target.value)}
                        disabled={isPhasePaid}
                        className="w-full border rounded-lg p-2 focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="VD: Giai đoạn 1 - Phân tích"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Số ngày</label>
                      <input
                        type="number"
                        value={phase.days}
                        onChange={(e) => updatePhase(index, 'days', Number(e.target.value))}
                        disabled={isPhasePaid}
                        className="w-full border rounded-lg p-2 focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Số tiền (VND)</label>
                      <input
                        type="number"
                        value={phase.amount}
                        onChange={(e) => updatePhase(index, 'amount', Number(e.target.value))}
                        disabled={isPhasePaid}
                        className="w-full border rounded-lg p-2 focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">% Thanh toán</label>
                      <input
                        type="number"
                        value={phase.payment_percentage}
                        onChange={(e) => updatePhase(index, 'payment_percentage', Number(e.target.value))}
                        disabled={isPhasePaid}
                        className="w-full border rounded-lg p-2 focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">Công việc</label>
                      <textarea
                        value={phase.tasks}
                        onChange={(e) => updatePhase(index, 'tasks', e.target.value)}
                        disabled={isPhasePaid}
                        className="w-full border rounded-lg p-2 h-20 focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Mô tả chi tiết công việc trong giai đoạn này..."
                      />
                    </div>
                  </div>
                  {!isPhasePaid && (
                    <button
                      onClick={() => removePhase(index)}
                      className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
                    >
                      🗑️ Xóa giai đoạn
                    </button>
                  )}
                </div>
              )
            })}
            <div className="flex gap-2">
              <button
                onClick={addPhase}
                className="px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
              >
                ➕ Thêm giai đoạn
              </button>
              <button
                onClick={() => saveSection('phases')}
                disabled={saving}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-semibold disabled:opacity-50"
              >
                {saving ? '💾 Đang lưu...' : '💾 Lưu'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {phases.length > 0 ? (
              phases.map((phase, index) => {
                const isCompleted = phase.completed || false
                const isPaymentSubmitted = phase.payment_submitted || false
                const isPaymentApproved = phase.payment_approved || false
                const canComplete = proposal?.deposit_paid && (index === 0 || (phases[index - 1]?.payment_approved))

                // Debug log for phase buttons
                console.log(`🔍 Phase ${index + 1} (${phase.name}) Debug:`, {
                  userRole,
                  isCompleted,
                  canComplete,
                  depositPaid: proposal?.deposit_paid,
                  prevPhasePaid: index > 0 ? phases[index - 1]?.payment_approved : 'N/A (first phase)',
                  shouldShowButton: userRole === 'sale' && !isCompleted && canComplete
                })

                return (
                  <div
                    key={index}
                    className={`border-2 rounded-xl p-5 transition-all duration-300 ${
                      isPaymentApproved
                        ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50'
                        : isCompleted
                        ? 'border-yellow-500 bg-gradient-to-r from-yellow-50 to-amber-50'
                        : 'border-blue-300 bg-gradient-to-r from-blue-50 to-transparent'
                    }`}
                  >
                    {/* Phase Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <div className="font-bold text-xl text-gray-800">{phase.name}</div>

                          {/* Status Badges */}
                          <div className="flex gap-2 flex-wrap">
                            {isPaymentApproved && (
                              <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                                ✅ Đã Thanh Toán
                              </span>
                            )}
                            {isCompleted && !isPaymentApproved && (
                              <span className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
                                ✅ Hoàn Thành - Chờ Thanh Toán
                              </span>
                            )}
                            {!isCompleted && (
                              <span className="px-3 py-1 bg-gray-300 text-gray-700 text-xs font-bold rounded-full">
                                🔨 Đang Thực Hiện
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Phase Info */}
                        <div className="text-sm text-gray-700 mb-2">{phase.tasks}</div>
                      </div>

                      {/* Amount & Days */}
                      <div className="text-right ml-4">
                        <div className="font-bold text-2xl text-blue-600">{formatCurrency(phase.amount)}</div>
                        <div className="text-sm text-gray-600">{phase.days} ngày</div>
                        <div className="text-xs text-gray-500">({phase.payment_percentage}% thanh toán)</div>
                      </div>
                    </div>

                    {/* Timestamps */}
                    {(phase.completed_at || phase.payment_submitted_at || phase.payment_approved_at) && (
                      <div className="bg-white/60 rounded-lg p-3 mb-3 text-xs space-y-1">
                        {phase.completed_at && (
                          <div className="text-gray-600">
                            ✅ Hoàn thành: <span className="font-semibold">{new Date(phase.completed_at).toLocaleString('vi-VN')}</span>
                          </div>
                        )}
                        {phase.payment_submitted_at && (
                          <div className="text-gray-600">
                            💳 Gửi thanh toán: <span className="font-semibold">{new Date(phase.payment_submitted_at).toLocaleString('vi-VN')}</span>
                          </div>
                        )}
                        {phase.payment_approved_at && (
                          <div className="text-green-700">
                            ✅ Duyệt thanh toán: <span className="font-semibold">{new Date(phase.payment_approved_at).toLocaleString('vi-VN')}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-wrap">
                      {/* SALE: Mark Complete Button */}
                      {userRole === 'sale' && !isCompleted && canComplete && (
                        <button
                          onClick={() => handleMarkPhaseComplete(index)}
                          disabled={processingPhase}
                          className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ✅ Đánh Dấu Hoàn Thành
                        </button>
                      )}

                      {/* CUSTOMER: Payment Button */}
                      {userRole === 'customer' && isCompleted && !isPaymentApproved && (
                        <button
                          onClick={() => setShowPhasePaymentModal(index)}
                          disabled={processingPhase}
                          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          💳 Thanh Toán Giai Đoạn {index + 1}: {formatCurrency(phase.amount)}
                        </button>
                      )}

                      {/* Lock Message */}
                      {userRole === 'sale' && !isCompleted && !canComplete && (
                        <div className="text-sm text-gray-500 italic py-2">
                          🔒 Chờ giai đoạn trước hoàn thành và thanh toán
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8 text-gray-400 italic">Chưa có giai đoạn nào</div>
            )}
          </div>
        )}
      </div>

      {/* Section 4: Team Members */}
      <div className={`border-2 rounded-xl p-6 bg-white shadow-lg transition-all duration-300 ${
        approvals.team ? 'border-green-500' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              approvals.team ? 'bg-green-500 text-white' : 'bg-blue-100 text-blue-600'
            }`}>
              {approvals.team ? '✓' : '4'}
            </div>
            <h3 className="text-xl font-bold text-gray-800">Đội Ngũ Thực Hiện</h3>
          </div>
          <div className="flex items-center gap-3">
            {userRole === 'customer' && (
              <label className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                approvals.team
                  ? 'bg-green-100 cursor-not-allowed opacity-75'
                  : 'bg-green-50 hover:bg-green-100 cursor-pointer'
              }`}>
                <input
                  type="checkbox"
                  checked={approvals.team}
                  onChange={() => toggleApproval('team')}
                  disabled={approvals.team}
                  className="w-5 h-5 text-green-600 disabled:cursor-not-allowed"
                />
                <span className="text-sm font-semibold text-green-700">
                  {approvals.team ? 'Đã đồng ý ✓' : 'Đồng ý'}
                </span>
              </label>
            )}
            {userRole === 'sale' && (
              <button
                onClick={() => setEditMode(editMode === 'team' ? null : 'team')}
                disabled={proposal?.status === 'accepted'}
                className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                  proposal?.status === 'accepted'
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
                title={proposal?.status === 'accepted' ? '🔒 Không thể sửa - Khách hàng đã chấp nhận' : ''}
              >
                {proposal?.status === 'accepted' ? '🔒 Đã khóa' : (editMode === 'team' ? '✕ Hủy' : '✏️ Chỉnh sửa')}
              </button>
            )}
          </div>
        </div>

        {editMode === 'team' && userRole === 'sale' ? (
          <div className="space-y-4 animate-fadeIn">
            {teamMembers.map((member, index) => (
              <div key={index} className="border-2 border-blue-200 rounded-lg p-4 bg-gradient-to-br from-purple-50 to-pink-50">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">👤 Tên</label>
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                      className="w-full border rounded-lg p-2 focus:border-blue-500 focus:outline-none"
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">💼 Vai trò</label>
                    <input
                      type="text"
                      value={member.role}
                      onChange={(e) => updateTeamMember(index, 'role', e.target.value)}
                      className="w-full border rounded-lg p-2 focus:border-blue-500 focus:outline-none"
                      placeholder="Senior Developer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">⭐ Rating (0-5)</label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      value={member.rating}
                      onChange={(e) => updateTeamMember(index, 'rating', Number(e.target.value))}
                      className="w-full border rounded-lg p-2 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
                <button
                  onClick={() => removeTeamMember(index)}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  🗑️ Xóa thành viên
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <button
                onClick={addTeamMember}
                className="px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
              >
                ➕ Thêm thành viên
              </button>
              <button
                onClick={() => saveSection('team')}
                disabled={saving}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-semibold disabled:opacity-50"
              >
                {saving ? '💾 Đang lưu...' : '💾 Lưu'}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {teamMembers.length > 0 ? (
              teamMembers.map((member, index) => (
                <div key={index} className="border-2 border-purple-200 rounded-lg p-4 bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-lg transition-shadow">
                  <div className="font-bold text-lg text-gray-800">{member.name}</div>
                  <div className="text-sm text-gray-600 mb-2">{member.role}</div>
                  <div className="flex items-center">
                    <span className="text-yellow-500">{'⭐'.repeat(Math.floor(member.rating))}</span>
                    <span className="text-sm ml-2 text-gray-600 font-medium">({member.rating}/5)</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400 italic col-span-full">Chưa có thành viên nào</div>
            )}
          </div>
        )}
      </div>

      {/* Section 5: Deliverables & Commitments */}
      <div className={`border-2 rounded-xl p-6 bg-white shadow-lg transition-all duration-300 ${
        approvals.commitments ? 'border-green-500' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              approvals.commitments ? 'bg-green-500 text-white' : 'bg-blue-100 text-blue-600'
            }`}>
              {approvals.commitments ? '✓' : '5'}
            </div>
            <h3 className="text-xl font-bold text-gray-800">Cam Kết & Phạt Vi Phạm</h3>
          </div>
          <div className="flex items-center gap-3">
            {userRole === 'customer' && (
              <label className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                approvals.commitments
                  ? 'bg-green-100 cursor-not-allowed opacity-75'
                  : 'bg-green-50 hover:bg-green-100 cursor-pointer'
              }`}>
                <input
                  type="checkbox"
                  checked={approvals.commitments}
                  onChange={() => toggleApproval('commitments')}
                  disabled={approvals.commitments}
                  className="w-5 h-5 text-green-600 disabled:cursor-not-allowed"
                />
                <span className="text-sm font-semibold text-green-700">
                  {approvals.commitments ? 'Đã đồng ý ✓' : 'Đồng ý'}
                </span>
              </label>
            )}
            {userRole === 'sale' && (
              <button
                onClick={() => setEditMode(editMode === 'commitments' ? null : 'commitments')}
                disabled={proposal?.status === 'accepted'}
                className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                  proposal?.status === 'accepted'
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
                title={proposal?.status === 'accepted' ? '🔒 Không thể sửa - Khách hàng đã chấp nhận' : ''}
              >
                {proposal?.status === 'accepted' ? '🔒 Đã khóa' : (editMode === 'commitments' ? '✕ Hủy' : '✏️ Chỉnh sửa')}
              </button>
            )}
          </div>
        </div>

        {editMode === 'commitments' && userRole === 'sale' ? (
          <div className="space-y-4 animate-fadeIn">
            {deliverables.map((item, index) => (
              <div key={index} className="border-2 border-red-200 rounded-lg p-4 bg-gradient-to-br from-red-50 to-orange-50">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">✅ Cam kết</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateDeliverable(index, 'description', e.target.value)}
                      className="w-full border rounded-lg p-2 focus:border-red-500 focus:outline-none"
                      placeholder="VD: Giao đúng hạn"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">⚠️ Mức phạt</label>
                    <input
                      type="text"
                      value={item.penalty}
                      onChange={(e) => updateDeliverable(index, 'penalty', e.target.value)}
                      className="w-full border rounded-lg p-2 focus:border-red-500 focus:outline-none"
                      placeholder="VD: Phạt 5% giá trị"
                    />
                  </div>
                </div>
                <button
                  onClick={() => removeDeliverable(index)}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  🗑️ Xóa cam kết
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <button
                onClick={addDeliverable}
                className="px-4 py-2 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
              >
                ➕ Thêm cam kết
              </button>
              <button
                onClick={() => saveSection('commitments')}
                disabled={saving}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-semibold disabled:opacity-50"
              >
                {saving ? '💾 Đang lưu...' : '💾 Lưu'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {deliverables.length > 0 ? (
              deliverables.map((item, index) => (
                <div key={index} className="border-l-4 border-red-500 bg-gradient-to-r from-red-50 to-transparent pl-4 py-3 rounded-r-lg">
                  <div className="font-bold text-gray-800">✅ {item.description}</div>
                  <div className="text-sm text-red-600 font-medium mt-1">⚠️ Phạt: {item.penalty}</div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400 italic">Chưa có cam kết nào</div>
            )}
          </div>
        )}
      </div>

      {/* Final Actions for Customer */}
      {userRole === 'customer' && allApproved && (
        <>
          {/* State 1: Not Submitted - Show Payment Button */}
          {!proposal?.payment_submitted && !proposal?.deposit_paid && (
            <div className="border-4 border-green-500 rounded-xl p-8 bg-gradient-to-br from-green-50 to-emerald-50 shadow-2xl animate-fadeIn">
              <div className="text-center">
                <div className="text-5xl mb-3">🎉</div>
                <div className="text-3xl font-bold text-green-700 mb-3">Đã đồng ý tất cả các mục!</div>
                <p className="text-gray-700 text-lg mb-6">Bạn có thể thanh toán tiền cọc để bắt đầu dự án</p>
                <button
                  onClick={() => {
                    console.log('🖱️ Payment button clicked!')
                    setShowPaymentModal(true)
                  }}
                  disabled={submittingPayment || !!proposal?.payment_submitted || !!proposal?.deposit_paid}
                  className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  💳 Thanh Toán Tiền Cọc {formatCurrency(depositAmount)}
                </button>
              </div>
            </div>
          )}

          {/* State 2: Submitted but Not Approved - Waiting for Admin */}
          {proposal?.payment_submitted && !proposal?.deposit_paid && (
            <div className="border-4 border-yellow-500 rounded-xl p-8 bg-gradient-to-br from-yellow-50 to-amber-50 shadow-2xl animate-fadeIn">
              <div className="text-center">
                <div className="text-5xl mb-3">⏳</div>
                <div className="text-3xl font-bold text-yellow-700 mb-3">Đang chờ duyệt thanh toán</div>
                <p className="text-gray-700 text-lg mb-2">
                  Bạn đã gửi xác nhận thanh toán vào lúc:{' '}
                  <span className="font-bold">
                    {proposal.payment_submitted_at
                      ? new Date(proposal.payment_submitted_at).toLocaleString('vi-VN')
                      : 'N/A'}
                  </span>
                </p>
                <p className="text-gray-600">Admin sẽ kiểm tra và duyệt thanh toán của bạn sớm nhất.</p>
                <div className="mt-4 inline-flex items-center gap-2 bg-white px-6 py-3 rounded-lg shadow">
                  <span className="text-2xl">💰</span>
                  <span className="font-bold text-lg">{formatCurrency(depositAmount)}</span>
                </div>
              </div>
            </div>
          )}

          {/* State 3: Approved - Project Started */}
          {proposal?.deposit_paid && (
            <div className="border-4 border-blue-500 rounded-xl p-8 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-2xl animate-fadeIn">
              <div className="text-center">
                <div className="text-5xl mb-3">✅</div>
                <div className="text-3xl font-bold text-blue-700 mb-3">Thanh toán đã được duyệt!</div>
                <p className="text-gray-700 text-lg mb-2">
                  Dự án đã chính thức bắt đầu vào:{' '}
                  <span className="font-bold">
                    {proposal.deposit_paid_at
                      ? new Date(proposal.deposit_paid_at).toLocaleString('vi-VN')
                      : 'N/A'}
                  </span>
                </p>
                <p className="text-gray-600">Chúng tôi sẽ liên hệ và bắt đầu triển khai dự án ngay!</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Payment Modal */}
      {showPaymentModal && !proposal?.payment_submitted && !proposal?.deposit_paid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fadeIn">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">💳</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Thanh Toán Tiền Cọc</h3>
              <p className="text-gray-600">Quét mã QR để thanh toán</p>
            </div>

            {/* QR Code */}
            <div className="bg-white border-4 border-blue-500 rounded-xl p-4 mb-6">
              <img
                src={generateQRCodeURL()}
                alt="QR Code thanh toán"
                className="w-full h-auto rounded-lg"
                onError={(e) => {
                  // Fallback if QR code fails to load
                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23f0f0f0" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%23999"%3EKhông thể tải QR%3C/text%3E%3C/svg%3E'
                }}
              />
            </div>

            {/* Payment Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Ngân hàng:</span>
                <span className="font-semibold">MB Bank (MBBank)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Chủ tài khoản:</span>
                <span className="font-semibold">LE TIEN HUNG</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Số tài khoản:</span>
                <span className="font-semibold font-mono">6868688868888</span>
              </div>
              <div className="flex justify-between border-t border-gray-300 pt-2 mt-2">
                <span className="text-gray-600">Số tiền:</span>
                <span className="font-bold text-lg text-green-600">{formatCurrency(depositAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Nội dung:</span>
                <span className="font-mono text-xs">Coc DuAn {projectId.substring(0, 8)}</span>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
              <p className="text-xs text-yellow-800">
                <strong>Lưu ý:</strong> Vui lòng chuyển khoản đúng số tiền và nội dung để hệ thống tự động xác nhận.
                Sau khi thanh toán, nhấn nút "Đã Thanh Toán" bên dưới.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                disabled={submittingPayment}
              >
                Hủy
              </button>
              <button
                onClick={handleSubmitPayment}
                disabled={submittingPayment}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingPayment ? '⏳ Đang xử lý...' : '✅ Đã Thanh Toán'}
              </button>
            </div>

            {/* Future SePay Integration Note */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-400">
                🔄 Sắp tích hợp SePay để tự động xác nhận thanh toán
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Phase Payment Modal */}
      {showPhasePaymentModal !== null && !phases[showPhasePaymentModal]?.payment_submitted && !phases[showPhasePaymentModal]?.payment_approved && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fadeIn">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">💳</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Thanh Toán Giai Đoạn {showPhasePaymentModal + 1}
              </h3>
              <p className="text-gray-600">Quét mã QR để thanh toán</p>
            </div>

            {/* QR Code */}
            <div className="bg-white border-4 border-blue-500 rounded-xl p-4 mb-6">
              <img
                src={generateQRCodeURL(showPhasePaymentModal)}
                alt="QR Code thanh toán giai đoạn"
                className="w-full h-auto rounded-lg"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23f0f0f0" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%23999"%3EKhông thể tải QR%3C/text%3E%3C/svg%3E'
                }}
              />
            </div>

            {/* Payment Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Giai đoạn:</span>
                <span className="font-semibold">{phases[showPhasePaymentModal]?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ngân hàng:</span>
                <span className="font-semibold">MB Bank</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Chủ tài khoản:</span>
                <span className="font-semibold">LE TIEN HUNG</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Số tài khoản:</span>
                <span className="font-semibold font-mono">6868688868888</span>
              </div>
              <div className="flex justify-between border-t border-gray-300 pt-2 mt-2">
                <span className="text-gray-600">Số tiền:</span>
                <span className="font-bold text-lg text-green-600">
                  {formatCurrency(phases[showPhasePaymentModal]?.amount || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Nội dung:</span>
                <span className="font-mono text-xs">GD{showPhasePaymentModal + 1} {projectId.substring(0, 8)}</span>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
              <p className="text-xs text-yellow-800">
                <strong>Lưu ý:</strong> Vui lòng chuyển khoản đúng số tiền và nội dung.
                Sau khi thanh toán, nhấn nút "Đã Thanh Toán" bên dưới.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowPhasePaymentModal(null)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                disabled={processingPhase}
              >
                Hủy
              </button>
              <button
                onClick={() => handleSubmitPhasePayment(showPhasePaymentModal)}
                disabled={processingPhase}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingPhase ? '⏳ Đang xử lý...' : '✅ Đã Thanh Toán'}
              </button>
            </div>

            {/* Future SePay Integration Note */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-400">
                🔄 Sắp tích hợp SePay để tự động xác nhận thanh toán
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Approval Confirmation Modal */}
      <ApprovalModal
        isOpen={showApprovalModal !== null}
        onClose={() => {
          setShowApprovalModal(null)
          setPendingApproval(null)
        }}
        onConfirm={confirmApproval}
        sectionTitle={showApprovalModal ? getSectionTitle(showApprovalModal) : ''}
      />

      {userRole === 'customer' && !allApproved && (
        <div className="border-2 border-yellow-400 rounded-xl p-4 bg-gradient-to-r from-yellow-50 to-amber-50 shadow-lg">
          <div className="flex items-center gap-3 text-yellow-800">
            <div className="text-2xl">ℹ️</div>
            <div className="font-medium">
              Vui lòng xem xét và đồng ý <span className="font-bold">{5 - Object.values(approvals).filter(v => v).length} mục còn lại</span> để tiếp tục
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
