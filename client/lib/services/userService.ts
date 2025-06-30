import { createClient } from '@supabase/supabase-js'
import { Database } from '../database.types'

type UserProfile = Database['public']['Tables']['user_profiles']['Row']
type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']
type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update']

export class UserService {
  constructor(private supabase: ReturnType<typeof createClient<Database>>) {}

  // User Profile operations
  async createUserProfile(profileData: UserProfileInsert): Promise<UserProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .insert(profileData)
        .select()
        .single()

      if (error) {
        console.error('Error creating user profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Failed to create user profile:', error)
      return null
    }
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
      return null
    }
  }

  async updateUserProfile(userId: string, updates: UserProfileUpdate): Promise<UserProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        console.error('Error updating user profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Failed to update user profile:', error)
      return null
    }
  }

  async updateLastSeen(userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('user_profiles')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (error) {
        console.error('Error updating last seen:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Failed to update last seen:', error)
      return false
    }
  }

  async searchUsers(query: string, limit: number = 10): Promise<Partial<UserProfile>[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('id, display_name, avatar_url, email')
        .or(`display_name.ilike.%${query}%, email.ilike.%${query}%`)
        .limit(limit)

      if (error) {
        console.error('Error searching users:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Failed to search users:', error)
      return []
    }
  }

  // Authentication helpers
  async ensureUserProfile(userId: string, email?: string, displayName?: string): Promise<UserProfile | null> {
    // First try to get existing profile
    let profile = await this.getUserProfile(userId)
    
    if (!profile && email) {
      // Create profile if it doesn't exist
      const profileData: UserProfileInsert = {
        user_id: userId,
        display_name: displayName || email.split('@')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as any
      
      profile = await this.createUserProfile(profileData)
    }

    return profile
  }

  async getCurrentUser(): Promise<{ user: any; profile: UserProfile | null }> {
    try {
      const { data: { user }, error: authError } = await this.supabase.auth.getUser()

      if (authError || !user) {
        return { user: null, profile: null }
      }

      const profile = await this.ensureUserProfile(
        user.id,
        user.email,
        user.user_metadata?.display_name || user.user_metadata?.full_name
      )

      return { user, profile }
    } catch (error) {
      console.error('Failed to get current user:', error)
      return { user: null, profile: null }
    }
  }

  // Session-related user operations
  async getUserActiveSessions(userId: string): Promise<Partial<Database['public']['Tables']['sessions']['Row']>[]> {
    try {
      const { data, error } = await this.supabase
        .from('session_participants')
        .select(`
          sessions (
            id,
            name,
            description,
            language,
            status,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true)

      if (error) {
        console.error('Error fetching user active sessions:', error)
        return []
      }

      return data?.map(item => item.sessions).filter(Boolean) || []
    } catch (error) {
      console.error('Failed to fetch user active sessions:', error)
      return []
    }
  }

  async getUserSessionHistory(userId: string, limit: number = 20): Promise<{
    session: Partial<Database['public']['Tables']['sessions']['Row']>
    role: string
    joined_at: string
    left_at: string | null
  }[]> {
    try {
      const { data, error } = await this.supabase
        .from('session_participants')
        .select(`
          role,
          joined_at,
          left_at,
          sessions (
            id,
            name,
            description,
            language,
            status,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', userId)
        .order('joined_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching user session history:', error)
        return []
      }

      return data?.map(item => ({
        session: item.sessions,
        role: item.role,
        joined_at: item.joined_at,
        left_at: item.left_at
      })).filter(item => item.session) || []
    } catch (error) {
      console.error('Failed to fetch user session history:', error)
      return []
    }
  }

  // Preferences and settings
  async updateUserPreferences(userId: string, preferences: Record<string, any>): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('user_profiles')
        .update({
          preferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        console.error('Error updating user preferences:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Failed to update user preferences:', error)
      return false
    }
  }

  async getUserPreferences(userId: string): Promise<Record<string, any>> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('preferences')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user preferences:', error)
        return {}
      }

      return (data?.preferences as Record<string, any>) || {}
    } catch (error) {
      console.error('Failed to fetch user preferences:', error)
      return {}
    }
  }

  // Real-time subscriptions
  subscribeToUserProfileChanges(userId: string, callback: (payload: any) => void) {
    return this.supabase
      .channel(`user_profile_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles',
          filter: `id=eq.${userId}`
        },
        callback
      )
      .subscribe()
  }
}
