'use client'

import { useEffect, useState } from 'react'

export default function TestDirectWebSocketPage() {
  const [messages, setMessages] = useState<string[]>([])
  const [isConnected, setIsConnected] = useState(false)

  const addMessage = (message: string) => {
    setMessages(prev => [...prev, `${new Date().toISOString()}: ${message}`])
  }

  useEffect(() => {
    const wsUrl = 'ws://localhost:8000/collaboration?docname=direct-test'
    
    addMessage(`Attempting direct WebSocket connection to: ${wsUrl}`)

    try {
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        addMessage('✅ Direct WebSocket connection opened')
        setIsConnected(true)
        
        // Don't send test data, just wait for server to send initial state
        addMessage('� Waiting for Y.js server response...')
      }

      ws.onmessage = (event) => {
        addMessage(`📨 Received message: ${event.data} (type: ${typeof event.data})`)
      }

      ws.onclose = (event) => {
        addMessage(`❌ WebSocket connection closed: code=${event.code}, reason="${event.reason}"`)
        setIsConnected(false)
      }

      ws.onerror = (event) => {
        addMessage(`🚨 WebSocket error occurred`)
        console.error('WebSocket error:', event)
      }

      return () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close()
          addMessage('🔌 WebSocket connection closed on cleanup')
        }
      }
    } catch (error) {
      addMessage(`❌ Error creating WebSocket: ${error}`)
      console.error('WebSocket creation error:', error)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Direct WebSocket Test</h1>
        
        {/* Connection Status */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
          <div className="flex items-center space-x-2">
            <div className={`w-4 h-4 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={`font-medium ${isConnected ? 'text-green-700' : 'text-red-700'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Log Messages */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Log Messages</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
            {messages.map((message, index) => (
              <div key={index} className="mb-1">
                {message}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
