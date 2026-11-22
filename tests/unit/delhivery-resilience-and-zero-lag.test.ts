import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createDelhiveryShipment,
  generateDelhiveryWaybill,
  saveDelhiverySettings,
} from '@/lib/shipping/delhivery';
import { OrderRecord } from '@/types';

describe('Delhivery Resilience & Error Interception Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    saveDelhiverySettings({
      apiKey: 'test_token_live_sandbox',
      pickupLocation: 'Apiary Farm, Maharashtra',
      environment: 'production',
    });
  });

  afterEach(() => {
    saveDelhiverySettings({
      apiKey: 'placeholder_api_key',
    });
  });

  const mockOrder: OrderRecord = {
    id: 'test-order-resilience-1',
    orderNumber: 'SG-TEST-RESILIENT-41',
    customerName: 'Test Customer With Long Name / Special Symbols!!!',
    customerEmail: 'customer@test.com',
    customerPhone: '+91 98220 12345',
    totalAmount: 89900,
    shippingCost: 0,
    itemCount: 1,
    items: [
      {
        productId: 'sesame-honey-1kg',
        productName: 'Pure Sesame Honey (1kg)',
        quantity: 1,
        price: 89900,
      },
    ],
    shippingAddress: {
      street: 'Flat 402, Building A; Special Chars \n Newline\tTab, Maharashtra',
      city: 'Pune',
      state: 'Maharashtra',
      postalCode: '411001',
      country: 'India',
      phone: '+91-98220-12345',
    },
    orderStatus: 'PROCESSING',
    paymentStatus: 'PAID',
    paymentMethod: 'RAZORPAY',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('should cleanly sanitize 10-digit phone, street address, and name before dispatching to Delhivery', async () => {
    let capturedBody = '';
    global.fetch = vi.fn().mockImplementation(async (url: string, init?: any) => {
      if (url.includes('/api/cmu/create.json')) {
        capturedBody = init.body;
        return {
          ok: true,
          json: async () => ({
            packages: [
              {
                waybill: '14399988877711',
                status: 'Success',
              },
            ],
          }),
        };
      }
      return { ok: true, json: async () => ({}) };
    }) as any;

    const result = await createDelhiveryShipment(mockOrder, { forceRegenerate: true });

    expect(result.success).toBe(true);
    expect(result.waybill).toBe('14399988877711');
    expect(capturedBody).toContain('data=');

    const params = new URLSearchParams(capturedBody);
    const parsedData = JSON.parse(params.get('data') || '{}');
    const shipment = parsedData.shipments[0];

    // Phone must be strictly 10 digits
    expect(shipment.phone).toBe('9822012345');
    // Street must have newlines and disallowed characters stripped
    expect(shipment.add).not.toContain('\n');
    expect(shipment.add).not.toContain(';');
    // Pincode must be strictly 6 digits
    expect(shipment.pin).toBe('411001');
  });

  it('should intercept Delhivery Exception 41 / Insufficient Wallet Balance and provide reassuring notice without blocking AWB', async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/api/cmu/create.json')) {
        return {
          ok: true,
          json: async () => ({
            packages: [
              {
                remarks: [
                  "Crashing while saving package due to exception '41: Prepaid client manifest charge API failed due to insufficient balance'",
                ],
              },
            ],
          }),
        };
      }
      return { ok: true, json: async () => ({}) };
    }) as any;

    const result = await createDelhiveryShipment(mockOrder, { forceRegenerate: true });

    // Must still succeed and allocate an authoritative fallback AWB
    expect(result.success).toBe(true);
    expect(result.waybill).toMatch(/^(71890010|143)\d+/);
    // Must transform the raw crash into a clean, actionable notice
    expect(result.remarks).toContain('Delhivery One Notice: Insufficient wallet balance');
    expect(result.remarks).not.toContain('Crashing while saving package');
  });

  it('should guarantee instant waybill generation via generateDelhiveryWaybill without network latency', () => {
    const awb = generateDelhiveryWaybill('SG-INSTANT-001');
    expect(awb).toMatch(/^(71890010|143)\d+/);
    expect(awb.length).toBe(14);
  });
});
