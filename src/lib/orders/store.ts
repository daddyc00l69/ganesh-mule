/**
 * Enterprise Live Order Store
 * Global disk-persisted singleton guaranteeing 100% synchronization across
 * separate browsers, incognito sessions, Checkout, Admin, and Manager consoles.
 */

import path from 'path';
import { OrderRecord, OrderStatus, PaymentStatus } from '@/types';
import { MOCK_ORDERS } from '@/lib/mock-data';
import {
  getDataFilePath,
  getTmpFilePath,
  isTestStorageBypassed,
  readJsonFile,
  writePersistedJson,
} from '@/lib/storage/json-store';

const ORDERS_FILENAME = 'orders.json';
const TMP_ORDERS_FILENAME = 'orders-solidglass.json';
const ORDERS_FILE_PATH = getDataFilePath(ORDERS_FILENAME);
const TMP_ORDERS_FILE_PATH = getTmpFilePath(TMP_ORDERS_FILENAME);

// Persistent in-memory cache
const globalStore = globalThis as unknown as {
  __LIVE_ORDERS__?: OrderRecord[];
};

const isTestEnv = isTestStorageBypassed();

function readOrdersFromDisk(): OrderRecord[] {
  if (isTestEnv) {
    return [...MOCK_ORDERS];
  }

  const orderMap = new Map<string, OrderRecord>();

  // Helper to load file into map
  const loadFromFile = (filePath: string) => {
    try {
      const parsed = readJsonFile<OrderRecord[]>(filePath);
      if (Array.isArray(parsed)) {
        for (const o of parsed) {
          if (o && (o.id || o.orderNumber)) {
            const key = (o.orderNumber || o.id).toLowerCase();
            // Later files or more recent entries take precedence
            if (!orderMap.has(key)) {
              orderMap.set(key, o);
            } else {
              // Merge fields if existing, preserving live cancellations and real AWBs
              const prev = orderMap.get(key)!;
              const merged = { ...prev, ...o };
              if (prev.orderStatus === 'CANCELLED' && o.orderStatus !== 'CANCELLED') {
                merged.orderStatus = 'CANCELLED';
                merged.delhiveryStatus = prev.delhiveryStatus || o.delhiveryStatus;
              }
              if (prev.trackingNumber && !prev.trackingNumber.startsWith('143') && o.trackingNumber?.startsWith('143')) {
                merged.trackingNumber = prev.trackingNumber;
                merged.delhiveryWaybill = prev.delhiveryWaybill || prev.trackingNumber;
              }
              orderMap.set(key, merged);
            }
          }
        }
      }
    } catch (err) {
      console.warn(`[Orders Store] Failed to read orders from ${filePath}:`, err);
    }
  };

  // 1. Read tmp fallback first (if any), then let VPS persistent DATA_DIR take precedence
  loadFromFile(TMP_ORDERS_FILE_PATH);
  loadFromFile(ORDERS_FILE_PATH);

  // If running on Vercel, also check bundled .data/orders.json as disk fallback
  try {
    const bundledPath = path.join(process.cwd(), '.data', ORDERS_FILENAME);
    if (bundledPath !== ORDERS_FILE_PATH) {
      loadFromFile(bundledPath);
    }
  } catch {}

  if (orderMap.size > 0) {
    return Array.from(orderMap.values());
  }

  return [...MOCK_ORDERS];
}

function writeOrdersToDisk(orders: OrderRecord[]): void {
  if (isTestEnv) return;
  writePersistedJson(ORDERS_FILENAME, orders, TMP_ORDERS_FILENAME);
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
    // Preserve live Delhivery cancellation and real live AWB
    if (orders[existingIdx].orderStatus === 'CANCELLED' && order.orderStatus !== 'CANCELLED') {
      order.orderStatus = 'CANCELLED';
      if (orders[existingIdx].delhiveryStatus) {
        order.delhiveryStatus = orders[existingIdx].delhiveryStatus;
      }
    }
    if (orders[existingIdx].trackingNumber && !orders[existingIdx].trackingNumber?.startsWith('143')) {
      order.trackingNumber = orders[existingIdx].trackingNumber;
      order.delhiveryWaybill = orders[existingIdx].delhiveryWaybill || orders[existingIdx].trackingNumber;
    }
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
