import { NextRequest, NextResponse } from 'next/server';
import { getSessionTokenFromCookies } from './session';
import { prisma, isDatabaseOnline } from '@/lib/db';
import { SafeUser } from '@/types';
import { hasPermission, PermissionKey } from '@/lib/permissions';

/**
 * Extracts and verifies the currently logged in user from session cookies.
 */
export async function getCurrentUser(): Promise<SafeUser | null> {
  try {
    const token = await getSessionTokenFromCookies();
    if (!token) return null;

    // Fallback dev session token format for testing / dev mode: dev_ROLE_email
    if (token.startsWith('dev_')) {
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
  requiredRole?: 'ADMIN' | 'MANAGER' | 'CUSTOMER',
  requiredPermission?: PermissionKey
): Promise<{ user: SafeUser } | { error: string; status: number }> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'Authentication required', status: 401 };
  }

  if (requiredRole && user.role !== requiredRole && user.role !== 'ADMIN') {
    return { error: 'Insufficient role privileges', status: 403 };
  }

  if (
    requiredPermission &&
    !hasPermission(user.role as any, user.permissions || [], requiredPermission)
  ) {
    return { error: `Missing required permission: ${requiredPermission}`, status: 403 };
  }

  return { user };
}
