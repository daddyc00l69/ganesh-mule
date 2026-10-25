import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') || '';
  const pathname = req.nextUrl.pathname;

  // 1. Admin Subdomain Rewriting
  if (host.startsWith('admin.')) {
    if (!pathname.startsWith('/admin') && !pathname.startsWith('/api')) {
      const url = req.nextUrl.clone();
      url.pathname = pathname === '/' ? '/admin' : `/admin${pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  // 2. Direct Root Visits to Shop Catalogue (hide homepage)
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/shop', req.url));
  }

  // 3. Strict Security Route Guard for Staff Portals (/manager and /admin)
  // Prevents unauthorized visitors from seeing or accessing manager/admin interfaces
  if (pathname.startsWith('/manager') || pathname.startsWith('/admin')) {
    const sessionCookie = req.cookies.get('sg_session')?.value;
    if (!sessionCookie) {
      const portalUrl = new URL('/portal', req.url);
      portalUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(portalUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
