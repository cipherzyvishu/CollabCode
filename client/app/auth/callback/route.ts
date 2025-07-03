import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'
  // Check if this is a session join request
  const isJoiningSession = searchParams.get('joinSession') === 'true'
  
  console.log('Auth callback with params:', { 
    next, 
    isJoiningSession, 
    code: code ? 'present' : 'missing' 
  })

  if (code) {
    // Get cookie store
    const cookieStore = cookies()
    
    // Create a server client with proper cookie handlers
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.delete({ name, ...options })
          },
        },
      }
    )

    try {
      // Exchange code for session
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      // Log success or failure
      if (error) {
        console.error('Auth callback error:', error);
        return NextResponse.redirect(`${origin}/auth/auth-code-error`);
      }
      
      console.log(`✅ Authentication successful - redirecting to: ${next}`);
      
      // Ensure proper redirect with query parameters preserved
      let finalRedirectPath = next;
      
      // If this is a session join, make sure we pass the necessary parameters
      if (isJoiningSession && next.includes('/session/')) {
        // Add a parameter to force session join on page load
        const separator = next.includes('?') ? '&' : '?';
        finalRedirectPath = `${next}${separator}forceJoin=true`;
        console.log(`✅ Session join detected - adding forceJoin param: ${finalRedirectPath}`);
      }
      
      // Determine the base URL for redirect based on environment
      const forwardedHost = request.headers.get('x-forwarded-host');
      const baseUrl = process.env.NODE_ENV === 'development'
        ? origin
        : (forwardedHost ? `https://${forwardedHost}` : origin);
      
      const finalUrl = `${baseUrl}${finalRedirectPath}`;
      console.log(`🔀 Final redirect URL: ${finalUrl}`);
      return NextResponse.redirect(finalUrl);
    } catch (error) {
      console.error('Unexpected error in auth callback:', error);
      return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
