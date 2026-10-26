import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkDelhiveryServiceability,
  calculateConsignmentWeightGrams,
  generateDelhiveryWaybill,
  createDelhiveryShipment,
  getDelhiveryTracking,
  getDelhiverySettings,
  saveDelhiverySettings,
  syncAllActiveDelhiveryOrders,
  getDelhiveryOfficialPackingSlip,
  DELHIVERY_URLS,
} from '@/lib/shipping/delhivery';
import { OrderRecord } from '@/types';
import { addLiveOrder, getLiveOrderById } from '@/lib/orders/store';

describe('Delhivery One Automatic Shipping Integration (https://one.delhivery.com)', () => {
  beforeEach(() => {
    // Reset settings to default test configuration
    saveDelhiverySettings({
      autoShipping: true,
      shippingMode: 'Express',
      environment: 'staging',
      pickupLocation: 'Ganesh Mule Apiary Dispatch Center, Pune',
    });
  });

  it('should verify official Delhivery One URLs', () => {
    expect(DELHIVERY_URLS.PORTAL).toBe('https://one.delhivery.com');
    expect(DELHIVERY_URLS.TRACKING_BASE).toBe('https://www.delhivery.com/track/package');
    expect(DELHIVERY_URLS.PRODUCTION_API).toBe('https://track.delhivery.com');
    expect(DELHIVERY_URLS.STAGING_API).toBe('https://staging-express.delhivery.com');
  });

  it('should accurately calculate consignment weight with solid glass packaging', () => {
    // 300g honey -> 600g gross
    const single300 = calculateConsignmentWeightGrams([
      {
        id: '1',
        orderId: 'o1',
        productId: 'prod-wild-forest-300g',
        productName: 'Wild Forest Raw Honey (300g)',
        sku: 'HNY-WLD-300',
        price: 44900,
        quantity: 1,
        total: 44900,
      },
    ]);
    expect(single300).toBe(600);

    // 750g honey -> 1280g gross
    const single750 = calculateConsignmentWeightGrams([
      {
        id: '2',
        orderId: 'o1',
        productId: 'prod-wild-forest-750g',
        productName: 'Wild Forest Raw Honey (750g)',
        sku: 'HNY-WLD-750',
        price: 89900,
        quantity: 1,
        total: 89900,
      },
    ]);
    expect(single750).toBe(1280);

    // 1050g honey -> 1800g gross
    const single1050 = calculateConsignmentWeightGrams([
      {
        id: '3',
        orderId: 'o1',
        productId: 'prod-wild-forest-1050g',
        productName: 'Family Reservoir Raw Honey (1050g)',
        sku: 'HNY-WLD-1050',
        price: 119900,
        quantity: 1,
        total: 119900,
      },
    ]);
    expect(single1050).toBe(1800);

    // Multi-item order: 2x 300g + 1x 1050g
    const multi = calculateConsignmentWeightGrams([
      {
        id: '4',
        orderId: 'o1',
        productId: 'prod-wild-forest-300g',
        productName: 'Wild Forest Raw Honey (300g)',
        sku: 'HNY-WLD-300',
        price: 44900,
        quantity: 2,
        total: 89800,
      },
      {
        id: '5',
        orderId: 'o1',
        productId: 'prod-wild-forest-1050g',
        productName: 'Family Reservoir Raw Honey (1050g)',
        sku: 'HNY-WLD-1050',
        price: 119900,
        quantity: 1,
        total: 119900,
      },
    ]);
    expect(multi).toBe(1200 + 1800);
  });

  it('should verify Indian pincode serviceability and express transit SLA', async () => {
    const puneCheck = await checkDelhiveryServiceability('411001');
    expect(puneCheck.serviceable).toBe(true);
    expect(puneCheck.prepaidAvailable).toBe(true);
    expect(puneCheck.codAvailable).toBe(false); // Invariant: Ganesh Mule is strictly prepaid
    expect(puneCheck.expectedDeliveryDays).toBe(2);
    expect(puneCheck.carrier).toBe('Delhivery One');
    expect(puneCheck.providerUrl).toBe('https://one.delhivery.com');

    const mumbaiCheck = await checkDelhiveryServiceability('400001');
    expect(mumbaiCheck.serviceable).toBe(true);

    const invalidCheck = await checkDelhiveryServiceability('000000');
    expect(invalidCheck.serviceable).toBe(false);
  });

  it('should generate valid Delhivery numeric AWB', () => {
    const awb = generateDelhiveryWaybill('SG-ORD-9988');
    expect(awb).toMatch(/^143\d+/);
    expect(awb.length).toBeGreaterThanOrEqual(12);
  });

  it('should automatically book Delhivery shipment for prepaid order', async () => {
    const testOrder: OrderRecord = {
      id: `ord-delhivery-${Date.now()}`,
      orderNumber: `SG-DELH-${Date.now().toString().slice(-4)}`,
      userId: 'usr-customer-1',
      customerName: 'Ananya Sharma',
      customerEmail: 'ananya@gmail.com',
      customerPhone: '+91 98220 11223',
      shippingAddress: {
        fullName: 'Ananya Sharma',
        phone: '+91 98220 11223',
        street: 'Flat 302, Green Glen Layout, Bellandur',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560103',
        country: 'India',
      },
      subtotal: 89900,
      shippingCost: 0,
      taxAmount: 4500,
      discountAmount: 0,
      totalAmount: 94400,
      orderStatus: 'PROCESSING',
      paymentStatus: 'PAID',
      items: [
        {
          id: 'item-1',
          orderId: 'ord-delhivery',
          productId: 'prod-wild-forest-750g',
          productName: 'Wild Forest Raw Honey (750g)',
          sku: 'HNY-WLD-750',
          price: 89900,
          quantity: 1,
          total: 89900,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addLiveOrder(testOrder);

    const result = await createDelhiveryShipment(testOrder);
    expect(result.success).toBe(true);
    expect(result.waybill).toBeDefined();
    expect(result.waybill).toMatch(/^143/);
    expect(result.carrier).toContain('Delhivery One');
    expect(result.trackingUrl).toContain('https://www.delhivery.com/track/package');
    expect(result.labelUrl).toContain('/api/shipping/delhivery/label');

    // Order record should have received the tracking number
    expect(testOrder.trackingNumber).toBe(result.waybill);
    expect(testOrder.delhiveryWaybill).toBe(result.waybill);
  });

  it('should return live tracking checkpoints for waybill', async () => {
    const tracking = await getDelhiveryTracking('143928173629', 'SG-DELH-001');
    expect(tracking.waybill).toBe('143928173629');
    expect(tracking.portalUrl).toBe('https://one.delhivery.com');
    expect(tracking.trackingUrl).toContain('https://www.delhivery.com/track/package/143928173629');
    expect(tracking.checkpoints.length).toBeGreaterThanOrEqual(1);
    expect(tracking.checkpoints[0].instructions).toContain('solid glass packaging');
  });

  it('should allow Admin to update and persist Delhivery configuration', () => {
    const updated = saveDelhiverySettings({
      clientId: 'GANESH_MULE_ENTERPRISE',
      shippingMode: 'Surface',
      autoShipping: false,
    });

    expect(updated.clientId).toBe('GANESH_MULE_ENTERPRISE');
    expect(updated.shippingMode).toBe('Surface');
    expect(updated.autoShipping).toBe(false);

    const reloaded = getDelhiverySettings();
    expect(reloaded.clientId).toBe('GANESH_MULE_ENTERPRISE');
    expect(reloaded.shippingMode).toBe('Surface');
    expect(reloaded.autoShipping).toBe(false);
  });

  it('should detect cancelled status from Delhivery and update local order', async () => {
    const testCancelOrder: OrderRecord = {
      id: `ord-cancel-test-${Date.now()}`,
      orderNumber: `SG-CNCL-${Date.now().toString().slice(-4)}`,
      userId: 'usr-customer-2',
      customerName: 'Rohit Patil',
      customerEmail: 'rohit@patil.com',
      shippingAddress: {
        fullName: 'Rohit Patil',
        phone: '+91 98220 12345',
        street: 'Lokhandwala Complex',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400053',
        country: 'India',
      },
      subtotal: 89900,
      shippingCost: 0,
      taxAmount: 4500,
      discountAmount: 0,
      totalAmount: 94400,
      orderStatus: 'CONFIRMED',
      paymentStatus: 'COD_PENDING',
      trackingNumber: '71890010000070', // verified cancelled test waybill
      delhiveryWaybill: '71890010000070',
      delhiveryStatus: 'Manifested',
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addLiveOrder(testCancelOrder);

    // Save temporary production API key for live tracking verification
    saveDelhiverySettings({
      apiKey: '1dc311f006e46db696c3e34bff2f130fc1e8a22c',
      environment: 'production',
    });

    const trackingResult = await getDelhiveryTracking('71890010000070', testCancelOrder.orderNumber);
    expect(trackingResult.waybill).toBe('71890010000070');
    expect(trackingResult.statusCode).toBe('CANCELLED');
    expect(trackingResult.isCancelled).toBe(true);
    expect(trackingResult.status.toLowerCase()).toContain('cancel');
  });

  it('should fetch official Delhivery PDF packing slip and download link', async () => {
    saveDelhiverySettings({
      apiKey: '1dc311f006e46db696c3e34bff2f130fc1e8a22c',
      environment: 'production',
    });

    const slip = await getDelhiveryOfficialPackingSlip('71890010000070');
    expect(slip.error).toBeUndefined();
    expect(slip.pdfDownloadLink || slip.pdfBuffer || slip.packageData).toBeDefined();
    if (slip.pdfDownloadLink) {
      expect(slip.pdfDownloadLink).toContain('.pdf');
    }
  });

  it('should batch sync active Delhivery orders and update database statuses', async () => {
    saveDelhiverySettings({
      apiKey: '1dc311f006e46db696c3e34bff2f130fc1e8a22c',
      environment: 'production',
    });

    const syncResult = await syncAllActiveDelhiveryOrders();
    expect(syncResult.success).toBe(true);
    expect(typeof syncResult.totalChecked).toBe('number');
  });
});

