/**
 * Enterprise Live Inventory & Product Store
 * Global singleton managing live stock levels, decrements on order confirmation, and audit movements.
 */

import { ProductItem, InventoryMovementRecord } from '@/types';
import { MOCK_PRODUCTS, MOCK_INVENTORY_MOVEMENTS } from '@/lib/mock-data';

const globalInventoryStore = globalThis as unknown as {
  __LIVE_PRODUCTS__?: ProductItem[];
  __LIVE_INVENTORY_MOVEMENTS__?: InventoryMovementRecord[];
};

if (!globalInventoryStore.__LIVE_PRODUCTS__) {
  globalInventoryStore.__LIVE_PRODUCTS__ = JSON.parse(JSON.stringify(MOCK_PRODUCTS));
}

if (!globalInventoryStore.__LIVE_INVENTORY_MOVEMENTS__) {
  globalInventoryStore.__LIVE_INVENTORY_MOVEMENTS__ = [...MOCK_INVENTORY_MOVEMENTS];
}

export function getLiveProducts(): ProductItem[] {
  if (!globalInventoryStore.__LIVE_PRODUCTS__) {
    globalInventoryStore.__LIVE_PRODUCTS__ = JSON.parse(JSON.stringify(MOCK_PRODUCTS));
  }
  return globalInventoryStore.__LIVE_PRODUCTS__!;
}

export function getLiveProductById(idOrSlug: string): ProductItem | undefined {
  const products = getLiveProducts();
  return products.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
}

export function getLiveInventoryMovements(): InventoryMovementRecord[] {
  if (!globalInventoryStore.__LIVE_INVENTORY_MOVEMENTS__) {
    globalInventoryStore.__LIVE_INVENTORY_MOVEMENTS__ = [...MOCK_INVENTORY_MOVEMENTS];
  }
  return globalInventoryStore.__LIVE_INVENTORY_MOVEMENTS__!;
}

/**
 * Decrements stock when an order is confirmed / paid.
 * Records an official InventoryMovementRecord.
 */
export function decrementProductStock(
  productId: string,
  quantity: number,
  orderNumber: string
): { success: boolean; newStock: number; movement?: InventoryMovementRecord } {
  const products = getLiveProducts();
  const product = products.find((p) => p.id === productId);

  if (!product) {
    return { success: false, newStock: 0 };
  }

  const previousStock = product.stockQuantity;
  const newStock = Math.max(0, previousStock - quantity);
  product.stockQuantity = newStock;
  product.updatedAt = new Date().toISOString();

  // Also reflect in MOCK_PRODUCTS array
  const mockProd = MOCK_PRODUCTS.find((p) => p.id === productId);
  if (mockProd) {
    mockProd.stockQuantity = newStock;
    mockProd.updatedAt = product.updatedAt;
  }

  // Create movement entry
  const movement: InventoryMovementRecord = {
    id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    delta: -quantity,
    quantityAfter: newStock,
    reason: 'ORDER_FULFILLMENT',
    referenceId: orderNumber,
    actorId: 'sys-razorpay',
    actorName: 'Razorpay Payment Settlement',
    notes: `Prepaid Order #${orderNumber} confirmed. Stock decremented from ${previousStock} to ${newStock} units.`,
    createdAt: new Date().toISOString(),
  };

  const movements = getLiveInventoryMovements();
  movements.unshift(movement);
  MOCK_INVENTORY_MOVEMENTS.unshift(movement);

  return { success: true, newStock, movement };
}

/**
 * Manager / Admin manual stock adjustment
 */
export function adjustProductStock(
  productId: string,
  delta: number,
  reason: 'RESTOCK' | 'MANUAL_ADJUSTMENT' | 'DAMAGE_WRITE_OFF',
  referenceId: string,
  actorName: string,
  notes: string
): { success: boolean; newStock: number; movement?: InventoryMovementRecord } {
  const products = getLiveProducts();
  const product = products.find((p) => p.id === productId);

  if (!product) {
    return { success: false, newStock: 0 };
  }

  const previousStock = product.stockQuantity;
  const newStock = Math.max(0, previousStock + delta);
  product.stockQuantity = newStock;
  product.updatedAt = new Date().toISOString();

  const mockProd = MOCK_PRODUCTS.find((p) => p.id === productId);
  if (mockProd) {
    mockProd.stockQuantity = newStock;
    mockProd.updatedAt = product.updatedAt;
  }

  const movement: InventoryMovementRecord = {
    id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    delta,
    quantityAfter: newStock,
    reason,
    referenceId: referenceId || `ADJ-${new Date().toISOString().slice(0, 10)}`,
    actorId: 'staff',
    actorName,
    notes: notes || `Stock adjusted by ${delta > 0 ? '+' : ''}${delta} (${reason})`,
    createdAt: new Date().toISOString(),
  };

  const movements = getLiveInventoryMovements();
  movements.unshift(movement);
  MOCK_INVENTORY_MOVEMENTS.unshift(movement);

  return { success: true, newStock, movement };
}
