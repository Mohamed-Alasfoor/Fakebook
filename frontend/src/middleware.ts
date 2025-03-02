import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Allow unauthenticated access to login, register, and internal assets
  const { pathname } = request.nextUrl
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next()
  }

  // Check if the authentication cookie exists
  const userId = request.cookies.get('user_id')
  if (!userId) {
    // Redirect to the login page immediately
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

// Apply the middleware to all routes except the allowed ones
export const config = {
  matcher: ['/((?!login|register|_next|favicon.ico).*)'],
}
