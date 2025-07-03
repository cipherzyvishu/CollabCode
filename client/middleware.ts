import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Get current user session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/session']
  const isProtectedRoute = protectedRoutes.some(route => 
    url.pathname.startsWith(route)
  )

  // Auth routes that should redirect if already authenticated
  const authRoutes = ['/auth/signin', '/auth/signup']
  const isAuthRoute = authRoutes.some(route => 
    url.pathname.startsWith(route)
  )

  // If user is not authenticated and trying to access protected route
  if (!user && isProtectedRoute) {
    console.log('🚧 Middleware: Unauthenticated user trying to access protected route:', url.pathname)
    const redirectUrl = url.clone()
    // Redirect to the login page (which is active) instead of signin (which just redirects)
    redirectUrl.pathname = '/auth/login'
    
    // Special handling for session routes to ensure proper redirection
    if (url.pathname.startsWith('/session/')) {
      // For session routes, ensure we preserve the session ID
      console.log('🚧 Middleware: Detected session route, preserving session ID in redirectTo')
      redirectUrl.searchParams.set('redirectTo', url.pathname + url.search)
      redirectUrl.searchParams.set('joinSession', 'true') // Flag to indicate this is a session join
    } else {
      // For other routes, preserve the full path including parameters
      redirectUrl.searchParams.set('redirectTo', url.pathname + url.search)
    }
    
    console.log('🚧 Middleware: Redirecting to:', redirectUrl.toString())
    return NextResponse.redirect(redirectUrl)
  }

  // If user is authenticated and trying to access auth routes, redirect to dashboard
  if (user && isAuthRoute) {
    const redirectUrl = url.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
