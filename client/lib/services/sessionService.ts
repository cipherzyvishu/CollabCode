import { createClient } from '@supabase/supabase-js'
import { Database } from '../database.types'

type Session = Database['public']['Tables']['sessions']['Row']
type SessionInsert = Database['public']['Tables']['sessions']['Insert']
type SessionUpdate = Database['public']['Tables']['sessions']['Update']
type SessionParticipant = Database['public']['Tables']['session_participants']['Row']
type SessionParticipantInsert = Database['public']['Tables']['session_participants']['Insert']
type CodeSnapshot = Database['public']['Tables']['code_snapshots']['Row']
type CodeSnapshotInsert = Database['public']['Tables']['code_snapshots']['Insert']

export class SessionService {
  constructor(private supabase: ReturnType<typeof createClient<Database>>) {}

  // Session CRUD operations
  async createSession(sessionData: SessionInsert): Promise<Session | null> {
    try {
      const { data, error } = await this.supabase
        .from('sessions')
        .insert(sessionData)
        .select()
        .single()

      if (error) {
        console.error('Error creating session:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Failed to create session:', error)
      return null
    }
  }

  async getSession(sessionId: string): Promise<Session | null> {
    try {
      const { data, error } = await this.supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (error) {
        console.error('Error fetching session:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Failed to fetch session:', error)
      return null
    }
  }

  async getSessionWithParticipants(sessionId: string): Promise<{
    session: Session | null
    participants: SessionParticipant[]
  }> {
    try {
      const [sessionResponse, participantsResponse] = await Promise.all([
        this.supabase
          .from('sessions')
          .select('*')
          .eq('id', sessionId)
          .single(),
        this.supabase
          .from('session_participants')
          .select(`
            *,
            user_profiles (
              id,
              display_name,
              avatar_url
            )
          `)
          .eq('session_id', sessionId)
      ])

      return {
        session: sessionResponse.data,
        participants: participantsResponse.data || []
      }
    } catch (error) {
      console.error('Failed to fetch session with participants:', error)
      return {
        session: null,
        participants: []
      }
    }
  }

  async updateSession(sessionId: string, updates: SessionUpdate): Promise<Session | null> {
    try {
      const { data, error } = await this.supabase
        .from('sessions')
        .update(updates)
        .eq('id', sessionId)
        .select()
        .single()

      if (error) {
        console.error('Error updating session:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Failed to update session:', error)
      return null
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId)

      if (error) {
        console.error('Error deleting session:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Failed to delete session:', error)
      return false
    }
  }

  async getUserSessions(userId: string): Promise<Session[]> {
    try {
      const { data, error } = await this.supabase
        .from('sessions')
        .select('*')
        .or(`owner_id.eq.${userId},id.in.(${await this.getUserParticipatedSessionIds(userId)})`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching user sessions:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Failed to fetch user sessions:', error)
      return []
    }
  }

  private async getUserParticipatedSessionIds(userId: string): Promise<string> {
    const { data } = await this.supabase
      .from('session_participants')
      .select('session_id')
      .eq('user_id', userId)

    return data?.map(p => p.session_id).join(',') || ''
  }

  // Session Participants operations
  async joinSession(sessionId: string, userId: string, role: 'viewer' | 'editor' = 'editor'): Promise<SessionParticipant | null> {
    try {
      const participantData: SessionParticipantInsert = {
        session_id: sessionId,
        user_id: userId,
        role,
        joined_at: new Date().toISOString(),
        is_active: true
      }

      const { data, error } = await this.supabase
        .from('session_participants')
        .insert(participantData)
        .select()
        .single()

      if (error) {
        console.error('Error joining session:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Failed to join session:', error)
      return null
    }
  }

  async leaveSession(sessionId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('session_participants')
        .update({ 
          is_active: false,
          left_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .eq('user_id', userId)

      if (error) {
        console.error('Error leaving session:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Failed to leave session:', error)
      return false
    }
  }

  async updateParticipantRole(sessionId: string, userId: string, role: 'viewer' | 'editor'): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('session_participants')
        .update({ role })
        .eq('session_id', sessionId)
        .eq('user_id', userId)

      if (error) {
        console.error('Error updating participant role:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Failed to update participant role:', error)
      return false
    }
  }

  // Code Snapshots operations
  async saveCodeSnapshot(sessionId: string, code: string, userId: string, version?: number): Promise<CodeSnapshot | null> {
    try {
      const snapshotData: CodeSnapshotInsert = {
        session_id: sessionId,
        code_content: code,
        created_by: userId,
        version: version || await this.getNextVersion(sessionId),
        created_at: new Date().toISOString()
      }

      const { data, error } = await this.supabase
        .from('code_snapshots')
        .insert(snapshotData)
        .select()
        .single()

      if (error) {
        console.error('Error saving code snapshot:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Failed to save code snapshot:', error)
      return null
    }
  }

  async getCodeSnapshots(sessionId: string, limit: number = 10): Promise<CodeSnapshot[]> {
    try {
      const { data, error } = await this.supabase
        .from('code_snapshots')
        .select('*')
        .eq('session_id', sessionId)
        .order('version', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching code snapshots:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Failed to fetch code snapshots:', error)
      return []
    }
  }

  async getLatestCodeSnapshot(sessionId: string): Promise<CodeSnapshot | null> {
    try {
      const { data, error } = await this.supabase
        .from('code_snapshots')
        .select('*')
        .eq('session_id', sessionId)
        .order('version', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching latest code snapshot:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Failed to fetch latest code snapshot:', error)
      return null
    }
  }

  private async getNextVersion(sessionId: string): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from('code_snapshots')
        .select('version')
        .eq('session_id', sessionId)
        .order('version', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error getting next version:', error)
        return 1
      }

      return (data?.version || 0) + 1
    } catch (error) {
      console.error('Failed to get next version:', error)
      return 1
    }
  }

  // Session Templates operations
  async getSessionTemplates(): Promise<Database['public']['Tables']['session_templates']['Row'][]> {
    try {
      const { data, error } = await this.supabase
        .from('session_templates')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) {
        console.error('Error fetching session templates:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Failed to fetch session templates:', error)
      return []
    }
  }

  async createSessionFromTemplate(templateId: string, userId: string, sessionName: string): Promise<Session | null> {
    try {
      const { data: template, error: templateError } = await this.supabase
        .from('session_templates')
        .select('*')
        .eq('id', templateId)
        .single()

      if (templateError || !template) {
        console.error('Error fetching template:', templateError)
        return null
      }

      const sessionData: SessionInsert = {
        name: sessionName,
        description: template.description,
        language: template.language,
        owner_id: userId,
        code: this.generateSessionCode(),
        settings: template.default_settings || {},
        template_id: templateId,
        status: 'active'
      }

      return await this.createSession(sessionData)
    } catch (error) {
      console.error('Failed to create session from template:', error)
      return null
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

  // Real-time subscriptions
  subscribeToSessionChanges(sessionId: string, callback: (payload: any) => void) {
    return this.supabase
      .channel(`session_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${sessionId}`
        },
        callback
      )
      .subscribe()
  }

  subscribeToParticipantChanges(sessionId: string, callback: (payload: any) => void) {
    return this.supabase
      .channel(`participants_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_participants',
          filter: `session_id=eq.${sessionId}`
        },
        callback
      )
      .subscribe()
  }

  subscribeToCodeChanges(sessionId: string, callback: (payload: any) => void) {
    return this.supabase
      .channel(`code_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'code_snapshots',
          filter: `session_id=eq.${sessionId}`
        },
        callback
      )
      .subscribe()
  }
}
