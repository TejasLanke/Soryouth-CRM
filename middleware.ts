
import { NextResponse, type NextRequest } from 'next/server';
import { verifySession } from './lib/auth';

export async function middleware(request: NextRequest) {
  const currentUser = await verifySession();
  const { pathname } = request.nextUrl;

  const publicRoutes = ['/', '/login', '/signup'];
  const isPublicRoute = publicRoutes.some(route => pathname === route);

  // If user is trying to access auth pages but is already logged in, redirect to dashboard
  if (currentUser && (pathname.startsWith('/login') || pathname.startsWith('/signup'))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // If user is trying to access a protected route and is not logged in, redirect to login
  if (!currentUser && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  // Match all routes except for API routes, static assets, and images
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
