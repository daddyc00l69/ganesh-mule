import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
} from '@/lib/payments/razorpay';
import { createHmac } from 'crypto';

// Reusable Zod Schemas mirroring API route validation
const CheckoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
  customer: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(10),
  }),
  address: z.object({
    fullName: z.string().min(1),
    phone: z.string().min(10),
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(4),
    country: z.string().default('IN'),
  }),
});

const InventoryAdjustmentSchema = z
  .object({
    productId: z.string().min(1),
    delta: z.number().int().optional(),
    targetQuantity: z.number().int().nonnegative().optional(),
    reason: z
      .enum([
        'ORDER_RESERVATION',
        'ORDER_FULFILLMENT',
        'ORDER_CANCELLATION',
        'MANUAL_ADJUSTMENT',
        'RESTOCK',
        'RETURN_RESTOCK',
        'DAMAGE_WRITE_OFF',
      ])
      .default('MANUAL_ADJUSTMENT'),
    referenceId: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((data) => data.delta !== undefined || data.targetQuantity !== undefined, {
    message: 'Either delta or targetQuantity must be provided',
  });

const CreateManagerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  department: z.string().optional(),
  permissions: z.array(z.string()),
});

const RefundSchema = z.object({
  orderId: z.string().min(1),
  amount: z.number().int().positive(),
  reason: z.string().min(3),
});

describe('API Route Payload Validation & Security Safeguards', () => {
  describe('Checkout & Order Initiation Schema', () => {
    const validCheckoutPayload = {
      items: [{ productId: 'prod-001', quantity: 2 }],
      customer: {
        name: 'Ganesh Mule',
        email: 'ganesh@example.com',
        phone: '9876543210',
      },
      address: {
        fullName: 'Ganesh Mule',
        phone: '9876543210',
        street: '42 MG Road',
        city: 'Pune',
        state: 'Maharashtra',
        postalCode: '411001',
        country: 'IN',
      },
    };

    it('accepts valid checkout order payloads', () => {
      const result = CheckoutSchema.safeParse(validCheckoutPayload);
      expect(result.success).toBe(true);
    });

    it('rejects empty cart submission', () => {
      const invalid = { ...validCheckoutPayload, items: [] };
      const result = CheckoutSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects zero or negative quantities', () => {
      const zeroQty = {
        ...validCheckoutPayload,
        items: [{ productId: 'prod-001', quantity: 0 }],
      };
      expect(CheckoutSchema.safeParse(zeroQty).success).toBe(false);

      const negativeQty = {
        ...validCheckoutPayload,
        items: [{ productId: 'prod-001', quantity: -3 }],
      };
      expect(CheckoutSchema.safeParse(negativeQty).success).toBe(false);
    });

    it('rejects malformed customer email addresses', () => {
      const invalidEmail = {
        ...validCheckoutPayload,
        customer: { ...validCheckoutPayload.customer, email: 'not-an-email' },
      };
      expect(CheckoutSchema.safeParse(invalidEmail).success).toBe(false);
    });

    it('rejects short phone numbers (<10 digits)', () => {
      const shortPhone = {
        ...validCheckoutPayload,
        customer: { ...validCheckoutPayload.customer, phone: '12345' },
      };
      expect(CheckoutSchema.safeParse(shortPhone).success).toBe(false);
    });
  });

  describe('Inventory Stock Adjustment Schema & Edge Cases', () => {
    it('accepts adjustments with relative delta', () => {
      const result = InventoryAdjustmentSchema.safeParse({
        productId: 'prod-honey-01',
        delta: 10,
        reason: 'RESTOCK',
        notes: 'Batch #2026-B received from Western Ghats apiary',
      });
      expect(result.success).toBe(true);
    });

    it('accepts adjustments with absolute targetQuantity', () => {
      const result = InventoryAdjustmentSchema.safeParse({
        productId: 'prod-honey-01',
        targetQuantity: 45,
        reason: 'MANUAL_ADJUSTMENT',
      });
      expect(result.success).toBe(true);
    });

    it('rejects adjustments where neither delta nor targetQuantity is given', () => {
      const result = InventoryAdjustmentSchema.safeParse({
        productId: 'prod-honey-01',
        reason: 'RESTOCK',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Either delta or targetQuantity must be provided');
      }
    });

    it('rejects negative targetQuantity values', () => {
      const result = InventoryAdjustmentSchema.safeParse({
        productId: 'prod-honey-01',
        targetQuantity: -5,
        reason: 'DAMAGE_WRITE_OFF',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid reason enum values', () => {
      const result = InventoryAdjustmentSchema.safeParse({
        productId: 'prod-honey-01',
        delta: -2,
        reason: 'LOST_IN_SPACE' as any,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Manager Provisioning Schema', () => {
    it('accepts valid manager credentials and permissions', () => {
      const result = CreateManagerSchema.safeParse({
        name: 'Sunita Sharma',
        email: 'sunita.sharma@solidglass.com',
        password: 'SecurePassword@2026',
        department: 'Operations & Logistics',
        permissions: ['inventory.read', 'inventory.update', 'orders.read'],
      });
      expect(result.success).toBe(true);
    });

    it('enforces minimum password length of 8 characters for managers', () => {
      const shortPass = CreateManagerSchema.safeParse({
        name: 'Sunita Sharma',
        email: 'sunita.sharma@solidglass.com',
        password: 'short',
        permissions: ['inventory.read'],
      });
      expect(shortPass.success).toBe(false);
    });
  });

  describe('Refund Evaluation Schema', () => {
    it('accepts positive refund amount with informative reason', () => {
      const result = RefundSchema.safeParse({
        orderId: 'ord-88392',
        amount: 189900, // ₹1,899.00 in paise
        reason: 'Damaged glass jar reported during transit courier delivery',
      });
      expect(result.success).toBe(true);
    });

    it('rejects non-positive or zero refund amounts', () => {
      expect(
        RefundSchema.safeParse({
          orderId: 'ord-88392',
          amount: 0,
          reason: 'Test refund',
        }).success
      ).toBe(false);

      expect(
        RefundSchema.safeParse({
          orderId: 'ord-88392',
          amount: -5000,
          reason: 'Negative test',
        }).success
      ).toBe(false);
    });
  });

  describe('Razorpay Signature & Webhook Security Invariants', () => {
    const testSecret = 'whsec_test_secret_key_2026';
    const samplePayload = JSON.stringify({
      event: 'order.paid',
      payload: {
        payment: {
          entity: {
            id: 'pay_ABC123XYZ',
            order_id: 'order_SG999',
            amount: 2890764,
            status: 'captured',
          },
        },
      },
    });

    it('verifies legitimate webhook signatures generated with HMAC-SHA256', () => {
      const validSignature = createHmac('sha256', testSecret).update(samplePayload).digest('hex');

      const isValid = verifyRazorpayWebhookSignature({
        rawBody: samplePayload,
        signature: validSignature,
        secret: testSecret,
      });

      expect(isValid).toBe(true);
    });

    it('rejects tampered webhook payloads even with valid original signature', () => {
      const validSignature = createHmac('sha256', testSecret).update(samplePayload).digest('hex');
      const tamperedPayload = samplePayload.replace('order.paid', 'payment.failed');

      const isValid = verifyRazorpayWebhookSignature({
        rawBody: tamperedPayload,
        signature: validSignature,
        secret: testSecret,
      });

      expect(isValid).toBe(false);
    });

    it('verifies checkout redirect signature with order_id and payment_id', () => {
      const orderId = 'order_DEF456';
      const paymentId = 'pay_GHI789';
      const secret = 'rzp_key_secret_2026';
      const signature = createHmac('sha256', secret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const isValid = verifyRazorpayPaymentSignature({
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
        secret,
      });

      expect(isValid).toBe(true);
    });

    it('rejects forged or length-mismatched checkout signatures without error', () => {
      const isValid = verifyRazorpayPaymentSignature({
        razorpayOrderId: 'order_123',
        razorpayPaymentId: 'pay_456',
        razorpaySignature: 'invalid_signature_too_short',
        secret: 'any_secret',
      });

      expect(isValid).toBe(false);
    });
  });
});
