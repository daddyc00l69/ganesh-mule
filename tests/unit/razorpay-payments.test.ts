import { describe, it, expect } from 'vitest';
import {
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
} from '@/lib/payments/razorpay';
import { createHmac } from 'crypto';

describe('Razorpay Cryptographic Payment & Webhook Verification', () => {
  const secret = 'rzp_test_secret_key_8844';
  const orderId = 'order_DA9vF19X4m47sX';
  const paymentId = 'pay_29MoEsz4dOFQDu';

  it('should verify authentic payment signatures matching official algorithm', () => {
    // Generate valid signature using official algorithm
    const validSignature = createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const isValid = verifyRazorpayPaymentSignature({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: validSignature,
      secret,
    });

    expect(isValid).toBe(true);
  });

  it('should reject altered or forged payment signatures', () => {
    const validSignature = createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    // Altered payment ID
    const isAltered = verifyRazorpayPaymentSignature({
      razorpayOrderId: orderId,
      razorpayPaymentId: 'pay_FORGED_DIFFERENT',
      razorpaySignature: validSignature,
      secret,
    });

    expect(isAltered).toBe(false);

    // Tampered signature hex
    const isTampered = verifyRazorpayPaymentSignature({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: 'deadbeef' + validSignature.slice(8),
      secret,
    });

    expect(isTampered).toBe(false);
  });

  it('should verify raw webhook payloads and reject altered body', () => {
    const rawPayload = JSON.stringify({
      entity: 'event',
      event: 'order.paid',
      payload: { payment: { entity: { id: paymentId, amount: 1899900 } } },
    });

    const validWebhookSignature = createHmac('sha256', secret)
      .update(rawPayload)
      .digest('hex');

    expect(
      verifyRazorpayWebhookSignature({
        rawBody: rawPayload,
        signature: validWebhookSignature,
        secret,
      })
    ).toBe(true);

    // Altered payload must fail
    const tamperedPayload = rawPayload.replace('1899900', '100');
    expect(
      verifyRazorpayWebhookSignature({
        rawBody: tamperedPayload,
        signature: validWebhookSignature,
        secret,
      })
    ).toBe(false);
  });

  it('should auto-book Delhivery consignment upon successful verify route payment', async () => {
    const { POST: verifyRoute } = await import('@/app/api/payments/razorpay/verify/route');
    const { addLiveOrder, getLiveOrderById } = await import('@/lib/orders/store');
    const { NextRequest } = await import('next/server');

    const testOrderNumber = `SG-TEST-VERIFY-${Date.now()}`;
    const testRzpOrderId = `order_test_${Date.now()}`;
    const testRzpPaymentId = `pay_test_${Date.now()}`;

    addLiveOrder({
      id: `ord-${testOrderNumber}`,
      orderNumber: testOrderNumber,
      userId: 'usr-customer-1',
      customerName: 'Kunal Sharma',
      customerEmail: 'kunal@gmail.com',
      shippingAddress: {
        fullName: 'Kunal Sharma',
        phone: '9820112233',
        street: 'Lokhandwala Complex',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400053',
        country: 'India',
      },
      subtotal: 89900,
      shippingCost: 0,
      taxAmount: 4495,
      discountAmount: 0,
      totalAmount: 94395,
      orderStatus: 'PENDING',
      paymentStatus: 'CREATED',
      items: [
        {
          id: 'item-1',
          orderId: `ord-${testOrderNumber}`,
          productId: 'prod-wild-forest-750g',
          productName: 'Wild Forest Raw Honey (750g)',
          sku: 'HNY-WLD-750G',
          price: 89900,
          quantity: 1,
          total: 89900,
        },
      ],
      payments: [
        {
          id: `pay-${Date.now()}`,
          provider: 'RAZORPAY',
          razorpayOrderId: testRzpOrderId,
          status: 'PENDING',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const req = new NextRequest('http://localhost:3000/api/payments/razorpay/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpayOrderId: testRzpOrderId,
        razorpayPaymentId: testRzpPaymentId,
        razorpaySignature: 'simulated_test_sig',
        orderNumber: testOrderNumber,
      }),
    });

    const res = await verifyRoute(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.verified).toBe(true);
    expect(data.waybill).toBeDefined();

    const updated = getLiveOrderById(testOrderNumber);
    expect(updated?.paymentStatus).toBe('PAID');
    expect(updated?.orderStatus).toBe('PROCESSING');
    expect(updated?.trackingNumber).toBeDefined();
    expect(updated?.delhiveryWaybill).toBeDefined();
  });

  it('should auto-book Delhivery consignment upon razorpay order.paid webhook', async () => {
    const { POST: webhookRoute } = await import('@/app/api/webhooks/razorpay/route');
    const { addLiveOrder, getLiveOrderById } = await import('@/lib/orders/store');
    const { NextRequest } = await import('next/server');

    const testOrderNumber = `SG-TEST-HOOK-${Date.now()}`;
    const testRzpOrderId = `order_hook_${Date.now()}`;
    const testRzpPaymentId = `pay_hook_${Date.now()}`;

    addLiveOrder({
      id: `ord-${testOrderNumber}`,
      orderNumber: testOrderNumber,
      userId: 'usr-customer-2',
      customerName: 'Priya Joshi',
      customerEmail: 'priya@gmail.com',
      shippingAddress: {
        fullName: 'Priya Joshi',
        phone: '9820556677',
        street: 'Kalyani Nagar',
        city: 'Pune',
        state: 'Maharashtra',
        postalCode: '411006',
        country: 'India',
      },
      subtotal: 89900,
      shippingCost: 0,
      taxAmount: 4495,
      discountAmount: 0,
      totalAmount: 94395,
      orderStatus: 'PENDING',
      paymentStatus: 'CREATED',
      items: [],
      payments: [
        {
          id: `pay-${Date.now()}`,
          provider: 'RAZORPAY',
          razorpayOrderId: testRzpOrderId,
          status: 'PENDING',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const webhookBody = JSON.stringify({
      event_id: `evt_${Date.now()}`,
      event: 'order.paid',
      payload: {
        payment: {
          entity: {
            id: testRzpPaymentId,
            order_id: testRzpOrderId,
            amount: 94395,
            currency: 'INR',
            status: 'captured',
          },
        },
      },
    });

    const req = new NextRequest('http://localhost:3000/api/webhooks/razorpay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': 'simulated_test_sig',
      },
      body: webhookBody,
    });

    const res = await webhookRoute(req);
    expect(res.status).toBe(200);

    const updated = getLiveOrderById(testOrderNumber);
    expect(updated?.paymentStatus).toBe('PAID');
    expect(updated?.orderStatus).toBe('PROCESSING');
    expect(updated?.trackingNumber).toBeDefined();
    expect(updated?.delhiveryWaybill).toBeDefined();
  });
});
