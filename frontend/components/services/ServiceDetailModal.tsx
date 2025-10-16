import { useState } from 'react'
import { servicesAPI } from '@/lib/api'

interface ServiceDetailModalProps {
  service: any
  onClose: () => void
}

export default function ServiceDetailModal({ service, onClose }: ServiceDetailModalProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [formData, setFormData] = useState({
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    company_name: '',
    project_description: '',
    budget_range: '',
    expected_timeline: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      await servicesAPI.createRequest({
        service_id: service.id,
        ...formData
      })
      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (error) {
      console.error('Error submitting request:', error)
      alert('Có lỗi xảy ra. Vui lòng thử lại!')
    } finally {
      setSubmitting(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="relative w-full max-w-5xl bg-white shadow-xl rounded-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-2xl font-bold">{service.name}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex border-b">
            <button onClick={() => setActiveTab('overview')} className={`px-6 py-3 ${activeTab === 'overview' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-600'}`}>Tổng quan</button>
            <button onClick={() => setActiveTab('process')} className={`px-6 py-3 ${activeTab === 'process' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-600'}`}>Quy trình</button>
            <button onClick={() => setActiveTab('team')} className={`px-6 py-3 ${activeTab === 'team' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-600'}`}>Đội ngũ</button>
            <button onClick={() => setActiveTab('register')} className={`px-6 py-3 ${activeTab === 'register' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-600'}`}>Đăng ký</button>
          </div>

          <div className="p-6 max-h-96 overflow-y-auto">
            {activeTab === 'overview' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Giới thiệu</h3>
                  <p className="text-gray-700">{service.full_description}</p>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Điểm khác biệt Operis</h3>
                  <ul className="space-y-2">
                    {service.differentiators?.map((diff: string, idx: number) => (
                      <li key={idx} className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>{diff}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-600">Thời gian</div>
                    <div className="text-lg font-semibold">{service.estimated_duration_min}-{service.estimated_duration_max} ngày</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Chi phí</div>
                    <div className="text-lg font-semibold text-blue-600">
                      {formatPrice(service.price_range_min)} - {formatPrice(service.price_range_max)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'process' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Các giai đoạn thực hiện</h3>
                <div className="space-y-4">
                  {service.process_stages?.map((stage: any, idx: number) => (
                    <div key={idx} className="flex">
                      <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">{stage.stage}</div>
                      <div className="ml-4 flex-1">
                        <h4 className="font-semibold">{stage.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{stage.duration}</p>
                        {stage.description && <p className="text-sm text-gray-700 mt-2">{stage.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'team' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Đội ngũ dự kiến</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(service.team_structure || {}).map(([role, count]: any) => (
                    <div key={role} className="p-4 bg-gray-50 rounded-lg">
                      <div className="font-semibold">{role}</div>
                      <div className="text-2xl font-bold text-blue-600">{count} người</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'register' && (
              <div>
                {success ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-16 w-16 text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-xl font-semibold mb-2">Gửi yêu cầu thành công!</h3>
                    <p className="text-gray-600">Chúng tôi sẽ liên hệ với bạn sớm nhất.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Họ và tên *</label>
                        <input type="text" required value={formData.contact_name} onChange={e => setFormData({...formData, contact_name: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Email *</label>
                        <input type="email" required value={formData.contact_email} onChange={e => setFormData({...formData, contact_email: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Số điện thoại *</label>
                        <input type="tel" required value={formData.contact_phone} onChange={e => setFormData({...formData, contact_phone: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Công ty</label>
                        <input type="text" value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Mô tả dự án *</label>
                      <textarea required rows={4} value={formData.project_description} onChange={e => setFormData({...formData, project_description: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="Mô tả chi tiết về dự án..." />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Ngân sách</label>
                        <select value={formData.budget_range} onChange={e => setFormData({...formData, budget_range: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                          <option value="">Chọn mức</option>
                          <option>Dưới 50 triệu</option>
                          <option>50-100 triệu</option>
                          <option>100-200 triệu</option>
                          <option>Trên 200 triệu</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Thời gian mong muốn</label>
                        <input type="text" value={formData.expected_timeline} onChange={e => setFormData({...formData, expected_timeline: e.target.value})} placeholder="VD: 2-3 tháng" className="w-full px-3 py-2 border rounded-lg" />
                      </div>
                    </div>

                    <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
                      {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
