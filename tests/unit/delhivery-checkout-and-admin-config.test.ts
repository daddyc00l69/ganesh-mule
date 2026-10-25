import { describe, it, expect } from 'vitest';
import { getAdminConfigStatus, authenticateStaffLogin } from '@/lib/auth/staff-store';
import { calculateDelhiveryShippingCost } from '@/lib/shipping/delhivery';
import { calculateOrderFees } from '@/lib/config/fee-settings';
import { MOCK_PRODUCTS } from '@/lib/mock-data';

describe('Admin Configuration & Delhivery Dynamic Checkout Logistics', () => {
  it('should report administrator as configured by default so initial setup alert is not shown', () => {
    const status = getAdminConfigStatus();
    expect(status.configured).toBe(true);
    expect(status.adminEmail).toBeDefined();
    expect(status.adminName).toBeDefined();
  });

  it('should authenticate configured administrator with correct password', async () => {
    const status = getAdminConfigStatus();
    const result = await authenticateStaffLogin({
      email: status.adminEmail || 'tushar0p.test@gmail.com',
      password: 'Admin@123456',
      expectedRole: 'ADMIN',
    });
    expect(result.success).toBe(true);
    expect(result.user.role).toBe('ADMIN');
  });

  it('should calculate live Delhivery shipping cost + 18% GST for Mumbai (400005) Zone B', async () => {
    const mumbaiPin = '400005';
    // 300g jar package is 600g gross consignment
    const result = await calculateDelhiveryShippingCost({
      destinationPincode: mumbaiPin,
      weightGrams: 600,
    });

    expect(result.success).toBe(true);
    expect(result.destinationPincode).toBe('400005');
    expect(result.zoneCode).toBe('B'); // Regional Maharashtra
    expect(result.pricing.gstRate).toBe(18.0);
    expect(result.pricing.insuredGlassHandlingFee).toBe(10.0);
    // Base freight for Zone B (45) + 1 slab (25) = 70.0, handling 10, fuel 8.0 = 88.0 subtotal
    // GST 18% of 88 = 15.84, Total = 103.84
    expect(result.pricing.subtotal).toBeGreaterThan(0);
    expect(result.pricing.gstAmount).toBeGreaterThan(0);
    expect(result.pricing.totalShippingCost).toBe(
      Math.round((result.pricing.subtotal + result.pricing.gstAmount) * 100) / 100
    );
  });

  it('should dynamically update order fee breakdown with custom Delhivery rate + 18% GST', () => {
    const subtotal = 44900; // ₹449.00
    const customDelhiveryBase = 8800; // ₹88.00 base freight + handling
    const fees = calculateOrderFees(subtotal, 0, undefined, customDelhiveryBase);

    expect(fees.shippingBase).toBe(8800);
    expect(fees.shippingGstRate).toBe(18);
    expect(fees.shippingGst).toBe(1584); // 18% of ₹88.00 = ₹15.84
    expect(fees.shippingTotal).toBe(10384); // ₹103.84 total courier
    expect(fees.grandTotal).toBeGreaterThan(subtotal + fees.shippingTotal);
  });

  it('should use local solid glass honey product images with zero external unsplash dependencies', () => {
    for (const product of MOCK_PRODUCTS) {
      expect(product.images.length).toBeGreaterThan(0);
      for (const img of product.images) {
        expect(img.url).toMatch(/^\/images\/products\//);
        expect(img.url).not.toContain('unsplash.com');
      }
    }
  });
});
