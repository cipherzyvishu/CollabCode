'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AlertCircle } from 'lucide-react'

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div className="mb-4">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Authentication Error
          </h1>
          
          <p className="text-gray-600 mb-6">
            Sorry, we couldn't authenticate you. This could be due to an expired or invalid authentication code.
          </p>
          
          <div className="space-y-3">
            <Link href="/auth/login">
              <Button className="w-full" variant="primary">
                Try Again
              </Button>
            </Link>
            
            <Link href="/">
              <Button className="w-full" variant="outline">
                Go Home
              </Button>
            </Link>
          </div>
          
          <div className="mt-6 text-sm text-gray-500">
            <p>
              If you continue to experience issues, please{' '}
              <a href="mailto:support@collabcode.dev" className="text-blue-600 hover:underline">
                contact support
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
