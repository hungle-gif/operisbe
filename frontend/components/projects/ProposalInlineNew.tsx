'use client'

import { useState, useEffect } from 'react'
import { proposalsAPI, projectsAPI } from '@/lib/api'
// React Icons - Modern professional icons
import {
  FiCheckCircle, FiXCircle, FiEdit2, FiSave, FiTrash2, FiPlus,
  FiCreditCard, FiLock, FiClock, FiDollarSign, FiUsers, FiFileText,
  FiAlertCircle, FiCheck, FiX, FiTool, FiPackage, FiShield
} from 'react-icons/fi'
import { AiFillStar, AiOutlineStar } from 'react-icons/ai'
import { BsCheckCircle, BsClock } from 'react-icons/bs'
import { MdPayment, MdPending, MdCheckCircle } from 'react-icons/md'
import { HiCheckCircle, HiXCircle } from 'react-icons/hi'

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
    user_email: string
    user_name: string
  }
  budget: number
  estimated_hours: number
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

export default function ProposalInlineNew({ projectId, userRole }: ProposalInlineProps) {
  const [project, setProject] = useState<Project | null>(null)
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState<string | null>(null)

  // Form states
  const [analysis, setAnalysis] = useState('')
  const [depositAmount, setDepositAmount] = useState(0)
  const [duration, setDuration] = useState(0)
  const [phases, setPhases] = useState<any[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [deliverables, setDeliverables] = useState<any[]>([])
  const [approvals, setApprovals] = useState({
    analysis: false,
    deposit: false,
    phases: false,
    team: false,
    commitments: false
  })

  // Payment modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [submittingPayment, setSubmittingPayment] = useState(false)
  const [showPhasePaymentModal, setShowPhasePaymentModal] = useState<number | null>(null)
  const [processingPhase, setProcessingPhase] = useState(false)

  useEffect(() => {
    if (projectId) {
      loadData()
    }
  }, [projectId])

  const loadData = async () => {
    try {
      // Load Project
      const projectResponse = await projectsAPI.get(projectId)
      setProject(projectResponse.data)

      // Load Proposal
      const proposalResponse = await proposalsAPI.list(projectId)

      if (proposalResponse.data && proposalResponse.data.length > 0) {
        const p = proposalResponse.data[0]
        setProposal(p)
        setAnalysis(p.project_analysis || '')
        setDepositAmount(p.deposit_amount || 0)
        setDuration(p.estimated_duration_days || 0)
        setPhases(p.phases || [])
        setTeamMembers(p.team_members || [])
        setDeliverables(p.deliverables || [])
        setApprovals(p.customer_approvals || approvals)
      } else {
        // Pre-fill for new proposal
        const projectData = projectResponse.data
        if (projectData.description) setAnalysis(projectData.description)
        if (projectData.budget) setDepositAmount(Number(projectData.budget) * 0.3)
        if (projectData.estimated_hours) setDuration(Math.ceil(Number(projectData.estimated_hours) / 8))

        // Default 6 team members
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

      setLoading(false)
    } catch (err: any) {
      console.error('Failed to load data:', err)
      setLoading(false)
    }
  }

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  // Render star rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1 text-yellow-500">
        {[...Array(5)].map((_, i) => (
          i < Math.floor(rating)
            ? <AiFillStar key={i} className="w-4 h-4" />
            : <AiOutlineStar key={i} className="w-4 h-4" />
        ))}
        <span className="text-sm ml-1 text-gray-600 font-medium">({rating}/5)</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header with better typography */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold mb-3 flex items-center gap-3">
          <FiFileText className="w-8 h-8" />
          Bản Thương Thảo Dự Án
        </h1>
        <p className="text-blue-100 text-lg">
          Xây dựng hệ thống quản lý mình bạch cho khách hàng: <span className="font-semibold">{project?.name}</span>
        </p>
      </div>

      {/* Modern Section Card Component */}
      {/* Section 1: Project Analysis - Phân Tích Dự Án */}
      <SectionCard
        title="Phân Tích Dự Án"
        icon={<FiFileText />}
        approved={approvals.analysis}
        editMode={editMode === 'analysis'}
        onEdit={() => setEditMode(editMode === 'analysis' ? null : 'analysis')}
        onApprove={() => {}}
        userRole={userRole}
      >
        {editMode === 'analysis' && userRole === 'sale' ? (
          <div className="space-y-4">
            <textarea
              value={analysis}
              onChange={(e) => setAnalysis(e.target.value)}
              className="w-full border-2 border-blue-200 rounded-xl p-4 h-32 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
              placeholder="Nhập phân tích dự án chi tiết..."
            />
            <button
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <FiSave className="w-5 h-5" />
              Lưu
            </button>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-6 whitespace-pre-wrap text-gray-700 leading-relaxed border border-gray-200">
            {analysis || <span className="text-gray-400 italic">Chưa có phân tích</span>}
          </div>
        )}
      </SectionCard>

      {/* Continue with other sections... */}
      <div className="text-center text-gray-500 italic py-8">
        More sections to be added...
      </div>
    </div>
  )
}

// Reusable Section Card Component with modern design
interface SectionCardProps {
  title: string
  icon: React.ReactNode
  approved: boolean
  editMode: boolean
  onEdit: () => void
  onApprove: () => void
  userRole: 'sale' | 'customer'
  children: React.ReactNode
}

function SectionCard({ title, icon, approved, editMode, onEdit, onApprove, userRole, children }: SectionCardProps) {
  return (
    <div className={`rounded-2xl overflow-hidden shadow-lg transition-all duration-300 ${
      approved
        ? 'ring-2 ring-green-400 bg-gradient-to-br from-green-50 to-emerald-50'
        : 'bg-white hover:shadow-xl'
    }`}>
      {/* Card Header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Approval Status Icon */}
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl ${
              approved ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'
            }`}>
              {approved ? <FiCheckCircle /> : icon}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">{title}</h3>
              {approved && (
                <p className="text-sm text-green-600 font-medium flex items-center gap-1">
                  <FiCheck className="w-4 h-4" />
                  Đã đồng ý
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {userRole === 'customer' && !approved && (
              <button
                onClick={onApprove}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2 font-medium"
              >
                <FiCheck className="w-5 h-5" />
                Đồng ý
              </button>
            )}
            {userRole === 'sale' && (
              <button
                onClick={onEdit}
                className={`px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center gap-2 font-medium ${
                  editMode
                    ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
                }`}
              >
                {editMode ? (
                  <>
                    <FiX className="w-5 h-5" />
                    Hủy
                  </>
                ) : (
                  <>
                    <FiEdit2 className="w-5 h-5" />
                    Chỉnh sửa
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}
