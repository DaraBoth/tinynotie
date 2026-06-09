import { NextResponse } from 'next/server';

const PROTECTED_PREFIXES = ['/home', '/groups', '/profile', '/settings'];
const AUTH_ROUTES = ['/login', '/register'];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth-token')?.value;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_ROUTES.some((p) => pathname.startsWith(p));

  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/home/:path*',
    '/groups/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/login',
    '/register',
  ],
};
