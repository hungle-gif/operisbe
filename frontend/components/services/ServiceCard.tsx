interface ServiceCardProps {
  service: any
  onClick: () => void
  featured?: boolean
}

export default function ServiceCard({ service, onClick, featured }: ServiceCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group ${
        featured ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      {featured && (
        <div className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 inline-block">
          NỔI BẬT
        </div>
      )}

      <div className="p-6">
        <div className="flex items-center mb-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-xl font-semibold text-gray-900">{service.name}</h3>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {service.short_description}
        </p>

        <div className="flex items-center text-sm text-gray-500 mb-4">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{service.estimated_duration_min}-{service.estimated_duration_max} ngày</span>
        </div>

        {service.price_range_min && service.price_range_max && (
          <div className="border-t pt-4">
            <div className="text-sm text-gray-500 mb-1">Chi phí ước tính</div>
            <div className="text-lg font-semibold text-blue-600">
              {formatPrice(service.price_range_min)} - {formatPrice(service.price_range_max)}
            </div>
          </div>
        )}

        <button className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium">
          Xem chi tiết
        </button>
      </div>
    </div>
  )
}