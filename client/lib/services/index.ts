import { createClient } from '@supabase/supabase-js'
import { Database } from '../database.types'
import { SessionService } from './sessionService'
import { UserService } from './userService'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export class ServiceProvider {
  private supabase: ReturnType<typeof createClient<Database>>
  public sessionService: SessionService
  public userService: UserService

  constructor() {
    this.supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
    this.sessionService = new SessionService(this.supabase)
    this.userService = new UserService(this.supabase)
  }

  getSupabaseClient() {
    return this.supabase
  }

  // Helper method to check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      return !!user
    } catch {
      return false
    }
  }

  // Helper method to get current user ID
  async getCurrentUserId(): Promise<string | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      return user?.id || null
    } catch {
      return null
    }
  }

  // Authentication methods
  async signInWithEmail(email: string, password: string) {
    return await this.supabase.auth.signInWithPassword({
      email,
      password
    })
  }

  async signUpWithEmail(email: string, password: string, displayName?: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName
        }
      }
    })

    // Create user profile after successful signup
    if (data.user && !error) {
      await this.userService.ensureUserProfile(
        data.user.id,
        email,
        displayName
      )
    }

    return { data, error }
  }

  async signInWithProvider(provider: 'google' | 'github') {
    return await this.supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
  }

  async signOut() {
    return await this.supabase.auth.signOut()
  }

  async resetPassword(email: string) {
    return await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })
  }

  // Session management helpers
  async createQuickSession(userId: string, language: string = 'javascript'): Promise<Database['public']['Tables']['sessions']['Row'] | null> {
    const sessionData = {
      name: `Quick Session ${new Date().toLocaleDateString()}`,
      description: 'Quick collaborative coding session',
      language,
      owner_id: userId,
      code: this.generateSessionCode(),
      settings: {
        theme: 'vs-dark',
        fontSize: 14,
        autoSave: true,
        allowGuests: true
      },
      status: 'active' as const
    }

    return await this.sessionService.createSession(sessionData)
  }

  async joinSessionByCode(code: string, userId: string): Promise<{
    success: boolean
    session?: Database['public']['Tables']['sessions']['Row']
    error?: string
  }> {
    try {
      // Find session by code
      const { data: sessions, error } = await this.supabase
        .from('sessions')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('status', 'active')
        .limit(1)

      if (error || !sessions || sessions.length === 0) {
        return {
          success: false,
          error: 'Session not found or expired'
        }
      }

      const session = sessions[0]

      // Check if user is already a participant
      const { data: existingParticipant } = await this.supabase
        .from('session_participants')
        .select('*')
        .eq('session_id', session.id)
        .eq('user_id', userId)
        .single()

      if (existingParticipant) {
        // Reactivate if they were inactive
        await this.sessionService.joinSession(session.id, userId)
        return {
          success: true,
          session
        }
      }

      // Join the session
      const participant = await this.sessionService.joinSession(session.id, userId)
      
      if (!participant) {
        return {
          success: false,
          error: 'Failed to join session'
        }
      }

      return {
        success: true,
        session
      }
    } catch (error) {
      console.error('Error joining session by code:', error)
      return {
        success: false,
        error: 'An unexpected error occurred'
      }
    }
  }

  private generateSessionCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // Real-time subscription management
  private subscriptions = new Map<string, any>()

  subscribeToSession(sessionId: string, callbacks: {
    onSessionChange?: (payload: any) => void
    onParticipantChange?: (payload: any) => void
    onCodeChange?: (payload: any) => void
  }) {
    const subscriptionKey = `session_${sessionId}`
    
    // Unsubscribe from existing subscription if any
    this.unsubscribe(subscriptionKey)

    const subscriptions = []

    if (callbacks.onSessionChange) {
      subscriptions.push(
        this.sessionService.subscribeToSessionChanges(sessionId, callbacks.onSessionChange)
      )
    }

    if (callbacks.onParticipantChange) {
      subscriptions.push(
        this.sessionService.subscribeToParticipantChanges(sessionId, callbacks.onParticipantChange)
      )
    }

    if (callbacks.onCodeChange) {
      subscriptions.push(
        this.sessionService.subscribeToCodeChanges(sessionId, callbacks.onCodeChange)
      )
    }

    this.subscriptions.set(subscriptionKey, subscriptions)
    return subscriptionKey
  }

  unsubscribe(subscriptionKey: string) {
    const subscriptions = this.subscriptions.get(subscriptionKey)
    if (subscriptions) {
      subscriptions.forEach((sub: any) => {
        if (sub && typeof sub.unsubscribe === 'function') {
          sub.unsubscribe()
        }
      })
      this.subscriptions.delete(subscriptionKey)
    }
  }

  unsubscribeAll() {
    for (const [key] of this.subscriptions) {
      this.unsubscribe(key)
    }
  }
}

// Create a singleton instance
export const serviceProvider = new ServiceProvider()

// Export individual services for convenience
export const sessionService = serviceProvider.sessionService
export const userService = serviceProvider.userService
export const supabase = serviceProvider.getSupabaseClient()
