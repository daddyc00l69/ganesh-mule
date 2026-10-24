/**
 * Operational fee and shipping configuration with statutory GST breakdowns
 * Manageable by Managers and Super Admins
 */

export interface FeeSettings {
  // Shipping Charges
  shippingBaseFee: number; // in paise, default 7000 (₹70.00)
  shippingGstRate: number; // percentage, default 18 (18% GST)
  freeShippingThreshold: number; // in paise, default 99900 (₹999.00)
  freeShippingEnabled: boolean; // default true

  // Platform & Payment Gateway Convenience Fee
  platformBaseFee: number; // in paise, default 2000 (₹20.00)
  platformGstRate: number; // percentage, default 18 (18% GST)
  platformFeeEnabled: boolean; // default true

  // Gateway % Mode
  paymentGatewayPercent: number; // percentage, default 2.0 (2%)
  paymentGatewayGstRate: number; // percentage, default 18 (18% GST)
  paymentGatewayFeeEnabled: boolean; // default false (or true when percent mode active)

  // Fee Mode
  feeMode: 'FLAT_20' | 'PERCENT_2' | 'BOTH';

  // Audit metadata
  updatedAt: string;
  updatedBy: string;
}

export const DEFAULT_FEE_SETTINGS: FeeSettings = {
  shippingBaseFee: 7000, // ₹70.00
  shippingGstRate: 18, // 18% GST -> ₹12.60, Total ₹82.60
  freeShippingThreshold: 0, // Disabled by default per store policy
  freeShippingEnabled: false, // Strictly ₹70.00 base + 18% GST (₹82.60 total)

  platformBaseFee: 2000, // ₹20.00
  platformGstRate: 18, // 18% GST -> ₹3.60, Total ₹23.60
  platformFeeEnabled: true,

  paymentGatewayPercent: 2.0, // 2%
  paymentGatewayGstRate: 18, // 18% GST on gateway fee
  paymentGatewayFeeEnabled: false,

  feeMode: 'FLAT_20',

  updatedAt: new Date().toISOString(),
  updatedBy: 'System Manager (Vikram Mehta)',
};

// Global in-memory singleton for runtime persistence
let activeFeeSettings: FeeSettings = { ...DEFAULT_FEE_SETTINGS };

export function getFeeSettings(): FeeSettings {
  return { ...activeFeeSettings };
}

export function updateFeeSettings(updates: Partial<FeeSettings>, updatedBy: string = 'Manager'): FeeSettings {
  activeFeeSettings = {
    ...activeFeeSettings,
    ...updates,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };
  return { ...activeFeeSettings };
}

export interface FeeCalculationResult {
  subtotal: number;
  discountAmount: number;
  discountedSubtotal: number;

  // Shipping
  shippingBase: number; // in paise (e.g. 7000 = ₹70)
  shippingGst: number; // in paise (e.g. 1260 = ₹12.60)
  shippingTotal: number; // in paise (e.g. 8260 = ₹82.60)
  isFreeShipping: boolean;

  // Platform & PG fee
  platformBase: number; // in paise (e.g. 2000 = ₹20)
  platformGst: number; // in paise (e.g. 360 = ₹3.60)
  platformTotal: number; // in paise (e.g. 2360 = ₹23.60)

  // Tax summaries
  productTaxable: number;
  productGst: number;
  totalTax: number;

  // Grand total
  grandTotal: number;
}

/**
 * Computes exact fee, shipping, and statutory GST splits
 */
export function calculateOrderFees(
  subtotalPaise: number,
  discountPaise: number = 0,
  settings: FeeSettings = activeFeeSettings
): FeeCalculationResult {
  const discountedSubtotal = Math.max(0, subtotalPaise - discountPaise);

  // 1. Shipping Calculation
  const isFreeShipping =
    settings.freeShippingEnabled &&
    settings.freeShippingThreshold > 0 &&
    discountedSubtotal >= settings.freeShippingThreshold;

  const shippingBase = isFreeShipping || discountedSubtotal === 0 ? 0 : settings.shippingBaseFee;
  const shippingGst = Math.round((shippingBase * settings.shippingGstRate) / 100);
  const shippingTotal = shippingBase + shippingGst;

  // 2. Platform / Payment Gateway Fee Calculation
  let platformBase = 0;
  let platformGst = 0;

  if (discountedSubtotal > 0 && settings.platformFeeEnabled) {
    if (settings.feeMode === 'FLAT_20' || settings.feeMode === 'BOTH') {
      const flatBase = settings.platformBaseFee;
      const flatGst = Math.round((flatBase * settings.platformGstRate) / 100);
      platformBase += flatBase;
      platformGst += flatGst;
    }

    if (settings.feeMode === 'PERCENT_2' || settings.feeMode === 'BOTH') {
      const pgBase = Math.round((discountedSubtotal * settings.paymentGatewayPercent) / 100);
      const pgGst = Math.round((pgBase * settings.paymentGatewayGstRate) / 100);
      platformBase += pgBase;
      platformGst += pgGst;
    }
  }

  const platformTotal = platformBase + platformGst;

  // 3. Product GST (5% for raw honey)
  const productTaxable = Math.round((discountedSubtotal * 100) / 105);
  const productGst = discountedSubtotal - productTaxable;

  const totalTax = productGst + shippingGst + platformGst;
  const grandTotal = discountedSubtotal + shippingTotal + platformTotal;

  return {
    subtotal: subtotalPaise,
    discountAmount: discountPaise,
    discountedSubtotal,
    shippingBase,
    shippingGst,
    shippingTotal,
    isFreeShipping,
    platformBase,
    platformGst,
    platformTotal,
    productTaxable,
    productGst,
    totalTax,
    grandTotal,
  };
}
