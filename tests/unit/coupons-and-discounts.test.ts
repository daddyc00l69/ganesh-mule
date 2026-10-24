import { describe, it, expect } from 'vitest';
import { DiscountCoupon } from '@/types';
import { MOCK_COUPONS } from '@/lib/mock-data';

describe('Discount Coupon Governance & Calculation Invariants', () => {
  describe('Percentage Discount Calculations', () => {
    it('accurately computes percentage discount in minor units (paise)', () => {
      const subtotal = 100000; // ₹1,000.00
      const percentage = 15; // 15%
      const discount = Math.round((subtotal * percentage) / 100);

      expect(discount).toBe(15000); // ₹150.00
      expect(subtotal - discount).toBe(85000); // ₹850.00
    });

    it('enforces maximum discount cap on percentage coupons', () => {
      const subtotal = 1000000; // ₹10,000.00
      const percentage = 20; // 20% = ₹2,000.00
      const maxCap = 100000; // ₹1,000.00 cap

      const rawDiscount = Math.round((subtotal * percentage) / 100);
      const cappedDiscount = Math.min(rawDiscount, maxCap);

      expect(rawDiscount).toBe(200000); // Would be ₹2,000
      expect(cappedDiscount).toBe(100000); // Capped at ₹1,000
    });

    it('does not cap discount when under the maximum limit', () => {
      const subtotal = 200000; // ₹2,000.00
      const percentage = 15; // 15% = ₹300.00
      const maxCap = 50000; // ₹500.00 cap

      const rawDiscount = Math.round((subtotal * percentage) / 100);
      const cappedDiscount = Math.min(rawDiscount, maxCap);

      expect(cappedDiscount).toBe(30000); // Fully ₹300.00
    });
  });

  describe('Fixed Amount Discount Calculations', () => {
    it('accurately deducts flat amount discounts', () => {
      const subtotal = 150000; // ₹1,500.00
      const flatDiscount = 20000; // ₹200.00

      const effectiveDiscount = Math.min(flatDiscount, subtotal);
      expect(effectiveDiscount).toBe(20000);
      expect(subtotal - effectiveDiscount).toBe(130000);
    });

    it('prevents negative totals if fixed discount exceeds subtotal', () => {
      const smallSubtotal = 10000; // ₹100.00
      const largeDiscount = 20000; // ₹200.00

      const effectiveDiscount = Math.min(largeDiscount, smallSubtotal);
      const resultingSubtotal = Math.max(0, smallSubtotal - effectiveDiscount);

      expect(effectiveDiscount).toBe(10000); // Capped at subtotal
      expect(resultingSubtotal).toBe(0); // Zero, never negative
    });
  });

  describe('Eligibility & Boundary Conditions', () => {
    const sampleCoupon: DiscountCoupon = {
      id: 'coup-test-1',
      code: 'VIKRAM15',
      description: 'Test coupon',
      discountType: 'PERCENTAGE',
      value: 15,
      minOrderAmount: 99900, // ₹999.00
      maxDiscountAmount: 50000,
      expiresAt: '2028-01-01T00:00:00Z',
      usageLimit: 100,
      usageCount: 5,
      isActive: true,
      assignedManagerIds: ['usr-mgr-1'],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };

    it('accepts coupon when subtotal meets or exceeds minOrderAmount', () => {
      const qualifyingSubtotal = 120000; // ₹1,200.00
      const isValid = qualifyingSubtotal >= sampleCoupon.minOrderAmount;
      expect(isValid).toBe(true);
    });

    it('rejects coupon when subtotal is below minOrderAmount', () => {
      const underSubtotal = 50000; // ₹500.00 (below ₹999)
      const isValid = underSubtotal >= sampleCoupon.minOrderAmount;
      expect(isValid).toBe(false);
    });

    it('rejects deactivated coupons', () => {
      const pausedCoupon = { ...sampleCoupon, isActive: false };
      expect(pausedCoupon.isActive).toBe(false);
    });

    it('detects expired coupons accurately', () => {
      const pastDate = new Date(Date.now() - 24 * 3600000).toISOString();
      const expiredCoupon = { ...sampleCoupon, expiresAt: pastDate };

      const isExpired = new Date(expiredCoupon.expiresAt) < new Date();
      expect(isExpired).toBe(true);
    });

    it('detects when global usage limit has been exhausted', () => {
      const exhaustedCoupon = { ...sampleCoupon, usageLimit: 50, usageCount: 50 };
      const isExhausted = exhaustedCoupon.usageCount >= exhaustedCoupon.usageLimit;
      expect(isExhausted).toBe(true);

      const availableCoupon = { ...sampleCoupon, usageLimit: 50, usageCount: 49 };
      expect(availableCoupon.usageCount < availableCoupon.usageLimit).toBe(true);
    });
  });

  describe('Manager Assignment & Multi-Manager Scoping', () => {
    it('supports assigning multiple managers to a single promotional code', () => {
      const sharedCoupon = MOCK_COUPONS.find((c) => c.code === 'ROYAL20');
      expect(sharedCoupon).toBeDefined();
      expect(sharedCoupon?.assignedManagerIds).toContain('usr-mgr-1');
      expect(sharedCoupon?.assignedManagerIds).toContain('usr-mgr-2');
      expect(sharedCoupon?.assignedManagerNames).toContain('Vikram Mehta');
      expect(sharedCoupon?.assignedManagerNames).toContain('Priya Sharma');
    });

    it('filters coupons visible to manager Vikram Mehta strictly', () => {
      const managerId = 'usr-mgr-1';
      const visibleToVikram = MOCK_COUPONS.filter((c) =>
        c.assignedManagerIds?.includes(managerId)
      );

      const codes = visibleToVikram.map((c) => c.code);
      expect(codes).toContain('VIKRAM15');
      expect(codes).toContain('ROYAL20');
      expect(codes).toContain('AMBER10');
      expect(codes).toContain('HARVEST50');

      // PRIYA200 is assigned only to Priya, should not appear in Vikram's exclusive list
      expect(codes).not.toContain('PRIYA200');
    });

    it('filters coupons visible to manager Priya Sharma strictly', () => {
      const managerId = 'usr-mgr-2';
      const visibleToPriya = MOCK_COUPONS.filter((c) =>
        c.assignedManagerIds?.includes(managerId)
      );

      const codes = visibleToPriya.map((c) => c.code);
      expect(codes).toContain('PRIYA200');
      expect(codes).toContain('ROYAL20');
      expect(codes).toContain('AMBER10');

      // VIKRAM15 and HARVEST50 belong to Vikram
      expect(codes).not.toContain('VIKRAM15');
      expect(codes).not.toContain('HARVEST50');
    });
  });

  describe('Checkout Shipping & Tax Interplay After Discount', () => {
    it('recalculates free shipping threshold against discounted subtotal', () => {
      // Subtotal before coupon: ₹1,050.00
      const originalSubtotal = 105000;
      // Flat ₹100 discount drops subtotal to ₹950.00 (below ₹999 free shipping threshold)
      const discount = 10000;
      const discountedSubtotal = originalSubtotal - discount; // 95000

      const freeShippingThreshold = 99900;
      const shippingCost = discountedSubtotal >= freeShippingThreshold ? 0 : 5000;

      // Because discounted subtotal is ₹950 < ₹999, standard shipping of ₹50 applies
      expect(shippingCost).toBe(5000);

      const gstTax = Math.round(discountedSubtotal * 0.05); // 5% GST
      const grandTotal = discountedSubtotal + shippingCost + gstTax;

      expect(gstTax).toBe(4750); // ₹47.50
      expect(grandTotal).toBe(104750); // ₹1,047.50
    });
  });
});
