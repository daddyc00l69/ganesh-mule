import { NextRequest, NextResponse } from 'next/server';
import { getSessionTokenFromCookies, getRawSessionCookie, decodeUserSessionFromToken } from './session';
import { findStaffBySessionToken } from './staff-store';
import { prisma, isDatabaseOnline } from '@/lib/db';
import { SafeUser } from '@/types';
import { hasPermission, PermissionKey } from '@/lib/permissions';

/**
 * Extracts and verifies the currently logged in user from session cookies.
 */
export async function getCurrentUser(): Promise<SafeUser | null> {
  try {
    const rawCookie = await getRawSessionCookie();
    if (rawCookie) {
      // 1. Check stateless signed user payload (bulletproof across Vercel serverless lambdas)
      const statelessUser = decodeUserSessionFromToken(rawCookie);
      if (statelessUser) return statelessUser;
    }

    const token = await getSessionTokenFromCookies();
    if (!token) return null;

    // 1b. Check if token itself is a stateless signed user payload
    const statelessFromToken = decodeUserSessionFromToken(token);
    if (statelessFromToken) return statelessFromToken;

    // 2. Check in-memory / persisted staff store sessions
    const staffUser = findStaffBySessionToken(token);
    if (staffUser) return staffUser;

    // Fallback dev session token format for testing / dev mode: dev_ROLE_email
    if (process.env.NODE_ENV !== 'production' && token.startsWith('dev_')) {
      const [, role, email] = token.split('_');
      return {
        id: `usr-${role.toLowerCase()}`,
        email: email || `${role.toLowerCase()}@ganeshmule.com`,
        name: role === 'ADMIN' ? 'Super Admin' : 'Vikram Mehta',
        role: role as any,
        isActive: true,
        createdAt: new Date().toISOString(),
        permissions: role === 'ADMIN' ? [] : ['orders.read', 'orders.update', 'inventory.read', 'inventory.update'],
      };
    }

    // Check DB session if database is online
    const dbOnline = await isDatabaseOnline();
    if (!dbOnline) return null;

    try {
      const session = await prisma.session.findUnique({
        where: { token },
        include: {
          user: {
            include: {
              managerProfile: true,
              customerProfile: true,
            },
          },
        },
      });

      if (session && session.expiresAt > new Date() && session.user.isActive) {
        return {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role as any,
          isActive: session.user.isActive,
          createdAt: session.user.createdAt.toISOString(),
          permissions: session.user.managerProfile?.permissions || [],
          department: session.user.managerProfile?.department || undefined,
          avatarUrl: session.user.avatarUrl || undefined,
        };
      }
    } catch {
      // DB unreachable
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Validates that current user has required role and permission.
 */
export async function requireAuth(
  requiredRole?: 'DEVELOPER' | 'ADMIN' | 'MANAGER' | 'CUSTOMER',
  requiredPermission?: PermissionKey
): Promise<{ user: SafeUser } | { error: string; status: number }> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'Authentication required', status: 401 };
  }

  // Developer has full super-user privileges across all panels
  if (user.role === 'DEVELOPER') {
    return { user };
  }

  // Developer panel is strictly restricted to DEVELOPER role
  if (requiredRole === 'DEVELOPER') {
    return { error: 'Insufficient role privileges (Developer access required)', status: 403 };
  }

  // Admin access allows DEVELOPER or ADMIN
  if (requiredRole === 'ADMIN' && user.role !== 'ADMIN') {
    return { error: 'Insufficient role privileges (Administrator access required)', status: 403 };
  }

  // Manager access allows DEVELOPER, ADMIN, or MANAGER
  if (requiredRole === 'MANAGER' && user.role !== 'MANAGER' && user.role !== 'ADMIN') {
    return { error: 'Insufficient role privileges (Staff access required)', status: 403 };
  }

  if (
    requiredPermission &&
    !hasPermission(user.role as any, user.permissions || [], requiredPermission)
  ) {
    return { error: `Missing required permission: ${requiredPermission}`, status: 403 };
  }

  return { user };
}

/**
 * Enforces staff authentication & permission in production deployments (e.g., public VPS)
 * while preserving dev/test ergonomics locally.
 */
export async function requireAuthInProduction(
  requiredRole: 'ADMIN' | 'MANAGER' = 'MANAGER',
  requiredPermission?: PermissionKey
): Promise<{ user: SafeUser | null } | { response: NextResponse }> {
  const auth = await requireAuth(requiredRole, requiredPermission);
  if ('error' in auth) {
    if (process.env.NODE_ENV === 'production') {
      return {
        response: NextResponse.json({ error: auth.error }, { status: auth.status }),
      };
    }
    return { user: null };
  }
  return { user: auth.user };
}
