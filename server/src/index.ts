import { Server } from 'socket.io'
import { createServer } from 'http'
import dotenv from 'dotenv'
import logger from './utils/logger'
import { setupSocketHandlers } from './events/socketHandlers'
import { YjsWebSocketServer } from './utils/yjsServer'
import { ClientToServerEvents, ServerToClientEvents } from '@/shared/types'

// Load environment variables
dotenv.config()

const PORT = process.env.PORT || 8000
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3456', 'http://localhost:3000']

// Create HTTP server (minimal, just for Socket.IO)
const httpServer = createServer()

// Create Socket.IO server with CORS configuration
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
})

// Set up Socket.IO event handlers
setupSocketHandlers(io)

// Initialize Y.js WebSocket server
const yjsServer = new YjsWebSocketServer(httpServer, '/collaboration')

// Global error handling
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  yjsServer.close()
  httpServer.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully')
  yjsServer.close()
  httpServer.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })
})

// Start server
httpServer.listen(Number(PORT), 'localhost', () => {
  logger.info(`🚀 CollabCode Socket.IO Server running on localhost:${PORT}`)
  logger.info(`🔗 Y.js WebSocket Server available at ws://localhost:${PORT}`)
  logger.info(`📡 Accepting connections from: ${ALLOWED_ORIGINS.join(', ')}`)
})

export { io }
