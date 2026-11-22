/**
 * Central Financial Calculation Engine
 * Implements authoritative decimal arithmetic for e-commerce checkout quotes,
 * order persistence, platform service margins, and statutory GST compliance.
 */

import { FinanceDecimal } from './decimal';
import { getPlatformFinanceSettings, PlatformFinanceConfig } from './settings-store';
import { isValidIndianPin, getGstStateCode } from '@/lib/constants/india';

export interface AuthoritativeQuoteItemInput {
  productId: string;
  name: string;
  sku: string;
  unitPricePaise: number; // Stored price from database
  quantity: number;
  weightGrams?: number;
  weight?: string;
  hsnCode?: string;
  customGstRate?: number; // Override if specific product CA tax classification differs
}

export interface AuthoritativeQuoteInput {
  items: AuthoritativeQuoteItemInput[];
  destinationPin?: string;
  destinationState?: string;
  shippingMode?: 'Express' | 'Surface';
  customDeliveryBasePaise?: number; // Live Delhivery courier rate if PIN provided
  customDeliveryTotalPaise?: number;
  couponDiscountPaise?: number;
  couponCode?: string;
  sellerStateCode?: string; // Default '27' (Maharashtra)
  overrideSettings?: Partial<PlatformFinanceConfig>;
}

export interface ProductLineFinancial {
  productId: string;
  name: string;
  sku: string;
  hsnCode: string;
  quantity: number;
  unitPricePaise: number;
  grossTotalPaise: number;
  taxableAmountPaise: number;
  gstRate: number;
  gstAmountPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
}

export interface OrderFinancialSnapshot {
  version: number;
  calculationTimestamp: string;
  currency: string;

  // 1. Products
  itemsCount: number;
  totalQuantity: number;
  productGstEnabled: boolean;
  productSubtotalPaise: number;
  productTaxablePaise: number;
  productGstPaise: number;
  productGstRate: number;
  customerGstBreakdownVisible: boolean;
  productLines: ProductLineFinancial[];

  // 2. Promotional Discounts
  discountPaise: number;
  discountedSubtotalPaise: number;
  couponCode?: string | null;

  // 3. Delivery & Freight (SAC 9965)
  deliveryEnabled: boolean;
  deliveryBasePaise: number;
  deliveryGstRate: number;
  deliveryGstPaise: number;
  deliveryTotalPaise: number;
  isInterStateDelivery: boolean;
  deliveryCgstPaise: number;
  deliverySgstPaise: number;
  deliveryIgstPaise: number;

  // 4. Platform Technology Service Fee (SAC 9971)
  platformFeeEnabled: boolean;
  platformFeeType: 'FIXED' | 'PERCENTAGE';
  platformFeeBasePaise: number;
  platformGstRate: number;
  platformGstPaise: number;
  platformTotalPaise: number;
  customerDisclosed: boolean;
  clientVisible: boolean;
  platformCgstPaise: number;
  platformSgstPaise: number;
  platformIgstPaise: number;

  // 5. Consolidated Statutory GST
  totalTaxableValuePaise: number;
  totalCgstPaise: number;
  totalSgstPaise: number;
  totalIgstPaise: number;
  totalTaxPaise: number;

  // 6. Grand Final Payable
  grandTotalPaise: number;

  // 7. Client Business Settlement Split (Internal Merchant P&L)
  merchantGrossPayablePaise: number; // Subtotal + Delivery - Discount
  platformRetainedMarginPaise: number; // Platform fee + Platform GST
}

export interface AuthoritativeQuoteResponse {
  success: boolean;
  snapshot: OrderFinancialSnapshot;
  formatted: {
    productSubtotal: string;
    discount: string;
    delivery: string;
    deliveryGst: string;
    platformFee: string;
    platformGst: string;
    totalTax: string;
    grandTotal: string;
  };
  disclosures: {
    showPlatformFee: boolean;
    showDelivery: boolean;
    deliveryGstEnabled: boolean;
    deliveryGstRate: number;
    productGstEnabled: boolean;
    productGstRate: number;
    customerGstBreakdownVisible: boolean;
    isPinServiceable: boolean;
    deliveryPendingPin: boolean;
  };
}

/**
 * Calculates authoritative financial breakdown with mathematical decimal precision.
 */
export async function calculateAuthoritativeQuote(
  input: AuthoritativeQuoteInput
): Promise<AuthoritativeQuoteResponse> {
  const activeSettings = await getPlatformFinanceSettings();
  const settings: PlatformFinanceConfig = input.overrideSettings
    ? { ...activeSettings, ...input.overrideSettings }
    : activeSettings;

  const sellerState = input.sellerStateCode || '27'; // Maharashtra
  const customerState = input.destinationState
    ? getGstStateCode(input.destinationState)
    : input.destinationPin && isValidIndianPin(input.destinationPin)
    ? '27' // Default or lookup
    : sellerState;

  const isInterState = customerState !== sellerState;
  const isPinComplete = Boolean(
    input.destinationPin &&
    input.destinationPin.length === 6 &&
    isValidIndianPin(input.destinationPin)
  );

  // 1. Calculate Items with Decimal Arithmetic
  const isProductGstActive = settings.productGstEnabled !== false && settings.defaultProductGstRate > 0;
  let totalGross = FinanceDecimal.zero();
  let totalProductTaxable = FinanceDecimal.zero();
  let totalProductGst = FinanceDecimal.zero();
  let totalQty = 0;
  const productLines: ProductLineFinancial[] = [];

  for (const item of input.items) {
    const qty = Math.max(1, Math.floor(item.quantity));
    totalQty += qty;
    const unitPriceDec = FinanceDecimal.fromPaise(item.unitPricePaise);
    const lineGrossDec = unitPriceDec.mulQuantity(qty);
    totalGross = totalGross.add(lineGrossDec);

    const gstRate = isProductGstActive ? (item.customGstRate ?? settings.defaultProductGstRate) : 0;
    const isInclusive = settings.productPricesGstInclusive;

    let lineTaxableDec: FinanceDecimal;
    let lineGstDec: FinanceDecimal;

    if (gstRate === 0) {
      lineTaxableDec = lineGrossDec;
      lineGstDec = FinanceDecimal.zero();
    } else if (isInclusive) {
      const split = lineGrossDec.extractTaxFromInclusive(gstRate);
      lineTaxableDec = split.taxable;
      lineGstDec = split.tax;
    } else {
      const split = lineGrossDec.addTaxToExclusive(gstRate);
      lineTaxableDec = lineGrossDec;
      lineGstDec = split.tax;
    }

    totalProductTaxable = totalProductTaxable.add(lineTaxableDec);
    totalProductGst = totalProductGst.add(lineGstDec);

    const lineGstPaise = lineGstDec.toPaise();
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (isInterState) {
      igst = lineGstPaise;
    } else {
      cgst = Math.round(lineGstPaise / 2);
      sgst = lineGstPaise - cgst;
    }

    productLines.push({
      productId: item.productId,
      name: item.name,
      sku: item.sku,
      hsnCode: item.hsnCode || '0409', // HSN 0409: Natural Honey
      quantity: qty,
      unitPricePaise: item.unitPricePaise,
      grossTotalPaise: lineGrossDec.toPaise(),
      taxableAmountPaise: lineTaxableDec.toPaise(),
      gstRate,
      gstAmountPaise: lineGstPaise,
      cgstPaise: cgst,
      sgstPaise: sgst,
      igstPaise: igst,
    });
  }

  // 2. Promotional Discounts
  const grossSubtotalPaise = totalGross.toPaise();
  const rawDiscountPaise = Math.max(0, input.couponDiscountPaise || 0);
  const discountPaise = Math.min(rawDiscountPaise, grossSubtotalPaise);
  const discountedSubtotalPaise = grossSubtotalPaise - discountPaise;
  const discountedSubtotalDec = FinanceDecimal.fromPaise(discountedSubtotalPaise);

  // 3. Delivery Calculation (SAC 9965)
  let deliveryBasePaise = 0;
  let deliveryGstPaise = 0;
  let deliveryTotalPaise = 0;
  let deliveryCgst = 0;
  let deliverySgst = 0;
  let deliveryIgst = 0;

  const isDeliveryGstActive = settings.deliveryGstEnabled !== false && settings.deliveryGstRate > 0;

  if ((settings.deliveryEnabled || (input.customDeliveryTotalPaise !== undefined && input.customDeliveryTotalPaise > 0)) && isPinComplete && discountedSubtotalPaise > 0) {
    if (input.customDeliveryTotalPaise !== undefined && input.customDeliveryTotalPaise > 0) {
      if (isDeliveryGstActive) {
        deliveryTotalPaise = input.customDeliveryTotalPaise;
        const totalDec = FinanceDecimal.fromPaise(deliveryTotalPaise);
        const split = totalDec.extractTaxFromInclusive(settings.deliveryGstRate);
        deliveryBasePaise = input.customDeliveryBasePaise ?? split.taxable.toPaise();
        deliveryGstPaise = deliveryTotalPaise - deliveryBasePaise;
      } else {
        deliveryBasePaise = input.customDeliveryBasePaise ?? input.customDeliveryTotalPaise;
        deliveryGstPaise = 0;
        deliveryTotalPaise = deliveryBasePaise;
      }
    } else {
      deliveryBasePaise = input.customDeliveryBasePaise ?? settings.deliveryFeePaise;
      const baseDec = FinanceDecimal.fromPaise(deliveryBasePaise);
      if (isDeliveryGstActive) {
        deliveryGstPaise = baseDec.mulRate(settings.deliveryGstRate).toPaise();
      } else {
        deliveryGstPaise = 0;
      }
      deliveryTotalPaise = deliveryBasePaise + deliveryGstPaise;
    }

    if (isInterState) {
      deliveryIgst = deliveryGstPaise;
    } else {
      deliveryCgst = Math.round(deliveryGstPaise / 2);
      deliverySgst = deliveryGstPaise - deliveryCgst;
    }
  }

  // 4. Platform Technology Service Fee Calculation (SAC 9971)
  let platformFeeBasePaise = 0;
  let platformGstPaise = 0;
  let platformTotalPaise = 0;
  let platformCgst = 0;
  let platformSgst = 0;
  let platformIgst = 0;

  if (settings.platformFeeEnabled && discountedSubtotalPaise > 0) {
    if (settings.feeType === 'PERCENTAGE') {
      const computedFee = discountedSubtotalDec.mulRate(settings.feePercent).toPaise();
      platformFeeBasePaise = Math.max(settings.minFeePaise, Math.min(computedFee, settings.maxFeePaise));
    } else {
      platformFeeBasePaise = settings.fixedFeePaise;
    }

    const feeBaseDec = FinanceDecimal.fromPaise(platformFeeBasePaise);
    if (settings.platformGstEnabled) {
      if (settings.platformGstInclusive) {
        const split = feeBaseDec.extractTaxFromInclusive(settings.platformGstRate);
        platformFeeBasePaise = split.taxable.toPaise();
        platformGstPaise = split.tax.toPaise();
      } else {
        platformGstPaise = feeBaseDec.mulRate(settings.platformGstRate).toPaise();
      }
    }
    platformTotalPaise = platformFeeBasePaise + platformGstPaise;

    if (isInterState) {
      platformIgst = platformGstPaise;
    } else {
      platformCgst = Math.round(platformGstPaise / 2);
      platformSgst = platformGstPaise - platformCgst;
    }
  }

  // 5. Total Statutory GST Breakdown
  const totalTaxableValuePaise = totalProductTaxable.toPaise() + deliveryBasePaise + platformFeeBasePaise;
  const totalCgstPaise = productLines.reduce((acc, l) => acc + l.cgstPaise, 0) + deliveryCgst + platformCgst;
  const totalSgstPaise = productLines.reduce((acc, l) => acc + l.sgstPaise, 0) + deliverySgst + platformSgst;
  const totalIgstPaise = productLines.reduce((acc, l) => acc + l.igstPaise, 0) + deliveryIgst + platformIgst;
  const totalTaxPaise = totalCgstPaise + totalSgstPaise + totalIgstPaise;

  // 6. Grand Final Payable
  const grandTotalPaise = discountedSubtotalPaise + deliveryTotalPaise + platformTotalPaise;

  // 7. Merchant vs Platform Settlement Breakdown
  const merchantGrossPayablePaise = discountedSubtotalPaise + deliveryTotalPaise;
  const platformRetainedMarginPaise = platformTotalPaise;

  const snapshot: OrderFinancialSnapshot = {
    version: settings.version,
    calculationTimestamp: new Date().toISOString(),
    currency: 'INR',
    itemsCount: input.items.length,
    totalQuantity: totalQty,
    productGstEnabled: isProductGstActive,
    productSubtotalPaise: grossSubtotalPaise,
    productTaxablePaise: totalProductTaxable.toPaise(),
    productGstPaise: totalProductGst.toPaise(),
    productGstRate: isProductGstActive ? settings.defaultProductGstRate : 0,
    customerGstBreakdownVisible: Boolean(settings.customerGstBreakdownVisible && settings.showProductGstBreakdown),
    productLines,
    discountPaise,
    discountedSubtotalPaise,
    couponCode: input.couponCode || null,
    deliveryEnabled: settings.deliveryEnabled,
    deliveryBasePaise,
    deliveryGstRate: isDeliveryGstActive ? settings.deliveryGstRate : 0,
    deliveryGstPaise,
    deliveryTotalPaise,
    isInterStateDelivery: isInterState,
    deliveryCgstPaise: deliveryCgst,
    deliverySgstPaise: deliverySgst,
    deliveryIgstPaise: deliveryIgst,
    platformFeeEnabled: settings.platformFeeEnabled,
    platformFeeType: settings.feeType,
    platformFeeBasePaise,
    platformGstRate: settings.platformGstRate,
    platformGstPaise,
    platformTotalPaise,
    customerDisclosed: settings.customerDisclosed,
    clientVisible: settings.clientVisible,
    platformCgstPaise: platformCgst,
    platformSgstPaise: platformSgst,
    platformIgstPaise: platformIgst,
    totalTaxableValuePaise,
    totalCgstPaise,
    totalSgstPaise,
    totalIgstPaise,
    totalTaxPaise,
    grandTotalPaise,
    merchantGrossPayablePaise,
    platformRetainedMarginPaise,
  };

  return {
    success: true,
    snapshot,
    formatted: {
      productSubtotal: FinanceDecimal.fromPaise(grossSubtotalPaise).toFormattedINR(),
      discount: FinanceDecimal.fromPaise(discountPaise).toFormattedINR(),
      delivery: FinanceDecimal.fromPaise(deliveryTotalPaise).toFormattedINR(),
      deliveryGst: FinanceDecimal.fromPaise(deliveryGstPaise).toFormattedINR(),
      platformFee: FinanceDecimal.fromPaise(platformFeeBasePaise).toFormattedINR(),
      platformGst: FinanceDecimal.fromPaise(platformGstPaise).toFormattedINR(),
      totalTax: FinanceDecimal.fromPaise(totalTaxPaise).toFormattedINR(),
      grandTotal: FinanceDecimal.fromPaise(grandTotalPaise).toFormattedINR(),
    },
    disclosures: {
      showPlatformFee: Boolean(settings.platformFeeEnabled && settings.customerDisclosed && platformFeeBasePaise > 0),
      showDelivery: Boolean(settings.deliveryEnabled),
      deliveryGstEnabled: isDeliveryGstActive && deliveryGstPaise > 0,
      deliveryGstRate: isDeliveryGstActive ? settings.deliveryGstRate : 0,
      productGstEnabled: isProductGstActive,
      productGstRate: isProductGstActive ? settings.defaultProductGstRate : 0,
      customerGstBreakdownVisible: Boolean(settings.customerGstBreakdownVisible && settings.showProductGstBreakdown),
      isPinServiceable: isPinComplete,
      deliveryPendingPin: !isPinComplete,
    },
  };
}
