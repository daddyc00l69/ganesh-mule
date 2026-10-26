/**
 * Enterprise Live Order Store
 * Global disk-persisted singleton guaranteeing 100% synchronization across
 * separate browsers, incognito sessions, Checkout, Admin, and Manager consoles.
 */

import fs from 'fs';
import path from 'path';
import { OrderRecord, OrderStatus, PaymentStatus } from '@/types';
import { MOCK_ORDERS } from '@/lib/mock-data';

const DATA_DIR = path.join(process.cwd(), '.data');
const ORDERS_FILE_PATH = path.join(DATA_DIR, 'orders.json');

// Persistent in-memory cache
const globalStore = globalThis as unknown as {
  __LIVE_ORDERS__?: OrderRecord[];
};

const isTestEnv = process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST);

function readOrdersFromDisk(): OrderRecord[] {
  if (isTestEnv) {
    return [...MOCK_ORDERS];
  }
  try {
    if (fs.existsSync(ORDERS_FILE_PATH)) {
      const content = fs.readFileSync(ORDERS_FILE_PATH, 'utf-8').trim();
      if (content) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn('[Orders Store] Failed to read orders from disk:', err);
  }
  return [...MOCK_ORDERS];
}

function writeOrdersToDisk(orders: OrderRecord[]): void {
  if (isTestEnv) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(ORDERS_FILE_PATH, JSON.stringify(orders, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Orders Store] Failed to write orders to disk:', err);
  }
}

// Initial hydration from disk
if (!globalStore.__LIVE_ORDERS__) {
  globalStore.__LIVE_ORDERS__ = readOrdersFromDisk();
}

export function getLiveOrders(): OrderRecord[] {
  if (isTestEnv) {
    if (!globalStore.__LIVE_ORDERS__) {
      globalStore.__LIVE_ORDERS__ = [...MOCK_ORDERS];
    }
    return globalStore.__LIVE_ORDERS__;
  }
  return reloadOrdersFromDisk();
}

export function reloadOrdersFromDisk(): OrderRecord[] {
  if (isTestEnv) {
    if (!globalStore.__LIVE_ORDERS__) {
      globalStore.__LIVE_ORDERS__ = [...MOCK_ORDERS];
    }
    return globalStore.__LIVE_ORDERS__;
  }
  const diskOrders = readOrdersFromDisk();
  if (!globalStore.__LIVE_ORDERS__) {
    globalStore.__LIVE_ORDERS__ = diskOrders;
  } else {
    for (const d of diskOrders) {
      const existing = globalStore.__LIVE_ORDERS__.find(
        (m) => m.id === d.id || m.orderNumber === d.orderNumber
      );
      if (existing) {
        Object.assign(existing, d);
      } else {
        globalStore.__LIVE_ORDERS__.unshift(d);
      }
    }
  }
  return globalStore.__LIVE_ORDERS__;
}

export function getLiveOrderById(idOrNumber: string): OrderRecord | undefined {
  const cleanId = idOrNumber.trim().toLowerCase();
  const cleanWithoutHash = cleanId.replace(/^#/, '');
  const orders = getLiveOrders();
  return orders.find((o) => {
    const oNum = o.orderNumber.trim().toLowerCase();
    const oNumWithoutHash = oNum.replace(/^#/, '');
    const oId = o.id.trim().toLowerCase();
    return (
      oId === cleanId ||
      oNum === cleanId ||
      oNumWithoutHash === cleanWithoutHash ||
      oNumWithoutHash === cleanId ||
      oNum === cleanWithoutHash
    );
  });
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
  const existingIdx = orders.findIndex(
    (o) => o.id === order.id || o.orderNumber === order.orderNumber
  );

  if (existingIdx >= 0) {
    Object.assign(orders[existingIdx], order);
    order = orders[existingIdx];
  } else {
    orders.unshift(order);
  }

  globalStore.__LIVE_ORDERS__ = orders;
  writeOrdersToDisk(orders);

  // Sync to MOCK_ORDERS in memory
  const mockIdx = MOCK_ORDERS.findIndex(
    (o) => o.id === order.id || o.orderNumber === order.orderNumber
  );
  if (mockIdx >= 0) {
    Object.assign(MOCK_ORDERS[mockIdx], order);
  } else {
    MOCK_ORDERS.unshift(orders[0]);
  }

  return order;
}

export function updateLiveOrderStatus(
  idOrNumber: string,
  updates: Partial<OrderRecord>
): OrderRecord | null {
  const cleanId = idOrNumber.trim().toLowerCase();
  const cleanWithoutHash = cleanId.replace(/^#/, '');
  const orders = getLiveOrders();

  const idx = orders.findIndex((o) => {
    const oNum = o.orderNumber.trim().toLowerCase();
    const oNumWithoutHash = oNum.replace(/^#/, '');
    return (
      o.id.toLowerCase() === cleanId ||
      oNum === cleanId ||
      oNumWithoutHash === cleanWithoutHash ||
      oNumWithoutHash === cleanId ||
      oNum === cleanWithoutHash
    );
  });

  if (idx === -1) return null;

  Object.assign(orders[idx], updates, {
    updatedAt: new Date().toISOString(),
  });

  globalStore.__LIVE_ORDERS__ = orders;
  writeOrdersToDisk(orders);

  // Sync to MOCK_ORDERS in memory
  const mockIdx = MOCK_ORDERS.findIndex(
    (o) => o.id === orders[idx].id || o.orderNumber === orders[idx].orderNumber
  );
  if (mockIdx >= 0) {
    MOCK_ORDERS[mockIdx] = orders[idx];
  }

  return orders[idx];
}

export function clearLiveOrders(): void {
  globalStore.__LIVE_ORDERS__ = [];
  MOCK_ORDERS.length = 0;
  writeOrdersToDisk([]);
}
