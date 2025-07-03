import { WebSocket, WebSocketServer } from 'ws'
import logger from './logger'

// Import the setupWSConnection function using the correct export path
const { setupWSConnection } = require('@y/websocket-server/utils')

export class YjsWebSocketServer {
  private wss: WebSocketServer
  private server: any

  constructor(server: any, path: string = '/collaboration') {
    this.server = server
    
    // Create WebSocket server attached to the HTTP server
    this.wss = new WebSocketServer({ 
      noServer: true
    })

    this.setupConnections()
    
    // Handle upgrade event on the HTTP server
    server.on('upgrade', (request: any, socket: any, head: any) => {
      const url = new URL(request.url!, `http://${request.headers.host}`)
      
      // Check if this is a Y.js WebSocket request
      // Y.js WebSocket URLs have the document name in the path
      if (url.pathname.startsWith('/session-') || url.pathname === '/collaboration' || url.pathname.startsWith('/collaboration/')) {
        logger.info(`🔗 Y.js WebSocket upgrade request for path: ${url.pathname}`)
        
        // You may check auth of request here if needed
        // For now, we allow all connections
        this.wss.handleUpgrade(request, socket, head, (ws: WebSocket) => {
          this.wss.emit('connection', ws, request)
        })
      }
    })

    logger.info(`🔗 Y.js WebSocket server initialized on path: ${path}`)
  }

  private setupConnections() {
    this.wss.on('connection', (ws: WebSocket, req: any) => {
      try {
        const url = new URL(req.url!, `http://${req.headers.host}`)
        // Extract document name from URL path
        let docname = url.pathname.slice(1) // Remove leading slash
        if (docname.startsWith('collaboration/')) {
          docname = docname.replace('collaboration/', '')
        }
        if (!docname || docname === 'collaboration') {
          docname = 'default-doc'
        }
        
        logger.info(`📡 Y.js WebSocket connection established for document: ${docname}`)
        
        // Use the official y-websocket server connection handler
        setupWSConnection(ws, req)

        ws.on('close', () => {
          logger.info(`📡 Y.js WebSocket connection closed for document: ${docname}`)
        })

        ws.on('error', (error: any) => {
          logger.error(`📡 Y.js WebSocket error for document: ${docname}:`, error)
        })

      } catch (error) {
        logger.error('Error setting up Y.js WebSocket connection:', error)
        ws.close(1011, 'Server error')
      }
    })

    this.wss.on('error', (error: any) => {
      logger.error('Y.js WebSocket server error:', error)
    })
  }

  // Get basic statistics
  getStats() {
    return {
      totalConnections: this.wss.clients.size
    }
  }

  // Graceful shutdown  
  close() {
    logger.info('🔗 Closing Y.js WebSocket server...')
    this.wss.close(() => {
      logger.info('🔗 Y.js WebSocket server closed')
    })
  }
}
