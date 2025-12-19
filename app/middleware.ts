import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. Get the path the user is trying to visit
  const path = request.nextUrl.pathname;

  // 2. Get the role from the cookie (We will set this in the login route)
  // Note: In production, we would verify a secure JWT token here.
  const role = request.cookies.get('optimus_role')?.value;

  // 3. Define the protection logic

  // A. Protect Admin Routes
  // If trying to access /admin AND role is NOT super_admin -> Redirect to Login
  if (path.startsWith('/admin') && role !== 'super_admin') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // B. Protect Auris Team Routes
  // If trying to access /team/auris AND role is NOT auris_leader -> Redirect
  // (Optional: Allow super_admin to see everything by adding: && role !== 'super_admin')
  if (path.startsWith('/team/auris') && role !== 'auris_leader' && role !== 'super_admin') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  // C. Protect Libras Team Routes
  // If trying to access /team/libras AND role is NOT libras_leader -> Redirect
  if (path.startsWith('/team/libras') && role !== 'libras_leader' && role !== 'super_admin') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  // 4. If all checks pass, allow the request
  return NextResponse.next();
}

// 5. Matcher: Only run middleware on these specific paths to save performance
export const config = {
  matcher: [
    '/admin/:path*', 
    '/team/:path*'
  ],
};