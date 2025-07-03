'use client'

import { useEffect, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import * as Y from 'yjs'
import { MonacoBinding } from 'y-monaco'
import { WebsocketProvider } from 'y-websocket'
import { useSocket } from '@/app/providers'

interface CollaborativeEditorProps {
  sessionId: string
  language: string
  initialValue?: string
  onCodeChange?: (code: string) => void
  theme?: 'vs-dark' | 'light'
  readOnly?: boolean
}

export default function CollaborativeEditor({
  sessionId,
  language,
  initialValue = '',
  onCodeChange,
  theme = 'vs-dark',
  readOnly = false
}: CollaborativeEditorProps) {
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<any>(null)
  const bindingRef = useRef<MonacoBinding | null>(null)
  const docRef = useRef<Y.Doc | null>(null)
  const providerRef = useRef<WebsocketProvider | null>(null)
  const socket = useSocket()
  
  const [isConnected, setIsConnected] = useState(false)
  const [collaborators, setCollaborators] = useState<string[]>([])

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor
    monacoRef.current = monaco

    // Configure Monaco Editor
    monaco.editor.defineTheme('collaborativeTheme', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
      ],
      colors: {
        'editor.background': '#1E1E1E',
        'editor.foreground': '#D4D4D4',
        'editor.lineHighlightBackground': '#2D2D30',
        'editor.selectionBackground': '#264F78',
        'editorCursor.foreground': '#AEAFAD',
      }
    })

    if (theme === 'vs-dark') {
      monaco.editor.setTheme('collaborativeTheme')
    }

    // Initialize Y.js document
    const ydoc = new Y.Doc()
    docRef.current = ydoc
    const ytext = ydoc.getText('monaco')

    // Set initial content if provided
    if (initialValue && ytext.length === 0) {
      ytext.insert(0, initialValue)
    }

    // Initialize WebSocket provider for real-time collaboration
    try {
      const wsUrl = process.env.NODE_ENV === 'production' 
        ? `wss://${window.location.host}`
        : 'ws://localhost:8000'
      
      console.log('🔗 Connecting to Y.js WebSocket:', wsUrl, `session-${sessionId}`)
      
      const provider = new WebsocketProvider(wsUrl, `session-${sessionId}`, ydoc)
      providerRef.current = provider

      provider.on('status', (event: any) => {
        console.log('🔗 Y.js WebSocket status:', event.status)
        setIsConnected(event.status === 'connected')
      })

      provider.on('connection-close', (event: any) => {
        console.log('🔗 Y.js WebSocket connection closed:', event)
      })

      provider.on('connection-error', (event: any) => {
        console.error('🔗 Y.js WebSocket connection error:', event)
      })

      // Note: y-websocket doesn't have a 'peers' event, we'll track collaborators differently
      // We need to sync this with the actual participants from the session store
      provider.awareness.on('change', () => {
        // Only count unique remote clients - exclude our own client
        const states = Array.from(provider.awareness.getStates().entries())
          .filter(([clientID]) => clientID !== provider.awareness.clientID);
        
        console.log('👥 Y.js awareness states changed:', states.length + 1) // +1 for ourselves
        setCollaborators(states.map((entry, index) => `User ${index + 1}`))
      })

      // Create Monaco binding for collaborative editing
      const binding = new MonacoBinding(ytext, editor.getModel()!, new Set([editor]), provider.awareness)
      bindingRef.current = binding

      // Listen for code changes
      editor.onDidChangeModelContent(() => {
        const code = editor.getValue()
        onCodeChange?.(code)
      })

    } catch (error) {
      console.warn('WebSocket collaboration not available:', error)
      // Socket.IO sync will be handled by the useEffect
    }
  }

  const setupSocketIOSync = (editor: any) => {
    if (!socket) return

    // Clean up any existing listeners first
    socket.off('code-change')
    socket.off('cursor-change')
    socket.off('session-state')
    socket.off('user-joined')
    socket.off('user-left')

    // Join the session room with user information
    const userName = 'User'; // TODO: Get from user store
    socket.emit('join-session', sessionId, { name: userName })

    // Listen for code changes from other users
    socket.on('code-change', (data: { code: string; userId: string; timestamp?: string }) => {
      if (data.userId !== socket.id) {
        const currentPosition = editor.getPosition()
        const currentScrollTop = editor.getScrollTop()
        editor.setValue(data.code)
        if (currentPosition) {
          editor.setPosition(currentPosition)
        }
        editor.setScrollTop(currentScrollTop)
      }
    })

    // Send code changes to other users with debouncing
    let timeout: NodeJS.Timeout
    const handleContentChange = () => {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        const code = editor.getValue()
        if (socket.id) {
          socket.emit('code-change', {
            sessionId,
            code,
            userId: socket.id
          })
        }
        onCodeChange?.(code)
      }, 300) // Debounce for 300ms
    }

    // Remove existing content change listener if any
    const model = editor.getModel()
    if (model) {
      model.onDidChangeContent(handleContentChange)
    }

    // Listen for cursor changes
    socket.on('cursor-change', (data: { 
      position: { lineNumber: number; column: number }; 
      userId: string; 
      userName: string; 
      timestamp?: string 
    }) => {
      if (data.userId !== socket.id && monacoRef.current) {
        try {
          // Add cursor decoration for other users
          const decorations = editor.createDecorationsCollection([{
            range: new monacoRef.current.Range(
              data.position.lineNumber,
              data.position.column,
              data.position.lineNumber,
              data.position.column + 1
            ),
            options: {
              className: 'other-user-cursor',
              hoverMessage: { value: `${data.userName}'s cursor` },
              stickiness: monacoRef.current.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
            }
          }])
          
          // Remove decoration after 3 seconds
          setTimeout(() => decorations.clear(), 3000)
        } catch (error) {
          console.warn('Error adding cursor decoration:', error)
        }
      }
    })

    // Send cursor changes
    const handleCursorChange = (e: any) => {
      if (e.position && socket.id) {
        socket.emit('cursor-change', {
          sessionId,
          position: e.position,
          userId: socket.id,
          userName: 'User' // TODO: Get from user store
        })
      }
    }

    editor.onDidChangeCursorPosition(handleCursorChange)

    // Listen for session state updates
    socket.on('session-state', (data: { 
      code: string; 
      participants: Array<{ id: string; name: string; joinedAt: string }> 
    }) => {
      if (data.code && data.code !== editor.getValue()) {
        editor.setValue(data.code)
        onCodeChange?.(data.code)
      }
      setCollaborators(data.participants.map(p => p.name))
    })

    // Listen for user join/leave events
    socket.on('user-joined', (data: { 
      user: { id: string; name: string; avatar?: string }; 
      participantCount: number 
    }) => {
      console.log(`User ${data.user.name} joined the session`)
    })

    socket.on('user-left', (data: { userId: string; participantCount: number }) => {
      console.log(`User ${data.userId} left the session`)
    })

    setIsConnected(true)
  }

  // Handle socket connection and session joining
  useEffect(() => {
    if (socket && sessionId && editorRef.current) {
      console.log('🔗 Setting up Socket.IO sync for session:', sessionId)
      setupSocketIOSync(editorRef.current)
    }
  }, [socket, sessionId])

  // Cleanup effect - only runs on unmount
  useEffect(() => {
    let isCleanedUp = false

    return () => {
      // Cleanup on unmount only, not on dependency changes
      if (!isCleanedUp) {
        isCleanedUp = true
        
        console.log('🧹 Cleaning up CollaborativeEditor for session:', sessionId)
        
        // Cleanup Y.js bindings
        if (bindingRef.current) {
          bindingRef.current.destroy()
          bindingRef.current = null
        }
        if (providerRef.current) {
          providerRef.current.destroy()
          providerRef.current = null
        }
        if (docRef.current) {
          docRef.current.destroy()
          docRef.current = null
        }
        
        // Cleanup Socket.IO listeners and leave session
        if (socket) {
          socket.off('code-change')
          socket.off('cursor-change')
          socket.off('session-state')
          socket.off('user-joined')
          socket.off('user-left')
          socket.emit('leave-session', sessionId)
        }
      }
    }
  }, []) // Empty dependency array - only run cleanup on unmount

  const getLanguageExtension = (lang: string) => {
    const extensionMap: { [key: string]: string } = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      html: 'html',
      css: 'css',
      json: 'json',
      markdown: 'md',
      tsx: 'tsx',
      jsx: 'jsx'
    }
    return extensionMap[lang] || 'txt'
  }

  return (
    <div className="relative h-full">
      {/* Connection Status */}
      <div className="absolute top-2 right-2 z-10 flex items-center space-x-2 bg-opacity-80 bg-gray-800 px-2 py-1 rounded-md">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
        <span className="text-xs text-white">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      <Editor
        height="100%"
        language={language}
        theme={theme}
        value={initialValue}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          minimap: { enabled: true },
          wordWrap: 'on',
          lineHeight: 1.5,
          fontFamily: '"Fira Code", "Cascadia Code", "JetBrains Mono", Consolas, "Courier New", monospace',
          fontLigatures: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          contextmenu: true,
          selectOnLineNumbers: true,
          glyphMargin: true,
          folding: true,
          foldingStrategy: 'indentation',
          showFoldingControls: 'always',
          unfoldOnClickAfterEndOfLine: false,
          renderLineHighlight: 'all',
          bracketPairColorization: {
            enabled: true
          },
          guides: {
            bracketPairs: true,
            indentation: true
          },
          suggest: {
            showKeywords: true,
            showSnippets: true,
            showClasses: true,
            showFunctions: true,
            showVariables: true
          },
          quickSuggestions: {
            other: true,
            comments: true,
            strings: true
          },
          parameterHints: {
            enabled: true
          },
          hover: {
            enabled: true
          }
        }}
        loading={
          <div className="flex items-center justify-center h-full bg-gray-900">
            <div className="text-center text-gray-400">
              <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p>Loading editor...</p>
            </div>
          </div>
        }
      />

      {/* Custom styles for collaboration cursors */}
      <style jsx global>{`
        .other-user-cursor {
          background-color: rgba(255, 193, 7, 0.3);
          border-left: 2px solid #ffc107;
        }
      `}</style>
    </div>
  )
}
