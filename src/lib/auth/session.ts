import { cookies } from 'next/headers';
import { createHmac, randomBytes } from 'crypto';
import type { SafeUser } from '@/types';

export const SESSION_COOKIE_NAME = 'sg_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-fallback-session-secret-min-32-chars-long';

interface StatelessSessionPayload {
  user: SafeUser;
  exp: number;
}

/**
 * Creates a self-contained, HMAC-SHA256 signed stateless session token.
 * This guarantees session validity across all Vercel serverless Lambda instances without requiring in-memory state.
 */
export function createUserSessionToken(user: SafeUser): string {
  const payload: StatelessSessionPayload = {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions || [],
      department: user.department,
      isActive: true,
      createdAt: user.createdAt,
    },
    exp: Date.now() + SESSION_MAX_AGE * 1000,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const hmac = createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('hex');
  return `usr_${payloadB64}.${hmac}`;
}

/**
 * Decodes and verifies a stateless session token. Returns SafeUser if signature is valid and unexpired.
 */
export function decodeUserSessionFromToken(signedValue: string): SafeUser | null {
  if (!signedValue || typeof signedValue !== 'string') return null;

  // Handle usr_ prefix
  let content = signedValue;
  if (content.startsWith('usr_')) {
    content = content.slice(4);
  } else {
    // Check if it's a signed token that contains usr_
    const verified = verifySignedSessionToken(signedValue);
    if (verified && verified.startsWith('usr_')) {
      content = verified.slice(4);
    } else {
      return null;
    }
  }

  const parts = content.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;
  const expectedSig = createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('hex');
  if (signature !== expectedSig) return null;

  try {
    const rawJson = Buffer.from(payloadB64, 'base64url').toString('utf-8');
    const parsed: StatelessSessionPayload = JSON.parse(rawJson);
    if (!parsed.user || !parsed.exp) return null;
    if (Date.now() > parsed.exp) return null;
    return parsed.user;
  } catch {
    return null;
  }
}

/**
 * Creates an HMAC signature for a raw string token.
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
  if (!signedValue || typeof signedValue !== 'string') return null;
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
export async function setSessionCookie(rawTokenOrUser: string | SafeUser): Promise<string> {
  const tokenToStore =
    typeof rawTokenOrUser === 'string'
      ? rawTokenOrUser
      : createUserSessionToken(rawTokenOrUser);

  try {
    const cookieStore = await cookies();
    // If it's already a signed usr_ token, store it directly or sign it
    const finalValue = tokenToStore.startsWith('usr_')
      ? tokenToStore
      : signSessionToken(tokenToStore);

    cookieStore.set(SESSION_COOKIE_NAME, finalValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    });
  } catch {
    // Non-request context (e.g. unit tests or background scripts)
  }

  return tokenToStore;
}

/**
 * Clears the session cookie.
 */
export async function clearSessionCookie(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch {
    // Non-request context
  }
}

/**
 * Reads the raw session cookie value directly.
 */
export async function getRawSessionCookie(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(SESSION_COOKIE_NAME);
    return cookie?.value || null;
  } catch {
    return null;
  }
}

/**
 * Reads and verifies the raw session token from current request cookies.
 */
export async function getSessionTokenFromCookies(): Promise<string | null> {
  const raw = await getRawSessionCookie();
  if (!raw) return null;
  if (raw.startsWith('usr_')) return raw;
  return verifySignedSessionToken(raw);
}
