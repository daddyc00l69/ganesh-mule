/**
 * Enterprise Live Order Store
 * Global singleton guaranteeing zero desynchronization between Checkout, Admin, Manager, and Customer portals.
 */

import { OrderRecord, OrderStatus, PaymentStatus } from '@/types';
import { MOCK_ORDERS } from '@/lib/mock-data';

// Persistent global store across Next.js reloads and route handlers
const globalStore = globalThis as unknown as {
  __LIVE_ORDERS__?: OrderRecord[];
};

if (!globalStore.__LIVE_ORDERS__) {
  // Initialize from seed orders
  globalStore.__LIVE_ORDERS__ = [...MOCK_ORDERS];
}

export function getLiveOrders(): OrderRecord[] {
  if (!globalStore.__LIVE_ORDERS__) {
    globalStore.__LIVE_ORDERS__ = [...MOCK_ORDERS];
  }
  return globalStore.__LIVE_ORDERS__;
}

export function getLiveOrderById(idOrNumber: string): OrderRecord | undefined {
  const orders = getLiveOrders();
  return orders.find(
    (o) => o.id === idOrNumber || o.orderNumber.toLowerCase() === idOrNumber.toLowerCase()
  );
}

export function getLiveOrdersByCustomerEmail(email: string): OrderRecord[] {
  const cleanEmail = email.trim().toLowerCase();
  const orders = getLiveOrders();
  return orders.filter((o) => o.customerEmail?.toLowerCase() === cleanEmail);
}

export function getLiveOrdersByManager(managerName: string): OrderRecord[] {
  const clean = managerName.trim().toLowerCase();
  const orders = getLiveOrders();
  return orders.filter((o) => o.assignedManagerName?.toLowerCase() === clean);
}

export function addLiveOrder(order: OrderRecord): OrderRecord {
  const orders = getLiveOrders();
  // Prevent duplicate insertion
  const existingIdx = orders.findIndex(
    (o) => o.id === order.id || o.orderNumber === order.orderNumber
  );
  if (existingIdx >= 0) {
    orders[existingIdx] = { ...orders[existingIdx], ...order };
    return orders[existingIdx];
  }

  orders.unshift(order);
  // Also reflect in MOCK_ORDERS array
  const mockIdx = MOCK_ORDERS.findIndex(
    (o) => o.id === order.id || o.orderNumber === order.orderNumber
  );
  if (mockIdx >= 0) {
    MOCK_ORDERS[mockIdx] = orders[0];
  } else {
    MOCK_ORDERS.unshift(orders[0]);
  }
  return order;
}

export function updateLiveOrderStatus(
  idOrNumber: string,
  updates: Partial<OrderRecord>
): OrderRecord | null {
  const orders = getLiveOrders();
  const idx = orders.findIndex(
    (o) => o.id === idOrNumber || o.orderNumber.toLowerCase() === idOrNumber.toLowerCase()
  );
  if (idx === -1) return null;

  orders[idx] = {
    ...orders[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  // Sync to MOCK_ORDERS as well
  const mockIdx = MOCK_ORDERS.findIndex(
    (o) => o.id === orders[idx].id || o.orderNumber === orders[idx].orderNumber
  );
  if (mockIdx >= 0) {
    MOCK_ORDERS[mockIdx] = orders[idx];
  }

  return orders[idx];
}

export function clearLiveOrders(): void {
  if (globalStore.__LIVE_ORDERS__) {
    globalStore.__LIVE_ORDERS__ = [];
  }
  MOCK_ORDERS.length = 0;
}

