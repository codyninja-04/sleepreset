import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED = ['/log', '/insights', '/trends', '/settings']

/**
 * Keeps the Supabase session cookie fresh on navigation and sends signed out
 * visitors to the login page. The landing and auth pages stay open.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return response

  const supabase = createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options })
        response = NextResponse.next({ request: { headers: request.headers } })
        response.cookies.set({ name, value, ...options })
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: '', ...options })
        response = NextResponse.next({ request: { headers: request.headers } })
        response.cookies.set({ name, value: '', ...options })
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const needsAuth = PROTECTED.some((p) => path === p || path.startsWith(`${p}/`))

  if (needsAuth && !user) {
    const login = request.nextUrl.clone()
    login.pathname = '/login'
    login.search = ''
    login.searchParams.set('next', path)
    return NextResponse.redirect(login)
  }

  if (user && (path === '/login' || path === '/signup')) {
    const log = request.nextUrl.clone()
    log.pathname = '/log'
    log.search = ''
    return NextResponse.redirect(log)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|api/cron|sw.js|manifest.webmanifest|icon.svg|maskable.svg|.*\\.png$).*)'],
}
