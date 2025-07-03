'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useSessionStore, useUserStore } from '@/lib/stores'
import { serviceProvider } from '@/lib/services'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { 
  ArrowLeft,
  Users,
  Settings,
  Share2,
  Play,
  Pause,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Copy,
  MessageSquare,
  Download,
  Sun,
  Moon,
  AlertCircle,
  Save
} from 'lucide-react'

// Dynamically import CollaborativeEditor to avoid SSR issues
const CollaborativeEditor = dynamic(() => import('@/components/editor/CollaborativeEditor'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">Loading editor...</p>
      </div>
    </div>
  )
})

interface SessionState {
  micEnabled: boolean
  videoEnabled: boolean
  editorTheme: 'vs-dark' | 'light'
  isRunning: boolean
}

export default function SessionPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params?.id as string
  const forceJoin = typeof window !== 'undefined' && 
    new URLSearchParams(window.location.search).get('forceJoin') === 'true'
  
  // Zustand stores
  const {
    currentSession,
    participants,
    isLoading: sessionLoading,
    error,
    loadSession,
    joinSession,
    leaveSession,
    saveCodeSnapshot,
    subscribeToRealTimeUpdates,
    unsubscribeFromRealTimeUpdates,
    reset
  } = useSessionStore()
  
  const { user, profile, isAuthenticated, isLoading: userLoading } = useUserStore()
  
  // Debug logging for state changes (can be removed in production)
  useEffect(() => {
    console.log('🔍 Session page state change:', {
      userLoading,
      sessionLoading,
      isAuthenticated,
      userId: user?.id,
      sessionId,
      initialized: initializationRef.current
    })
  }, [userLoading, sessionLoading, isAuthenticated, user?.id, sessionId])
  
  // Local UI state
  const [sessionState, setSessionState] = useState<SessionState>({
    micEnabled: false,
    videoEnabled: false,
    editorTheme: 'vs-dark',
    isRunning: false
  })
  
  const [currentCode, setCurrentCode] = useState('')
  const [hasJoined, setHasJoined] = useState(false)
  const joinedRef = useRef(false) // Track if user has already joined
  const initializationRef = useRef(false) // Track if session has been initialized

  // Initialize session on mount with improved auth handling
  useEffect(() => {
    let mounted = true // Track if component is still mounted
    
    const initializeSession = async () => {
      console.log('🔍 initializeSession called:', { 
        sessionId, 
        userLoading, 
        isAuthenticated, 
        userId: user?.id,
        pathname: window.location.pathname,
        forceJoin
      })
      
      if (!sessionId) {
        console.log('⚠️ No session ID, redirecting to dashboard')
        router.push('/dashboard')
        return
      }

      // Wait for authentication to be determined
      if (userLoading) {
        console.log('⏳ Waiting for auth to load... userLoading:', userLoading)
        return
      }

      if (!isAuthenticated || !user) {
        console.log('❌ Not authenticated, redirecting to signin...', { isAuthenticated, user })
        // Instead of redirecting immediately, check if we're in the process of signing in
        // This prevents automatic redirects in incognito mode
        if (window.location.pathname.includes('/auth/login') || window.location.pathname.includes('/auth/signin')) {
          console.log('Already on login page, not redirecting')
          return
        }
        
        const redirectUrl = `/auth/login?redirectTo=${encodeURIComponent(`/session/${sessionId}`)}&joinSession=true`
        console.log('Redirecting to login with session join flag:', redirectUrl)
        router.push(redirectUrl)
        return
      }

      // Prevent double initialization
      if (initializationRef.current) {
        console.log('🚫 Session already initialized, skipping...')
        return
      }

      console.log('✅ User authenticated, loading session:', sessionId, user.id)
      initializationRef.current = true
      
      // Only proceed if component is still mounted
      if (!mounted) return
      
      // Get current store functions to avoid dependency issues
      const { loadSession, subscribeToRealTimeUpdates } = useSessionStore.getState()
      
      // Load session data
      await loadSession(sessionId)
      
      // Subscribe to real-time updates
      subscribeToRealTimeUpdates(sessionId)
    }

    initializeSession()

    // Cleanup function
    return () => {
      mounted = false
      joinedRef.current = false // Reset join status
      initializationRef.current = false // Reset initialization status
      const { unsubscribeFromRealTimeUpdates } = useSessionStore.getState()
      unsubscribeFromRealTimeUpdates()
    }
  }, [sessionId, isAuthenticated, user, userLoading, router])

  // Join session when data is loaded
  useEffect(() => {
    if (currentSession && user && !joinedRef.current && !sessionLoading) {
      console.log('🔄 Checking if user needs to join session:', { 
        userId: user.id,
        sessionId: currentSession.id,
        forceJoin
      });
      
      // Check if user is already a participant
      const isParticipant = participants.some(p => p.user_id === user.id && p.is_active);
      
      if (!isParticipant || forceJoin) {
        console.log(`👤 User is ${!isParticipant ? 'not a participant' : 'being forced to join'}, joining session...`);
        
        // Clear forceJoin parameter from URL if it exists
        if (forceJoin && typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.delete('forceJoin');
          window.history.replaceState({}, document.title, url.toString());
        }
        
        // Get current joinSession function to avoid dependency issues
        const { joinSession } = useSessionStore.getState();
        
        // Join the session
        joinSession(sessionId, user.id).then(() => {
          console.log('✅ User joined session successfully');
          joinedRef.current = true;
          setHasJoined(true);
        }).catch(error => {
          console.error('❌ Failed to join session:', error);
        });
      } else {
        console.log('👤 User is already a participant in this session');
        joinedRef.current = true;
        setHasJoined(true);
      }
    }
  }, [currentSession, user, sessionLoading, participants, sessionId, forceJoin])

  // Load initial code from latest snapshot
  useEffect(() => {
    if (currentSession && !currentCode) {
      const loadInitialCode = async () => {
        const latestSnapshot = await serviceProvider.sessionService.getLatestCodeSnapshot(currentSession.id)
        const code = latestSnapshot?.code_content || getStarterCode(currentSession.language)
        setCurrentCode(code)
      }
      
      loadInitialCode()
    }
  }, [currentSession, currentCode])

  const getStarterCode = (language: string) => {
    const starterCodes: { [key: string]: string } = {
      typescript: `// Welcome to CollabCode - TypeScript Session!

function greeting(name: string): string {
  return \`Hello, \${name}!\`;
}

console.log(greeting("Collaborator"));

// Start coding together!`,
      javascript: `// Welcome to CollabCode - JavaScript Session!

function greeting(name) {
  return \`Hello, \${name}!\`;
}

console.log(greeting("Collaborator"));

// Start coding together!`,
      python: `# Welcome to CollabCode - Python Session!

def greeting(name):
    """Say hello to the collaborator"""
    return f"Hello, {name}!"

print(greeting("Collaborator"))

# Start coding together!`,
      html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CollabCode Session</title>
    <style>
        body {
            font-family: system-ui, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        h1 {
            color: #333;
        }
    </style>
</head>
<body>
    <h1>Welcome to CollabCode!</h1>
    <p>Start building something together!</p>
    
    <div id="app"></div>

    <script>
        document.getElementById('app').textContent = 'Hello, Collaborator!';
        // Start coding together!
    </script>
</body>
</html>`
    }
    
    return starterCodes[language] || starterCodes.typescript
  }

  const handleLeaveSession = async () => {
    if (currentSession && user) {
      await leaveSession(currentSession.id, user.id)
    }
    reset()
    router.push('/dashboard')
  }

  const handleShareSession = async () => {
    if (currentSession) {
      const shareText = `Join my CollabCode session: ${currentSession.title}\nCode: ${currentSession.session_code}\nLink: ${window.location.origin}/session/${currentSession.id}`
      try {
        await navigator.clipboard.writeText(shareText)
        // Could add a toast notification here
      } catch (err) {
        console.error('Failed to copy share text:', err)
      }
    }
  }

  // Auto-save timeout ref
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleCodeChange = async (code: string) => {
    setCurrentCode(code)
    
    // Auto-save code snapshot with debouncing
    if (currentSession && user && code.trim() !== currentCode.trim()) {
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      
      // Set new timeout for auto-save (5 seconds)
      autoSaveTimeoutRef.current = setTimeout(async () => {
        try {
          console.log('Auto-saving code snapshot...')
          await saveCodeSnapshot(code, user.id)
          console.log('Code snapshot saved successfully')
        } catch (error) {
          console.error('Failed to auto-save code snapshot:', error)
        }
      }, 5000) // Auto-save after 5 seconds of inactivity
    }
  }

  // Manual save function
  const handleManualSave = async () => {
    if (currentSession && user && currentCode) {
      try {
        console.log('Manually saving code snapshot...')
        await saveCodeSnapshot(currentCode, user.id)
        console.log('Manual save successful')
        // You could show a toast notification here
      } catch (error) {
        console.error('Manual save failed:', error)
      }
    }
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [])

  const handleRunCode = () => {
    setSessionState(prev => ({ ...prev, isRunning: true }))
    // TODO: Implement code execution
    console.log('Running code:', currentCode)
    
    // Simulate code execution
    setTimeout(() => {
      setSessionState(prev => ({ ...prev, isRunning: false }))
      // TODO: Show execution results
    }, 2000)
  }

  const handleDownloadCode = () => {
    if (!currentSession || !currentCode) return
    
    const extension = currentSession.language === 'typescript' ? 'ts' : 
                     currentSession.language === 'python' ? 'py' : 
                     currentSession.language === 'html' ? 'html' : 'js'
    
    const blob = new Blob([currentCode], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentSession.title.replace(/\s+/g, '_').toLowerCase()}.${extension}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const toggleMic = () => {
    setSessionState(prev => ({ ...prev, micEnabled: !prev.micEnabled }))
  }

  const toggleVideo = () => {
    setSessionState(prev => ({ ...prev, videoEnabled: !prev.videoEnabled }))
  }

  const toggleTheme = () => {
    setSessionState(prev => ({ 
      ...prev, 
      editorTheme: prev.editorTheme === 'vs-dark' ? 'light' : 'vs-dark' 
    }))
  }

  // Loading state - show while auth is being determined
  if (userLoading || sessionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {userLoading ? 'Checking authentication...' : 'Loading session...'}
          </p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Session</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Session not found state
  if (!currentSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Session Not Found</h2>
            <p className="text-gray-600 mb-6">This session doesn't exist or you don't have access to it.</p>
            <Button onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={handleLeaveSession}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Leave
              </Button>
              
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{currentSession.title}</h1>
                <p className="text-sm text-gray-500">Session Code: {currentSession.session_code}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Voice/Video Controls */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMic}
                className={sessionState.micEnabled ? 'text-green-600' : 'text-red-600'}
              >
                {sessionState.micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleVideo}
                className={sessionState.videoEnabled ? 'text-green-600' : 'text-red-600'}
              >
                {sessionState.videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </Button>

              {/* Share Button */}
              <Button variant="ghost" size="sm" onClick={handleShareSession}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>

              {/* Participants */}
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span className="rounded-md bg-gray-100 px-2 py-0.5">{participants.filter(p => p.is_active).length} active</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Code Editor Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">
                main.{currentSession.language === 'typescript' ? 'ts' : currentSession.language === 'python' ? 'py' : currentSession.language === 'html' ? 'html' : 'js'}
              </span>
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                {currentSession.language}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleManualSave}
                className="text-blue-600 hover:text-blue-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleTheme}
              >
                {sessionState.editorTheme === 'vs-dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDownloadCode}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleRunCode}
                disabled={sessionState.isRunning}
              >
                {sessionState.isRunning ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-gray-400 border-t-gray-600 rounded-full" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Collaborative Monaco Editor */}
          <div className="flex-1">
            <CollaborativeEditor
              sessionId={sessionId}
              language={currentSession.language}
              initialValue={currentCode}
              onCodeChange={handleCodeChange}
              theme={sessionState.editorTheme}
            />
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          {/* Participants Panel */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Participants ({participants.filter(p => p.is_active).length})
            </h3>
            <div className="space-y-2">
              {participants.filter(p => p.is_active).map((participant) => {
                const isOwner = participant.user_id === currentSession.created_by
                const displayName = participant.user_profiles?.display_name || 
                                  participant.user_profiles?.email?.split('@')[0] || 
                                  'Anonymous User'
                
                return (
                  <div key={participant.user_id} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{displayName}</p>
                      <p className="text-xs text-gray-500">
                        {isOwner ? 'Owner' : participant.role}
                      </p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${participant.is_active ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* AI Assistant Panel Placeholder */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">AI Assistant</h3>
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
              <p>AI coding assistant will be integrated here.</p>
              <p className="mt-2">Features coming soon:</p>
              <ul className="mt-1 list-disc list-inside space-y-1">
                <li>Code suggestions</li>
                <li>Bug detection</li>
                <li>Code explanation</li>
                <li>Refactoring help</li>
              </ul>
            </div>
          </div>

          {/* Chat Panel Placeholder */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900">Chat</h3>
            </div>
            <div className="flex-1 p-4">
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                <p>Real-time chat will be available here.</p>
                <p className="mt-2">Discuss code, share ideas, and collaborate effectively.</p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled
                />
                <Button size="sm" disabled>
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
