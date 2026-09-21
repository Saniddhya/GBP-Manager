import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

/**
 * Routes an anonymous visitor may open. `/` used to be caught by the "everything
 * needs a session" default, so the landing page redirected straight to `/login`
 * and its "Get Started" / "Sign In" buttons could never be reached.
 */
const PUBLIC_ROUTES = new Set(['/', '/login', '/register']);
const AUTH_ROUTES = new Set(['/login', '/register']);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await getSession();

  // Signed-in visitors are bounced away from the login/register forms.
  if (session && AUTH_ROUTES.has(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (!session && !PUBLIC_ROUTES.has(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Everything except API routes (they authenticate themselves), Next.js
    // internals and static files such as /favicon.ico or /next.svg.
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};

