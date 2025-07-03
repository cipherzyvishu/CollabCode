import { io, Socket } from 'socket.io-client'
import { ClientToServerEvents, ServerToClientEvents } from '@/shared/types'

type SocketType = Socket<ServerToClientEvents, ClientToServerEvents>

class SocketManager {
  private socket: SocketType | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  connect(userId: string): SocketType {
    if (this.socket?.connected) {
      console.log('🔌 Socket already connected')
      return this.socket
    }

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8000'
    console.log('🔌 Connecting to Socket.IO server:', socketUrl)
    
    this.socket = io(socketUrl, {
      transports: ['polling', 'websocket'], // Try polling first, then websocket
      auth: {
        userId,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 10000,
      forceNew: true,
    }) as SocketType

    this.setupEventListeners()
    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  getSocket(): SocketType | null {
    return this.socket
  }

  private setupEventListeners() {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('✅ Connected to Socket.IO server')
      console.log('📡 Socket ID:', this.socket?.id)
      console.log('🚀 Transport:', this.socket?.io.engine.transport.name)
      this.reconnectAttempts = 0
    })

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from server:', reason)
      if (reason === 'io server disconnect') {
        // the disconnection was initiated by the server, reconnect manually
        this.socket?.connect()
      }
    })

    this.socket.on('connect_error', (error) => {
      console.error('🔥 Connection error:', error.message)
      console.error('🔥 Error details:', error)
      this.reconnectAttempts++
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('❌ Max reconnection attempts reached')
      }
    })

    // Log transport upgrades
    this.socket.io.on('upgrade', () => {
      console.log('⬆️ Transport upgraded to:', this.socket?.io.engine.transport.name)
    })

    this.socket.io.on('upgradeError', (error) => {
      console.error('🔥 Transport upgrade error:', error)
    })
  }

  // Helper methods for common socket operations
  joinSession(sessionId: string, userId: string) {
    this.socket?.emit('joinSession', { sessionId, userId })
  }

  leaveSession(sessionId: string, userId: string) {
    this.socket?.emit('leaveSession', { sessionId, userId })
  }

  sendCodeChange(sessionId: string, code: string, userId: string) {
    this.socket?.emit('codeChange', { sessionId, code, userId })
  }

  sendCursorMove(sessionId: string, position: { line: number; column: number }, userId: string) {
    this.socket?.emit('cursorMove', { sessionId, position, userId })
  }

  requestAI(sessionId: string, code: string, userId: string) {
    this.socket?.emit('requestAI', { sessionId, code, userId })
  }

  runCode(sessionId: string, code: string, userId: string, language: string) {
    this.socket?.emit('run_code', { sessionId, code, userId, language })
  }
}

// Export singleton instance
export const socketManager = new SocketManager()
export default socketManager
