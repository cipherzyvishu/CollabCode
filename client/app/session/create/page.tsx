'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { serviceProvider } from '@/lib/services'
import { useUserStore } from '@/lib/stores'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { 
  ArrowLeft,
  Users,
  Globe,
  Lock,
  Code,
  Palette,
  Settings,
  Play,
  Copy,
  Check
} from 'lucide-react'

interface SessionTemplate {
  id: string
  name: string
  language: string
  description: string
  icon: React.ElementType
  color: string
  starter?: string
}

export default function CreateSessionPage() {
  const router = useRouter()
  const user = useUserStore((state) => state.user)
  
  const [sessionName, setSessionName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [maxParticipants, setMaxParticipants] = useState(10)
  const [loading, setLoading] = useState(false)
  const [sessionCode, setSessionCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const templates: SessionTemplate[] = [
    {
      id: 'javascript',
      name: 'JavaScript',
      language: 'javascript',
      description: 'Vanilla JavaScript development',
      icon: Code,
      color: 'yellow',
      starter: `// Welcome to your JavaScript session!
console.log('Hello, collaborative coding!');

function main() {
  // Start coding here...
}

main();`
    },
    {
      id: 'typescript',
      name: 'TypeScript',
      language: 'typescript',
      description: 'TypeScript with type safety',
      icon: Code,
      color: 'blue',
      starter: `// Welcome to your TypeScript session!
interface User {
  name: string;
  id: number;
}

function greetUser(user: User): string {
  return \`Hello, \${user.name}!\`;
}

// Start coding here...`
    },
    {
      id: 'react',
      name: 'React',
      language: 'tsx',
      description: 'React component development',
      icon: Code,
      color: 'cyan',
      starter: `import React, { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h1>Collaborative React Session</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}

export default App;`
    },
    {
      id: 'python',
      name: 'Python',
      language: 'python',
      description: 'Python scripting and development',
      icon: Code,
      color: 'green',
      starter: `# Welcome to your Python session!
def main():
    print("Hello, collaborative coding!")
    
    # Start coding here...
    pass

if __name__ == "__main__":
    main()`
    },
    {
      id: 'nodejs',
      name: 'Node.js',
      language: 'javascript',
      description: 'Server-side JavaScript with Node.js',
      icon: Code,
      color: 'emerald',
      starter: `const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello from collaborative Node.js session!');
});

// Add your routes and logic here...

app.listen(port, () => {
  console.log(\`Server running at http://localhost:\${port}\`);
});`
    },
    {
      id: 'html',
      name: 'HTML/CSS',
      language: 'html',
      description: 'Web page development',
      icon: Palette,
      color: 'orange',
      starter: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Collaborative Session</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
        }
    </style>
</head>
<body>
    <h1>Welcome to Collaborative Coding!</h1>
    <p>Start building your web page here...</p>
</body>
</html>`
    }
  ]

  const handleCreateSession = async () => {
    if (!sessionName.trim() || !selectedTemplate || !user?.id) {
      return
    }

    setLoading(true)

    try {
      const template = templates.find(t => t.id === selectedTemplate)
      
      // Generate a unique session code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase()
      
      const sessionData = {
        title: sessionName,
        description: description || `${template?.name} collaborative session`,
        language: template?.language || 'typescript',
        template_type: selectedTemplate,
        created_by: user.id,
        session_code: code,
        max_participants: maxParticipants,
        is_public: !isPrivate,
        starter_code: template?.starter || '',
        current_code: template?.starter || '',
        is_active: true
      }

      // Save to database using direct Supabase call to bypass type issues
      console.log('Creating session:', sessionData)
      
      const supabase = serviceProvider.getSupabaseClient()
      const { data: createdSession, error: createError } = await supabase
        .from('sessions')
        .insert([sessionData as any])
        .select()
        .single()
      
      if (createError || !createdSession) {
        console.error('Session creation error:', createError)
        throw new Error('Failed to create session in database')
      }

      // Save initial code snapshot with template starter code
      if (template?.starter) {
        const supabase = serviceProvider.getSupabaseClient()
        await supabase.from('code_snapshots').insert({
          session_id: createdSession.id,
          code: template.starter,
          language: template.language || 'typescript',
          saved_by: user.id,
          version_number: 1,
          is_auto_save: false
        } as any)
      }
      
      setSessionCode((createdSession as any).session_code || code)
      
      // Navigate to the session after a short delay
      setTimeout(() => {
        router.push(`/session/${createdSession.id}`)
      }, 2000)
      
    } catch (error) {
      console.error('Failed to create session:', error)
    } finally {
      setLoading(false)
    }
  }

  const copySessionCode = async () => {
    if (sessionCode) {
      await navigator.clipboard.writeText(sessionCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getColorClasses = (color: string) => {
    const colorMap = {
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      cyan: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200'
    }
    return colorMap[color as keyof typeof colorMap] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  if (sessionCode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Created!</h2>
              <p className="text-gray-600">Your collaborative coding session is ready</p>
            </div>
            
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Session Code:</p>
              <div className="flex items-center justify-center space-x-2">
                <code className="text-lg font-mono font-bold bg-gray-100 px-3 py-2 rounded">
                  {sessionCode}
                </code>
                <Button size="sm" variant="ghost" onClick={copySessionCode}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Share this code with collaborators</p>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">Redirecting to your session...</p>
            <div className="animate-pulse h-2 bg-blue-200 rounded-full">
              <div className="h-2 bg-blue-600 rounded-full" style={{ width: '70%' }}></div>
            </div>
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
            <div className="flex items-center">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="ml-4 flex items-center">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">CollabCode</span>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Welcome, {user?.name || user?.email?.split('@')[0] || 'User'}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Session</h1>
          <p className="text-gray-600">Set up a collaborative coding environment for your team</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Session Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Session Details</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Name *
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., React Components Workshop"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    placeholder="Brief description of what you'll be working on..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Template Selection */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Choose Template</h3>
                <p className="text-sm text-gray-600">Select a starting template for your session</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template) => {
                    const IconComponent = template.icon
                    const isSelected = selectedTemplate === template.id
                    
                    return (
                      <div
                        key={template.id}
                        onClick={() => setSelectedTemplate(template.id)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-lg ${getColorClasses(template.color)}`}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900">{template.name}</h4>
                            <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings & Actions */}
          <div className="space-y-6">
            {/* Session Settings */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="ml-3">
                      <div className="flex items-center">
                        {isPrivate ? <Lock className="h-4 w-4 mr-1" /> : <Globe className="h-4 w-4 mr-1" />}
                        <span className="text-sm font-medium text-gray-700">
                          {isPrivate ? 'Private' : 'Public'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {isPrivate ? 'Only invited users can join' : 'Anyone with the code can join'}
                      </p>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Participants
                  </label>
                  <select
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={2}>2 people</option>
                    <option value={5}>5 people</option>
                    <option value={10}>10 people</option>
                    <option value={20}>20 people</option>
                    <option value={50}>50 people</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            {selectedTemplate && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-gray-900">Preview</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        Up to {maxParticipants} participants
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isPrivate ? <Lock className="h-4 w-4 text-gray-500" /> : <Globe className="h-4 w-4 text-gray-500" />}
                      <span className="text-sm text-gray-600">
                        {isPrivate ? 'Private session' : 'Public session'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Code className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {templates.find(t => t.id === selectedTemplate)?.name} template
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Create Button */}
            <Button
              onClick={handleCreateSession}
              disabled={!sessionName.trim() || !selectedTemplate || loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  Creating Session...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Create Session
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
