'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { authAPI } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState('')

  useEffect(() => {
    // Check if user was redirected due to token expiration
    const returnUrl = searchParams.get('returnUrl')
    if (returnUrl) {
      setSessionExpiredMessage('⚠️ Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSessionExpiredMessage('')
    setLoading(true)

    try {
      const response = await authAPI.login(formData)
      const { access_token, refresh_token, user } = response.data

      // Save tokens to localStorage
      localStorage.setItem('token', access_token)
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', refresh_token)
      localStorage.setItem('user', JSON.stringify(user))

      // Debug: Log user role
      console.log('User role:', user.role)
      console.log('Token saved to localStorage')

      // Check if there's a return URL
      const returnUrl = searchParams.get('returnUrl')

      if (returnUrl && returnUrl.startsWith('/dashboard')) {
        // Redirect back to the page they were on
        window.location.href = returnUrl
        return
      }

      // Otherwise redirect based on user role
      let redirectPath = '/dashboard'
      switch (user.role) {
        case 'admin':
          redirectPath = '/dashboard/admin'
          break
        case 'sale':
        case 'sales':
          redirectPath = '/dashboard/sales'
          break
        case 'dev':
        case 'developer':
          redirectPath = '/dashboard/developer'
          break
        case 'customer':
          redirectPath = '/dashboard/customer'
          break
      }

      console.log('Final redirect path:', redirectPath)
      // Use window.location for hard navigation
      window.location.href = redirectPath
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-2xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">OPERIS</h1>
          <h2 className="text-2xl font-semibold text-gray-700">Đăng nhập</h2>
          <p className="mt-2 text-sm text-gray-600">
            Hệ thống quản lý công ty phần mềm
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {sessionExpiredMessage && (
            <div className="bg-yellow-50 border border-yellow-400 text-yellow-800 px-4 py-3 rounded relative">
              <span className="block sm:inline">{sessionExpiredMessage}</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Ghi nhớ đăng nhập
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                Quên mật khẩu?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span>Đang đăng nhập...</span>
              ) : (
                <span>Đăng nhập</span>
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Chưa có tài khoản?{' '}
              <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Demo accounts</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="bg-gray-50 p-2 rounded">
              <p className="font-semibold text-gray-700">Admin</p>
              <p className="text-gray-600">admin@operis.com</p>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <p className="font-semibold text-gray-700">Sale</p>
              <p className="text-gray-600">sale@operis.com</p>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <p className="font-semibold text-gray-700">Developer</p>
              <p className="text-gray-600">dev@operis.com</p>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <p className="font-semibold text-gray-700">Customer</p>
              <p className="text-gray-600">customer@operis.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
