import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { Database } from '../database.types'
import { serviceProvider } from '../services'

type Session = Database['public']['Tables']['sessions']['Row']
type SessionParticipant = Database['public']['Tables']['session_participants']['Row']
type UserProfile = Database['public']['Tables']['user_profiles']['Row']
type CodeSnapshot = Database['public']['Tables']['code_snapshots']['Row']

interface SessionState {
  // Current session data
  currentSession: Session | null
  participants: (SessionParticipant & { user_profiles?: UserProfile })[]
  codeSnapshots: CodeSnapshot[]
  isLoading: boolean
  error: string | null

  // Actions
  loadSession: (sessionId: string) => Promise<void>
  updateSession: (updates: Partial<Session>) => Promise<void>
  joinSession: (sessionId: string, userId: string) => Promise<void>
  leaveSession: (sessionId: string, userId: string) => Promise<void>
  saveCodeSnapshot: (code: string, userId: string) => Promise<void>
  loadCodeSnapshots: (limit?: number) => Promise<void>
  
  // Real-time subscription management
  subscribeToRealTimeUpdates: (sessionId: string) => void
  unsubscribeFromRealTimeUpdates: () => void
  
  // Reset state
  reset: () => void
}

export const useSessionStore = create<SessionState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      currentSession: null,
      participants: [],
      codeSnapshots: [],
      isLoading: false,
      error: null,

      // Actions
      loadSession: async (sessionId: string) => {
        set({ isLoading: true, error: null })
        
        try {
          // Use direct Supabase query to handle schema mismatch
          const supabase = serviceProvider.getSupabaseClient()
          const [sessionResponse, participantsResponse] = await Promise.all([
            supabase
              .from('sessions')
              .select('*')
              .eq('id', sessionId)
              .single(),
            supabase
              .from('session_participants')
              .select(`
                *,
                user_profiles (
                  user_id,
                  display_name,
                  avatar_url
                )
              `)
              .eq('session_id', sessionId)
          ])
          
          const session = sessionResponse.data
          const participants = participantsResponse.data || []
          
          console.log('[sessionStore] Fetched session data:', session);
          console.log('[sessionStore] Fetched participants data:', participants);

          if (!session) {
            console.error('[sessionStore] Session not found in Supabase response.');
            set({ error: 'Session not found', isLoading: false })
            return
          }

          set({
            currentSession: session as any,
            participants: participants as any,
            isLoading: false,
            error: null, // Explicitly clear previous errors
          })

          console.log('[sessionStore] Session state updated. isLoading: false');

          // Load initial code snapshots
          get().loadCodeSnapshots(5)
        } catch (error) {
          console.error('Failed to load session:', error)
          set({ 
            error: 'Failed to load session', 
            isLoading: false 
          })
        }
      },

      updateSession: async (updates: Partial<Session>) => {
        const { currentSession } = get()
        if (!currentSession) return

        try {
          const updatedSession = await serviceProvider.sessionService.updateSession(
            currentSession.id,
            updates
          )
          
          if (updatedSession) {
            set({ currentSession: updatedSession })
          }
        } catch (error) {
          console.error('Failed to update session:', error)
          set({ error: 'Failed to update session' })
        }
      },

      joinSession: async (sessionId: string, userId: string) => {
        try {
          const participant = await serviceProvider.sessionService.joinSession(sessionId, userId)
          
          if (participant) {
            // Refresh participants list
            const { participants } = await serviceProvider.sessionService.getSessionWithParticipants(sessionId)
            set({ participants })
          }
        } catch (error) {
          console.error('Failed to join session:', error)
          set({ error: 'Failed to join session' })
        }
      },

      leaveSession: async (sessionId: string, userId: string) => {
        try {
          await serviceProvider.sessionService.leaveSession(sessionId, userId)
          
          // Refresh participants list
          const { participants } = await serviceProvider.sessionService.getSessionWithParticipants(sessionId)
          set({ participants })
        } catch (error) {
          console.error('Failed to leave session:', error)
          set({ error: 'Failed to leave session' })
        }
      },

      saveCodeSnapshot: async (code: string, userId: string) => {
        const { currentSession } = get()
        if (!currentSession) {
          console.error('No current session for code snapshot')
          return
        }

        try {
          console.log('SessionStore: Attempting to save code snapshot', {
            sessionId: currentSession.id,
            codeLength: code.length,
            userId
          })
          
          const snapshot = await serviceProvider.sessionService.saveCodeSnapshot(
            currentSession.id,
            code,
            userId
          )
          
          if (snapshot) {
            console.log('SessionStore: Code snapshot saved successfully', snapshot)
            set(state => ({
              codeSnapshots: [snapshot, ...state.codeSnapshots].slice(0, 10) // Keep latest 10
            }))
          } else {
            console.error('SessionStore: Failed to save code snapshot - no data returned')
          }
        } catch (error) {
          console.error('SessionStore: Error saving code snapshot:', error)
        }
      },

      loadCodeSnapshots: async (limit = 10) => {
        const { currentSession } = get()
        if (!currentSession) return

        try {
          const snapshots = await serviceProvider.sessionService.getCodeSnapshots(
            currentSession.id,
            limit
          )
          set({ codeSnapshots: snapshots })
        } catch (error) {
          console.error('Failed to load code snapshots:', error)
        }
      },

      subscribeToRealTimeUpdates: (sessionId: string) => {
        serviceProvider.subscribeToSession(sessionId, {
          onSessionChange: (payload) => {
            const { eventType, new: newRecord } = payload
            
            if (eventType === 'UPDATE' && newRecord) {
              set({ currentSession: newRecord })
            }
          },
          
          onParticipantChange: async (_payload) => {
            // Refresh participants when there are changes
            try {
              const { participants } = await serviceProvider.sessionService.getSessionWithParticipants(sessionId)
              set({ participants })
            } catch (error) {
              console.error('Failed to refresh participants:', error)
            }
          },
          
          onCodeChange: (payload) => {
            const { eventType, new: newRecord } = payload
            
            if (eventType === 'INSERT' && newRecord) {
              set(state => ({
                codeSnapshots: [newRecord, ...state.codeSnapshots].slice(0, 10)
              }))
            }
          }
        })
      },

      unsubscribeFromRealTimeUpdates: () => {
        serviceProvider.unsubscribeAll()
      },

      reset: () => {
        set({
          currentSession: null,
          participants: [],
          codeSnapshots: [],
          isLoading: false,
          error: null
        })
        get().unsubscribeFromRealTimeUpdates()
      }
    })),
    {
      name: 'session-store'
    }
  )
)
