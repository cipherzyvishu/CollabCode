import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { Database } from '../database.types'
import { serviceProvider } from '../services'

type UserProfile = Database['public']['Tables']['user_profiles']['Row']
type Session = Database['public']['Tables']['sessions']['Row']

interface UserState {
  // Authentication state
  user: any | null
  profile: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // User sessions
  userSessions: Session[]
  activeSessionsLoading: boolean

  // Actions
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<boolean>
  signUp: (email: string, password: string, displayName?: string) => Promise<boolean>
  signInWithProvider: (provider: 'google' | 'github') => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
  loadUserSessions: () => Promise<void>
  updatePreferences: (preferences: Record<string, any>) => Promise<void>
  
  // Reset state
  reset: () => void
}

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        profile: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,
        userSessions: [],
        activeSessionsLoading: false,

        // Actions
        initialize: async () => {
          set({ isLoading: true, error: null })
          
          try {
            const { user, profile } = await serviceProvider.userService.getCurrentUser()
            
            set({
              user,
              profile,
              isAuthenticated: !!user,
              isLoading: false
            })

            if (user) {
              // Load user sessions in background
              get().loadUserSessions()
              
              // Update last seen
              serviceProvider.userService.updateLastSeen(user.id)
            }
          } catch (error) {
            console.error('Failed to initialize user:', error)
            set({
              user: null,
              profile: null,
              isAuthenticated: false,
              isLoading: false,
              error: 'Failed to initialize user session'
            })
          }
        },

        signIn: async (email: string, password: string) => {
          set({ isLoading: true, error: null })
          
          try {
            const { data, error } = await serviceProvider.signInWithEmail(email, password)
            
            if (error) {
              set({ 
                error: error.message, 
                isLoading: false 
              })
              return false
            }

            if (data.user) {
              const profile = await serviceProvider.userService.ensureUserProfile(
                data.user.id,
                data.user.email,
                data.user.user_metadata?.display_name
              )

              set({
                user: data.user,
                profile,
                isAuthenticated: true,
                isLoading: false,
                error: null
              })

              // Load user sessions and update last seen
              get().loadUserSessions()
              serviceProvider.userService.updateLastSeen(data.user.id)
              
              return true
            }

            return false
          } catch (error) {
            console.error('Sign in failed:', error)
            set({ 
              error: 'Sign in failed', 
              isLoading: false 
            })
            return false
          }
        },

        signUp: async (email: string, password: string, displayName?: string) => {
          set({ isLoading: true, error: null })
          
          try {
            const { data, error } = await serviceProvider.signUpWithEmail(email, password, displayName)
            
            if (error) {
              set({ 
                error: error.message, 
                isLoading: false 
              })
              return false
            }

            if (data.user) {
              // Profile creation is handled in the service
              set({
                user: data.user,
                isAuthenticated: true,
                isLoading: false,
                error: null
              })
              
              return true
            }

            return false
          } catch (error) {
            console.error('Sign up failed:', error)
            set({ 
              error: 'Sign up failed', 
              isLoading: false 
            })
            return false
          }
        },

        signInWithProvider: async (provider: 'google' | 'github') => {
          set({ isLoading: true, error: null })
          
          try {
            const { error } = await serviceProvider.signInWithProvider(provider)
            
            if (error) {
              set({ 
                error: error.message, 
                isLoading: false 
              })
            }
            // The actual authentication will be handled by the auth callback
          } catch (error) {
            console.error('Provider sign in failed:', error)
            set({ 
              error: 'Provider sign in failed', 
              isLoading: false 
            })
          }
        },

        signOut: async () => {
          set({ isLoading: true })
          
          try {
            await serviceProvider.signOut()
            get().reset()
          } catch (error) {
            console.error('Sign out failed:', error)
            set({ error: 'Sign out failed', isLoading: false })
          }
        },

        updateProfile: async (updates: Partial<UserProfile>) => {
          const { user, profile } = get()
          if (!user || !profile) return

          try {
            const updatedProfile = await serviceProvider.userService.updateUserProfile(
              user.id,
              updates
            )
            
            if (updatedProfile) {
              set({ profile: updatedProfile })
            }
          } catch (error) {
            console.error('Failed to update profile:', error)
            set({ error: 'Failed to update profile' })
          }
        },

        loadUserSessions: async () => {
          const { user } = get()
          if (!user) return

          set({ activeSessionsLoading: true })
          
          try {
            const sessions = await serviceProvider.sessionService.getUserSessions(user.id)
            set({ 
              userSessions: sessions,
              activeSessionsLoading: false 
            })
          } catch (error) {
            console.error('Failed to load user sessions:', error)
            set({ 
              activeSessionsLoading: false,
              error: 'Failed to load user sessions'
            })
          }
        },

        updatePreferences: async (preferences: Record<string, any>) => {
          const { user } = get()
          if (!user) return

          try {
            const success = await serviceProvider.userService.updateUserPreferences(
              user.id,
              preferences
            )
            
            if (success && get().profile) {
              set(state => ({
                profile: state.profile ? {
                  ...state.profile,
                  preferences
                } : null
              }))
            }
          } catch (error) {
            console.error('Failed to update preferences:', error)
            set({ error: 'Failed to update preferences' })
          }
        },

        reset: () => {
          set({
            user: null,
            profile: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            userSessions: [],
            activeSessionsLoading: false
          })
        }
      }),
      {
        name: 'user-store',
        // Only persist essential auth state
        partialize: (state) => ({
          user: state.user,
          profile: state.profile,
          isAuthenticated: state.isAuthenticated
        })
      }
    ),
    {
      name: 'user-store'
    }
  )
)

// Auth state change listener
if (typeof window !== 'undefined') {
  serviceProvider.getSupabaseClient().auth.onAuthStateChange(async (event, session) => {
    const store = useUserStore.getState()
    
    if (event === 'SIGNED_IN' && session?.user) {
      const profile = await serviceProvider.userService.ensureUserProfile(
        session.user.id,
        session.user.email,
        session.user.user_metadata?.display_name
      )

      store.user = session.user
      store.profile = profile
      store.isAuthenticated = true
      store.isLoading = false
      store.error = null
      
      // Load user sessions and update last seen
      store.loadUserSessions()
      serviceProvider.userService.updateLastSeen(session.user.id)
      
    } else if (event === 'SIGNED_OUT') {
      store.reset()
    }
  })
}
