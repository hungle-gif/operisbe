'use client'

import { useState } from 'react'
import { servicesAPI } from '@/lib/api'

interface TeamMember {
  role: string
  name: string
  avatar: string
  rating: number
  experience: string
  description: string
}

interface ProcessStage {
  stage: number
  name: string
  duration: string
  description: string
  details?: string[]
  commitment?: Record<string, string>
  supervision?: string
  warranty_packages?: string[]
}

interface Challenge {
  type: string
  title: string
  description: string
  solution: string
}

interface Service {
  id: string
  name: string
  slug: string
  category: string
  short_description: string
  icon: string
  estimated_duration_min: number
  estimated_duration_max: number
  price_range_min: number
  price_range_max: number
  estimated_team_size?: number
  full_description?: string
  key_features?: (string | Challenge)[]  // Can be strings OR challenge objects
  differentiators?: string[]
  process_stages?: ProcessStage[]
  team_structure?: {
    members?: TeamMember[]
  }
  technologies?: string[]
}

interface ServiceAccordionProps {
  service: Service
  isOpen: boolean
  onToggle: () => void
  isLoadingDetails?: boolean
}

const FUNCTION_OPTIONS = [
  'Admin (Quản trị hệ thống)',
  'Sale (Bán hàng)',
  'Marketing',
  'Kế toán',
  'Chăm sóc khách hàng',
  'Developer (Lập trình viên)',
  'Quản lý nhân sự (HR)',
  'Kho vận',
  'Báo cáo & Thống kê',
  'Khác (vui lòng ghi rõ)'
]

export default function ServiceAccordionV2({ service, isOpen, onToggle, isLoadingDetails }: ServiceAccordionProps) {
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    contact_phone: '',
    zalo_number: '',
    contact_email: '',
    system_users_count: '',
    required_functions: [] as string[],
    other_function_description: '',
    special_requirements: '',
    workflow_description: ''
  })

  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price)
  }

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, JSX.Element> = {
      building: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      globe: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      ),
    }
    return icons[iconName] || icons.building
  }

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    const stars = []

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <svg key={i} className="w-4 h-4 text-yellow-400" viewBox="0 0 20 20">
            <defs>
              <linearGradient id={`half-${i}`}>
                <stop offset="50%" stopColor="currentColor" stopOpacity="1" />
                <stop offset="50%" stopColor="currentColor" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            <path fill={`url(#half-${i})`} d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )
      } else {
        stars.push(
          <svg key={i} className="w-4 h-4 text-gray-300 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )
      }
    }

    return <div className="flex gap-0.5">{stars}</div>
  }

  const handleFunctionToggle = (func: string) => {
    setFormData(prev => ({
      ...prev,
      required_functions: prev.required_functions.includes(func)
        ? prev.required_functions.filter(f => f !== func)
        : [...prev.required_functions, func]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const response = await servicesAPI.createRequest({
        service_id: service.id,
        ...formData,
        system_users_count: parseInt(formData.system_users_count)
      })

      // Redirect to project page if project_id is returned
      if (response.data.project_id) {
        window.location.href = `/dashboard/customer/projects/${response.data.project_id}`
      } else {
        setSuccess(true)
        // Reset form
        setFormData({
          company_name: '',
          contact_name: '',
          contact_phone: '',
          zalo_number: '',
          contact_email: '',
          system_users_count: '',
          required_functions: [],
          other_function_description: '',
          special_requirements: '',
          workflow_description: ''
        })
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-300">
      {/* Header - Always Visible */}
      <div
        onClick={onToggle}
        className="cursor-pointer p-6 hover:bg-gray-50 transition-colors duration-200"
      >
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
            {getIconComponent(service.icon)}
          </div>

          {/* Title and Description */}
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              {service.name}
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                  isOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">{service.short_description}</p>
          </div>

          {/* Stats - Quick View */}
          <div className="hidden lg:flex gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {formatPrice(service.price_range_min)}
              </div>
              <div className="text-xs text-gray-500 mt-1">Chi phí TB</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {service.estimated_duration_min} ngày
              </div>
              <div className="text-xs text-gray-500 mt-1">Thời gian TB</div>
            </div>
            {service.estimated_team_size && (
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {service.estimated_team_size} người
                </div>
                <div className="text-xs text-gray-500 mt-1">Nhân sự TB</div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 lg:hidden">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {(service.price_range_min / 1000000).toFixed(0)}M
            </div>
            <div className="text-xs text-gray-500">Chi phí TB</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {service.estimated_duration_min} ngày
            </div>
            <div className="text-xs text-gray-500">Thời gian</div>
          </div>
          {service.estimated_team_size && (
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                {service.estimated_team_size} người
              </div>
              <div className="text-xs text-gray-500">Nhân sự</div>
            </div>
          )}
        </div>
      </div>

      {/* Expandable Content */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
        } overflow-hidden`}
      >
        <div className="px-6 pb-6 space-y-8 border-t border-gray-100 pt-6">
          {isLoadingDetails ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Đang tải chi tiết...</p>
            </div>
          ) : (
            <>
              {/* Challenges Section - BEFORE Differentiators */}
              {service.key_features && Array.isArray(service.key_features) && service.key_features.length > 0 && typeof service.key_features[0] === 'object' && service.key_features[0] !== null && 'title' in service.key_features[0] && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Những vấn đề khó giải quyết khi làm hệ thống tùy biến
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {(service.key_features as Challenge[]).map((feature: Challenge, idx) => (
                      <div key={idx} className="bg-red-50 border-2 border-red-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h5 className="font-bold text-red-900 mb-1">{feature.title}</h5>
                            <p className="text-sm text-red-700">{feature.description}</p>
                          </div>
                        </div>
                        <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
                          <p className="text-xs text-green-900">
                            <strong className="text-green-700">✓ Giải pháp Operis:</strong> {feature.solution}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Differentiators */}
              {service.differentiators && service.differentiators.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Điểm khác biệt của Operis
                  </h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    {service.differentiators.map((diff, idx) => (
                      <div key={idx} className="flex items-start gap-2 bg-blue-50 p-3 rounded-lg">
                        <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-gray-700">{diff}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Process Stages - Enhanced */}
              {service.process_stages && service.process_stages.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Quy trình thực hiện chi tiết
                  </h4>
                  <div className="space-y-4">
                    {service.process_stages.map((stage, idx) => (
                      <div key={idx} className="relative">
                        {idx < service.process_stages!.length - 1 && (
                          <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500 to-gray-200"></div>
                        )}
                        <div className="flex gap-4">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold shadow-md z-10">
                            {stage.stage}
                          </div>
                          <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-semibold text-gray-900">{stage.name}</h5>
                              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                                {stage.duration}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{stage.description}</p>

                            {/* Details */}
                            {stage.details && stage.details.length > 0 && (
                              <ul className="space-y-1.5 mb-3">
                                {stage.details.map((detail, detailIdx) => (
                                  <li key={detailIdx} className="flex items-start gap-2 text-sm text-gray-700">
                                    <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span>{detail}</span>
                                  </li>
                                ))}
                              </ul>
                            )}

                            {/* Commitment (for stage 1) */}
                            {stage.commitment && (
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                                <div className="font-medium text-sm text-yellow-900 mb-2 flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                  Cam kết bồi thường khi chậm tiến độ:
                                </div>
                                <ul className="text-sm text-yellow-800 space-y-1">
                                  {Object.entries(stage.commitment).map(([key, value]) => (
                                    <li key={key} className="flex items-center gap-2">
                                      <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                                      <span>{value}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Supervision (for stage 2) */}
                            {stage.supervision && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mt-2 text-sm text-blue-800">
                                <strong>Lưu ý:</strong> {stage.supervision}
                              </div>
                            )}

                            {/* Warranty packages (for stage 4) */}
                            {stage.warranty_packages && (
                              <div className="mt-3">
                                <div className="font-medium text-sm text-gray-900 mb-2">Gói bảo hành:</div>
                                <div className="grid gap-2">
                                  {stage.warranty_packages.map((pkg, pkgIdx) => (
                                    <div key={pkgIdx} className="flex items-center gap-2 text-sm text-gray-700 bg-white p-2 rounded border border-gray-200">
                                      <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                      {pkg}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Team Members with Ratings */}
              {service.team_structure?.members && service.team_structure.members.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Đội ngũ thực hiện dự án
                  </h4>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {service.team_structure.members.map((member, idx) => (
                      <div key={idx} className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-12 h-12 rounded-full border-2 border-white shadow-md"
                          />
                          <div className="flex-1 min-w-0">
                            <h5 className="font-semibold text-gray-900 text-sm">{member.name}</h5>
                            <p className="text-xs text-purple-600 font-medium">{member.role}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {renderStars(member.rating)}
                              <span className="text-xs font-semibold text-gray-700">{member.rating.toFixed(1)}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mt-2">{member.experience}</p>
                        <p className="text-xs text-gray-500 mt-1 italic">{member.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Registration Form */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                <h4 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Đăng ký tư vấn miễn phí
                </h4>
                <p className="text-sm text-gray-600 mb-6">
                  Điền thông tin chi tiết để chúng tôi tư vấn giải pháp phù hợp nhất cho doanh nghiệp của bạn
                </p>

                {success ? (
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
                    <p className="font-semibold">Đăng ký thành công!</p>
                    <p className="text-sm mt-1">Chúng tôi sẽ liên hệ với bạn trong vòng 24h. Cảm ơn bạn đã tin tưởng Operis!</p>
                    <button
                      onClick={() => setSuccess(false)}
                      className="mt-3 text-sm underline hover:no-underline"
                    >
                      Đăng ký dịch vụ khác
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Company Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tên công ty <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.company_name}
                          onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="VD: Công ty TNHH ABC"
                        />
                      </div>

                      {/* Contact Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tên người yêu cầu <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.contact_name}
                          onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="VD: Nguyễn Văn A"
                        />
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Số điện thoại <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={formData.contact_phone}
                          onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="VD: 0901234567"
                        />
                      </div>

                      {/* Zalo */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Số Zalo <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={formData.zalo_number}
                          onChange={(e) => setFormData({ ...formData, zalo_number: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="VD: 0901234567"
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.contact_email}
                          onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="VD: example@company.com"
                        />
                      </div>

                      {/* System Users Count */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Số lượng người sử dụng hệ thống <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={formData.system_users_count}
                          onChange={(e) => setFormData({ ...formData, system_users_count: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="VD: 20"
                        />
                      </div>
                    </div>

                    {/* Required Functions */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chức năng cần có <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {FUNCTION_OPTIONS.map((func) => (
                          <label
                            key={func}
                            className={`flex items-center gap-2 p-2 rounded-lg border-2 cursor-pointer transition-all ${
                              formData.required_functions.includes(func)
                                ? 'border-blue-500 bg-blue-50 text-blue-900'
                                : 'border-gray-200 bg-white hover:border-blue-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={formData.required_functions.includes(func)}
                              onChange={() => handleFunctionToggle(func)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm">{func}</span>
                          </label>
                        ))}
                      </div>
                      {formData.required_functions.length === 0 && (
                        <p className="text-xs text-red-500 mt-1">Vui lòng chọn ít nhất 1 chức năng</p>
                      )}

                      {/* Other Function Description - Show when "Khác" is selected */}
                      {formData.required_functions.includes('Khác (vui lòng ghi rõ)') && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Vui lòng ghi rõ chức năng khác <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.other_function_description}
                            onChange={(e) => setFormData({ ...formData, other_function_description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="VD: Quản lý vận chuyển, Tích hợp ERP bên thứ 3..."
                          />
                        </div>
                      )}
                    </div>

                    {/* Special Requirements */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Những yêu cầu đặc biệt <span className="text-red-500">*</span>
                      </label>
                      <p className="text-xs text-gray-500 mb-2">
                        VD: Sử dụng hình ảnh là chính, cần tính năng upload ảnh hàng loạt, tích hợp camera AI...
                      </p>
                      <textarea
                        required
                        rows={4}
                        value={formData.special_requirements}
                        onChange={(e) => setFormData({ ...formData, special_requirements: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Mô tả chi tiết các yêu cầu đặc biệt của bạn..."
                      />
                    </div>

                    {/* Workflow Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mô tả chi tiết luồng công việc <span className="text-red-500">*</span>
                      </label>
                      <p className="text-xs text-gray-500 mb-2">
                        Càng chi tiết càng tốt! Mô tả từ bước bắt đầu đến khi kết thúc công việc trong doanh nghiệp của bạn.
                        Đây là điểm khác biệt của Operis - tùy biến 100% theo luồng riêng của bạn.
                      </p>
                      <textarea
                        required
                        rows={6}
                        value={formData.workflow_description}
                        onChange={(e) => setFormData({ ...formData, workflow_description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="VD: Bước 1: Khách hàng gọi điện đặt hàng → Bước 2: Nhân viên sale nhập đơn vào hệ thống → Bước 3: Bộ phận kho kiểm tra hàng → ..."
                      />
                    </div>

                    {error && (
                      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting || formData.required_functions.length === 0}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Đang gửi...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          Gửi đăng ký ngay
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
