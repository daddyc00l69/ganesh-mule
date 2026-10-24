import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') || '';
  const pathname = req.nextUrl.pathname;

  // Check if accessing via admin subdomain (e.g. admin.ganeshmule.com or admin.localhost:3001)
  if (host.startsWith('admin.')) {
    if (!pathname.startsWith('/admin') && !pathname.startsWith('/api')) {
      const url = req.nextUrl.clone();
      url.pathname = pathname === '/' ? '/admin' : `/admin${pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
