import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const RESERVED_TOP_LEVEL_PATHS = [
  'about',
  'admin',
  'apply-organizer',
  'apply-venue-owner',
  'auth',
  'booking',
  'bookings',
  'community',
  'dashboard',
  'host-event',
  'hosting',
  'notifications',
  'organizer',
  'payment',
  'payment-failed',
  'payment-success',
  'search',
  'sitemap',
  'status',
  'support',
  'vendor',
  'venues',
];

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

    // Extract the first segment of the pathname
    const firstSegment = pathname.split('/')[1];

    // If the first segment is in the reserved top-level paths, redirect to gobokin.com
    if (RESERVED_TOP_LEVEL_PATHS.includes(firstSegment)) {
      const redirectUrl = `https://gobokin.com${pathname}${url.search}`;
      return NextResponse.redirect(redirectUrl, 307);
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
