import logger from './logger'

interface SessionUser {
  userId: string
  socketId: string
  joinedAt: Date
}

interface SessionData {
  sessionId: string
  users: Map<string, SessionUser>
  code: string
  createdAt: Date
  lastActivity: Date
}

export class SessionManager {
  private sessions: Map<string, SessionData> = new Map()

  // Add user to a session
  addUserToSession(sessionId: string, userId: string, socketId: string): void {
    let session = this.sessions.get(sessionId)
    
    if (!session) {
      session = {
        sessionId,
        users: new Map(),
        code: '',
        createdAt: new Date(),
        lastActivity: new Date(),
      }
      this.sessions.set(sessionId, session)
      logger.info(`Created new session: ${sessionId}`)
    }

    const user: SessionUser = {
      userId,
      socketId,
      joinedAt: new Date(),
    }

    session.users.set(userId, user)
    session.lastActivity = new Date()
    
    logger.info(`User ${userId} added to session ${sessionId}. Total users: ${session.users.size}`)
  }

  // Remove user from a session
  removeUserFromSession(sessionId: string, userId: string): void {
    const session = this.sessions.get(sessionId)
    
    if (session) {
      session.users.delete(userId)
      session.lastActivity = new Date()
      
      logger.info(`User ${userId} removed from session ${sessionId}. Remaining users: ${session.users.size}`)
      
      // If no users left, clean up the session after a delay
      if (session.users.size === 0) {
        setTimeout(() => {
          const currentSession = this.sessions.get(sessionId)
          if (currentSession && currentSession.users.size === 0) {
            this.sessions.delete(sessionId)
            logger.info(`Empty session ${sessionId} cleaned up`)
          }
        }, 30000) // 30 seconds delay
      }
    }
  }

  // Remove user from all sessions (on disconnect)
  removeUserFromAllSessions(socketId: string): void {
    let removedFromSessions: string[] = []
    
    for (const [sessionId, session] of this.sessions.entries()) {
      for (const [userId, user] of session.users.entries()) {
        if (user.socketId === socketId) {
          session.users.delete(userId)
          removedFromSessions.push(sessionId)
          
          // Clean up empty sessions
          if (session.users.size === 0) {
            setTimeout(() => {
              const currentSession = this.sessions.get(sessionId)
              if (currentSession && currentSession.users.size === 0) {
                this.sessions.delete(sessionId)
                logger.info(`Empty session ${sessionId} cleaned up after user disconnect`)
              }
            }, 30000)
          }
        }
      }
    }
    
    if (removedFromSessions.length > 0) {
      logger.info(`Socket ${socketId} removed from sessions: ${removedFromSessions.join(', ')}`)
    }
  }

  // Get session participants
  getSessionParticipants(sessionId: string): SessionUser[] {
    const session = this.sessions.get(sessionId)
    return session ? Array.from(session.users.values()) : []
  }

  // Update session code
  updateSessionCode(sessionId: string, code: string): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.code = code
      session.lastActivity = new Date()
    }
  }

  // Get session code
  getSessionCode(sessionId: string): string {
    const session = this.sessions.get(sessionId)
    return session ? session.code : ''
  }

  // Get session statistics
  getSessionStats(): {
    totalSessions: number
    totalUsers: number
    activeSessions: string[]
  } {
    const activeSessions: string[] = []
    let totalUsers = 0

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.users.size > 0) {
        activeSessions.push(sessionId)
        totalUsers += session.users.size
      }
    }

    return {
      totalSessions: this.sessions.size,
      totalUsers,
      activeSessions,
    }
  }

  // Clean up old inactive sessions
  cleanupInactiveSessions(maxInactiveMinutes: number = 60): void {
    const cutoffTime = new Date(Date.now() - maxInactiveMinutes * 60 * 1000)
    const toDelete: string[] = []

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.lastActivity < cutoffTime && session.users.size === 0) {
        toDelete.push(sessionId)
      }
    }

    toDelete.forEach(sessionId => {
      this.sessions.delete(sessionId)
      logger.info(`Cleaned up inactive session: ${sessionId}`)
    })

    if (toDelete.length > 0) {
      logger.info(`Cleaned up ${toDelete.length} inactive sessions`)
    }
  }
}
