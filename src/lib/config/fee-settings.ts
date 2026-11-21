/**
 * Operational fee and shipping configuration with statutory GST breakdowns
 * Manageable by Managers and Super Admins (browser-safe; disk persistence lives in fee-settings-server.ts)
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

const globalFeeStore = globalThis as unknown as {
  __FEE_SETTINGS__?: FeeSettings;
};

export function getFeeSettings(): FeeSettings {
  if (!globalFeeStore.__FEE_SETTINGS__) {
    globalFeeStore.__FEE_SETTINGS__ = { ...DEFAULT_FEE_SETTINGS };
  }
  return { ...globalFeeStore.__FEE_SETTINGS__ };
}

export function updateFeeSettings(updates: Partial<FeeSettings>, updatedBy: string = 'Manager'): FeeSettings {
  const current = getFeeSettings();
  const next: FeeSettings = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };
  globalFeeStore.__FEE_SETTINGS__ = next;
  return { ...next };
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

  // Bundled Shipping & Delivery (Courier Shipping + Solid Glass Packaging)
  bundledShippingBase: number;
  bundledShippingGst: number;
  bundledShippingTotal: number;

  // Merchant Settlement Accounting (Internal gateway business expense, NOT added to customer order)
  netMerchantSettlement: number;

  // Grand total payable
  grandTotal: number;
}

/**
 * Computes exact fee, shipping, and statutory GST splits
 * Complies strictly with Indian GST:
 * - Product prices are tax-inclusive (GST extracted, never added on top)
 * - Courier Shipping (SAC 9965) has 18% GST
 * - Packaging / Platform fee (SAC 9971) has 18% GST
 * - Payment gateway processing is a business expense (not charged to customer as tax)
 * - Zero tax-on-tax
 */
export function calculateOrderFees(
  subtotalPaise: number,
  discountPaise: number = 0,
  settings: FeeSettings = getFeeSettings(),
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

  // 2. Packaging / Platform Base Fee Calculation (18% GST)
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

  // 3. Product GST (5% for pure natural honey HSN 0409 - extracted from inclusive price, never added on top)
  const productGstRate = 5;
  const productTaxable = Math.round((discountedSubtotal * 100) / (100 + productGstRate));
  const productGst = discountedSubtotal - productTaxable;

  // 4. Bundled Delivery (Courier Freight + Solid Glass Protective Packaging)
  const bundledShippingBase = shippingBase + platformBase;
  const bundledShippingGst = shippingGst + platformGst;
  const bundledShippingTotal = shippingTotal + platformTotal;

  // 5. Total customer-side tax (strictly Product GST + Courier GST + Packaging GST; no tax-on-tax)
  const totalTax = productGst + shippingGst + platformGst;

  // 6. Grand total customer payable amount
  const grandTotal = discountedSubtotal + bundledShippingTotal;

  // 7. Payment Gateway (PG) Processing Expense - Strictly a business settlement expense
  // Recorded for merchant accounting / P&L reports, NOT added onto the customer bill as tax
  const pgGstRate = settings.paymentGatewayGstRate || 18;
  const pgPercent = settings.paymentGatewayPercent || 2.0;
  const pgBase = Math.round((grandTotal * pgPercent) / 100);
  const pgGst = Math.round((pgBase * pgGstRate) / 100);
  const pgTotal = pgBase + pgGst;
  const netMerchantSettlement = Math.max(0, grandTotal - pgTotal);

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
    prePgTotal: grandTotal,
    bundledShippingBase,
    bundledShippingGst,
    bundledShippingTotal,
    productTaxable,
    productGst,
    productGstRate,
    totalTax,
    netMerchantSettlement,
    grandTotal,
  };
}
