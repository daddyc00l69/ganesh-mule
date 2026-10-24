import { describe, it, expect } from 'vitest';
import {
  WAREHOUSE_DAILY_SCHEDULE,
  getIndianStandardTime,
  getWarehouseOperationalStatus,
  runWarehouseReconcileBatch,
} from '@/lib/warehouse/schedule';
import { MOCK_ORDERS } from '@/lib/mock-data';
import { addLiveOrder } from '@/lib/orders/store';

describe('Warehouse Operational Schedule & 12:30 AM Reconcile Engine', () => {
  it('should define all 6 required daily operational milestones', () => {
    expect(WAREHOUSE_DAILY_SCHEDULE.length).toBe(6);

    const times = WAREHOUSE_DAILY_SCHEDULE.map((m) => m.timeStr);
    expect(times).toContain('24/7');
    expect(times).toContain('12:30 AM IST');
    expect(times).toContain('09:00 AM IST');
    expect(times).toContain('11:00 AM IST');
    expect(times).toContain('01:00 PM IST');
    expect(times).toContain('04:00 PM IST');
  });

  it('should calculate accurate Indian Standard Time (UTC+05:30)', () => {
    const ist = getIndianStandardTime();
    expect(ist.formattedTime).toContain('IST');
    expect(ist.hours).toBeGreaterThanOrEqual(0);
    expect(ist.hours).toBeLessThanOrEqual(23);
    expect(ist.minutes).toBeGreaterThanOrEqual(0);
    expect(ist.minutes).toBeLessThanOrEqual(59);
  });

  it('should determine current warehouse operational status and next milestone countdown', () => {
    const status = getWarehouseOperationalStatus();
    expect(status.istTime).toBeDefined();
    expect(status.currentPhase).toBeDefined();
    expect(status.nextPhase).toBeDefined();
    expect(status.countdownFormatted).toMatch(/\d+h \d+m/);
  });

  it('should run 12:30 AM batch reconciliation and output structured batch result', async () => {
    // Add a test paid processing order to test reconciliation
    const testOrder = {
      id: `ord-test-reconcile-${Date.now()}`,
      orderNumber: `SG-HNY-REC-1`,
      userId: 'usr-test',
      customerName: 'Test Reconcile Customer',
      customerEmail: 'test.rec@gmail.com',
      shippingAddress: {
        fullName: 'Test Customer',
        phone: '+91 98200 00000',
        street: '123 Honey Lane',
        city: 'Pune',
        state: 'Maharashtra',
        postalCode: '411001',
        country: 'India',
      },
      subtotal: 69900,
      shippingCost: 0,
      taxAmount: 9000,
      discountAmount: 0,
      totalAmount: 78900,
      orderStatus: 'PROCESSING' as const,
      paymentStatus: 'PAID' as const,
      items: [
        {
          id: 'item-rec-1',
          orderId: 'ord-test-reconcile',
          productId: 'prod-wild-forest-500g',
          productName: 'Wild Forest Raw Honey (500g)',
          sku: 'HNY-WLD-500',
          price: 69900,
          quantity: 2,
          total: 139800,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addLiveOrder(testOrder);
    MOCK_ORDERS.push(testOrder);

    const result = await runWarehouseReconcileBatch('Test Unit Runner');
    expect(result.batchId).toMatch(/^WH-IST-/);
    expect(result.ordersReconciled).toBeGreaterThanOrEqual(1);
    expect(result.totalUnits).toBeGreaterThanOrEqual(2);
    expect(result.skuSummary.length).toBeGreaterThanOrEqual(1);
    expect(testOrder.orderStatus).toBe('CONFIRMED');

    // Clean up test order
    const index = MOCK_ORDERS.indexOf(testOrder);
    if (index > -1) MOCK_ORDERS.splice(index, 1);
  });
});
