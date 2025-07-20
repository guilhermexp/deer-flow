import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession, isProtectedRoute, isPublicRoute } from '~/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Update Supabase session
  const response = await updateSession(request)
  
  // Check if route requires authentication
  if (isProtectedRoute(pathname)) {
    // Try to get the session from the response cookies
    const supabaseAuth = request.cookies.get('sb-vlwujoxrehymafeeiihh-auth-token')
    
    if (!supabaseAuth) {
      // No auth cookie, redirect to login
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
  }
  
  // For public routes that authenticated users shouldn't access
  if (pathname === '/login' || pathname === '/register') {
    const supabaseAuth = request.cookies.get('sb-vlwujoxrehymafeeiihh-auth-token')
    
    if (supabaseAuth) {
      // User is already authenticated, redirect to chat
      const url = request.nextUrl.clone()
      url.pathname = '/chat'
      return NextResponse.redirect(url)
    }
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)',
  ],
}