import { NextRequest } from 'next/server';
import { createHmac, randomBytes } from 'crypto';
import { prisma, isDatabaseOnline } from '@/lib/db';
import { createUserSessionToken, SESSION_MAX_AGE, SESSION_COOKIE_NAME } from './session';
import { SafeUser } from '@/types';

export const GOOGLE_OAUTH_COOKIE_NAME = 'sg_google_oauth_state';
const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v3/userinfo';

const DEFAULT_DEV_SECRET = 'dev-fallback-session-secret-min-32-chars-long';
const SESSION_SECRET = process.env.SESSION_SECRET || DEFAULT_DEV_SECRET;

export interface GoogleOAuthState {
  csrf: string;
  nonce: string;
  redirect: string;
  expectedRole?: 'ADMIN' | 'MANAGER' | 'CUSTOMER';
  exp: number;
}

export interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

/**
 * Returns true if Google OAuth credentials are set in environment.
 */
export function isGoogleAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim());
}

/**
 * Derives the canonical base URL from environment or request headers.
 */
export function getBaseUrl(req?: NextRequest): string {
  // 1. Explicit APP_URL environment variable
  if (process.env.APP_URL?.trim()) {
    return process.env.APP_URL.trim().replace(/\/$/, '');
  }

  // 2. Request host header if available
  if (req) {
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    const proto = req.headers.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https');
    if (host) {
      return `${proto}://${host}`;
    }
  }

  // 3. Vercel deployment URL
  if (process.env.VERCEL_URL?.trim()) {
    return `https://${process.env.VERCEL_URL.trim()}`;
  }

  return 'http://localhost:3000';
}

/**
 * Derives the exact Google OAuth callback URL.
 */
export function getGoogleCallbackUrl(req?: NextRequest): string {
  const base = getBaseUrl(req);
  return `${base}/api/auth/google/callback`;
}

/**
 * Sanitizes redirect target to prevent open redirect vulnerabilities.
 */
export function sanitizeRedirectPath(path?: string | null): string {
  if (!path || typeof path !== 'string') return '/account';
  const clean = path.trim();
  // Must start with a single slash, not double slash (//evil.com) and no protocol
  if (!clean.startsWith('/') || clean.startsWith('//') || clean.includes('://')) {
    return '/account';
  }
  return clean;
}

/**
 * Encrypts/signs the OAuth state object.
 */
export function signOAuthState(payload: GoogleOAuthState): string {
  const b64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const hmac = createHmac('sha256', SESSION_SECRET).update(b64).digest('hex');
  return `${b64}.${hmac}`;
}

/**
 * Verifies and decodes the OAuth state string.
 */
export function verifyOAuthState(signedState: string): GoogleOAuthState | null {
  if (!signedState || typeof signedState !== 'string') return null;
  const parts = signedState.split('.');
  if (parts.length !== 2) return null;

  const [b64, signature] = parts;
  const expectedSig = createHmac('sha256', SESSION_SECRET).update(b64).digest('hex');
  if (signature !== expectedSig) return null;

  try {
    const raw = Buffer.from(b64, 'base64url').toString('utf-8');
    const state: GoogleOAuthState = JSON.parse(raw);
    if (!state.csrf || !state.exp) return null;
    if (Date.now() > state.exp) return null; // Expired state
    return state;
  } catch {
    return null;
  }
}

/**
 * Creates the Google authorization URL and the state cookie descriptor.
 */
export function createGoogleAuthUrl(options: {
  redirect?: string;
  expectedRole?: 'ADMIN' | 'MANAGER' | 'CUSTOMER';
  req?: NextRequest;
}): { url: string; stateCookieValue: string } {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID is not configured in environment variables');
  }

  const callbackUrl = getGoogleCallbackUrl(options.req);
  const csrf = randomBytes(16).toString('hex');
  const nonce = randomBytes(16).toString('hex');
  const sanitizedRedirect = sanitizeRedirectPath(options.redirect);

  const statePayload: GoogleOAuthState = {
    csrf,
    nonce,
    redirect: sanitizedRedirect,
    expectedRole: options.expectedRole,
    exp: Date.now() + 10 * 60 * 1000, // 10 minutes
  };

  const signedState = signOAuthState(statePayload);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    response_type: 'code',
    scope: 'openid email profile',
    state: signedState,
    nonce,
    access_type: 'online',
    prompt: 'select_account',
  });

  return {
    url: `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`,
    stateCookieValue: signedState,
  };
}

/**
 * Exchanges authorization code for tokens and verifies the Google user profile.
 */
export async function exchangeGoogleCode(
  code: string,
  req: NextRequest
): Promise<GoogleUserInfo> {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET) are missing');
  }

  const callbackUrl = getGoogleCallbackUrl(req);

  // 1. Exchange authorization code for tokens
  const tokenRes = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: callbackUrl,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    console.error('[Google OAuth Token Error]', errText);
    throw new Error('Failed to exchange authorization code with Google');
  }

  const tokens = await tokenRes.json();
  const accessToken = tokens.access_token;
  if (!accessToken) {
    throw new Error('Google did not return an access token');
  }

  // 2. Fetch authenticated user profile
  const userinfoRes = await fetch(GOOGLE_USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!userinfoRes.ok) {
    throw new Error('Failed to retrieve user information from Google');
  }

  const userInfo: GoogleUserInfo = await userinfoRes.json();
  if (!userInfo.sub || !userInfo.email) {
    throw new Error('Invalid user profile returned by Google');
  }

  // Security requirement: Must be a verified email address
  if (!userInfo.email_verified) {
    throw new Error('Unverified Google email addresses cannot be used for authentication');
  }

  return userInfo;
}

/**
 * Resolves user role, safely links accounts, and issues session.
 */
export async function authenticateGoogleUser(
  googleProfile: GoogleUserInfo,
  state: GoogleOAuthState
): Promise<{ user: SafeUser; token: string; redirectUrl: string }> {
  const cleanEmail = googleProfile.email.toLowerCase().trim();
  const configuredAdminEmail = (process.env.ADMIN_EMAIL || 'admin@devtushar.uk').toLowerCase().trim();

  const dbOnline = await isDatabaseOnline();
  let userRecord: any = null;

  if (dbOnline) {
    // 1. Look up existing user by Google ID or Email
    userRecord = await prisma.user.findFirst({
      where: {
        OR: [{ googleId: googleProfile.sub }, { email: cleanEmail }],
      },
      include: {
        managerProfile: true,
      },
    });

    if (userRecord) {
      // Security check: account suspension
      if (!userRecord.isActive) {
        throw new Error('Account has been suspended. Please contact administrator.');
      }

      // Safe account linking: update Google ID and Avatar if not linked
      if (userRecord.googleId !== googleProfile.sub || (!userRecord.avatarUrl && googleProfile.picture)) {
        userRecord = await prisma.user.update({
          where: { id: userRecord.id },
          data: {
            googleId: googleProfile.sub,
            avatarUrl: googleProfile.picture || userRecord.avatarUrl,
            name: userRecord.name || googleProfile.name || 'Ganesh Honey Customer',
          },
          include: {
            managerProfile: true,
          },
        });
      }
    } else {
      // 2. Account does not exist. Check if this is the designated Super Admin
      const isInitialAdmin = cleanEmail === configuredAdminEmail || cleanEmail === 'tushar0p.test@gmail.com';
      const role = isInitialAdmin ? 'ADMIN' : 'CUSTOMER';

      userRecord = await prisma.user.create({
        data: {
          email: cleanEmail,
          name: googleProfile.name || (isInitialAdmin ? 'Tushar (Super Administrator)' : 'Ganesh Honey Customer'),
          googleId: googleProfile.sub,
          avatarUrl: googleProfile.picture,
          role,
          isActive: true,
          ...(role === 'CUSTOMER' ? { customerProfile: { create: {} } } : {}),
        },
        include: {
          managerProfile: true,
        },
      });
    }
  } else {
    // Resilient fallback if DB temporarily unreachable
    const isInitialAdmin = cleanEmail === configuredAdminEmail || cleanEmail === 'tushar0p.test@gmail.com';
    userRecord = {
      id: `usr-google-${googleProfile.sub.slice(-8)}`,
      email: cleanEmail,
      name: googleProfile.name || 'Ganesh Honey Customer',
      role: isInitialAdmin ? 'ADMIN' : 'CUSTOMER',
      isActive: true,
      createdAt: new Date(),
    };
  }

  // 3. Strict Privilege Escalation Protection:
  // If the user signed in from a Staff portal requiring ADMIN or MANAGER, but their role is only CUSTOMER:
  if (
    (state.expectedRole === 'ADMIN' && userRecord.role !== 'ADMIN') ||
    (state.expectedRole === 'MANAGER' && userRecord.role !== 'MANAGER' && userRecord.role !== 'ADMIN')
  ) {
    throw new Error('Access denied: This Google account does not have Staff or Administrator privileges.');
  }

  // 4. Construct SafeUser
  const safeUser: SafeUser = {
    id: userRecord.id,
    email: userRecord.email,
    name: userRecord.name,
    role: userRecord.role,
    isActive: userRecord.isActive,
    createdAt: typeof userRecord.createdAt === 'string' ? userRecord.createdAt : userRecord.createdAt.toISOString(),
    permissions: userRecord.managerProfile?.permissions || [],
    department: userRecord.managerProfile?.department || undefined,
  };

  // 5. Generate secure HMAC-SHA256 session token
  const token = createUserSessionToken(safeUser);

  // 6. Record session in Prisma if DB is online
  if (dbOnline) {
    try {
      await prisma.session.create({
        data: {
          userId: userRecord.id,
          token,
          expiresAt: new Date(Date.now() + SESSION_MAX_AGE * 1000),
        },
      });
    } catch (sessionErr) {
      console.warn('[Session Persist Warning]', sessionErr);
    }
  }

  // 7. Determine clean destination URL based on verified role
  let destination = state.redirect;
  if (safeUser.role === 'ADMIN') {
    destination = destination.startsWith('/admin') ? destination : '/admin';
  } else if (safeUser.role === 'MANAGER') {
    destination = destination.startsWith('/manager') ? destination : '/manager/orders';
  } else {
    // Customers can never be redirected to /admin or /manager
    if (destination.startsWith('/admin') || destination.startsWith('/manager')) {
      destination = '/account';
    }
  }

  return {
    user: safeUser,
    token,
    redirectUrl: destination,
  };
}
