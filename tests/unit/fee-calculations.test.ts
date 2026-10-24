import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateOrderFees,
  getFeeSettings,
  updateFeeSettings,
  DEFAULT_FEE_SETTINGS,
} from '@/lib/config/fee-settings';

describe('Fee and Shipping GST Calculations (₹70+18% and ₹20+18%)', () => {
  beforeEach(() => {
    // Reset to defaults before each test
    updateFeeSettings(DEFAULT_FEE_SETTINGS, 'Test Reset');
  });

  it('calculates default ₹70 base + 18% GST shipping and ₹20 base + 18% GST platform fee for an order below free shipping threshold', () => {
    const subtotal = 50000; // ₹500.00
    const result = calculateOrderFees(subtotal, 0);

    // Shipping: ₹70.00 base + 18% GST (₹12.60) = ₹82.60
    expect(result.shippingBase).toBe(7000); // 7000 paise = ₹70.00
    expect(result.shippingGst).toBe(1260); // 1260 paise = ₹12.60
    expect(result.shippingTotal).toBe(8260); // 8260 paise = ₹82.60
    expect(result.isFreeShipping).toBe(false);

    // Platform Fee: ₹20.00 base + 18% GST (₹3.60) = ₹23.60
    expect(result.platformBase).toBe(2000); // 2000 paise = ₹20.00
    expect(result.platformGst).toBe(360); // 360 paise = ₹3.60
    expect(result.platformTotal).toBe(2360); // 2360 paise = ₹23.60

    // Product GST: 5% embedded/calculated on raw honey
    // Taxable = 50000 * 100 / 105 = 47619, GST = 2381
    expect(result.productGst).toBe(2381);

    // Total tax = Product GST (2381) + Shipping GST (1260) + Platform GST (360) = 4001
    expect(result.totalTax).toBe(2381 + 1260 + 360);

    // Grand total = Subtotal (50000) + ShippingTotal (8260) + PlatformTotal (2360) = 60620 (₹606.20)
    expect(result.grandTotal).toBe(50000 + 8260 + 2360);
  });

  it('applies free shipping when free shipping is enabled and cart reaches threshold of ₹999.00', () => {
    const subtotal = 120000; // ₹1,200.00
    const customSettings: FeeSettings = {
      ...DEFAULT_FEE_SETTINGS,
      freeShippingEnabled: true,
      freeShippingThreshold: 999,
    };
    const result = calculateOrderFees(subtotal, 0, customSettings);

    expect(result.isFreeShipping).toBe(true);
    expect(result.shippingBase).toBe(0);
    expect(result.shippingGst).toBe(0);
    expect(result.shippingTotal).toBe(0);

    // Platform fee still applies: ₹20.00 base + 18% GST = ₹23.60
    expect(result.platformBase).toBe(2000);
    expect(result.platformGst).toBe(360);
    expect(result.platformTotal).toBe(2360);

    expect(result.grandTotal).toBe(120000 + 2360);
  });

  it('accounts for promotional discount coupons before checking threshold', () => {
    const subtotal = 100000; // ₹1,000.00
    const discount = 15000; // ₹150.00 (discounted subtotal = ₹850.00, below ₹999)

    const result = calculateOrderFees(subtotal, discount);

    expect(result.discountedSubtotal).toBe(85000);
    // Because discounted total (850) is below threshold (999), shipping is charged
    expect(result.isFreeShipping).toBe(false);
    expect(result.shippingBase).toBe(7000);
    expect(result.shippingTotal).toBe(8260);
    expect(result.platformTotal).toBe(2360);
  });

  it('allows manager to adjust shipping and platform fee rates dynamically', () => {
    // Manager updates base shipping to ₹80 and platform fee to ₹25
    updateFeeSettings(
      {
        shippingBaseFee: 8000, // ₹80.00
        platformBaseFee: 2500, // ₹25.00
      },
      'Manager Vikram Mehta'
    );

    const activeSettings = getFeeSettings();
    expect(activeSettings.shippingBaseFee).toBe(8000);
    expect(activeSettings.platformBaseFee).toBe(2500);
    expect(activeSettings.updatedBy).toBe('Manager Vikram Mehta');

    const result = calculateOrderFees(50000, 0, activeSettings);

    // Shipping: ₹80.00 base + 18% GST (₹14.40) = ₹94.40
    expect(result.shippingBase).toBe(8000);
    expect(result.shippingGst).toBe(1440);
    expect(result.shippingTotal).toBe(9440);

    // Platform Fee: ₹25.00 base + 18% GST (₹4.50) = ₹29.50
    expect(result.platformBase).toBe(2500);
    expect(result.platformGst).toBe(450);
    expect(result.platformTotal).toBe(2950);

    expect(result.grandTotal).toBe(50000 + 9440 + 2950);
  });

  it('supports 2% payment gateway mode plus 18% GST', () => {
    updateFeeSettings(
      {
        feeMode: 'PERCENT_2',
        paymentGatewayPercent: 2.0,
        paymentGatewayGstRate: 18,
      },
      'Manager Vikram Mehta'
    );

    const subtotal = 100000; // ₹1,000.00
    const result = calculateOrderFees(subtotal, 0);

    // 2% of ₹1,000 = ₹20.00 (2000 paise)
    // 18% GST on ₹20 = ₹3.60 (360 paise)
    // Total = ₹23.60 (2360 paise)
    expect(result.platformBase).toBe(2000);
    expect(result.platformGst).toBe(360);
    expect(result.platformTotal).toBe(2360);
  });
});
