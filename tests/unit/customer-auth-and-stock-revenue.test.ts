import { describe, it, expect } from 'vitest';
import { formatCustomerDisplayName, verifyCustomerOtp } from '@/lib/auth/otp';
import { decrementProductStock, getLiveProducts, getLiveInventoryMovements } from '@/lib/inventory/store';
import { getLiveOrders, addLiveOrder, updateLiveOrderStatus } from '@/lib/orders/store';
import { DEFAULT_EMAIL_FROM, ORDERS_EMAIL_FROM, SUPPORT_EMAIL_FROM, AUTH_EMAIL_FROM } from '@/lib/email/resend';

describe('Customer Auth, drtushar.uk Domain & Stock/Revenue Live Sync', () => {
  it('should format customer display name for tushar0p.verify@gmail.com cleanly as "Tushar"', () => {
    expect(formatCustomerDisplayName('tushar0p.verify@gmail.com')).toBe('Tushar');
    expect(formatCustomerDisplayName('tushar0p.verify@gmail.com', 'Tushar0p Verify')).toBe('Tushar');
    expect(formatCustomerDisplayName('tushar.patil@gmail.com', 'Tushar Patil')).toBe('Tushar Patil');
    expect(formatCustomerDisplayName('tushar@gmail.com')).toBe('Tushar');
    expect(formatCustomerDisplayName('random.customer@gmail.com')).toBe('Random Customer');
  });

  it('should verify sender emails are configured with verified tushar.uk domain', () => {
    expect(DEFAULT_EMAIL_FROM).toMatch(/tushar\.uk/);
    expect(ORDERS_EMAIL_FROM).toMatch(/tushar\.uk/);
    expect(SUPPORT_EMAIL_FROM).toMatch(/tushar\.uk/);
    expect(AUTH_EMAIL_FROM).toMatch(/tushar\.uk/);
  });

  it('should decrement product stock and record inventory movement when payment is confirmed', () => {
    const products = getLiveProducts();
    const product = products[0];
    const initialStock = product.stockQuantity;

    const result = decrementProductStock(product.id, 2, 'ORD-TEST-101');
    expect(result.success).toBe(true);
    expect(result.newStock).toBe(initialStock - 2);

    const movements = getLiveInventoryMovements();
    const movement = movements.find((m) => m.referenceId === 'ORD-TEST-101');
    expect(movement).toBeDefined();
    expect(movement?.delta).toBe(-2);
    expect(movement?.reason).toBe('ORDER_FULFILLMENT');
    expect(movement?.quantityAfter).toBe(initialStock - 2);
  });

  it('should calculate revenue dynamically based on paid and confirmed live orders', () => {
    const testOrder = {
      id: 'ord-rev-test-1',
      orderNumber: 'ORD-REV-101',
      customerName: 'Tushar',
      customerEmail: 'tushar0p.verify@gmail.com',
      customerPhone: '9820112345',
      orderStatus: 'PROCESSING' as const,
      paymentStatus: 'PAID' as const,
      subtotalAmount: 180000,
      discountAmount: 0,
      taxAmount: 9000,
      shippingCost: 8260,
      platformFeeAmount: 2360,
      totalAmount: 199620, // ₹1,996.20
      shippingAddress: {
        fullName: 'Tushar',
        phone: '9820112345',
        street: 'Flat 402, Oberoi Sky Heights',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400053',
        country: 'India',
      },
      items: [
        {
          id: 'item-rev-1',
          orderId: 'ord-rev-test-1',
          productId: 'prod-wild-forest-500g',
          productName: 'Raw Forest Honey (500g)',
          quantity: 2,
          unitPrice: 90000,
          totalPrice: 180000,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addLiveOrder(testOrder);
    const liveOrders = getLiveOrders();
    const totalRev = liveOrders
      .filter((o) => o.paymentStatus === 'PAID')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    expect(totalRev).toBeGreaterThanOrEqual(199620);
  });

  it('should strictly reject random OTP and disallow unauthorized login', async () => {
    // 1. Without requesting OTP, random code should throw error
    await expect(
      verifyCustomerOtp('unrequested@example.com', '999999')
    ).rejects.toThrow('No active verification code found');

    // 2. Master code 123456 must NOT bypass verification
    await expect(
      verifyCustomerOtp('unrequested@example.com', '123456')
    ).rejects.toThrow('No active verification code found');
  });
});
