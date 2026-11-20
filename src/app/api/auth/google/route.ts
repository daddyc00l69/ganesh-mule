import { NextRequest, NextResponse } from 'next/server';
import {
  createGoogleAuthUrl,
  isGoogleAuthConfigured,
  GOOGLE_OAUTH_COOKIE_NAME,
} from '@/lib/auth/google';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const redirect = searchParams.get('redirect') || undefined;
    const expectedRoleParam = searchParams.get('expectedRole');
    const expectedRole =
      expectedRoleParam === 'ADMIN' || expectedRoleParam === 'MANAGER' || expectedRoleParam === 'CUSTOMER'
        ? expectedRoleParam
        : undefined;

    // Check if Google credentials exist
    if (!isGoogleAuthConfigured()) {
      const errorRedirect = new URL(
        expectedRole === 'ADMIN' || expectedRole === 'MANAGER' ? '/portal' : '/account',
        req.url
      );
      errorRedirect.searchParams.set('error', 'google_not_configured');
      errorRedirect.searchParams.set(
        'message',
        'Google OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET) are not configured in environment variables.'
      );
      return NextResponse.redirect(errorRedirect);
    }

    const { url, stateCookieValue } = createGoogleAuthUrl({
      redirect,
      expectedRole,
      req,
    });

    const res = NextResponse.redirect(url);
    const isHttps = req.nextUrl.protocol === 'https:';

    // Set secure temporary state cookie for CSRF validation (10 minutes)
    res.cookies.set(GOOGLE_OAUTH_COOKIE_NAME, stateCookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' && isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: 10 * 60, // 10 minutes
    });

    return res;
  } catch (error: any) {
    console.error('[Google OAuth Init Error]', error);
    const fallbackUrl = new URL('/account', req.url);
    fallbackUrl.searchParams.set('error', 'oauth_init_failed');
    fallbackUrl.searchParams.set('message', error.message || 'Failed to initiate Google sign-in');
    return NextResponse.redirect(fallbackUrl);
  }
}
