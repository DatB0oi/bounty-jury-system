import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('jury_auth')?.value;
  const path = request.nextUrl.pathname;
  
  // Public assets and API auth routes
  if (path.startsWith('/_next') || path.startsWith('/logo.svg') || path === '/api/login' || path === '/api/change-password') {
    return NextResponse.next();
  }

  // If no token and not on login page -> redirect to login
  if (!token && path !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token) {
    const payload = await verifyToken(token);
    
    // Invalid token -> clear cookie and go to login
    if (!payload && path !== '/login') {
      const resp = NextResponse.redirect(new URL('/login', request.url));
      resp.cookies.delete('jury_auth');
      return resp;
    }

    if (payload) {
      // Valid token, but requires password change
      if (payload.requiresPasswordChange && path !== '/change-password') {
        return NextResponse.redirect(new URL('/change-password', request.url));
      }

      // Valid token, no password change, but on login page
      if (!payload.requiresPasswordChange && (path === '/login' || path === '/change-password')) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'], // Match all except static files
};
