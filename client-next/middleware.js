import { NextResponse } from 'next/server';

// Routes that require authentication
const PROTECTED = ['/home', '/groups', '/profile'];

// Routes that should redirect authenticated users away (to /home)
const AUTH_ONLY = ['/login', '/register'];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth-token')?.value;

  const isProtected = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );
  const isAuthOnly = AUTH_ONLY.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );

  // Unauthenticated user trying to access a protected route → redirect to login
  if (isProtected && !token) {
    const url = new URL('/login', request.url);
    // Preserve the intended destination so we can redirect back after login
    if (pathname !== '/login') {
      url.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(url);
  }

  // Authenticated user trying to access login/register → send to home
  if (isAuthOnly && token) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on all routes except Next.js internals, static files, and API
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js).*)',
  ],
};
