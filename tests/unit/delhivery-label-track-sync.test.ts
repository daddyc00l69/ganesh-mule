import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getLabel } from '@/app/api/shipping/delhivery/label/route';
import { GET as getTrack } from '@/app/api/shipping/delhivery/track/route';
import { POST as syncOrders } from '@/app/api/shipping/delhivery/sync/route';
import { getLiveOrderById, addLiveOrder } from '@/lib/orders/store';
import { saveDelhiverySettings } from '@/lib/shipping/delhivery';
import { OrderRecord } from '@/types';

describe('Live Verification: Label, Tracking & Cancellation Synchronization', () => {
  beforeEach(() => {
    saveDelhiverySettings({
      apiKey: '1dc311f006e46db696c3e34bff2f130fc1e8a22c',
      environment: 'production',
    });

    const liveOrder: OrderRecord = {
      id: 'ord-live-7403',
      orderNumber: 'SG-LIVE-7403',
      userId: 'usr-customer-1',
      customerName: 'Tushar',
      customerEmail: 'tushar@patil.com',
      shippingAddress: {
        fullName: 'Tushar',
        phone: '+91 98220 12345',
        street: 'Flat 402, Oberoi Sky Heights',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400053',
        country: 'India',
      },
      subtotal: 99900,
      shippingCost: 0,
      taxAmount: 5053,
      discountAmount: 0,
      totalAmount: 104953,
      orderStatus: 'CONFIRMED',
      paymentStatus: 'COD_PENDING',
      trackingNumber: '71890010000070', // Cancelled on Delhivery
      delhiveryWaybill: '71890010000070',
      delhiveryStatus: 'Manifested',
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const draftOrder: OrderRecord = {
      id: 'ord-draft-6352',
      orderNumber: 'SG-2026-6352',
      userId: 'usr-customer-2',
      customerName: 'Aarav Mehta',
      customerEmail: 'aarav@gmail.com',
      shippingAddress: {
        fullName: 'Aarav Mehta',
        phone: '+91 98220 54321',
        street: 'Apiary Valley',
        city: 'Pune',
        state: 'Maharashtra',
        postalCode: '411004',
        country: 'India',
      },
      subtotal: 89900,
      shippingCost: 0,
      taxAmount: 4500,
      discountAmount: 0,
      totalAmount: 94400,
      orderStatus: 'CONFIRMED',
      paymentStatus: 'COD_PENDING',
      trackingNumber: '14309778631486', // Draft AWB
      delhiveryWaybill: '14309778631486',
      delhiveryStatus: 'Ready for Courier Booking',
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addLiveOrder(liveOrder);
    addLiveOrder(draftOrder);
  });

  it('should run sync API and update SG-LIVE-7403 to CANCELLED', async () => {
    const syncReq = new NextRequest('http://localhost:3000/api/shipping/delhivery/sync', { method: 'POST' });
    const syncRes = await syncOrders(syncReq);
    const syncData = await syncRes.json();
    expect(syncRes.status).toBe(200);
    expect(syncData.success).toBe(true);

    const order7403 = getLiveOrderById('SG-LIVE-7403');
    expect(order7403?.orderStatus).toBe('CANCELLED');
    expect(order7403?.delhiveryStatus).toContain('Cancelled on Delhivery');
  });

  it('should return live tracking checkpoints and cancelled status', async () => {
    const trackReq = new NextRequest('http://localhost:3000/api/shipping/delhivery/track?orderNumber=SG-LIVE-7403');
    const trackRes = await getTrack(trackReq);
    const trackData = await trackRes.json();
    expect(trackRes.status).toBe(200);
    expect(trackData.tracking.statusCode).toBe('CANCELLED');
    expect(trackData.tracking.isCancelled).toBe(true);
    expect(trackData.tracking.checkpoints.length).toBeGreaterThanOrEqual(1);
  });

  it('should stream official Delhivery PDF for SG-LIVE-7403', async () => {
    const labelReq = new NextRequest('http://localhost:3000/api/shipping/delhivery/label?orderNumber=SG-LIVE-7403');
    const labelRes = await getLabel(labelReq);
    expect(labelRes.status).toBe(200);
    expect(labelRes.headers.get('content-type')).toBe('application/pdf');
    expect(labelRes.headers.get('content-disposition')).toContain('delhivery-official-label-71890010000070.pdf');
  });

  it('should render HTML with Book Live option for unbooked SG-2026-6352', async () => {
    const labelHtmlReq = new NextRequest('http://localhost:3000/api/shipping/delhivery/label?orderNumber=SG-2026-6352');
    const labelHtmlRes = await getLabel(labelHtmlReq);
    expect(labelHtmlRes.status).toBe(200);
    expect(labelHtmlRes.headers.get('content-type')).toContain('text/html');
    const htmlText = await labelHtmlRes.text();
    expect(htmlText).toContain('Draft AWB');
    expect(htmlText).toContain('Book Live on Delhivery One');
  });
});
