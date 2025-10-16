'use client'

import { useEffect, useState } from 'react'
import { servicesAPI } from '@/lib/api'
import ServiceCard from '@/components/services/ServiceCard'
import ServiceDetailModal from '@/components/services/ServiceDetailModal'

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedService, setSelectedService] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadServices()
  }, [])

  const loadServices = async () => {
    try {
      const response = await servicesAPI.list({ is_active: true })
      setServices(response.data)
    } catch (error) {
      console.error('Error loading services:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleServiceClick = async (slug: string) => {
    try {
      const response = await servicesAPI.get(slug)
      setSelectedService(response.data)
      setShowModal(true)
    } catch (error) {
      console.error('Error loading service details:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Đang tải...</div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dịch vụ của Operis</h1>
        <p className="mt-2 text-gray-600">
          Khám phá các dịch vụ phát triển phần mềm chuyên nghiệp
        </p>
      </div>

      {/* Featured Services */}
      {services.filter(s => s.is_featured).length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Dịch vụ nổi bật
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services
              .filter(s => s.is_featured)
              .map(service => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onClick={() => handleServiceClick(service.slug)}
                  featured
                />
              ))}
          </div>
        </div>
      )}

      {/* All Services */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Tất cả dịch vụ
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(service => (
            <ServiceCard
              key={service.id}
              service={service}
              onClick={() => handleServiceClick(service.slug)}
            />
          ))}
        </div>
      </div>

      {/* Empty State */}
      {services.length === 0 && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p className="mt-2 text-gray-500">Chưa có dịch vụ nào</p>
        </div>
      )}

      {/* Service Detail Modal */}
      {showModal && selectedService && (
        <ServiceDetailModal
          service={selectedService}
          onClose={() => {
            setShowModal(false)
            setSelectedService(null)
          }}
        />
      )}
    </div>
  )
}
