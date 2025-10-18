'use client'

import { useState, useEffect } from 'react'
import { FiClock, FiCalendar, FiCheckCircle } from 'react-icons/fi'

interface ProjectCountdownProps {
  startDate: string // ISO date string
  estimatedDurationDays: number
  status?: string
}

export default function ProjectCountdown({
  startDate,
  estimatedDurationDays,
  status
}: ProjectCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
    totalDays: 0,
    progress: 0
  })

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const start = new Date(startDate)
      const end = new Date(start)
      end.setDate(end.getDate() + estimatedDurationDays)

      const now = new Date()
      const totalMs = end.getTime() - now.getTime()

      if (totalMs <= 0) {
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
          totalDays: estimatedDurationDays,
          progress: 100
        })
        return
      }

      const days = Math.floor(totalMs / (1000 * 60 * 60 * 24))
      const hours = Math.floor((totalMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((totalMs % (1000 * 60)) / 1000)

      // Calculate progress
      const totalProjectMs = estimatedDurationDays * 24 * 60 * 60 * 1000
      const elapsedMs = totalProjectMs - totalMs
      const progress = Math.min(100, Math.max(0, (elapsedMs / totalProjectMs) * 100))

      setTimeRemaining({
        days,
        hours,
        minutes,
        seconds,
        isExpired: false,
        totalDays: estimatedDurationDays,
        progress
      })
    }

    calculateTimeRemaining()
    const interval = setInterval(calculateTimeRemaining, 1000)

    return () => clearInterval(interval)
  }, [startDate, estimatedDurationDays])

  // If project is completed, show success message
  if (status === 'completed') {
    return (
      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <FiCheckCircle className="text-3xl" />
          <h3 className="text-xl font-bold">Dự Án Đã Hoàn Thành!</h3>
        </div>
        <p className="text-sm opacity-90">
          Dự án đã được hoàn thành thành công trong {estimatedDurationDays} ngày.
        </p>
      </div>
    )
  }

  // If expired but not completed
  if (timeRemaining.isExpired) {
    return (
      <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <FiClock className="text-3xl" />
          <h3 className="text-xl font-bold">Dự Án Đã Quá Hạn</h3>
        </div>
        <p className="text-sm opacity-90">
          Thời gian dự kiến {estimatedDurationDays} ngày đã kết thúc.
        </p>
        <p className="text-xs opacity-75 mt-2">
          Vui lòng liên hệ với đội ngũ hỗ trợ để biết thêm thông tin.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <FiClock className="text-3xl animate-pulse" />
        <div>
          <h3 className="text-xl font-bold">Thời Gian Còn Lại</h3>
          <p className="text-xs opacity-75">Dự án {timeRemaining.totalDays} ngày</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1 opacity-90">
          <span>Tiến độ</span>
          <span>{timeRemaining.progress.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
          <div
            className="bg-white h-full rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${timeRemaining.progress}%` }}
          />
        </div>
      </div>

      {/* Countdown Display */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-white/10 rounded-lg p-3 text-center backdrop-blur-sm">
          <div className="text-3xl font-bold">{timeRemaining.days}</div>
          <div className="text-xs opacity-75 mt-1">Ngày</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3 text-center backdrop-blur-sm">
          <div className="text-3xl font-bold">{timeRemaining.hours}</div>
          <div className="text-xs opacity-75 mt-1">Giờ</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3 text-center backdrop-blur-sm">
          <div className="text-3xl font-bold">{timeRemaining.minutes}</div>
          <div className="text-xs opacity-75 mt-1">Phút</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3 text-center backdrop-blur-sm">
          <div className="text-3xl font-bold">{timeRemaining.seconds}</div>
          <div className="text-xs opacity-75 mt-1">Giây</div>
        </div>
      </div>

      {/* Start Date Info */}
      <div className="flex items-center gap-2 text-xs opacity-75 border-t border-white/20 pt-3">
        <FiCalendar />
        <span>Bắt đầu: {new Date(startDate).toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })}</span>
      </div>
    </div>
  )
}
