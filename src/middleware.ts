import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const host = request.headers.get('host') || '';

  // Check if request comes from event.gobokin.com
  if (host.includes('event.gobokin.com')) {
    const pathname = url.pathname;

    // Do not rewrite internal Next.js requests, API routes, or assets with extensions
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api') ||
      pathname.includes('.')
    ) {
      return NextResponse.next();
    }

    // Do not rewrite if the pathname already starts with /events
    if (pathname.startsWith('/events')) {
      return NextResponse.next();
    }

    // Rewrite root '/' to '/events'
    // Rewrite '/[path]' to '/events/[path]'
    url.pathname = `/events${pathname === '/' ? '' : pathname}`;

    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, images, logo, etc. (static files with extensions)
     */
    '/((?!api|_next/static|_next/image|favicon\\.ico|.*\\..*).*)',
  ],
};
