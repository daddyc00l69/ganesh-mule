import { NextRequest, NextResponse } from 'next/server';
import {
  GOOGLE_OAUTH_COOKIE_NAME,
  verifyOAuthState,
  exchangeGoogleCode,
  authenticateGoogleUser,
  getBaseUrl,
} from '@/lib/auth/google';
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const errorParam = searchParams.get('error');
  const code = searchParams.get('code');
  const stateParam = searchParams.get('state');

  const cookieState = req.cookies.get(GOOGLE_OAUTH_COOKIE_NAME)?.value;
  const baseUrl = getBaseUrl(req);

  // 1. Handle user cancellation or Google-side error
  if (errorParam) {
    const errorDesc = searchParams.get('error_description') || errorParam;
    console.warn('[Google OAuth Flow Cancelled/Error]', errorDesc);
    const returnUrl = new URL('/account', baseUrl);
    returnUrl.searchParams.set('error', 'google_auth_cancelled');
    returnUrl.searchParams.set('message', 'Google sign-in was cancelled or encountered an error.');
    return NextResponse.redirect(returnUrl);
  }

  // 2. Validate presence of code and state
  if (!code || !stateParam) {
    const returnUrl = new URL('/account', baseUrl);
    returnUrl.searchParams.set('error', 'missing_parameters');
    returnUrl.searchParams.set('message', 'Authorization code or state parameter missing from callback.');
    return NextResponse.redirect(returnUrl);
  }

  // 3. Cryptographic State & CSRF Validation
  if (!cookieState || cookieState !== stateParam) {
    console.error('[Google OAuth State Mismatch] Possible CSRF or expired session state.');
    const returnUrl = new URL('/account', baseUrl);
    returnUrl.searchParams.set('error', 'invalid_state');
    returnUrl.searchParams.set('message', 'Session state mismatch or authorization expired. Please try again.');
    return NextResponse.redirect(returnUrl);
  }

  const verifiedState = verifyOAuthState(stateParam);
  if (!verifiedState) {
    console.error('[Google OAuth State Verification Failed]');
    const returnUrl = new URL('/account', baseUrl);
    returnUrl.searchParams.set('error', 'state_expired');
    returnUrl.searchParams.set('message', 'Sign-in session timed out. Please initiate sign-in again.');
    return NextResponse.redirect(returnUrl);
  }

  try {
    // 4. Exchange code for verified Google profile
    const googleProfile = await exchangeGoogleCode(code, req);

    // 5. Authenticate user, resolve role, and issue session
    const { token, redirectUrl } = await authenticateGoogleUser(googleProfile, verifiedState);

    // 6. Build redirect response
    const finalDestination = new URL(redirectUrl, baseUrl);
    const res = NextResponse.redirect(finalDestination);
    const isHttps = req.nextUrl.protocol === 'https:' || baseUrl.startsWith('https:');

    // 7. Set secure session cookie (7 days)
    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' && isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    });

    // 8. Clear temporary OAuth state cookie
    res.cookies.set(GOOGLE_OAUTH_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' && isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return res;
  } catch (authError: any) {
    console.error('[Google OAuth Authentication Failure]', authError.message);
    const failureUrl = new URL(
      verifiedState.expectedRole === 'ADMIN' || verifiedState.expectedRole === 'MANAGER'
        ? '/portal'
        : '/account',
      baseUrl
    );
    failureUrl.searchParams.set('error', 'auth_failed');
    failureUrl.searchParams.set('message', authError.message || 'Authentication with Google failed.');

    const res = NextResponse.redirect(failureUrl);
    // Clear temporary OAuth state cookie on failure
    res.cookies.set(GOOGLE_OAUTH_COOKIE_NAME, '', {
      path: '/',
      maxAge: 0,
    });
    return res;
  }
}
