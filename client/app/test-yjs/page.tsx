'use client'

import { useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

export default function TestYjsPage() {
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<string[]>([])
  const docRef = useRef<Y.Doc | null>(null)
  const providerRef = useRef<WebsocketProvider | null>(null)

  const addMessage = (message: string) => {
    setMessages(prev => [...prev, `${new Date().toISOString()}: ${message}`])
  }

  useEffect(() => {
    // Initialize Y.js document
    const ydoc = new Y.Doc()
    docRef.current = ydoc
    
    // Initialize WebSocket provider
    const wsUrl = 'ws://localhost:8000'
    const docName = 'test-session-123'
    
    addMessage(`Connecting to ${wsUrl} with document ${docName}`)
    
    try {
      // Try different configurations
      const provider = new WebsocketProvider(wsUrl, docName, ydoc, {
        connect: true,
        params: {}
      })
      providerRef.current = provider

      // Log WebSocket object creation
      addMessage(`WebSocket provider created, connecting to room: ${docName}`)

      // More detailed event handling
      provider.on('status', (event: any) => {
        addMessage(`WebSocket status: ${event.status}`)
        setIsConnected(event.status === 'connected')
      })

      provider.on('sync', (synced: boolean) => {
        addMessage(`Y.js sync status: ${synced}`)
      })

      provider.on('connection-close', (event: any) => {
        addMessage(`WebSocket connection closed: ${JSON.stringify(event)}`)
      })

      provider.on('connection-error', (event: any) => {
        addMessage(`WebSocket connection error: ${JSON.stringify(event)}`)
      })

      // Monitor the underlying WebSocket
      const monitorWs = () => {
        if (provider.ws) {
          addMessage(`WebSocket readyState: ${provider.ws.readyState} (0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED)`)
          addMessage(`WebSocket URL: ${provider.ws.url}`)
        } else {
          addMessage('WebSocket object not yet created')
        }
      }

      setTimeout(monitorWs, 500)
      setTimeout(monitorWs, 1500)
      setTimeout(monitorWs, 3000)

      // Check connection status periodically
      const checkStatus = () => {
        addMessage(`Provider state - wsconnected: ${provider.wsconnected}, wsconnecting: ${provider.wsconnecting}`)
        monitorWs()
      }

      setTimeout(checkStatus, 2000)
      setTimeout(checkStatus, 4000)
      setTimeout(checkStatus, 6000)

      // Test Y.js text collaboration
      const ytext = ydoc.getText('code')
      
      ytext.observe((event) => {
        addMessage(`Y.js text changed: ${ytext.toString()}`)
      })

      // Add some test content after connection
      setTimeout(() => {
        if (provider.wsconnected) {
          ytext.insert(0, 'Hello from Y.js test!')
          addMessage('Inserted test text')
        } else {
          addMessage('WebSocket not connected, cannot insert text')
          // Try to force connection
          addMessage('Attempting to connect...')
          provider.connect()
        }
      }, 2000)

    } catch (error) {
      addMessage(`Error initializing Y.js: ${error}`)
      console.error('Y.js initialization error:', error)
    }

    return () => {
      if (providerRef.current) {
        providerRef.current.destroy()
        addMessage('Y.js provider destroyed')
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Y.js WebSocket Test</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Connection Status */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
            <div className="flex items-center space-x-2">
              <div className={`w-4 h-4 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={`font-medium ${isConnected ? 'text-green-700' : 'text-red-700'}`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          {/* Test Actions */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
            <div className="space-y-2">
              <button
                onClick={() => {
                  if (docRef.current && providerRef.current?.wsconnected) {
                    const ytext = docRef.current.getText('code')
                    ytext.insert(ytext.length, '\nNew line added!')
                    addMessage('Added new line to document')
                  } else {
                    addMessage('Cannot add text - not connected')
                  }
                }}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add Text to Document
              </button>
              
              <button
                onClick={() => {
                  if (docRef.current) {
                    const ytext = docRef.current.getText('code')
                    addMessage(`Current document content: "${ytext.toString()}"`)
                  }
                }}
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Get Document Content
              </button>
            </div>
          </div>
        </div>

        {/* Log Messages */}
        <div className="mt-8">
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
    </div>
  )
}
