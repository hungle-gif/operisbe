'use client'

import { FiCheck, FiX, FiAlertCircle } from 'react-icons/fi'

interface ApprovalModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  sectionTitle: string
  sectionDescription?: string
}

export default function ApprovalModal({
  isOpen,
  onClose,
  onConfirm,
  sectionTitle,
  sectionDescription
}: ApprovalModalProps) {
  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fadeIn">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiAlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            Xác nhận đồng ý
          </h3>
          <p className="text-gray-600">
            Bạn có chắc chắn đồng ý với{' '}
            <span className="font-bold text-blue-600">{sectionTitle}</span>?
          </p>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded">
          <div className="flex items-start gap-2">
            <FiAlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-800 font-semibold mb-1">Lưu ý quan trọng:</p>
              <p className="text-sm text-yellow-700">
                Sau khi đồng ý, bạn sẽ <strong>không thể thay đổi</strong> quyết định này.
                Vui lòng đọc kỹ nội dung trước khi xác nhận.
              </p>
            </div>
          </div>
        </div>

        {/* Section Description */}
        {sectionDescription && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">{sectionDescription}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold flex items-center justify-center gap-2"
          >
            <FiX className="w-5 h-5" />
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-semibold flex items-center justify-center gap-2 shadow-lg"
          >
            <FiCheck className="w-5 h-5" />
            Đồng ý
          </button>
        </div>
      </div>
    </div>
  )
}
