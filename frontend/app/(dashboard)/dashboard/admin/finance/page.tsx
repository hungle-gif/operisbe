'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface FinanceDashboard {
  summary: {
    total_revenue: number
    total_deposit: number
    total_phase_payments: number
    pending_revenue: number
    total_projects: number
    completed_projects: number
    in_progress_projects: number
  }
}

interface ProjectFinancial {
  project_id: string
  project_name: string
  financial_summary: {
    total_contract_value: number
    total_paid: number
    total_pending: number
    payment_progress_percent: number
  }
}

export default function AdminFinancePage() {
  const router = useRouter()
  const [dashboard, setDashboard] = useState<FinanceDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [topCustomers, setTopCustomers] = useState<any[]>([])
  const [paymentStatus, setPaymentStatus] = useState<any>(null)

  useEffect(() => {
    loadFinanceDashboard()
    loadTopCustomers()
    loadPaymentStatus()
  }, [])

  const loadFinanceDashboard = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/finance/finance/dashboard`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setDashboard(data)
      }
    } catch (err) {
      console.error('Failed to load finance dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadTopCustomers = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/finance/finance/top-customers?limit=5`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setTopCustomers(data.top_customers)
      }
    } catch (err) {
      console.error('Failed to load top customers:', err)
    }
  }

  const loadPaymentStatus = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/finance/finance/payment-status-summary`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setPaymentStatus(data)
      }
    } catch (err) {
      console.error('Failed to load payment status:', err)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Finance Dashboard</h1>
          <p className="text-gray-600">Revenue statistics and financial overview</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Revenue */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Total Revenue</h3>
              <svg className="w-8 h-8 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(dashboard?.summary.total_revenue || 0)}</p>
            <p className="text-sm mt-2 opacity-90">
              From {dashboard?.summary.completed_projects || 0} completed projects
            </p>
          </div>

          {/* Deposit Collected */}
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Deposit Collected</h3>
              <svg className="w-8 h-8 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(dashboard?.summary.total_deposit || 0)}</p>
            <p className="text-sm mt-2 opacity-90">Initial deposits from clients</p>
          </div>

          {/* Phase Payments */}
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Phase Payments</h3>
              <svg className="w-8 h-8 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(dashboard?.summary.total_phase_payments || 0)}</p>
            <p className="text-sm mt-2 opacity-90">Milestone-based payments</p>
          </div>

          {/* Pending Revenue */}
          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Pending Revenue</h3>
              <svg className="w-8 h-8 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(dashboard?.summary.pending_revenue || 0)}</p>
            <p className="text-sm mt-2 opacity-90">From {dashboard?.summary.in_progress_projects || 0} active projects</p>
          </div>
        </div>

        {/* Payment Status Overview */}
        {paymentStatus && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Deposit Status */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Deposit Status</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Paid Deposits:</span>
                  <span className="font-bold text-green-600">{paymentStatus.deposits.paid_count}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Pending Deposits:</span>
                  <span className="font-bold text-orange-600">{paymentStatus.deposits.pending_count}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Payment Rate:</span>
                  <span className="font-bold text-blue-600">{paymentStatus.deposits.payment_rate_percent}%</span>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-500">Paid Amount:</span>
                    <span className="text-sm font-semibold">{formatCurrency(paymentStatus.deposits.total_paid_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Pending Amount:</span>
                    <span className="text-sm font-semibold">{formatCurrency(paymentStatus.deposits.total_pending_amount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Phase Payment Status */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Phase Payment Status</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Phases:</span>
                  <span className="font-bold text-gray-900">{paymentStatus.phases.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Paid Phases:</span>
                  <span className="font-bold text-green-600">{paymentStatus.phases.paid}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Pending Phases:</span>
                  <span className="font-bold text-orange-600">{paymentStatus.phases.pending}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Payment Rate:</span>
                  <span className="font-bold text-blue-600">{paymentStatus.phases.payment_rate_percent}%</span>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-500">Paid Revenue:</span>
                    <span className="text-sm font-semibold">{formatCurrency(paymentStatus.phases.total_revenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Pending Revenue:</span>
                    <span className="text-sm font-semibold">{formatCurrency(paymentStatus.phases.pending_revenue)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top Customers */}
        {topCustomers.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Top Customers by Revenue</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Rank</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Customer</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Email</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-600">Projects</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-600">Total Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.map((customer, index) => (
                    <tr key={customer.customer_id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' :
                          index === 1 ? 'bg-gray-100 text-gray-700' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        } font-bold`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium">{customer.customer_name}</td>
                      <td className="py-3 px-4 text-gray-600">{customer.customer_email}</td>
                      <td className="py-3 px-4 text-right">{customer.project_count}</td>
                      <td className="py-3 px-4 text-right font-bold text-green-600">
                        {formatCurrency(customer.total_revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
