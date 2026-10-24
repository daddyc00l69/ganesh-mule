export const PERMISSIONS = {
  PRODUCTS_READ: 'products.read',
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_UPDATE: 'products.update',
  INVENTORY_READ: 'inventory.read',
  INVENTORY_UPDATE: 'inventory.update',
  ORDERS_READ: 'orders.read',
  ORDERS_UPDATE: 'orders.update',
  CUSTOMERS_READ: 'customers.read',
  SUPPORT_MANAGE: 'support.manage',
  REFUNDS_REQUEST: 'refunds.request',
  REFUNDS_APPROVE: 'refunds.approve',
  REPORTS_READ: 'reports.read',
  MANAGERS_MANAGE: 'managers.manage',
  SETTINGS_MANAGE: 'settings.manage',
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export interface PermissionDefinition {
  key: PermissionKey;
  label: string;
  category: 'Products' | 'Inventory' | 'Orders' | 'Customers' | 'Support' | 'Reports' | 'Administration';
  description: string;
}

export const ALL_PERMISSIONS: PermissionDefinition[] = [
  {
    key: PERMISSIONS.PRODUCTS_READ,
    label: 'View Products & Categories',
    category: 'Products',
    description: 'Browse all catalog items, categories, prices, and stock numbers.',
  },
  {
    key: PERMISSIONS.PRODUCTS_CREATE,
    label: 'Create Products & Categories',
    category: 'Products',
    description: 'Add new items, upload media, and create product categories.',
  },
  {
    key: PERMISSIONS.PRODUCTS_UPDATE,
    label: 'Edit Products & Categories',
    category: 'Products',
    description: 'Update descriptions, prices, SKU, tags, and category links.',
  },
  {
    key: PERMISSIONS.INVENTORY_READ,
    label: 'View Inventory & Movements',
    category: 'Inventory',
    description: 'Inspect current stock, reserved stock, and historical movement logs.',
  },
  {
    key: PERMISSIONS.INVENTORY_UPDATE,
    label: 'Adjust Inventory',
    category: 'Inventory',
    description: 'Record stock adjustments, restocks, and write-offs with audit reasons.',
  },
  {
    key: PERMISSIONS.ORDERS_READ,
    label: 'View Orders',
    category: 'Orders',
    description: 'View customer orders, delivery addresses, and payment statuses.',
  },
  {
    key: PERMISSIONS.ORDERS_UPDATE,
    label: 'Process Orders & Shipping',
    category: 'Orders',
    description: 'Advance order statuses, record shipments, and enter tracking numbers.',
  },
  {
    key: PERMISSIONS.CUSTOMERS_READ,
    label: 'View Customers',
    category: 'Customers',
    description: 'View customer contact details and order histories within scope.',
  },
  {
    key: PERMISSIONS.SUPPORT_MANAGE,
    label: 'Manage Customer Support',
    category: 'Support',
    description: 'Access Chatwoot support desk, view conversation links, and respond.',
  },
  {
    key: PERMISSIONS.REFUNDS_REQUEST,
    label: 'Request Refunds',
    category: 'Orders',
    description: 'Initiate return and refund evaluation tickets for customer orders.',
  },
  {
    key: PERMISSIONS.REFUNDS_APPROVE,
    label: 'Approve & Execute Refunds',
    category: 'Orders',
    description: 'Authorize and execute payment gateway refunds back to customers.',
  },
  {
    key: PERMISSIONS.REPORTS_READ,
    label: 'View Operational Reports',
    category: 'Reports',
    description: 'Review sales velocity, order statistics, and processing times.',
  },
  {
    key: PERMISSIONS.MANAGERS_MANAGE,
    label: 'Manage Manager Staff',
    category: 'Administration',
    description: 'Create, update, activate, and deactivate manager accounts.',
  },
  {
    key: PERMISSIONS.SETTINGS_MANAGE,
    label: 'Manage Store Settings',
    category: 'Administration',
    description: 'Configure store information, shipping thresholds, taxes, and integrations.',
  },
];

/**
 * Checks if a user has the specified permission.
 * Admins inherently possess all permissions.
 */
export function hasPermission(
  role: 'ADMIN' | 'MANAGER' | 'CUSTOMER',
  userPermissions: string[] = [],
  requiredPermission: PermissionKey
): boolean {
  if (role === 'ADMIN') {
    return true;
  }
  if (role === 'CUSTOMER') {
    return false;
  }
  return userPermissions.includes(requiredPermission);
}

/**
 * Checks if a user has all of the specified permissions.
 */
export function hasAllPermissions(
  role: 'ADMIN' | 'MANAGER' | 'CUSTOMER',
  userPermissions: string[] = [],
  requiredPermissions: PermissionKey[]
): boolean {
  if (role === 'ADMIN') return true;
  if (role === 'CUSTOMER') return false;
  return requiredPermissions.every((perm) => userPermissions.includes(perm));
}

/**
 * Checks if a user has at least one of the specified permissions.
 */
export function hasAnyPermission(
  role: 'ADMIN' | 'MANAGER' | 'CUSTOMER',
  userPermissions: string[] = [],
  candidatePermissions: PermissionKey[]
): boolean {
  if (role === 'ADMIN') return true;
  if (role === 'CUSTOMER') return false;
  return candidatePermissions.some((perm) => userPermissions.includes(perm));
}
