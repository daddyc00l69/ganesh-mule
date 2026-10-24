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
});
