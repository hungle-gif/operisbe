'use client'

import { useState, useEffect, useRef } from 'react'
import { projectsAPI } from '@/lib/api'

interface Message {
  id: string
  sender: {
    id: string
    full_name: string
    email: string
    role: string
  }
  message: string
  message_type: string
  created_at: string
  is_read: boolean
}

interface ChatBoxProps {
  projectId: string
  currentUserId: string
}

export default function ChatBox({ projectId, currentUserId }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadMessages = async () => {
    try {
      const response = await projectsAPI.listMessages(projectId, 100)
      setMessages(response.data)
      setLoading(false)
      setTimeout(scrollToBottom, 100)
    } catch (error) {
      console.error('Failed to load messages:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMessages()
    // Poll for new messages every 5 seconds
    const interval = setInterval(loadMessages, 5000)
    return () => clearInterval(interval)
  }, [projectId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      await projectsAPI.sendMessage(projectId, {
        message: newMessage,
        message_type: 'text'
      })
      setNewMessage('')
      // Reload messages immediately after sending
      await loadMessages()
    } catch (error) {
      console.error('Failed to send message:', error)
      alert('Không thể gửi tin nhắn. Vui lòng thử lại.')
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Vừa xong'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`

    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isMyMessage = (message: Message) => message.sender.id === currentUserId

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Chat với Sale</h3>
            <p className="text-sm text-blue-100">Trả lời trong vài phút</p>
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ maxHeight: 'calc(100vh - 400px)', minHeight: '400px' }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-lg">Chưa có tin nhắn nào</p>
            <p className="text-sm">Bắt đầu cuộc trò chuyện với sale của bạn</p>
          </div>
        ) : (
          <>
            {messages.map((message) => {
              const isMe = isMyMessage(message)
              const isSystem = message.message_type === 'system'

              if (isSystem) {
                return (
                  <div key={message.id} className="flex justify-center">
                    <div className="bg-gray-100 text-gray-600 text-xs px-4 py-2 rounded-full">
                      {message.message}
                    </div>
                  </div>
                )
              }

              return (
                <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-3 max-w-[70%] ${isMe ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                      isMe ? 'bg-blue-500' : 'bg-green-500'
                    }`}>
                      {message.sender.full_name.charAt(0).toUpperCase()}
                    </div>

                    {/* Message Bubble */}
                    <div>
                      <div className={`rounded-2xl px-4 py-3 ${
                        isMe
                          ? 'bg-blue-500 text-white rounded-tr-none'
                          : 'bg-gray-100 text-gray-900 rounded-tl-none'
                      }`}>
                        {!isMe && (
                          <p className="text-xs font-semibold mb-1 text-gray-600">
                            {message.sender.full_name}
                          </p>
                        )}
                        <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
                      </div>
                      <p className={`text-xs text-gray-400 mt-1 ${isMe ? 'text-right' : 'text-left'}`}>
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-xl">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Nhập tin nhắn..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full font-semibold hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Đang gửi...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
                Gửi
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
