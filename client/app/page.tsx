'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from './providers'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Code, Users, Zap, ArrowRight } from 'lucide-react'

const HomePage = () => {
  const router = useRouter()
  const supabase = useSupabase()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        // If user is authenticated, redirect to dashboard
        if (user) {
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [supabase, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If user is authenticated, this won't render due to redirect above
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          {/* Logo */}
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-xl flex items-center justify-center mb-8">
            <Code className="h-8 w-8 text-white" />
          </div>
          
          {/* Main Heading */}
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            CollabCode
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Real-time collaborative coding platform. Write code together, 
            share knowledge, and build amazing projects with developers worldwide.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              size="lg"
              onClick={() => router.push('/auth/login')}
              className="flex items-center gap-2"
            >
              Get Started
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push('/auth/login')}
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card className="text-center">
            <CardContent className="p-6">
              <Code className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Real-time Editing
              </h3>
              <p className="text-gray-600">
                Collaborate on code in real-time with Monaco Editor and Y.js synchronization
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-6">
              <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Multi-user Sessions
              </h3>
              <p className="text-gray-600">
                Create private or public sessions with multiple participants and roles
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-6">
              <Zap className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Multiple Languages
              </h3>
              <p className="text-gray-600">
                Support for JavaScript, TypeScript, Python, React, Node.js, and more
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default HomePage