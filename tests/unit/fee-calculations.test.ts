import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateOrderFees,
  getFeeSettings,
  updateFeeSettings,
  DEFAULT_FEE_SETTINGS,
  FeeSettings,
} from '@/lib/config/fee-settings';

describe('Fee and Statutory GST Calculations (Zero Tax-on-Tax & Pure Indian GST Accuracy)', () => {
  beforeEach(() => {
    // Reset to defaults before each test
    updateFeeSettings(DEFAULT_FEE_SETTINGS, 'Test Reset');
  });

  it('calculates courier freight, solid glass protective packaging, and tax-inclusive honey GST without tax-on-tax', () => {
    const subtotal = 50000; // ₹500.00
    const result = calculateOrderFees(subtotal, 0);

    // 1. Courier Freight: ₹70.00 base + 18% GST (₹12.60) = ₹82.60
    expect(result.shippingBase).toBe(7000); // 7000 paise = ₹70.00
    expect(result.shippingGst).toBe(1260); // 1260 paise = ₹12.60
    expect(result.shippingTotal).toBe(8260); // 8260 paise = ₹82.60
    expect(result.isFreeShipping).toBe(false);

    // 2. Protective Solid Glass Packaging Fee: ₹25.42 base + 18% GST (₹4.58) = ₹30.00
    expect(result.platformBase).toBe(2542);
    expect(result.platformGst).toBe(458);
    expect(result.platformTotal).toBe(3000);

    // 3. Bundled Delivery (Courier Freight + Solid Glass Protective Packaging)
    expect(result.bundledShippingBase).toBe(7000 + 2542); // 9542 paise (₹95.42)
    expect(result.bundledShippingGst).toBe(1260 + 458); // 1718 paise (₹17.18)
    expect(result.bundledShippingTotal).toBe(8260 + 3000); // 11260 paise (₹112.60)
    expect(result.bundledShippingTotal).toBe(result.bundledShippingBase + result.bundledShippingGst);

    // 4. Product GST: 5% on pure natural honey (Taxable = 50000 * 100 / 105 = 47619, GST = 2381)
    expect(result.productGst).toBe(2381);

    // 5. Total Customer Tax = Product GST (2381) + Delivery GST (1718) = 4099 paise
    expect(result.totalTax).toBe(2381 + 1718);

    // 6. Grand total = Subtotal (50000) + Bundled Delivery (11260) = 61260 paise (₹612.60)
    expect(result.grandTotal).toBe(50000 + 11260);

    // 7. Payment gateway charges are internal business settlement expenses, NOT passed to customer
    expect(result.pgBase).toBe(Math.round((61260 * 2.0) / 100)); // 1225 paise
    expect(result.netMerchantSettlement).toBe(61260 - result.pgTotal);
  });

  it('applies free courier shipping when enabled and threshold met, charging only packaging', () => {
    const subtotal = 120000; // ₹1,200.00
    const customSettings: FeeSettings = {
      ...DEFAULT_FEE_SETTINGS,
      freeShippingEnabled: true,
      freeShippingThreshold: 99900, // ₹999.00
    };
    const result = calculateOrderFees(subtotal, 0, customSettings);

    expect(result.isFreeShipping).toBe(true);
    expect(result.shippingBase).toBe(0);
    expect(result.shippingGst).toBe(0);
    expect(result.shippingTotal).toBe(0);

    // Packaging fee applies: ₹25.42 base + 18% GST = ₹30.00
    expect(result.platformTotal).toBe(3000);

    // Bundled Delivery = 0 + 3000 = 3000 paise
    expect(result.bundledShippingTotal).toBe(3000);
    expect(result.grandTotal).toBe(120000 + 3000);
  });

  it('accounts for promotional discount coupons before checking threshold', () => {
    const subtotal = 100000; // ₹1,000.00
    const discount = 15000; // ₹150.00 (discounted subtotal = ₹850.00, below ₹999)

    const result = calculateOrderFees(subtotal, discount);

    expect(result.discountedSubtotal).toBe(85000);
    expect(result.isFreeShipping).toBe(false);
    expect(result.shippingBase).toBe(7000);
    expect(result.shippingTotal).toBe(8260);
    expect(result.platformTotal).toBe(3000);
  });

  it('allows manager to adjust shipping and platform fee rates dynamically', () => {
    // Manager updates base shipping to ₹80 and platform fee to ₹25
    updateFeeSettings(
      {
        shippingBaseFee: 8000, // ₹80.00
        platformBaseFee: 2500, // ₹25.00
        paymentGatewayPercent: 2.0,
      },
      'Manager Vikram Mehta'
    );

    const activeSettings = getFeeSettings();
    expect(activeSettings.shippingBaseFee).toBe(8000);
    expect(activeSettings.platformBaseFee).toBe(2500);
    expect(activeSettings.updatedBy).toBe('Manager Vikram Mehta');

    const result = calculateOrderFees(50000, 0, activeSettings);

    // Courier Shipping: ₹80.00 base + 18% GST (₹14.40) = ₹94.40
    expect(result.shippingBase).toBe(8000);
    expect(result.shippingGst).toBe(1440);
    expect(result.shippingTotal).toBe(9440);

    // Platform Fee: ₹25.00 base + 18% GST (₹4.50) = ₹29.50
    expect(result.platformBase).toBe(2500);
    expect(result.platformGst).toBe(450);
    expect(result.platformTotal).toBe(2950);

    // Bundled Shipping = 9440 + 2950 = 12390 paise
    expect(result.bundledShippingTotal).toBe(12390);
    expect(result.grandTotal).toBe(50000 + 12390);
  });

  it('guarantees transparent individual GST breakdown: Item (5%), Shipping (18%), Platform (18%) with zero tax-on-tax', () => {
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

    // 1. Item: 5% GST on Raw Honey (HSN 0409) extracted from inclusive price
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

    // 4. Bundled Delivery = 8260 + 2360 = 10620 paise
    expect(result.bundledShippingTotal).toBe(10620);

    // 5. Total Customer Tax = Item GST (3329) + Shipping GST (1260) + Platform GST (360) = 4949 paise (₹49.49)
    expect(result.totalTax).toBe(3329 + 1260 + 360);

    // 6. Grand Total = 69900 + 10620 = 80520 paise (₹805.20)
    expect(result.grandTotal).toBe(80520);

    // 7. Gateway charges are strictly business settlement expenses
    expect(result.pgBase).toBe(Math.round((80520 * 2.0) / 100)); // 1610 paise
    expect(result.netMerchantSettlement).toBe(80520 - result.pgTotal);
  });
});
