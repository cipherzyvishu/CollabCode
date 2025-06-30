import { Server, Socket } from 'socket.io'
import { v4 as uuidv4 } from 'uuid'
import logger from '../utils/logger'
import { ClientToServerEvents, ServerToClientEvents } from '@/shared/types'
import { SessionManager } from '../utils/sessionManager'

type SocketType = Socket<ClientToServerEvents, ServerToClientEvents>
type IOType = Server<ClientToServerEvents, ServerToClientEvents>

const sessionManager = new SessionManager()

export function setupSocketHandlers(io: IOType) {
  logger.info('Setting up Socket.IO handlers')

  io.on('connection', (socket: SocketType) => {
    logger.info(`User connected: ${socket.id}`)

    // Handle user joining a session
    socket.on('joinSession', async ({ sessionId, userId }) => {
      try {
        logger.info(`User ${userId} joining session ${sessionId}`)
        
        // Join the socket room
        await socket.join(sessionId)
        
        // Add user to session manager
        sessionManager.addUserToSession(sessionId, userId, socket.id)
        
        // Get session participants
        const participants = sessionManager.getSessionParticipants(sessionId)
        
        // Notify others in the session that a user joined
        socket.to(sessionId).emit('userJoined', {
          user: {
            id: userId,
            email: '', // This would come from your user data
            name: `User ${userId}`,
            created_at: new Date().toISOString(),
          }
        })

        // Send current participants to the new user
        socket.emit('userJoined', {
          user: {
            id: userId,
            email: '',
            name: `User ${userId}`,
            created_at: new Date().toISOString(),
          }
        })

        logger.info(`User ${userId} successfully joined session ${sessionId}`)
      } catch (error) {
        logger.error('Error joining session:', error)
      }
    })

    // Handle user leaving a session
    socket.on('leaveSession', async ({ sessionId, userId }) => {
      try {
        logger.info(`User ${userId} leaving session ${sessionId}`)
        
        // Leave the socket room
        await socket.leave(sessionId)
        
        // Remove user from session manager
        sessionManager.removeUserFromSession(sessionId, userId)
        
        // Notify others that user left
        socket.to(sessionId).emit('userLeft', { userId })
        
        logger.info(`User ${userId} left session ${sessionId}`)
      } catch (error) {
        logger.error('Error leaving session:', error)
      }
    })

    // Handle code changes
    socket.on('codeChange', ({ sessionId, code, userId }) => {
      try {
        logger.debug(`Code change in session ${sessionId} by user ${userId}`)
        
        // Broadcast code change to all other users in the session
        socket.to(sessionId).emit('codeChange', { code, userId })
        
        // Update session manager with latest code
        sessionManager.updateSessionCode(sessionId, code)
      } catch (error) {
        logger.error('Error handling code change:', error)
      }
    })

    // Handle real-time code changes for Monaco Editor
    socket.on('code-change', (data: { sessionId: string; code: string; userId: string }) => {
      try {
        const { sessionId, code, userId } = data
        logger.debug(`Monaco code change in session ${sessionId} by user ${userId}`)
        
        // Broadcast to all other participants in the session
        socket.to(sessionId).emit('code-change', {
          code,
          userId,
          timestamp: new Date().toISOString()
        })
        
        // Update session manager
        sessionManager.updateSessionCode(sessionId, code)
      } catch (error) {
        logger.error('Error handling Monaco code change:', error)
      }
    })

    // Handle cursor position changes for Monaco Editor
    socket.on('cursor-change', (data: { 
      sessionId: string; 
      position: { lineNumber: number; column: number }; 
      userId: string; 
      userName: string 
    }) => {
      try {
        const { sessionId, position, userId, userName } = data
        
        // Broadcast cursor position to other participants
        socket.to(sessionId).emit('cursor-change', {
          position,
          userId,
          userName,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        logger.error('Error handling cursor change:', error)
      }
    })

    // Handle joining session for Monaco Editor
    socket.on('join-session', (sessionId: string, userInfo?: { name: string; avatar?: string }) => {
      try {
        logger.info(`User ${socket.id} joining session ${sessionId} (Monaco)`)
        
        socket.join(sessionId)
        
        // Add to session manager
        const userId = userInfo?.name || `User_${socket.id.slice(0, 6)}`
        sessionManager.addUserToSession(sessionId, userId, socket.id)
        
        // Get session participants
        const participants = sessionManager.getSessionParticipants(sessionId)
        const sessionCode = sessionManager.getSessionCode(sessionId) || ''
        
        // Notify other participants
        socket.to(sessionId).emit('user-joined', {
          user: {
            id: socket.id,
            name: userId,
            avatar: userInfo?.avatar
          },
          participantCount: participants.length
        })
        
        // Send current session state to the new participant
        socket.emit('session-state', {
          code: sessionCode,
          participants: participants.map(p => ({
            id: p.socketId,
            name: p.userId,
            joinedAt: new Date().toISOString()
          }))
        })
        
        logger.info(`Session ${sessionId} now has ${participants.length} participants`)
      } catch (error) {
        logger.error('Error joining session (Monaco):', error)
      }
    })

    // Handle leaving session for Monaco Editor
    socket.on('leave-session', (sessionId: string) => {
      try {
        logger.info(`User ${socket.id} leaving session ${sessionId} (Monaco)`)
        
        // Remove from session manager
        sessionManager.removeUserFromSession(sessionId, socket.id)
        
        // Get remaining participants
        const participants = sessionManager.getSessionParticipants(sessionId)
        
        // Notify other participants
        socket.to(sessionId).emit('user-left', {
          userId: socket.id,
          participantCount: participants.length
        })
        
        socket.leave(sessionId)
      } catch (error) {
        logger.error('Error leaving session (Monaco):', error)
      }
    })

    // Handle cursor movement
    socket.on('cursorMove', ({ sessionId, position, userId }) => {
      try {
        // Broadcast cursor position to all other users in the session
        socket.to(sessionId).emit('cursorMove', { userId, position })
      } catch (error) {
        logger.error('Error handling cursor move:', error)
      }
    })

    // Handle AI request
    socket.on('requestAI', ({ sessionId, code, userId }) => {
      try {
        logger.info(`AI request in session ${sessionId} by user ${userId}`)
        
        // For now, just echo back a mock response
        // In production, this would call the HuggingFace API
        const mockExplanation = `This code appears to be ${code.split(' ')[0]} programming. The functionality includes various operations and logic flows.`
        
        // Send AI response back to the requesting user
        socket.emit('aiResponse', { 
          explanation: mockExplanation, 
          userId 
        })
        
        logger.info(`AI response sent for session ${sessionId}`)
      } catch (error) {
        logger.error('Error handling AI request:', error)
      }
    })

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`User disconnected: ${socket.id}, reason: ${reason}`)
      
      // Clean up user from all sessions
      sessionManager.removeUserFromAllSessions(socket.id)
    })

    // Handle connection errors
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error)
    })
  })

  // Handle server-level events
  io.on('error', (error) => {
    logger.error('Socket.IO server error:', error)
  })

  logger.info('Socket.IO handlers setup complete')
}
