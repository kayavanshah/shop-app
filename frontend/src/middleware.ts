import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value
  const { pathname } = request.nextUrl
  
  if (pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/api/auth/')) {
      if (session && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
         try {
             const parsed = await decrypt(session)
             if (parsed) return NextResponse.redirect(new URL('/', request.url))
         } catch(e) {}
      }
      return NextResponse.next()
  }
  
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const parsed = await decrypt(session)
    if (!parsed) {
        return NextResponse.redirect(new URL('/login', request.url))
    }
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

