/**
 * API client for backend communication
 */
import axios from 'axios'

// FORCE port 8001 to avoid conflict with background process on 8000
const API_URL = 'http://localhost:8001'

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Track refresh state
let isRedirecting = false
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: any) => void
  reject: (reason?: any) => void
}> = []

const processQueue = (error: any = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve()
    }
  })
  failedQueue = []
}

// Response interceptor with automatic token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refresh_token')

      if (refreshToken && !isRefreshing) {
        isRefreshing = true
        originalRequest._retry = true

        try {
          console.log('🔄 Access token expired. Refreshing...')

          // Call refresh endpoint directly (avoid interceptor loop)
          const response = await axios.post(`${API_URL}/api/auth/refresh`, {
            refresh_token: refreshToken
          })

          const { access_token, refresh_token: new_refresh_token } = response.data

          // Update tokens
          localStorage.setItem('access_token', access_token)
          localStorage.setItem('token', access_token)
          if (new_refresh_token) {
            localStorage.setItem('refresh_token', new_refresh_token)
          }

          // Update header
          api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
          originalRequest.headers['Authorization'] = `Bearer ${access_token}`

          console.log('✅ Token refreshed successfully')

          processQueue(null)
          isRefreshing = false

          // Retry original request
          return api(originalRequest)

        } catch (refreshError) {
          console.log('❌ Refresh token failed')
          processQueue(refreshError)
          isRefreshing = false

          // Logout
          if (!isRedirecting) {
            isRedirecting = true
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            localStorage.removeItem('token')
            localStorage.removeItem('user')

            console.log('⚠️ Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')

            const currentPath = window.location.pathname
            const returnUrl = currentPath !== '/login'
              ? `?returnUrl=${encodeURIComponent(currentPath)}`
              : ''

            setTimeout(() => {
              window.location.href = `/login${returnUrl}`
            }, 100)
          }

          return Promise.reject(refreshError)
        }
      }

      // Queue request if already refreshing
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(() => {
            originalRequest.headers['Authorization'] = `Bearer ${localStorage.getItem('access_token')}`
            return api(originalRequest)
          })
          .catch(err => Promise.reject(err))
      }

      // No refresh token → logout
      if (!refreshToken && !isRedirecting) {
        isRedirecting = true
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('token')
        localStorage.removeItem('user')

        console.log('⚠️ No refresh token. Please login again.')

        const currentPath = window.location.pathname
        const returnUrl = currentPath !== '/login'
          ? `?returnUrl=${encodeURIComponent(currentPath)}`
          : ''

        setTimeout(() => {
          window.location.href = `/login${returnUrl}`
        }, 100)
      }
    }

    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refresh_token: refreshToken }),
}

// User API
export const userAPI = {
  getMe: () => api.get('/users/me'),
  list: (params?: any) => api.get('/users', { params }),
  get: (id: string) => api.get(`/users/${id}`),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
}

// Services API
export const servicesAPI = {
  list: (params?: any) => api.get('/services', { params }),
  get: (slug: string) => api.get(`/services/${slug}`),
  create: (data: any) => api.post('/services', data),

  // Service Requests
  createRequest: (data: any) => api.post('/services/requests', data),
  listRequests: (params?: any) => api.get('/services/requests', { params }),
  getRequest: (id: string) => api.get(`/services/requests/${id}`),
  updateRequest: (id: string, data: any) => api.put(`/services/requests/${id}`, data),
}

// Projects API
export const projectsAPI = {
  list: (params?: any) => api.get('/projects', { params }),
  get: (id: string) => api.get(`/projects/${id}`),

  // Chat
  listMessages: (projectId: string, limit?: number) =>
    api.get(`/projects/${projectId}/messages`, { params: { limit } }),
  sendMessage: (projectId: string, data: any) =>
    api.post(`/projects/${projectId}/messages`, data),
  markMessageRead: (projectId: string, messageId: string) =>
    api.post(`/projects/${projectId}/messages/${messageId}/read`),
  getUnreadCount: (projectId: string) =>
    api.get(`/projects/${projectId}/unread-count`),
}

// Proposals API
export const proposalsAPI = {
  // List proposals for a project
  list: (projectId: string) => api.get(`/projects/${projectId}/proposals`),

  // Get single proposal
  get: (proposalId: string) => api.get(`/proposals/${proposalId}`),

  // Create new proposal (sales only)
  create: (projectId: string, data: any) => api.post(`/projects/${projectId}/proposals`, data),

  // Update proposal (sales only, draft only)
  update: (proposalId: string, data: any) => api.put(`/proposals/${proposalId}`, data),

  // Send proposal to customer (sales only)
  send: (proposalId: string) => api.post(`/proposals/${proposalId}/send`, {}),

  // Customer accepts proposal
  accept: (proposalId: string, data?: any) => api.post(`/proposals/${proposalId}/accept`, data || {}),

  // Customer rejects proposal
  reject: (proposalId: string, data?: any) => api.post(`/proposals/${proposalId}/reject`, data || {}),

  // === DEPOSIT PAYMENT (Initial payment) ===
  // Customer submits deposit payment notification (waiting for admin approval)
  submitPayment: (proposalId: string) => api.post(`/proposals/${proposalId}/submit-payment`, {}),

  // Admin/Sales approves customer's deposit payment submission
  approvePayment: (proposalId: string) => api.post(`/proposals/${proposalId}/approve-payment`, {}),

  // Admin/Sales rejects customer's deposit payment submission
  rejectPayment: (proposalId: string) => api.post(`/proposals/${proposalId}/reject-payment`, {}),

  // === PHASE-BASED PAYMENT (Per milestone) ===
  // Sales/Admin marks phase as completed
  markPhaseComplete: (proposalId: string, phaseIndex: number) =>
    api.post(`/proposals/${proposalId}/phases/${phaseIndex}/complete`, {}),

  // Customer submits phase payment
  submitPhasePayment: (proposalId: string, phaseIndex: number) =>
    api.post(`/proposals/${proposalId}/phases/${phaseIndex}/submit-payment`, {}),

  // Admin/Sales approves phase payment
  approvePhasePayment: (proposalId: string, phaseIndex: number) =>
    api.post(`/proposals/${proposalId}/phases/${phaseIndex}/approve-payment`, {}),

  // Admin/Sales rejects phase payment
  rejectPhasePayment: (proposalId: string, phaseIndex: number) =>
    api.post(`/proposals/${proposalId}/phases/${phaseIndex}/reject-payment`, {}),

  // [DEPRECATED] Use approvePayment instead
  confirmPayment: (proposalId: string) => api.post(`/proposals/${proposalId}/confirm-payment`, {}),
}
