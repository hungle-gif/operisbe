'use client'

import { useState } from 'react'

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
  key_features?: string[]
  differentiators?: string[]
  process_stages?: {
    stage: number
    name: string
    description: string
    duration: string
  }[]
  team_structure?: Record<string, number>
  technologies?: string[]
}

interface ServiceAccordionProps {
  service: Service
  isOpen: boolean
  onToggle: () => void
  isLoadingDetails?: boolean
}

export default function ServiceAccordion({ service, isOpen, onToggle, isLoadingDetails }: ServiceAccordionProps) {
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
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        } overflow-hidden`}
      >
        <div className="px-6 pb-6 space-y-6 border-t border-gray-100 pt-6">
          {isLoadingDetails ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Đang tải chi tiết...</p>
            </div>
          ) : (
            <>
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

              {/* Process Stages */}
              {service.process_stages && service.process_stages.length > 0 && (
                <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Quy trình thực hiện
            </h4>
            <div className="space-y-4">
              {service.process_stages.map((stage, idx) => (
                <div key={idx} className="relative">
                  {idx < service.process_stages.length - 1 && (
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
                      <p className="text-sm text-gray-600">{stage.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
                </div>
              )}

              {/* Team Structure */}
              {service.team_structure && Object.keys(service.team_structure).length > 0 && (
                <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Đội ngũ thực hiện
            </h4>
            <div className="flex flex-wrap gap-3">
              {Object.entries(service.team_structure).map(([role, count]) => (
                <div key={role} className="bg-purple-50 rounded-lg px-4 py-2 border border-purple-200">
                  <div className="text-sm font-medium text-gray-900">{role}</div>
                  <div className="text-xs text-purple-600 font-semibold">{count} người</div>
                </div>
              ))}
            </div>
                </div>
              )}

              {/* CTA Button */}
              <div className="pt-4">
            <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Đăng ký tư vấn ngay
            </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
