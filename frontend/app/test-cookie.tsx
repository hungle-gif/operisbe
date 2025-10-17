'use client'

import { useEffect, useState } from 'react'

export default function TestCookiePage() {
  const [cookies, setCookies] = useState('')
  const [localStorage, setLocalStorage] = useState<any>({})

  useEffect(() => {
    setCookies(document.cookie)
    setLocalStorage({
      token: window.localStorage.getItem('token'),
      access_token: window.localStorage.getItem('access_token'),
      user: window.localStorage.getItem('user')
    })
  }, [])

  const testSetCookie = () => {
    const testToken = 'test_token_123'
    document.cookie = `access_token=${testToken}; path=/; max-age=86400`
    document.cookie = `token=${testToken}; path=/; max-age=86400`
    alert('Cookies set! Refresh page to see changes.')
  }

  const clearAll = () => {
    // Clear localStorage
    window.localStorage.clear()

    // Clear cookies
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'

    alert('Cleared! Refresh to see changes.')
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Cookie & LocalStorage Test</h1>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Cookies:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {cookies || 'No cookies found'}
          </pre>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">LocalStorage:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(localStorage, null, 2)}
          </pre>
        </div>

        <div className="flex gap-4">
          <button
            onClick={testSetCookie}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Test Set Cookies
          </button>
          <button
            onClick={clearAll}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  )
}
