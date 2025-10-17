import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface RoleProtectionOptions {
  allowedRoles: string[]
  redirectTo?: string
}

/**
 * Hook to protect routes based on user role
 *
 * Usage:
 *   useRoleProtection({ allowedRoles: ['admin'] })
 *   useRoleProtection({ allowedRoles: ['sale', 'sales'] })
 */
export function useRoleProtection({ allowedRoles, redirectTo }: RoleProtectionOptions) {
  const router = useRouter()

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('access_token') || localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    // Check role
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      router.push('/login')
      return
    }

    const user = JSON.parse(userStr)
    const userRole = user.role

    // Normalize roles
    const normalizeRole = (role: string) => {
      if (role === 'sales' || role === 'sale') return 'sale'
      if (role === 'developer' || role === 'dev') return 'dev'
      return role
    }

    const normalizedUserRole = normalizeRole(userRole)
    const normalizedAllowedRoles = allowedRoles.map(normalizeRole)

    // Check if user role is allowed
    if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
      // Redirect to appropriate dashboard
      if (redirectTo) {
        router.push(redirectTo)
      } else {
        const rolePathMap: Record<string, string> = {
          admin: '/dashboard/admin',
          sale: '/dashboard/sales',
          sales: '/dashboard/sales',
          dev: '/dashboard/developer',
          developer: '/dashboard/developer',
          customer: '/dashboard/customer'
        }
        const userDashboard = rolePathMap[userRole] || '/dashboard/customer'
        router.push(userDashboard)
      }
    }
  }, [allowedRoles, redirectTo, router])
}
