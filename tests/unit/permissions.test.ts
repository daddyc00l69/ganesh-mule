import { describe, it, expect } from 'vitest';
import { hasPermission, hasAllPermissions, hasAnyPermission, PERMISSIONS } from '@/lib/permissions';

describe('RBAC Granular Permissions Matrix', () => {
  it('Admin should inherently possess all permissions', () => {
    expect(hasPermission('ADMIN', [], PERMISSIONS.ORDERS_READ)).toBe(true);
    expect(hasPermission('ADMIN', [], PERMISSIONS.MANAGERS_MANAGE)).toBe(true);
    expect(hasPermission('ADMIN', [], PERMISSIONS.REFUNDS_APPROVE)).toBe(true);
    expect(hasPermission('ADMIN', [], PERMISSIONS.SETTINGS_MANAGE)).toBe(true);
  });

  it('Customer should be denied administrative permissions', () => {
    expect(hasPermission('CUSTOMER', [], PERMISSIONS.ORDERS_READ)).toBe(false);
    expect(hasPermission('CUSTOMER', [], PERMISSIONS.INVENTORY_UPDATE)).toBe(false);
    expect(hasPermission('CUSTOMER', [], PERMISSIONS.PRODUCTS_CREATE)).toBe(false);
  });

  it('Manager should only possess granted permissions', () => {
    const managerPerms = [PERMISSIONS.ORDERS_READ, PERMISSIONS.ORDERS_UPDATE, PERMISSIONS.INVENTORY_READ];

    expect(hasPermission('MANAGER', managerPerms, PERMISSIONS.ORDERS_READ)).toBe(true);
    expect(hasPermission('MANAGER', managerPerms, PERMISSIONS.ORDERS_UPDATE)).toBe(true);
    expect(hasPermission('MANAGER', managerPerms, PERMISSIONS.INVENTORY_READ)).toBe(true);

    // Ungranted permissions must be denied
    expect(hasPermission('MANAGER', managerPerms, PERMISSIONS.REFUNDS_APPROVE)).toBe(false);
    expect(hasPermission('MANAGER', managerPerms, PERMISSIONS.MANAGERS_MANAGE)).toBe(false);
    expect(hasPermission('MANAGER', managerPerms, PERMISSIONS.SETTINGS_MANAGE)).toBe(false);
  });

  it('should validate multi-permission helper requirements', () => {
    const perms = [PERMISSIONS.ORDERS_READ, PERMISSIONS.ORDERS_UPDATE];

    expect(
      hasAllPermissions('MANAGER', perms, [PERMISSIONS.ORDERS_READ, PERMISSIONS.ORDERS_UPDATE])
    ).toBe(true);

    expect(
      hasAllPermissions('MANAGER', perms, [PERMISSIONS.ORDERS_READ, PERMISSIONS.PRODUCTS_CREATE])
    ).toBe(false);

    expect(
      hasAnyPermission('MANAGER', perms, [PERMISSIONS.PRODUCTS_CREATE, PERMISSIONS.ORDERS_READ])
    ).toBe(true);
  });
});
