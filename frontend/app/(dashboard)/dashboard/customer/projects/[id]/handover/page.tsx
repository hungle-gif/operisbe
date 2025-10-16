'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { projectsAPI } from '@/lib/api'
import {
  FiCheckCircle, FiStar, FiDownload, FiMessageSquare,
  FiTool, FiZap, FiArrowLeft, FiAlertTriangle
} from 'react-icons/fi'
import { AiFillStar, AiOutlineStar } from 'react-icons/ai'

export default function ProjectHandoverPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Form states
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [complaint, setComplaint] = useState('')
  const [upgradeRequest, setUpgradeRequest] = useState('')
  const [featureRequest, setFeatureRequest] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadProject()
  }, [projectId])

  const loadProject = async () => {
    try {
      const response = await projectsAPI.get(projectId)
      setProject(response.data)
      setLoading(false)
    } catch (err) {
      console.error('Failed to load project:', err)
      setLoading(false)
    }
  }

  const handleSubmitHandover = async () => {
    // Validate: At least one field must be filled
    if (!feedback.trim() && !complaint.trim() && !upgradeRequest.trim() && !featureRequest.trim() && rating === 0) {
      alert('⚠️ Vui lòng nhập ít nhất một nội dung (đánh giá, ý kiến, khiếu nại, hoặc yêu cầu)!')
      return
    }

    setSubmitting(true)
    try {
      // Submit feedback to API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/feedback/projects/${projectId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          rating: rating || null,
          feedback: feedback || 'Không có đánh giá',
          complaint: complaint || null,
          upgrade_request: upgradeRequest || null,
          feature_request: featureRequest || null
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to submit feedback')
      }

      alert('✅ Cảm ơn bạn đã gửi phản hồi!\n\nChúng tôi sẽ xem xét và liên hệ bạn sớm nhất.')
      router.push(`/dashboard/customer/projects/${projectId}`)
    } catch (err: any) {
      alert(`❌ Lỗi: ${err.message}\nVui lòng thử lại.`)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const getRatingText = () => {
    switch (rating) {
      case 5: return '⭐ Xuất sắc!'
      case 4: return '👍 Rất tốt!'
      case 3: return '😊 Tốt'
      case 2: return '😐 Trung bình'
      case 1: return '😞 Cần cải thiện'
      default: return ''
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl p-8 text-white shadow-xl">
        <div className="text-center">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <FiCheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold mb-3">🎉 Dự Án Hoàn Thành!</h1>
          <p className="text-green-100 text-xl mb-2 font-semibold">{project?.name}</p>
          <p className="text-green-200 text-lg">
            Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của chúng tôi
          </p>
        </div>
      </div>

      {/* Rating Section */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-100 hover:border-yellow-300 transition-colors">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
            <FiStar className="w-6 h-6 text-yellow-600" />
          </div>
          Đánh Giá Dự Án
        </h2>
        <p className="text-gray-600 mb-6">Bạn hài lòng thế nào với dự án này?</p>

        <div className="flex justify-center gap-3 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="transition-all duration-200 transform hover:scale-125 focus:outline-none"
            >
              {star <= (hoverRating || rating) ? (
                <AiFillStar className="w-14 h-14 text-yellow-500" />
              ) : (
                <AiOutlineStar className="w-14 h-14 text-gray-300" />
              )}
            </button>
          ))}
        </div>

        {rating > 0 && (
          <p className="text-center text-lg font-semibold text-gray-700 animate-fadeIn">
            {getRatingText()}
          </p>
        )}
      </div>

      {/* Feedback Section */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-100 hover:border-blue-300 transition-colors">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <FiMessageSquare className="w-6 h-6 text-blue-600" />
          </div>
          Đóng Góp Ý Kiến
        </h2>
        <p className="text-gray-600 mb-4">Chia sẻ trải nghiệm của bạn về dự án</p>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="w-full border-2 border-gray-200 rounded-xl p-4 h-40 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none resize-none transition-all"
          placeholder="Hãy cho chúng tôi biết về trải nghiệm của bạn: chất lượng sản phẩm, đội ngũ phát triển, thời gian bàn giao, hỗ trợ khách hàng..."
          required
        />
        <p className="text-sm text-gray-500 mt-2">
          {feedback.length}/500 ký tự
        </p>
      </div>

      {/* Complaint Section */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-100 hover:border-red-300 transition-colors">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <FiAlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          Khiếu Nại (Nếu có)
        </h2>
        <p className="text-gray-600 mb-4">Bạn có vấn đề gì cần phản ánh không?</p>
        <textarea
          value={complaint}
          onChange={(e) => setComplaint(e.target.value)}
          className="w-full border-2 border-gray-200 rounded-xl p-4 h-32 focus:border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none resize-none transition-all"
          placeholder="VD: Chất lượng sản phẩm không đúng yêu cầu, trễ deadline, thiếu tính năng đã cam kết, hỗ trợ chưa tốt..."
        />
      </div>

      {/* Upgrade Request */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-100 hover:border-purple-300 transition-colors">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <FiTool className="w-6 h-6 text-purple-600" />
          </div>
          Yêu Cầu Nâng Cấp / Bảo Trì
        </h2>
        <p className="text-gray-600 mb-4">Bạn có muốn nâng cấp hoặc bảo trì hệ thống không?</p>
        <textarea
          value={upgradeRequest}
          onChange={(e) => setUpgradeRequest(e.target.value)}
          className="w-full border-2 border-gray-200 rounded-xl p-4 h-32 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none resize-none transition-all"
          placeholder="VD: Tối ưu hiệu suất, nâng cấp bảo mật, thay đổi giao diện, bảo trì định kỳ..."
        />
      </div>

      {/* Feature Request */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-100 hover:border-orange-300 transition-colors">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <FiZap className="w-6 h-6 text-orange-600" />
          </div>
          Đề Xuất Chức Năng Mới
        </h2>
        <p className="text-gray-600 mb-4">Bạn muốn thêm tính năng gì vào hệ thống?</p>
        <textarea
          value={featureRequest}
          onChange={(e) => setFeatureRequest(e.target.value)}
          className="w-full border-2 border-gray-200 rounded-xl p-4 h-32 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none resize-none transition-all"
          placeholder="VD: Thêm module báo cáo, tích hợp thanh toán online, ứng dụng mobile, chatbot AI..."
        />
      </div>

      {/* Document Download */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-8 border-2 border-blue-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <FiDownload className="w-6 h-6 text-white" />
          </div>
          Tài Liệu Bàn Giao
        </h2>
        <div className="space-y-3">
          <button className="w-full px-6 py-4 bg-white border-2 border-blue-300 text-blue-700 rounded-xl hover:bg-blue-50 hover:border-blue-400 transition-all font-semibold flex items-center justify-between group">
            <span className="flex items-center gap-2">
              📄 Tài liệu hướng dẫn sử dụng
            </span>
            <FiDownload className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
          </button>
          <button className="w-full px-6 py-4 bg-white border-2 border-blue-300 text-blue-700 rounded-xl hover:bg-blue-50 hover:border-blue-400 transition-all font-semibold flex items-center justify-between group">
            <span className="flex items-center gap-2">
              🔑 Thông tin đăng nhập & mật khẩu
            </span>
            <FiDownload className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
          </button>
          <button className="w-full px-6 py-4 bg-white border-2 border-blue-300 text-blue-700 rounded-xl hover:bg-blue-50 hover:border-blue-400 transition-all font-semibold flex items-center justify-between group">
            <span className="flex items-center gap-2">
              💾 Mã nguồn & Database backup
            </span>
            <FiDownload className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 sticky bottom-6 z-10">
        <button
          onClick={() => router.push(`/dashboard/customer/projects/${projectId}`)}
          className="flex-1 px-8 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold shadow-lg flex items-center justify-center gap-2"
        >
          <FiArrowLeft className="w-5 h-5" />
          Quay lại dự án
        </button>
        <button
          onClick={handleSubmitHandover}
          disabled={submitting}
          className="flex-1 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-bold text-lg shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Đang gửi...
            </>
          ) : (
            <>
              <FiCheckCircle className="w-6 h-6" />
              Hoàn Tất Bàn Giao
            </>
          )}
        </button>
      </div>
    </div>
  )
}
