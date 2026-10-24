import { cookies } from 'next/headers';
import { createHmac, randomBytes } from 'crypto';
import type { SafeUser } from '@/types';

export const SESSION_COOKIE_NAME = 'sg_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-fallback-session-secret-min-32-chars-long';

/**
 * Creates an HMAC signature for a token.
 */
export function signSessionToken(token: string): string {
  const hmac = createHmac('sha256', SESSION_SECRET);
  hmac.update(token);
  return `${token}.${hmac.digest('hex')}`;
}

/**
 * Verifies and extracts the raw token from a signed session string.
 */
export function verifySignedSessionToken(signedValue: string): string | null {
  const parts = signedValue.split('.');
  if (parts.length !== 2) return null;
  const [token, signature] = parts;
  const expectedSig = createHmac('sha256', SESSION_SECRET).update(token).digest('hex');
  if (signature !== expectedSig) return null;
  return token;
}

/**
 * Generates an unguessable 32-byte cryptographic token.
 */
export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Sets the secure session cookie on the response.
 */
export async function setSessionCookie(rawToken: string): Promise<void> {
  const cookieStore = await cookies();
  const signed = signSessionToken(rawToken);
  
  cookieStore.set(SESSION_COOKIE_NAME, signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

/**
 * Clears the session cookie.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Reads and verifies the raw session token from current request cookies.
 */
export async function getSessionTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!cookie?.value) return null;
  return verifySignedSessionToken(cookie.value);
}
