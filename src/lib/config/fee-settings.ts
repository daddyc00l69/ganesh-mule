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
  freeShippingEnabled: false, // Strictly courier base + 18% GST

  platformBaseFee: 2542, // ₹25.42 base -> 18% GST ₹4.58 -> Total ₹30.00 (Developer Platform Fee)
  platformGstRate: 18, // 18% GST
  platformFeeEnabled: true, // Bundled into delivery

  paymentGatewayPercent: 2.0, // 2%
  paymentGatewayGstRate: 18, // 18% GST on PG fee
  paymentGatewayFeeEnabled: true, // 2% PG on total order amount

  feeMode: 'BOTH',

  updatedAt: new Date().toISOString(),
  updatedBy: 'Developer Platform Setup',
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

  // Shipping (SAC 9965)
  shippingBase: number; // in paise (e.g. 7000 = ₹70)
  shippingGst: number; // in paise (e.g. 1260 = ₹12.60)
  shippingGstRate: number; // percentage (e.g. 18%)
  shippingTotal: number; // in paise (e.g. 8260 = ₹82.60)
  isFreeShipping: boolean;

  // Platform Convenience Fee (SAC 9971)
  platformBase: number; // in paise (e.g. 2000 = ₹20)
  platformGst: number; // in paise (e.g. 360 = ₹3.60)
  platformGstRate: number; // percentage (e.g. 18%)
  platformTotal: number; // in paise (e.g. 2360 = ₹23.60)

  // Payment Gateway (PG) Processing Fee - charged on total order amount with its own GST
  pgBase: number; // in paise
  pgGst: number; // in paise
  pgGstRate: number; // percentage (e.g. 18%)
  pgTotal: number; // in paise
  paymentGatewayPercent: number; // percentage (e.g. 2.0%)
  prePgTotal: number; // in paise (order amount before PG)

  // Product / Items GST summaries (HSN 0409: 5% on raw honey)
  productTaxable: number;
  productGst: number;
  productGstRate: number; // 5%
  totalTax: number;

  // Bundled Shipping & Delivery (Courier Shipping + Developer Platform Fee + Payment Gateway Fee)
  bundledShippingBase: number;
  bundledShippingGst: number;
  bundledShippingTotal: number;

  // Grand total payable
  grandTotal: number;
}

/**
 * Computes exact fee, shipping, and statutory GST splits
 * Note: Each component (Item, PG, Shipping, Platform) has its own GST
 * PG charges are computed on total amount (Items + Shipping + Platform)
 */
export function calculateOrderFees(
  subtotalPaise: number,
  discountPaise: number = 0,
  settings: FeeSettings = activeFeeSettings,
  customShippingBasePaise?: number,
  customShippingTotalPaise?: number
): FeeCalculationResult {
  const discountedSubtotal = Math.max(0, subtotalPaise - discountPaise);

  // 1. Shipping Calculation (18% GST)
  const isFreeShipping =
    settings.freeShippingEnabled &&
    settings.freeShippingThreshold > 0 &&
    discountedSubtotal >= settings.freeShippingThreshold;

  const shippingGstRate = settings.shippingGstRate || 18;
  let shippingBase = 0;
  let shippingGst = 0;
  let shippingTotal = 0;

  if (!isFreeShipping && discountedSubtotal > 0) {
    if (customShippingTotalPaise !== undefined && customShippingTotalPaise > 0) {
      shippingTotal = customShippingTotalPaise;
      shippingBase =
        customShippingBasePaise !== undefined
          ? customShippingBasePaise
          : Math.round((shippingTotal * 100) / (100 + shippingGstRate));
      shippingGst = shippingTotal - shippingBase;
    } else {
      const resolvedBase =
        customShippingBasePaise !== undefined ? customShippingBasePaise : settings.shippingBaseFee;
      shippingBase = resolvedBase;
      shippingGst = Math.round((shippingBase * shippingGstRate) / 100);
      shippingTotal = shippingBase + shippingGst;
    }
  }

  // 2. Platform Base Fee Calculation (18% GST)
  let platformBase = 0;
  let platformGst = 0;
  const platformGstRate = settings.platformGstRate || 18;

  if (discountedSubtotal > 0 && settings.platformFeeEnabled) {
    if (settings.feeMode === 'FLAT_20' || settings.feeMode === 'BOTH') {
      platformBase = settings.platformBaseFee;
      platformGst = Math.round((platformBase * platformGstRate) / 100);
    }
  }
  const platformTotal = platformBase + platformGst;

  // 3. Payment Gateway (PG) Fee Calculation
  // Explicit rule: PG charges on total order amount (Items + Shipping + Platform)
  // Also PG charges have their own 18% GST
  const prePgTotal = discountedSubtotal + shippingTotal + platformTotal;
  let pgBase = 0;
  let pgGst = 0;
  const pgGstRate = settings.paymentGatewayGstRate || 18;
  const pgPercent = settings.paymentGatewayPercent || 2.0;

  const isPgFeeActive =
    discountedSubtotal > 0 &&
    (settings.feeMode === 'PERCENT_2' || settings.feeMode === 'BOTH' || settings.paymentGatewayFeeEnabled);

  if (isPgFeeActive && pgPercent > 0) {
    pgBase = Math.round((prePgTotal * pgPercent) / 100);
    pgGst = Math.round((pgBase * pgGstRate) / 100);
  }
  const pgTotal = pgBase + pgGst;

  // 4. Product GST (5% for pure natural honey)
  const productGstRate = 5;
  const productTaxable = Math.round((discountedSubtotal * 100) / (100 + productGstRate));
  const productGst = discountedSubtotal - productTaxable;

  const totalTax = productGst + shippingGst + platformGst + pgGst;
  const bundledShippingBase = shippingBase + platformBase + pgBase;
  const bundledShippingGst = shippingGst + platformGst + pgGst;
  const bundledShippingTotal = shippingTotal + platformTotal + pgTotal;
  const grandTotal = discountedSubtotal + bundledShippingTotal;

  return {
    subtotal: subtotalPaise,
    discountAmount: discountPaise,
    discountedSubtotal,
    shippingBase,
    shippingGst,
    shippingGstRate,
    shippingTotal,
    isFreeShipping,
    platformBase,
    platformGst,
    platformGstRate,
    platformTotal,
    pgBase,
    pgGst,
    pgGstRate,
    pgTotal,
    paymentGatewayPercent: pgPercent,
    prePgTotal,
    bundledShippingBase,
    bundledShippingGst,
    bundledShippingTotal,
    productTaxable,
    productGst,
    productGstRate,
    totalTax,
    grandTotal,
  };
}
