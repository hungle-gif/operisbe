'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ServiceAccordionV2 from '@/components/services/ServiceAccordionV2'
import { servicesAPI, projectsAPI } from '@/lib/api'

interface ServiceSummary {
  id: string
  name: string
  slug: string
  category: string
  short_description: string
  icon: string
  thumbnail: string | null
  is_featured: boolean
  estimated_duration_min: number
  estimated_duration_max: number
  price_range_min: number
  price_range_max: number
}

interface ServiceDetail extends ServiceSummary {
  full_description: string
  key_features: string[]
  differentiators: string[]
  process_stages: {
    stage: number
    name: string
    description: string
    duration: string
  }[]
  team_structure: Record<string, number>
  estimated_team_size: number
  technologies: string[]
}

interface NegotiationProject {
  id: string
  name: string
  status: string
  project_manager?: {
    full_name: string
    email: string
  }
  created_at: string
}

export default function CustomerDashboard() {
  const router = useRouter()
  const [services, setServices] = useState<ServiceSummary[]>([])
  const [serviceDetails, setServiceDetails] = useState<Record<string, ServiceDetail>>({})
  const [loading, setLoading] = useState(true)
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({})
  const [openServiceId, setOpenServiceId] = useState<string | null>(null)
  const [negotiationProjects, setNegotiationProjects] = useState<NegotiationProject[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await servicesAPI.list({ is_active: true })
        setServices(response.data)
      } catch (error) {
        console.error('Error fetching services:', error)
      } finally {
        setLoading(false)
      }
    }

    const fetchNegotiationProjects = async () => {
      try {
        const response = await projectsAPI.list({ status: 'negotiation' })
        setNegotiationProjects(response.data)
      } catch (error) {
        console.error('Error fetching negotiation projects:', error)
      } finally {
        setLoadingProjects(false)
      }
    }

    fetchServices()
    fetchNegotiationProjects()
  }, [])

  const handleToggle = async (service: ServiceSummary) => {
    const serviceId = service.id

    // If already open, just close it
    if (openServiceId === serviceId) {
      setOpenServiceId(null)
      return
    }

    // Open the accordion
    setOpenServiceId(serviceId)

    // If details not loaded yet, fetch them
    if (!serviceDetails[serviceId]) {
      setLoadingDetails({ ...loadingDetails, [serviceId]: true })
      try {
        const response = await servicesAPI.get(service.slug)
        setServiceDetails({
          ...serviceDetails,
          [serviceId]: response.data,
        })
      } catch (error) {
        console.error('Error fetching service details:', error)
      } finally {
        setLoadingDetails({ ...loadingDetails, [serviceId]: false })
      }
    }
  }

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-gray-900">Customer Dashboard</h1>
        <a
          href="/dashboard/customer/projects"
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z" />
          </svg>
          Dự án của tôi
        </a>
      </div>
      <p className="text-gray-600 mb-8">Khám phá các dịch vụ của chúng tôi và bắt đầu dự án của bạn</p>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Dự án đang chạy</p>
              <p className="text-3xl font-bold mt-1">0</p>
            </div>
            <svg className="w-12 h-12 text-blue-300 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Đã hoàn thành</p>
              <p className="text-3xl font-bold mt-1">0</p>
            </div>
            <svg className="w-12 h-12 text-green-300 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Dịch vụ khả dụng</p>
              <p className="text-3xl font-bold mt-1">{services.length}</p>
            </div>
            <svg className="w-12 h-12 text-purple-300 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        </div>
      </div>

      {/* Negotiation Projects Section - PROMINENT */}
      {!loadingProjects && negotiationProjects.length > 0 && (
        <div className="mb-8">
          <div className="bg-gradient-to-r from-yellow-50 via-orange-50 to-red-50 rounded-2xl border-2 border-yellow-300 shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center animate-pulse">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Dự án đang thương thảo</h2>
                  <p className="text-sm text-gray-600">Nhấn vào để chat với sale phụ trách</p>
                </div>
              </div>
              <span className="px-4 py-2 bg-yellow-400 text-yellow-900 rounded-full text-sm font-bold">
                {negotiationProjects.length} dự án
              </span>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {negotiationProjects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => router.push(`/dashboard/customer/projects/${project.id}`)}
                  className="bg-white rounded-xl border-2 border-yellow-200 p-5 hover:border-yellow-400 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z" />
                      </svg>
                    </div>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                      Thương thảo
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {project.name}
                  </h3>

                  {project.project_manager && (
                    <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {project.project_manager.full_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-700 truncate">
                          {project.project_manager.full_name}
                        </p>
                        <p className="text-xs text-gray-500">Sale phụ trách</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      <span>{new Date(project.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="flex items-center gap-1 text-blue-600 font-semibold text-sm group-hover:gap-2 transition-all">
                      <span>Chat ngay</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-yellow-200">
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">Sale sẽ liên hệ với bạn trong vài phút.</span>
                Chat ngay để thương thảo nhanh hơn!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Services Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Dịch vụ của Operis</h2>
          <div className="text-sm text-gray-500">
            Nhấn vào dịch vụ để xem chi tiết
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Đang tải dịch vụ...</p>
          </div>
        ) : services.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="mt-4 text-gray-600">Chưa có dịch vụ nào khả dụng</p>
          </div>
        ) : (
          <div className="space-y-4">
            {services.map((service) => {
              const detail = serviceDetails[service.id]
              const isLoading = loadingDetails[service.id]

              return (
                <ServiceAccordionV2
                  key={service.id}
                  service={detail || service}
                  isOpen={openServiceId === service.id}
                  onToggle={() => handleToggle(service)}
                  isLoadingDetails={isLoading}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
