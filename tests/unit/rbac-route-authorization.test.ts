import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  PERMISSIONS,
  ALL_PERMISSIONS,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  PermissionKey,
} from '@/lib/permissions';
import { requireAuth } from '@/lib/auth/server';
import * as sessionModule from '@/lib/auth/session';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    session: {
      findUnique: vi.fn().mockRejectedValue(new Error('DB Offline Mock')),
    },
  },
}));

describe('Deep RBAC & Permission Enforcement Matrix', () => {
  const allPermissionKeys = Object.values(PERMISSIONS) as PermissionKey[];

  describe('Permission Catalog Completeness', () => {
    it('should define all 14 enterprise permissions in ALL_PERMISSIONS catalog', () => {
      expect(allPermissionKeys).toHaveLength(14);
      expect(ALL_PERMISSIONS).toHaveLength(14);

      const catalogKeys = ALL_PERMISSIONS.map((p) => p.key);
      allPermissionKeys.forEach((key) => {
        expect(catalogKeys).toContain(key);
      });
    });

    it('each catalog entry should have non-empty metadata', () => {
      ALL_PERMISSIONS.forEach((def) => {
        expect(def.key).toBeTruthy();
        expect(def.label).toBeTruthy();
        expect(def.category).toBeTruthy();
        expect(def.description).toBeTruthy();
      });
    });
  });

  describe('ADMIN Role Privileges', () => {
    it('ADMIN inherently possesses every individual permission even if array is empty', () => {
      allPermissionKeys.forEach((key) => {
        expect(hasPermission('ADMIN', [], key)).toBe(true);
      });
    });

    it('ADMIN satisfies all multi-permission requirements simultaneously', () => {
      expect(hasAllPermissions('ADMIN', [], allPermissionKeys)).toBe(true);
      expect(hasAnyPermission('ADMIN', [], [PERMISSIONS.MANAGERS_MANAGE, PERMISSIONS.SETTINGS_MANAGE])).toBe(true);
    });
  });

  describe('CUSTOMER Role Boundary Isolation', () => {
    it('CUSTOMER is strictly denied all administrative and operational permissions', () => {
      allPermissionKeys.forEach((key) => {
        // Even if malicious data passed permissions array, CUSTOMER must be false
        expect(hasPermission('CUSTOMER', [key], key)).toBe(false);
      });
    });

    it('CUSTOMER fails all permission aggregations', () => {
      expect(hasAllPermissions('CUSTOMER', allPermissionKeys, [PERMISSIONS.ORDERS_READ])).toBe(false);
      expect(hasAnyPermission('CUSTOMER', allPermissionKeys, [PERMISSIONS.INVENTORY_READ])).toBe(false);
    });
  });

  describe('MANAGER Role Granular Boundaries', () => {
    const warehouseManagerPerms = [
      PERMISSIONS.INVENTORY_READ,
      PERMISSIONS.INVENTORY_UPDATE,
      PERMISSIONS.PRODUCTS_READ,
    ];

    const supportLeadPerms = [
      PERMISSIONS.ORDERS_READ,
      PERMISSIONS.CUSTOMERS_READ,
      PERMISSIONS.SUPPORT_MANAGE,
      PERMISSIONS.REFUNDS_REQUEST,
    ];

    it('grants access strictly when permission is explicitly assigned', () => {
      expect(hasPermission('MANAGER', warehouseManagerPerms, PERMISSIONS.INVENTORY_READ)).toBe(true);
      expect(hasPermission('MANAGER', warehouseManagerPerms, PERMISSIONS.INVENTORY_UPDATE)).toBe(true);
      expect(hasPermission('MANAGER', warehouseManagerPerms, PERMISSIONS.PRODUCTS_READ)).toBe(true);

      // Must be denied unassigned permissions
      expect(hasPermission('MANAGER', warehouseManagerPerms, PERMISSIONS.MANAGERS_MANAGE)).toBe(false);
      expect(hasPermission('MANAGER', warehouseManagerPerms, PERMISSIONS.REFUNDS_APPROVE)).toBe(false);
      expect(hasPermission('MANAGER', warehouseManagerPerms, PERMISSIONS.SETTINGS_MANAGE)).toBe(false);
      expect(hasPermission('MANAGER', warehouseManagerPerms, PERMISSIONS.SUPPORT_MANAGE)).toBe(false);
    });

    it('evaluates support lead permissions accurately', () => {
      expect(hasPermission('MANAGER', supportLeadPerms, PERMISSIONS.SUPPORT_MANAGE)).toBe(true);
      expect(hasPermission('MANAGER', supportLeadPerms, PERMISSIONS.REFUNDS_REQUEST)).toBe(true);
      // Support lead can request refund, but cannot approve it
      expect(hasPermission('MANAGER', supportLeadPerms, PERMISSIONS.REFUNDS_APPROVE)).toBe(false);
      // Support lead cannot alter inventory
      expect(hasPermission('MANAGER', supportLeadPerms, PERMISSIONS.INVENTORY_UPDATE)).toBe(false);
    });

    it('correctly handles multi-permission checks', () => {
      expect(
        hasAllPermissions('MANAGER', warehouseManagerPerms, [
          PERMISSIONS.INVENTORY_READ,
          PERMISSIONS.INVENTORY_UPDATE,
        ])
      ).toBe(true);

      expect(
        hasAllPermissions('MANAGER', warehouseManagerPerms, [
          PERMISSIONS.INVENTORY_READ,
          PERMISSIONS.MANAGERS_MANAGE, // Missing
        ])
      ).toBe(false);

      expect(
        hasAnyPermission('MANAGER', warehouseManagerPerms, [
          PERMISSIONS.MANAGERS_MANAGE, // Missing
          PERMISSIONS.INVENTORY_READ, // Present
        ])
      ).toBe(true);

      expect(
        hasAnyPermission('MANAGER', warehouseManagerPerms, [
          PERMISSIONS.MANAGERS_MANAGE,
          PERMISSIONS.SETTINGS_MANAGE,
        ])
      ).toBe(false);
    });

    it('handles empty or undefined permissions gracefully without throwing', () => {
      expect(hasPermission('MANAGER', undefined as any, PERMISSIONS.ORDERS_READ)).toBe(false);
      expect(hasPermission('MANAGER', [], PERMISSIONS.ORDERS_READ)).toBe(false);
      expect(hasAllPermissions('MANAGER', [], [PERMISSIONS.ORDERS_READ])).toBe(false);
      expect(hasAnyPermission('MANAGER', [], [PERMISSIONS.ORDERS_READ])).toBe(false);
    });
  });

  describe('Server-Side requireAuth Route Guard Invariants', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('rejects unauthenticated requests with 401 error', async () => {
      vi.spyOn(sessionModule, 'getSessionTokenFromCookies').mockResolvedValue(null);

      const result = await requireAuth();
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.status).toBe(401);
        expect(result.error).toContain('Authentication required');
      }
    });

    it('authorizes authenticated dev admin session across any role & permission requirements', async () => {
      vi.spyOn(sessionModule, 'getSessionTokenFromCookies').mockResolvedValue('dev_ADMIN_admin@solidglass.com');

      const result = await requireAuth('ADMIN', PERMISSIONS.MANAGERS_MANAGE);
      expect('user' in result).toBe(true);
      if ('user' in result) {
        expect(result.user.role).toBe('ADMIN');
        expect(result.user.email).toBe('admin@solidglass.com');
      }
    });

    it('rejects manager when endpoint requires ADMIN role', async () => {
      vi.spyOn(sessionModule, 'getSessionTokenFromCookies').mockResolvedValue('dev_MANAGER_manager@solidglass.com');

      const result = await requireAuth('ADMIN');
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.status).toBe(403);
        expect(result.error).toContain('Insufficient role privileges');
      }
    });

    it('authorizes manager with granted permission', async () => {
      vi.spyOn(sessionModule, 'getSessionTokenFromCookies').mockResolvedValue('dev_MANAGER_manager@solidglass.com');

      // dev_MANAGER token grants: orders.read, orders.update, inventory.read, inventory.update
      const result = await requireAuth('MANAGER', PERMISSIONS.INVENTORY_UPDATE);
      expect('user' in result).toBe(true);
      if ('user' in result) {
        expect(result.user.role).toBe('MANAGER');
      }
    });

    it('rejects manager lacking required permission with 403 error', async () => {
      vi.spyOn(sessionModule, 'getSessionTokenFromCookies').mockResolvedValue('dev_MANAGER_manager@solidglass.com');

      // dev_MANAGER does not have REFUNDS_APPROVE
      const result = await requireAuth('MANAGER', PERMISSIONS.REFUNDS_APPROVE);
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.status).toBe(403);
        expect(result.error).toContain('Missing required permission');
      }
    });
  });
});
