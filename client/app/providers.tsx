'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useUserStore } from '@/lib/stores'
import { Database } from '@/lib/database.types'
import { socketManager } from '@/sockets'
import { Socket } from 'socket.io-client'
import { ClientToServerEvents, ServerToClientEvents } from '@/shared/types'

type SocketType = Socket<ServerToClientEvents, ClientToServerEvents>

const SupabaseContext = createContext<ReturnType<typeof createBrowserClient<Database>> | undefined>(undefined)
const SocketContext = createContext<SocketType | null>(null)

export function Providers({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Missing Supabase environment variables!')
      console.error('Please check your .env.local file and ensure you have:')
      console.error('- NEXT_PUBLIC_SUPABASE_URL')
      console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY')
      console.error('See SETUP.md for detailed instructions.')
      
      // Return a mock client to prevent app crash during development
      return null as any
    }
    
    return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
  })
  
  const [socket, setSocket] = useState<SocketType | null>(null)
  const { user, initialize } = useUserStore()

  // Initialize user store on mount
  useEffect(() => {
    if (supabase) {
      initialize()
    }
  }, [supabase]) // Removed 'initialize' from dependencies to prevent infinite loop

  // Socket.IO connection effect
  useEffect(() => {
    if (user?.id) {
      console.log('🔌 Connecting to Socket.IO server...')
      
      // Connect to Socket.IO server
      const socketInstance = socketManager.connect(user.id)
      setSocket(socketInstance)
      
      // Set up connection event listeners
      socketInstance.on('connect', () => {
        console.log('✅ Connected to server')
        console.log('📡 Socket.IO transport:', socketInstance.io.engine.transport.name)
      })

      socketInstance.on('disconnect', (reason) => {
        console.log('❌ Disconnected from server:', reason)
      })

      socketInstance.on('connect_error', (error) => {
        console.error('🚫 Connection error:', error)
      })

      // Clean up on unmount or user change
      return () => {
        console.log('🔌 Disconnecting from Socket.IO server...')
        socketManager.disconnect()
        setSocket(null)
      }
    }
  }, [user?.id])

  return (
    <SupabaseContext.Provider value={supabase}>
      <SocketContext.Provider value={socket}>
        {children}
      </SocketContext.Provider>
    </SupabaseContext.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}

export const useSocket = () => {
  const context = useContext(SocketContext)
  return context // Can be null if not connected
}
