'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSessionStore, useUserStore } from '@/lib/stores'
import { serviceProvider } from '@/lib/services'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import CollaborativeEditor from '@/components/editor/CollaborativeEditor'
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
  AlertCircle
} from 'lucide-react'

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
  
  // Zustand stores
  const {
    currentSession,
    participants,
    isLoading,
    error,
    loadSession,
    joinSession,
    leaveSession,
    saveCodeSnapshot,
    subscribeToRealTimeUpdates,
    unsubscribeFromRealTimeUpdates,
    reset
  } = useSessionStore()
  
  const { user, profile, isAuthenticated } = useUserStore()
  
  // Local UI state
  const [sessionState, setSessionState] = useState<SessionState>({
    micEnabled: false,
    videoEnabled: false,
    editorTheme: 'vs-dark',
    isRunning: false
  })
  
  const [currentCode, setCurrentCode] = useState('')
  const [hasJoined, setHasJoined] = useState(false)

  // Initialize session on mount
  useEffect(() => {
    if (!sessionId || !isAuthenticated || !user) {
      router.push('/auth/signin')
      return
    }

    // Load session data
    loadSession(sessionId)
    
    // Subscribe to real-time updates
    subscribeToRealTimeUpdates(sessionId)

    // Cleanup on unmount
    return () => {
      unsubscribeFromRealTimeUpdates()
    }
  }, [sessionId, isAuthenticated, user, loadSession, subscribeToRealTimeUpdates, unsubscribeFromRealTimeUpdates, router])

  // Join session when data is loaded
  useEffect(() => {
    if (currentSession && user && !hasJoined && !isLoading) {
      const isParticipant = participants.some(p => p.user_id === user.id && p.is_active)
      
      if (!isParticipant) {
        // Join the session
        joinSession(sessionId, user.id).then(() => {
          setHasJoined(true)
        })
      } else {
        setHasJoined(true)
      }
    }
  }, [currentSession, user, hasJoined, isLoading, participants, joinSession, sessionId])

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
      typescript: `// Welcome to CollabCode - React TypeScript Session!
import React, { useState } from 'react';

interface Props {
  title: string;
}

const CollaborativeComponent: React.FC<Props> = ({ title }) => {
  const [count, setCount] = useState(0);
  
  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <p className="mb-4">Count: {count}</p>
      <button 
        onClick={() => setCount(count + 1)}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Increment
      </button>
    </div>
  );
};

export default CollaborativeComponent;

// Start building something amazing together!`,
      javascript: `// Welcome to CollabCode - JavaScript Session!
function CollaborativeApp() {
  let count = 0;
  
  function increment() {
    count++;
    updateDisplay();
  }
  
  function updateDisplay() {
    const countElement = document.getElementById('count');
    if (countElement) {
      countElement.textContent = count.toString();
    }
  }
  
  return {
    increment,
    getCount: () => count
  };
}

// Initialize the app
const app = CollaborativeApp();

// Start coding here!
console.log('Welcome to collaborative coding!');`,
      python: `# Welcome to CollabCode - Python Session!
def collaborative_function():
    """
    A simple function to demonstrate collaborative coding
    """
    print("Hello from CollabCode!")
    
    # Example: Simple counter class
    class Counter:
        def __init__(self):
            self.count = 0
        
        def increment(self):
            self.count += 1
            return self.count
        
        def get_count(self):
            return self.count
    
    # Create and use the counter
    counter = Counter()
    print(f"Initial count: {counter.get_count()}")
    
    for i in range(5):
        counter.increment()
        print(f"Count after increment {i+1}: {counter.get_count()}")

if __name__ == "__main__":
    collaborative_function()
    # Start building something amazing together!`,
      html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CollabCode Session</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
        }
        
        .container {
            background: rgba(255, 255, 255, 0.1);
            padding: 30px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
        }
        
        .counter {
            text-align: center;
            margin: 30px 0;
        }
        
        button {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 15px 30px;
            font-size: 16px;
            border-radius: 8px;
            cursor: pointer;
            transition: background 0.3s;
        }
        
        button:hover {
            background: #45a049;
        }
        
        #count {
            font-size: 2em;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Welcome to CollabCode!</h1>
        <p>Start building something amazing together!</p>
        
        <div class="counter">
            <h2>Collaborative Counter</h2>
            <div id="count">0</div>
            <button onclick="increment()">Click me!</button>
        </div>
    </div>

    <script>
        let count = 0;
        
        function increment() {
            count++;
            document.getElementById('count').textContent = count;
        }
        
        // Add your JavaScript here!
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
      const shareText = `Join my CollabCode session: ${currentSession.name}\nCode: ${currentSession.code}\nLink: ${window.location.origin}/session/${currentSession.id}`
      try {
        await navigator.clipboard.writeText(shareText)
        // Could add a toast notification here
      } catch (err) {
        console.error('Failed to copy share text:', err)
      }
    }
  }

  const handleCodeChange = async (code: string) => {
    setCurrentCode(code)
    
    // Auto-save code snapshot every 30 seconds or on significant changes
    if (currentSession && user && code.trim() !== currentCode.trim()) {
      // Debounce the save operation
      const timeoutId = setTimeout(() => {
        saveCodeSnapshot(code, user.id)
      }, 30000) // 30 seconds
      
      return () => clearTimeout(timeoutId)
    }
  }

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
    a.download = `${currentSession.name.replace(/\s+/g, '_').toLowerCase()}.${extension}`
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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading session...</p>
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
                <h1 className="text-lg font-semibold text-gray-900">{currentSession.name}</h1>
                <p className="text-sm text-gray-500">Session Code: {currentSession.code}</p>
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
                <span>{participants.length}</span>
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
            <h3 className="text-sm font-medium text-gray-900 mb-3">Participants ({participants.length})</h3>
            <div className="space-y-2">
              {participants.map((participant) => {
                const isOwner = participant.user_id === currentSession.owner_id
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
