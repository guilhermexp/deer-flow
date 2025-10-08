import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // In development mode, be very permissive with auth checks
  if (process.env.NODE_ENV === 'development') {
    console.log('🛠️ Middleware: Development mode - allowing all requests');
    return NextResponse.next({
      request,
    });
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Verificar autenticação com timeout para produção
    const userPromise = supabase.auth.getUser()
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Auth timeout')), 5000)
    )

    const { data: { user } } = await Promise.race([
      userPromise,
      timeoutPromise
    ]) as { data: { user: any } }

    // URLs públicas que não precisam de autenticação
    const publicUrls = ['/login', '/register', '/']
    const isPublicUrl = publicUrls.includes(request.nextUrl.pathname)

    // Se não está autenticado e está tentando acessar rota protegida
    if (!user && !isPublicUrl && request.nextUrl.pathname !== '/') {
      // Redirecionar para login
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Se está autenticado e tentando acessar login/register, redirecionar para dashboard
    if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register')) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/dashboard'
      return NextResponse.redirect(redirectUrl)
    }

    return supabaseResponse
    
  } catch (error) {
    console.error('🔥 Middleware auth error:', error);
    // Em caso de erro de auth no middleware, permitir acesso em desenvolvimento
    return NextResponse.next({
      request,
    });
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (they handle their own auth)
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}