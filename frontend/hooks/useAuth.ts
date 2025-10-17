import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AuthOptions {
  requiredRole?: string | string[]
  redirectTo?: string
}

export function useAuth(options: AuthOptions = {}) {
  const router = useRouter()
  const { requiredRole, redirectTo = '/login' } = options

  useEffect(() => {
    // Check if token exists
    const token = localStorage.getItem('access_token') || localStorage.getItem('token')

    if (!token) {
      router.push(redirectTo)
      return
    }

    // Check role if specified
    if (requiredRole) {
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        router.push(redirectTo)
        return
      }

      const user = JSON.parse(userStr)
      const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]

      // Handle role variations (dev/developer, sale/sales)
      const normalizeRole = (role: string) => {
        if (role === 'developer' || role === 'dev') return 'dev'
        if (role === 'sales' || role === 'sale') return 'sale'
        return role
      }

      const userRoleNormalized = normalizeRole(user.role)
      const isAuthorized = allowedRoles.some(role => normalizeRole(role) === userRoleNormalized)

      if (!isAuthorized) {
        // Redirect to their own dashboard
        const rolePathMap: Record<string, string> = {
          admin: '/dashboard/admin',
          sale: '/dashboard/sales',
          sales: '/dashboard/sales',
          dev: '/dashboard/developer',
          developer: '/dashboard/developer',
          customer: '/dashboard/customer'
        }
        const userDashboard = rolePathMap[user.role] || '/dashboard/customer'
        router.push(userDashboard)
      }
    }
  }, [requiredRole, redirectTo, router])
}
