import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateOrderFees,
  getFeeSettings,
  updateFeeSettings,
  DEFAULT_FEE_SETTINGS,
  FeeSettings,
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

  it('supports 2% payment gateway mode charged on total order amount plus 18% GST', () => {
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

    // Total order amount before PG = Subtotal (100000) + Shipping (8260) = 108260 paise (₹1,082.60)
    // 2% PG fee on ₹1,082.60 = 2165 paise (₹21.65)
    // 18% GST on ₹21.65 = 390 paise (₹3.90)
    // Total PG fee = 2555 paise (₹25.55)
    expect(result.pgBase).toBe(2165);
    expect(result.pgGst).toBe(390);
    expect(result.pgTotal).toBe(2555);
    expect(result.grandTotal).toBe(108260 + 2555);
  });

  it('guarantees transparent individual GST breakdown: Item (5%), Shipping (18%), Platform (18%), and PG (18% on total)', () => {
    updateFeeSettings(
      {
        feeMode: 'BOTH',
        platformBaseFee: 2000, // ₹20.00
        platformGstRate: 18,
        shippingBaseFee: 7000, // ₹70.00
        shippingGstRate: 18,
        paymentGatewayPercent: 2.0, // 2%
        paymentGatewayGstRate: 18,
        freeShippingEnabled: false,
      },
      'Admin Setup'
    );

    const subtotal = 69900; // ₹699.00
    const result = calculateOrderFees(subtotal, 0);

    // 1. Item: 5% GST on Raw Honey
    expect(result.productTaxable).toBe(66571); // ₹665.71
    expect(result.productGst).toBe(3329); // ₹33.29 (5% GST)
    expect(result.productGstRate).toBe(5);

    // 2. Shipping: ₹70.00 base + 18% GST (₹12.60) = ₹82.60
    expect(result.shippingBase).toBe(7000);
    expect(result.shippingGst).toBe(1260);
    expect(result.shippingTotal).toBe(8260);

    // 3. Platform: ₹20.00 base + 18% GST (₹3.60) = ₹23.60
    expect(result.platformBase).toBe(2000);
    expect(result.platformGst).toBe(360);
    expect(result.platformTotal).toBe(2360);

    // 4. Pre-PG Total = 69900 + 8260 + 2360 = 80520 paise (₹805.20)
    expect(result.prePgTotal).toBe(80520);

    // 5. PG Charges on Total Amount: 2% of 80520 = 1610 paise (₹16.10)
    // 18% GST on PG charge: 18% of 1610 = 290 paise (₹2.90)
    // Total PG fee = 1900 paise (₹19.00)
    expect(result.pgBase).toBe(1610);
    expect(result.pgGst).toBe(290);
    expect(result.pgTotal).toBe(1900);

    // 6. Total Tax = Item GST (3329) + Shipping GST (1260) + Platform GST (360) + PG GST (290) = 5239 paise (₹52.39)
    expect(result.totalTax).toBe(3329 + 1260 + 360 + 290);

    // 7. Grand Total = Pre-PG Total (80520) + PG Total (1900) = 82420 paise (₹824.20)
    expect(result.grandTotal).toBe(80520 + 1900);
  });
});
