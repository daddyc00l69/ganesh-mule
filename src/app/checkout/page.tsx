'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { StoreProvider } from '@/components/storefront/store-provider';
import { useCart } from '@/lib/cart/cart-context';
import { formatCurrency } from '@/lib/utils';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Lock,
  Droplets,
  Truck,
  ChevronDown,
  ChevronUp,
  Zap,
  ShoppingBag,
  Tag,
  Check,
  X,
  Sparkles,
  TicketPercent,
  FileText,
  MapPin,
  Clock,
  Loader2,
  RefreshCw,
  Trash2,
  CreditCard,
  Plane,
  Package,
  BadgeCheck,
  ExternalLink,
  Shield,
  ArrowRight,
} from 'lucide-react';
import {
  INDIAN_STATES,
  guessCityStateFromPin,
  isValidIndianPin,
} from '@/lib/constants/india';
import {
  FeeSettings,
  DEFAULT_FEE_SETTINGS,
  calculateOrderFees,
} from '@/lib/config/fee-settings';

interface AppliedCouponState {
  id?: string;
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  discountAmount: number; // in paise
  assignedToManagerName?: string;
}

interface SpeedQuote {
  mode: 'Surface' | 'Express';
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  carrier: string;
  estimatedDays: number;
  estimatedDeliveryDate: string;
  courierBasePaise: number;
  courierGstPaise: number;
  courierTotalPaise: number;
  bundledDeliveryTotal: number;
  bundledDeliveryBase: number;
  bundledDeliveryGst: number;
  available: boolean;
  restrictionReason?: string | null;
  zoneName: string;
  zoneCode: string;
  billableWeightGrams: number;
  rateSource: string;
}

function formatEstimatedDeliveryDate(days: number): string {
  const target = new Date();
  let added = 0;
  while (added < days) {
    target.setDate(target.getDate() + 1);
    // Skip Sunday (0) for transit calculation
    if (target.getDay() !== 0) {
      added++;
    }
  }
  const dayName = target.toLocaleDateString('en-IN', { weekday: 'short' });
  const dayNum = target.getDate();
  const monthName = target.toLocaleDateString('en-IN', { month: 'short' });
  return `${dayName}, ${dayNum} ${monthName}`;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, subtotal, clearCart, removeFromCart, updateQuantity } = useCart();

  // Delhivery District & Air/Surface Serviceability States
  const [district, setDistrict] = useState<string>('');
  const [districtVerified, setDistrictVerified] = useState<boolean | null>(null);
  const [shippingMode, setShippingMode] = useState<'Express' | 'Surface'>('Surface');
  const [airAvailable, setAirAvailable] = useState<boolean>(true);
  const [airRestrictionReason, setAirRestrictionReason] = useState<string | null>(null);

  // Payment Method: Strictly 100% Prepaid (UPI, Cards, NetBanking via Razorpay)
  const paymentMethod: 'ONLINE' = 'ONLINE';

  // Dynamic fee configuration manageable by operations managers
  const [feeSettings, setFeeSettings] = useState<FeeSettings>(DEFAULT_FEE_SETTINGS);
  const [showGstBreakdown, setShowGstBreakdown] = useState(false);

  // Customer & Contact Details
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(''); // 10-digit Indian Mobile

  // Indian Structured Delivery Address
  const [country, setCountry] = useState('India');
  const [flatBuilding, setFlatBuilding] = useState('');
  const [areaStreet, setAreaStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [pinAutoDetected, setPinAutoDetected] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [availableTowns, setAvailableTowns] = useState<string[]>([]);
  const pincodeAbortRef = useRef<AbortController | null>(null);

  // Field refs for intelligent smooth-scrolling & auto-focus on incomplete fields
  const fullNameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const flatBuildingRef = useRef<HTMLInputElement>(null);
  const areaStreetRef = useRef<HTMLInputElement>(null);
  const postalCodeRef = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLInputElement>(null);

  // Cart safe clear confirmation
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Dual Delhivery Speed Quotes (Surface vs Air Express side-by-side)
  const [speedQuotes, setSpeedQuotes] = useState<{
    surface: SpeedQuote | null;
    express: SpeedQuote | null;
  }>({ surface: null, express: null });

  // Delhivery Dynamic Freight & Logistics Calculation States
  const [delhiveryRate, setDelhiveryRate] = useState<{
    baseFreightPaise: number;
    additionalWeightPaise: number;
    insuredGlassHandlingPaise: number;
    subtotalPaise: number;
    gstAmountPaise: number;
    totalPaise: number;
    zoneName: string;
    zoneCode: string;
    estimatedDays: number;
    carrier: string;
    billableWeightGrams: number;
    serviceable: boolean;
    rateSource: string;
  } | null>(null);
  const [isCalculatingFreight, setIsCalculatingFreight] = useState(false);

  // Coupon Code States
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCouponState | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccessMsg, setCouponSuccessMsg] = useState<string | null>(null);

  // Public Offers & Refresh Button States
  const [showPublicOffers, setShowPublicOffers] = useState(false);
  const [publicOffers, setPublicOffers] = useState<Array<{
    code: string;
    description: string;
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
    value: number;
    minOrderAmount: number;
  }>>([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState(false);

  // Mobile Order Summary Toggle
  const [isOrderSummaryOpen, setIsOrderSummaryOpen] = useState(false);

  // Checkout Execution States
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<{
    orderNumber: string;
    paymentId: string;
    amount: number;
    discountAmount?: number;
    couponCode?: string;
  } | null>(null);

  // Authoritative Server-Side Quote State
  const [serverQuote, setServerQuote] = useState<any | null>(null);
  const [isCalculatingQuote, setIsCalculatingQuote] = useState(false);

  // Billable package weight based on Delhivery slabs (250g -> 500g slab, 500g -> 800g slab, 1kg -> 1500g slab)
  const consignmentWeightGrams = items.reduce((acc, item) => {
    const name = (item.productName || (item as any).name || '').toLowerCase();
    const id = (item.productId || '').toLowerCase();
    const weight = ((item as any).weight || '').toLowerCase();
    if (weight.includes('1kg') || name.includes('1kg') || name.includes('1050') || id.includes('1kg') || id.includes('1050')) return acc + 1500 * item.quantity;
    if (weight.includes('500g') || name.includes('500g') || name.includes('750') || id.includes('500g') || id.includes('750')) return acc + 800 * item.quantity;
    return acc + 500 * item.quantity;
  }, 0) || 500;

  // Pre-load Razorpay checkout SDK in background on page mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as any).Razorpay) return;
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // Automatically purge cart on completed order (strictly once)
  const hasPurgedCartRef = useRef(false);
  useEffect(() => {
    if (completedOrder && !hasPurgedCartRef.current) {
      hasPurgedCartRef.current = true;
      clearCart();
    }
  }, [completedOrder, clearCart]);

  // Load authenticated customer details if session is active
  useEffect(() => {
    async function loadCustomerProfile() {
      try {
        const res = await fetch('/api/account/me');
        if (res.ok) {
          const data = await res.json();
          if (data?.authenticated && data?.user) {
            if (data.user.name) setFullName(data.user.name);
            if (data.user.email) setEmail(data.user.email);
            if (data.user.phone) setPhone(data.user.phone);
          }
        }
      } catch { }
    }
    loadCustomerProfile();
  }, []);

  // Load active manager-configured fee settings
  useEffect(() => {
    async function loadFeeSettings() {
      try {
        const res = await fetch('/api/settings/fees');
        if (res.ok) {
          const data = await res.json();
          if (data?.settings) {
            setFeeSettings(data.settings);
          }
        }
      } catch (err) {
        console.warn('Using default fee configuration:', err);
      }
      try {
        const dRes = await fetch('/api/shipping/delhivery/settings');
        if (dRes.ok) {
          const dData = await dRes.json();
          if (dData?.settings?.shippingMode) {
            setShippingMode(dData.settings.shippingMode === 'Express' ? 'Express' : 'Surface');
          }
        }
      } catch { }
    }
    loadFeeSettings();
  }, []);

  // Auto-apply coupon from URL if present (e.g. ?coupon=VIKRAM15)
  useEffect(() => {
    const urlCoupon = searchParams.get('coupon');
    if (urlCoupon && !appliedCoupon && subtotal > 0) {
      setCouponInput(urlCoupon.toUpperCase());
      validateAndApplyCoupon(urlCoupon.toUpperCase());
    }
  }, [searchParams, subtotal]);

  // Pincode-dependent Delhivery Freight & Speed Calculation
  const fetchDelhiverySpeedQuotes = async (pin: string, activeModePreference?: 'Express' | 'Surface') => {
    if (!isValidIndianPin(pin)) return;
    setIsCalculatingFreight(true);

    try {
      const [surfaceRes, expressRes] = await Promise.all([
        fetch(`/api/shipping/delhivery/cost?destinationPin=${pin}&weightGrams=${consignmentWeightGrams}&mode=Surface`),
        fetch(`/api/shipping/delhivery/cost?destinationPin=${pin}&weightGrams=${consignmentWeightGrams}&mode=Express`),
      ]);

      let surfaceQuote: SpeedQuote | null = null;
      let expressQuote: SpeedQuote | null = null;
      const currentDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;

      if (surfaceRes.ok) {
        const sData = await surfaceRes.json();
        if (sData.success && sData.pricing) {
          const courierBase = Math.round(sData.pricing.subtotal * 100);
          const courierTotal = sData.pricing.totalShippingCostPaise;
          const fees = calculateOrderFees(subtotal, currentDiscount, feeSettings, courierBase, courierTotal);
          surfaceQuote = {
            mode: 'Surface',
            title: 'Surface Standard',
            subtitle: 'Heavy solid glass shockproof road logistics',
            badge: 'Ground Express',
            badgeColor: 'amber',
            carrier: 'Delhivery One Surface',
            estimatedDays: sData.estimatedDays || 3,
            estimatedDeliveryDate: formatEstimatedDeliveryDate(sData.estimatedDays || 3),
            courierBasePaise: courierBase,
            courierGstPaise: Math.round(sData.pricing.gstAmount * 100),
            courierTotalPaise: courierTotal,
            bundledDeliveryTotal: fees.bundledShippingTotal,
            bundledDeliveryBase: fees.bundledShippingBase,
            bundledDeliveryGst: fees.bundledShippingGst,
            available: true,
            zoneName: sData.zone || 'National Zone',
            zoneCode: sData.zoneCode || 'C',
            billableWeightGrams: sData.billableWeightGrams || consignmentWeightGrams,
            rateSource: sData.rateSource || 'delhivery_api',
          };
        }
      }

      if (expressRes.ok) {
        const eData = await expressRes.json();
        if (eData.success && eData.pricing) {
          const courierBase = Math.round(eData.pricing.subtotal * 100);
          const courierTotal = eData.pricing.totalShippingCostPaise;
          const fees = calculateOrderFees(subtotal, currentDiscount, feeSettings, courierBase, courierTotal);
          const isAirAllowed = !eData.airRestricted && airAvailable;
          expressQuote = {
            mode: 'Express',
            title: 'Air Express Priority',
            subtitle: 'Fastest door-to-door domestic air transit',
            badge: '⚡ Fastest Air',
            badgeColor: 'emerald',
            carrier: 'Delhivery One Air Express',
            estimatedDays: eData.estimatedDays || 1,
            estimatedDeliveryDate: formatEstimatedDeliveryDate(eData.estimatedDays || 1),
            courierBasePaise: courierBase,
            courierGstPaise: Math.round(eData.pricing.gstAmount * 100),
            courierTotalPaise: courierTotal,
            bundledDeliveryTotal: fees.bundledShippingTotal,
            bundledDeliveryBase: fees.bundledShippingBase,
            bundledDeliveryGst: fees.bundledShippingGst,
            available: isAirAllowed,
            restrictionReason: eData.airRestrictionReason || (isAirAllowed ? null : `Liquid air cargo restricted for PIN ${pin}.`),
            zoneName: eData.zone || 'National Zone',
            zoneCode: eData.zoneCode || 'C',
            billableWeightGrams: eData.billableWeightGrams || consignmentWeightGrams,
            rateSource: eData.rateSource || 'delhivery_api',
          };
        }
      }

      setSpeedQuotes({ surface: surfaceQuote, express: expressQuote });

      // Determine which speed quote is active
      const targetMode = activeModePreference || shippingMode;
      const chosen = (targetMode === 'Express' && expressQuote?.available) ? expressQuote : surfaceQuote;

      if (chosen) {
        setDelhiveryRate({
          baseFreightPaise: chosen.courierBasePaise,
          additionalWeightPaise: 0,
          insuredGlassHandlingPaise: 0,
          subtotalPaise: chosen.courierBasePaise,
          gstAmountPaise: chosen.courierGstPaise,
          totalPaise: chosen.courierTotalPaise,
          zoneName: chosen.zoneName,
          zoneCode: chosen.zoneCode,
          estimatedDays: chosen.estimatedDays,
          carrier: chosen.carrier,
          billableWeightGrams: chosen.billableWeightGrams,
          serviceable: true,
          rateSource: chosen.rateSource,
        });

        if (targetMode === 'Express' && !expressQuote?.available) {
          setShippingMode('Surface');
        }
      }
    } catch (err) {
      console.warn('Delhivery speed calculation error:', err);
    } finally {
      setIsCalculatingFreight(false);
    }
  };

  // Re-fetch quotes when PIN, consignment weight, or discount changes
  useEffect(() => {
    if (postalCode.length === 6 && isValidIndianPin(postalCode)) {
      fetchDelhiverySpeedQuotes(postalCode, shippingMode);
    }
  }, [postalCode, consignmentWeightGrams, subtotal, appliedCoupon]);

  // Handle speed switch with instant UI responsiveness
  const handleSelectSpeedMode = (mode: 'Surface' | 'Express') => {
    if (mode === 'Express' && speedQuotes.express && !speedQuotes.express.available) {
      setErrorMessage(
        speedQuotes.express.restrictionReason ||
        `Air cargo is restricted for PIN ${postalCode}. Surface transit is active.`
      );
      return;
    }

    setShippingMode(mode);
    const targetQuote = mode === 'Express' ? speedQuotes.express : speedQuotes.surface;

    if (targetQuote) {
      setDelhiveryRate({
        baseFreightPaise: targetQuote.courierBasePaise,
        additionalWeightPaise: 0,
        insuredGlassHandlingPaise: 0,
        subtotalPaise: targetQuote.courierBasePaise,
        gstAmountPaise: targetQuote.courierGstPaise,
        totalPaise: targetQuote.courierTotalPaise,
        zoneName: targetQuote.zoneName,
        zoneCode: targetQuote.zoneCode,
        estimatedDays: targetQuote.estimatedDays,
        carrier: targetQuote.carrier,
        billableWeightGrams: targetQuote.billableWeightGrams,
        serviceable: true,
        rateSource: targetQuote.rateSource,
      });
    } else if (postalCode.length === 6 && isValidIndianPin(postalCode)) {
      fetchDelhiverySpeedQuotes(postalCode, mode);
    }
  };

  // Fetch Authoritative Server-Side Quote
  useEffect(() => {
    if (items.length === 0) {
      setServerQuote(null);
      return;
    }

    let isMounted = true;
    setIsCalculatingQuote(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/checkout/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
            destinationPin: postalCode.length === 6 && isValidIndianPin(postalCode) ? postalCode : undefined,
            destinationState: state,
            shippingMode,
            couponCode: appliedCoupon?.code,
          }),
        });

        if (res.ok && isMounted) {
          const data = await res.json();
          setServerQuote(data);
        }
      } catch (err) {
        console.warn('Failed to fetch authoritative checkout quote:', err);
      } finally {
        if (isMounted) setIsCalculatingQuote(false);
      }
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [items, postalCode, state, shippingMode, appliedCoupon]);

  // Dynamic calculations with statutory GST and manager-controlled fees
  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : (serverQuote?.snapshot?.discountPaise || 0);
  const isPinComplete = postalCode.length === 6 && isValidIndianPin(postalCode);
  const effectiveFeeSettings = isPinComplete
    ? feeSettings
    : { ...feeSettings, platformFeeEnabled: false };

  const fallbackBreakdown = calculateOrderFees(
    subtotal,
    discountAmount,
    effectiveFeeSettings,
    delhiveryRate
      ? delhiveryRate.subtotalPaise
      : isPinComplete
        ? undefined
        : 0,
    delhiveryRate ? delhiveryRate.totalPaise : undefined
  );

  // Authoritative server quote resolution
  const hasServerSnapshot = Boolean(serverQuote?.snapshot);
  const snap = serverQuote?.snapshot;

  const discountedSubtotal = hasServerSnapshot
    ? snap.discountedSubtotalPaise
    : fallbackBreakdown.discountedSubtotal;

  const shippingBase = hasServerSnapshot
    ? snap.deliveryBasePaise
    : fallbackBreakdown.shippingBase;

  const shippingGst = hasServerSnapshot
    ? snap.deliveryGstPaise
    : fallbackBreakdown.shippingGst;

  const shippingTotal = hasServerSnapshot
    ? snap.deliveryTotalPaise
    : fallbackBreakdown.shippingTotal;

  const bundledShippingBase = shippingBase;
  const bundledShippingGst = shippingGst;
  const bundledShippingTotal = shippingTotal;

  const isFreeShipping = hasServerSnapshot
    ? (snap.deliveryTotalPaise === 0 && isPinComplete)
    : fallbackBreakdown.isFreeShipping;

  const productTaxable = hasServerSnapshot
    ? snap.productTaxablePaise
    : fallbackBreakdown.productTaxable;

  const productGst = hasServerSnapshot
    ? snap.productGstPaise
    : fallbackBreakdown.productGst;

  const platformFeeBase = hasServerSnapshot
    ? snap.platformFeeBasePaise
    : 0;

  const platformFeeGst = hasServerSnapshot
    ? snap.platformGstPaise
    : 0;

  const platformFeeTotal = hasServerSnapshot
    ? snap.platformTotalPaise
    : 0;

  const showPlatformFee = Boolean(
    serverQuote?.disclosures?.showPlatformFee && platformFeeBase > 0
  );

  const productGstEnabled = hasServerSnapshot
    ? (serverQuote?.disclosures?.productGstEnabled ?? (snap.productGstPaise > 0))
    : (productGst > 0);

  const productGstRate = hasServerSnapshot
    ? (serverQuote?.disclosures?.productGstRate ?? snap.productGstRate ?? 5)
    : 5;

  const customerGstBreakdownVisible = hasServerSnapshot
    ? (serverQuote?.disclosures?.customerGstBreakdownVisible ?? true)
    : true;

  const deliveryGstEnabled = hasServerSnapshot
    ? (serverQuote?.disclosures?.deliveryGstEnabled ?? (bundledShippingGst > 0))
    : (bundledShippingGst > 0);

  const deliveryGstRate = hasServerSnapshot
    ? (serverQuote?.disclosures?.deliveryGstRate ?? snap.deliveryGstRate ?? 18)
    : 18;

  const totalTax = hasServerSnapshot
    ? snap.totalTaxPaise
    : fallbackBreakdown.totalTax;

  const totalAmount = hasServerSnapshot
    ? snap.grandTotalPaise
    : fallbackBreakdown.grandTotal;

  const hasTaxBreakdown = customerGstBreakdownVisible && totalTax > 0;
  const hasProductGst = productGstEnabled && productGst > 0 && customerGstBreakdownVisible;
  const hasDeliveryGst = deliveryGstEnabled && bundledShippingGst > 0 && customerGstBreakdownVisible;

  // Strict Form Validation for Pay button and Preview Card gating
  const isContactComplete = Boolean(
    fullName.trim() &&
    phone.length === 10 &&
    email.trim() &&
    email.includes('@')
  );

  const isDestinationComplete = Boolean(
    flatBuilding.trim() &&
    areaStreet.trim() &&
    postalCode.length === 6 &&
    isValidIndianPin(postalCode) &&
    city.trim()
  );

  const isFormValid = isContactComplete && isDestinationComplete && items.length > 0;

  // Jump and auto-focus destination PIN input
  const scrollToPinInput = () => {
    if (postalCodeRef.current) {
      postalCodeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      postalCodeRef.current.focus();
    }
  };

  // Contextual helper determining the next missing field for 1-click user guidance
  const getFirstMissingStep = () => {
    if (items.length === 0) {
      return {
        label: 'Select raw honey jars to proceed',
        action: () => router.push('/shop'),
      };
    }
    if (!fullName.trim()) {
      return {
        label: 'Enter Customer Full Name',
        action: () => {
          fullNameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          fullNameRef.current?.focus();
        },
      };
    }
    if (phone.length !== 10) {
      return {
        label: 'Enter 10-Digit Mobile Number',
        action: () => {
          phoneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          phoneRef.current?.focus();
        },
      };
    }
    if (!email.trim() || !email.includes('@')) {
      return {
        label: 'Enter Email Address for GST Invoice',
        action: () => {
          emailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          emailRef.current?.focus();
        },
      };
    }
    if (!flatBuilding.trim()) {
      return {
        label: 'Enter Flat / House / Building Name',
        action: () => {
          flatBuildingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          flatBuildingRef.current?.focus();
        },
      };
    }
    if (!areaStreet.trim()) {
      return {
        label: 'Enter Area, Street or Road',
        action: () => {
          areaStreetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          areaStreetRef.current?.focus();
        },
      };
    }
    if (postalCode.length !== 6 || !isValidIndianPin(postalCode)) {
      return {
        label: 'Enter 6-Digit Delivery PIN Code',
        action: scrollToPinInput,
      };
    }
    if (!city.trim()) {
      return {
        label: 'Enter Town or City',
        action: () => {
          cityRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          cityRef.current?.focus();
        },
      };
    }
    return null;
  };

  const missingStep = getFirstMissingStep();

  // Coupon handling
  const validateAndApplyCoupon = async (codeToTest?: string) => {
    const code = (codeToTest || couponInput).trim().toUpperCase();
    if (!code) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    setCouponLoading(true);
    setCouponError(null);
    setCouponSuccessMsg(null);

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          subtotal: Math.round(subtotal),
          customerEmail: email.trim() ? email.trim().toLowerCase() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.valid) {
        setCouponError(data.error || 'Invalid coupon code');
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon(data.coupon);
        setCouponInput('');
        setCouponSuccessMsg(
          `Coupon "${data.coupon.code}" applied! Saved ${formatCurrency(data.coupon.discountAmount)}`
        );
      }
    } catch {
      setCouponError('Failed to validate coupon. Please check connection.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponSuccessMsg(null);
    setCouponError(null);
  };

  const fetchPublicOffers = async () => {
    setIsLoadingOffers(true);
    try {
      const res = await fetch('/api/coupons?publicOnly=true');
      if (res.ok) {
        const data = await res.json();
        if (data.coupons && Array.isArray(data.coupons)) {
          setPublicOffers(data.coupons);
          setShowPublicOffers(true);
        }
      }
    } catch { }
    setIsLoadingOffers(false);
  };

  // PIN resolution handler with live Delhivery verification
  const fetchPinDetails = async (pin: string) => {
    if (pincodeAbortRef.current) {
      pincodeAbortRef.current.abort();
    }
    const controller = new AbortController();
    pincodeAbortRef.current = controller;

    setPinLoading(true);
    setPinError(null);

    try {
      const res = await fetch(`/api/pincode/${pin}`, { signal: controller.signal });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'PIN lookup failed');
      }
      const data = await res.json();
      if (data.success) {
        const resolvedCity = data.city || data.defaultTown || data.district || '';
        if (resolvedCity) {
          setCity(resolvedCity);
        }
        if (data.state) {
          setState(data.state);
        }
        const resolvedDistrict = data.district || data.delhivery?.district || resolvedCity;
        setDistrict(resolvedDistrict);
        setDistrictVerified(data.delhivery?.serviceable ?? true);

        const airOk = data.delhivery?.hasAir ?? true;
        setAirAvailable(airOk);
        setAirRestrictionReason(data.delhivery?.airRestrictionReason || null);
        if (!airOk && shippingMode === 'Express') {
          setShippingMode('Surface');
        }

        if (Array.isArray(data.postOffices) && data.postOffices.length > 0) {
          setAvailableTowns(data.postOffices);
        } else {
          setAvailableTowns([]);
        }
        setPinAutoDetected(`${resolvedCity}${resolvedCity && data.state ? ', ' : ''}${data.state}`);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        const local = guessCityStateFromPin(pin);
        if (local) {
          if (local.city) {
            setCity(local.city);
            setDistrict(local.city);
            setDistrictVerified(true);
          }
          if (local.state) setState(local.state);
          setPinAutoDetected(`${local.city || ''}${local.city && local.state ? ', ' : ''}${local.state || ''}`);
        } else {
          setPinAutoDetected(null);
          setDistrict('');
          setDistrictVerified(null);
          setPinError('Could not auto-detect. Please enter Town/City manually.');
        }
      }
    } finally {
      setPinLoading(false);
    }
  };

  const handlePincodeChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 6);
    setPostalCode(clean);

    if (clean.length < 6) {
      if (pincodeAbortRef.current) {
        pincodeAbortRef.current.abort();
      }
      setPinAutoDetected(null);
      setDistrict('');
      setDistrictVerified(null);
      setPinError(null);
      setAvailableTowns([]);
      setSpeedQuotes({ surface: null, express: null });
      setDelhiveryRate(null);
      return;
    }

    if (clean.length === 6) {
      // 1. Instant local guess for 0ms UI update
      const instant = guessCityStateFromPin(clean);
      if (instant) {
        if (instant.city) {
          setCity(instant.city);
          setDistrict(instant.city);
          setDistrictVerified(true);
        }
        if (instant.state) setState(instant.state);
        setPinAutoDetected(`${instant.city || ''}${instant.city && instant.state ? ', ' : ''}${instant.state || ''}`);
      }

      // 2. Authoritative live resolution (fetches all post offices & exact district)
      fetchPinDetails(clean);

      // 3. Live Delhivery Speed Quotes calculation for Surface & Air
      fetchDelhiverySpeedQuotes(clean, shippingMode);
    }
  };

  const handlePhoneChange = (val: string) => {
    const digits = val.replace(/\D/g, '');
    const clean = digits.length > 10 && digits.startsWith('91') ? digits.slice(2) : digits;
    setPhone(clean.slice(0, 10));
  };

  const handleInitiatePayment = async (e?: React.FormEvent, isDirectTest = false) => {
    if (e) e.preventDefault();
    if (items.length === 0) {
      setErrorMessage('Your bag is empty. Please select your raw honey jars before checking out.');
      return;
    }

    if (!fullName.trim()) {
      setErrorMessage('Please enter the customer full name for shipping label generation.');
      fullNameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      fullNameRef.current?.focus();
      return;
    }

    if (phone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number for courier delivery updates.');
      phoneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      phoneRef.current?.focus();
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address to receive your official GST Tax Invoice.');
      emailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      emailRef.current?.focus();
      return;
    }

    if (!flatBuilding.trim()) {
      setErrorMessage('Please enter your flat, house number, building, or apartment name.');
      flatBuildingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      flatBuildingRef.current?.focus();
      return;
    }

    if (!areaStreet.trim()) {
      setErrorMessage('Please enter your area, street, road, or locality name.');
      areaStreetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      areaStreetRef.current?.focus();
      return;
    }

    if (!isValidIndianPin(postalCode)) {
      setErrorMessage('Please enter a valid 6-digit Indian PIN Code to calculate courier delivery charges.');
      scrollToPinInput();
      return;
    }

    if (!city.trim()) {
      setErrorMessage('Please enter your town or city.');
      cityRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      cityRef.current?.focus();
      return;
    }

    if (!isContactComplete || !isDestinationComplete) {
      setErrorMessage('Please complete all contact and delivery destination details to proceed.');
      return;
    }

    setIsProcessing(true);
    setProcessingStep('Creating secure order...');
    setErrorMessage(null);

    const compositeStreet = [
      flatBuilding.trim(),
      areaStreet.trim(),
      landmark.trim() ? `Landmark: ${landmark.trim()}` : null,
    ]
      .filter(Boolean)
      .join(', ');

    const formattedPhone = phone.length === 10 ? `+91 ${phone.slice(0, 5)} ${phone.slice(5)}` : phone;

    try {
      const res = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          customer: { name: fullName.trim(), email: email.trim(), phone: formattedPhone },
          address: {
            fullName: fullName.trim(),
            phone: formattedPhone,
            street: compositeStreet,
            flatBuilding: flatBuilding.trim(),
            areaStreet: areaStreet.trim(),
            landmark: landmark.trim() || undefined,
            city: city.trim(),
            state,
            postalCode: postalCode.trim(),
            country: 'India',
          },
          shippingMode,
          paymentMethod,
          couponCode: appliedCoupon?.code,
        }),
      });

      const orderData = await res.json();
      if (!res.ok) {
        throw new Error(orderData.error || 'Failed to initiate checkout order');
      }

      const { razorpayOrderId, orderNumber, amount, currency, keyId } = orderData;

      // Direct Instant Test Mode (for staging verification without active bank gateway)
      if (isDirectTest || keyId.includes('placeholder')) {
        setProcessingStep('Instant test payment confirmation...');
        const verifyRes = await fetch('/api/payments/razorpay/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpayOrderId,
            razorpayPaymentId: `pay_test_${Date.now()}`,
            razorpaySignature: 'simulated_test_signature',
            orderNumber,
          }),
        });

        if (verifyRes.ok) {
          clearCart();
          setCompletedOrder({
            orderNumber,
            paymentId: `pay_test_${Date.now()}`,
            amount,
            discountAmount: orderData.discountAmount,
            couponCode: orderData.appliedCouponCode,
          });
          setIsProcessing(false);
          setProcessingStep(null);
          return;
        }
      }

      // Mount Razorpay Modal with preloaded SDK
      setProcessingStep('Opening Razorpay Gateway...');
      if (typeof window !== 'undefined' && !(window as any).Razorpay) {
        await new Promise<boolean>((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
      }

      const options = {
        key: keyId,
        amount,
        currency,
        name: 'Ganesh Mule Pure Honey',
        description: `Order ${orderNumber} - 100% Raw Forest Honey`,
        image: '/images/products/wild-forest-honey.jpg',
        order_id: razorpayOrderId,
        prefill: {
          name: fullName,
          email,
          contact: phone,
        },
        theme: {
          color: '#d97706',
        },
        handler: async function (response: any) {
          try {
            setProcessingStep('Verifying payment & generating tax invoice...');
            const verifyRes = await fetch('/api/payments/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                orderNumber,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              setErrorMessage('Payment verification failed. Please contact support.');
              setIsProcessing(false);
              setProcessingStep(null);
              return;
            }

            clearCart();
            setCompletedOrder({
              orderNumber,
              paymentId: response.razorpay_payment_id,
              amount,
              discountAmount: orderData.discountAmount,
              couponCode: orderData.appliedCouponCode,
            });
          } catch {
            setErrorMessage('Network error while verifying payment.');
          } finally {
            setIsProcessing(false);
            setProcessingStep(null);
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            setProcessingStep(null);
          },
        },
      };

      const razorpayInstance = new (window as any).Razorpay(options);

      razorpayInstance.on('payment.failed', function (resp: any) {
        setIsProcessing(false);
        setProcessingStep(null);
        const reason = resp?.error?.description || resp?.error?.reason || 'Transaction declined by bank';
        setErrorMessage(reason);

        fetch('/api/payments/razorpay/failure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderNumber,
            errorReason: reason,
            customerEmail: email,
          }),
        }).catch(() => { });
      });

      razorpayInstance.open();
    } catch (err: any) {
      setErrorMessage(err.message || 'Checkout failed. Please try again.');
      setIsProcessing(false);
      setProcessingStep(null);
    }
  };

  // EMPTY BAG STATE
  if (items.length === 0 && !completedOrder) {
    return (
      <StoreProvider>
        <div className="bg-[#f5f5f7] min-h-screen py-24 px-4 flex items-center justify-center text-[#1d1d1f]">
          <div className="max-w-md w-full bg-white rounded-3xl border border-[#d2d2d7]/80 p-8 sm:p-10 text-center space-y-5 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-[#f5f5f7] border border-[#d2d2d7] flex items-center justify-center mx-auto text-[#1d1d1f]">
              <ShoppingBag className="w-8 h-8 stroke-[1.75]" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-[#1d1d1f]">Your Bag is Empty</h1>
              <p className="text-xs sm:text-sm text-[#86868b] leading-relaxed max-w-xs mx-auto">
                Explore our cold-extracted wild forest harvests bottled exclusively in heavy solid glass jars.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-semibold bg-[#0071e3] hover:bg-[#0077ed] active:scale-95 text-white shadow-sm transition-all cursor-pointer"
              >
                <span>Browse Raw Honey Reserves</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </StoreProvider>
    );
  }

  // ORDER SUCCESS STATE
  if (completedOrder) {
    return (
      <StoreProvider>
        <div className="bg-[#f5f5f7] min-h-screen py-16 px-4 sm:px-6 text-[#1d1d1f]">
          <div className="max-w-xl mx-auto text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9 stroke-[2]" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-emerald-100/80 text-emerald-900 border border-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                Payment Verified • Insured Courier Booking
              </span>
              <h1 className="text-3xl font-bold tracking-tight text-[#1d1d1f]">
                Thank You for Your Order.
              </h1>
              <p className="text-xs sm:text-sm text-[#86868b] max-w-md mx-auto leading-relaxed">
                Your solid glass jars are being cushioned in custom shock-absorbing kraft packaging at our Western Ghats dispatch hub.
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-[#d2d2d7]/80 p-6 sm:p-7 text-left space-y-3.5 shadow-sm">
              <div className="flex justify-between items-center pb-3 border-b border-[#d2d2d7]/50 text-xs">
                <span className="text-[#86868b]">Order Number</span>
                <span className="font-mono font-bold text-[#1d1d1f] text-sm">
                  {completedOrder.orderNumber}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-[#d2d2d7]/50 text-xs">
                <span className="text-[#86868b]">Razorpay Payment ID</span>
                <span className="font-mono text-[#86868b] text-[11px]">
                  {completedOrder.paymentId}
                </span>
              </div>
              {completedOrder.couponCode && (
                <div className="flex justify-between items-center pb-3 border-b border-[#d2d2d7]/50 text-xs">
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    Coupon Applied ({completedOrder.couponCode})
                  </span>
                  <span className="font-semibold text-emerald-700">
                    -{formatCurrency(completedOrder.discountAmount || 0)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pb-3 border-b border-[#d2d2d7]/50 text-xs">
                <span className="text-[#86868b]">Dispatched Via</span>
                <span className="font-semibold text-[#1d1d1f]">
                  Insured Express Courier Delivery
                </span>
              </div>
              <div className="flex justify-between items-center text-xs pt-1">
                <span className="text-[#1d1d1f] font-medium">Total Paid</span>
                <span className="font-bold text-[#1d1d1f] text-base sm:text-lg font-mono">
                  {formatCurrency(completedOrder.amount)}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href={`/invoice/${completedOrder.orderNumber}`}
                target="_blank"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#1d1d1f] hover:bg-black text-white font-medium text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-white/80" />
                <span>View Official Tax Invoice (PDF)</span>
              </Link>
              <Link
                href="/account"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <span>Track in My Orders</span>
              </Link>
              <Link
                href="/shop"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white border border-[#d2d2d7] text-[#1d1d1f] hover:bg-[#f5f5f7] font-medium text-xs transition-all cursor-pointer shadow-2xs"
              >
                <span>Continue Shopping</span>
              </Link>
            </div>
          </div>
        </div>
      </StoreProvider>
    );
  }

  return (
    <StoreProvider>
      <div className="bg-[#f5f5f7] min-h-screen pb-44 lg:pb-20 text-[#1d1d1f] selection:bg-[#0071e3]/20 selection:text-[#0071e3] scroll-smooth overscroll-y-contain">

        {/* Top Progress & Guarantee Header (Distraction-Free Apple-Style Checkout Header) */}
        <div className="border-b border-[#d2d2d7]/80 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-xs">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex items-center gap-2 text-[#1d1d1f] hover:opacity-75 transition-opacity"
              >
                <Droplets className="w-4 h-4 fill-amber-500 text-amber-600" />
                <span className="font-semibold text-sm sm:text-base tracking-tight text-[#1d1d1f]">
                  Ganesh Mule
                </span>
              </Link>
              <span className="text-[#d2d2d7] hidden sm:inline">|</span>
              <Link
                href="/shop"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1d1d1f] hover:text-[#0071e3] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Shop</span>
              </Link>
            </div>

            {/* Stepper Breadcrumbs */}
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-[#1d1d1f] font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>1. Bag</span>
              </div>
              <span className="text-[#86868b]">/</span>
              <div className="flex items-center gap-1.5 text-[#1d1d1f] font-semibold bg-[#f5f5f7] px-2.5 py-0.5 rounded-full border border-[#d2d2d7]">
                <MapPin className="w-3.5 h-3.5 text-[#0071e3]" />
                <span>2. Address &amp; Delivery</span>
              </div>
              <span className="text-[#86868b]">/</span>
              <div className="flex items-center gap-1.5 text-[#86868b]">
                <Lock className="w-3.5 h-3.5" />
                <span>3. Secure Payment</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">100% Solid Glass Guarantee</span>
                <span className="sm:hidden">Insured Glass</span>
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">

          {/* Heading */}
          <div className="space-y-1.5">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#1d1d1f] tracking-tight">
              Checkout
            </h1>
            <p className="text-xs sm:text-sm text-[#86868b] max-w-xl leading-relaxed">
              Encrypted 256-bit checkout with 100% insured solid glass direct delivery across India.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span className="font-medium">{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-xs font-semibold underline text-rose-900 hover:text-rose-950 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Mobile Collapsible Order Summary Ribbon */}
          <div className="lg:hidden bg-white rounded-2xl border border-[#d2d2d7] shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setIsOrderSummaryOpen(!isOrderSummaryOpen)}
              className="w-full p-4 flex items-center justify-between text-left text-xs font-medium cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#0071e3]" />
                <span className="font-semibold text-[#1d1d1f]">
                  Order Summary ({totalQuantity} {totalQuantity === 1 ? 'jar' : 'jars'})
                </span>
                <span className="text-[#86868b]">•</span>
                <span className="font-bold text-[#1d1d1f] font-mono">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[#0071e3] font-semibold text-xs">
                <span>{isOrderSummaryOpen ? 'Hide' : 'Review'}</span>
                {isOrderSummaryOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </button>

            {isOrderSummaryOpen && (
              <div className="px-5 pb-5 pt-2 border-t border-stone-100 space-y-3 text-xs bg-stone-50/50">
                <div className="flex items-center justify-between pb-1 border-b border-stone-200/60">
                  <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                    Selected Harvests ({items.length})
                  </span>
                  {showClearConfirm ? (
                    <div className="flex items-center gap-1.5 animate-in fade-in">
                      <span className="text-[10px] text-stone-500 font-medium">Empty bag?</span>
                      <button
                        type="button"
                        onClick={() => {
                          clearCart();
                          setShowClearConfirm(false);
                        }}
                        className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded-full font-bold hover:bg-rose-700 cursor-pointer"
                      >
                        Yes, Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowClearConfirm(false)}
                        className="text-[10px] bg-stone-200 text-stone-700 px-2 py-0.5 rounded-full font-medium hover:bg-stone-300 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(true)}
                      className="text-[10px] text-rose-600 hover:text-rose-800 flex items-center gap-1 font-semibold cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3 h-3" /> Clear Bag
                    </button>
                  )}
                </div>
                <div className="divide-y divide-stone-100">
                  {items.map((item) => (
                    <div key={item.productId} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0 pr-1">
                        <p className="font-semibold text-stone-900 line-clamp-1 text-xs">{item.productName}</p>
                        <p className="text-[10px] text-stone-500 font-mono">
                          {item.weight || (item.productName.includes('1kg') ? '1000g' : item.productName.includes('250g') ? '250g' : '500g')}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 flex-nowrap">
                          <div className="inline-flex items-center flex-nowrap shrink-0 border border-stone-200 rounded-full bg-white shadow-2xs select-none h-6 px-0.5">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="w-5 h-5 flex items-center justify-center text-[#1d1d1f] hover:text-[#0071e3] hover:bg-stone-100 rounded-full transition-colors text-xs font-bold shrink-0 cursor-pointer"
                              title="Decrease quantity"
                              aria-label="Decrease quantity"
                            >
                              -
                            </button>
                            <span className="min-w-[18px] text-center text-[11px] font-bold text-[#1d1d1f] font-mono shrink-0 select-none px-0.5">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="w-5 h-5 flex items-center justify-center text-[#1d1d1f] hover:text-[#0071e3] hover:bg-stone-100 rounded-full transition-colors text-xs font-bold shrink-0 cursor-pointer"
                              title="Increase quantity"
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-[11px] text-stone-500 font-medium whitespace-nowrap shrink-0">
                            × {formatCurrency(item.price)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-semibold text-stone-900">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.productId)}
                          className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Checkout Form Grid */}
          <form onSubmit={handleInitiatePayment} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left 2 Columns: Fast Address & Delhivery Speed Selection */}
            <div className="lg:col-span-2 space-y-6">

              {/* 1. Contact Information */}
              <div className="bg-white rounded-3xl border border-[#d2d2d7]/80 p-6 sm:p-7 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-[#d2d2d7]/50 pb-3">
                  <h2 className="text-xs font-bold text-[#1d1d1f] uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#1d1d1f] text-white flex items-center justify-center text-[10px] font-semibold">1</span>
                    <span>Contact Details</span>
                  </h2>
                  <span className="text-[11px] text-[#86868b] font-medium">SMS Courier Tracking &amp; PDF Invoice</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Customer Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-800 flex items-center justify-between">
                      <span>Customer Full Name <span className="text-rose-500">*</span></span>
                    </label>
                    <input
                      ref={fullNameRef}
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="Customer Full Name"
                      className="w-full h-12 sm:h-11 px-3.5 text-base sm:text-xs rounded-xl border border-[#d2d2d7] bg-white text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all font-medium"
                    />
                  </div>

                  {/* Mobile Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-800 flex items-center justify-between">
                      <span>Mobile Number <span className="text-rose-500">*</span></span>
                      <span className={`text-[10px] font-mono ${phone.length === 10 ? 'text-emerald-700 font-bold' : 'text-stone-400'}`}>
                        {phone.length}/10 digits
                      </span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-xs font-bold text-stone-900 flex items-center gap-1 border-r border-stone-200 pr-2 pointer-events-none select-none">
                        <span>🇮🇳</span>
                        <span>+91</span>
                      </span>
                      <input
                        ref={phoneRef}
                        type="tel"
                        inputMode="tel"
                        required
                        value={phone}
                        onChange={(e) => {
                          handlePhoneChange(e.target.value);
                          if (errorMessage) setErrorMessage(null);
                        }}
                        placeholder="10-digit mobile number"
                        className="w-full h-12 sm:h-11 pl-20 pr-3.5 text-base sm:text-xs rounded-xl border border-[#d2d2d7] bg-white text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all font-mono font-medium"
                      />
                    </div>
                  </div>

                  {/* Email ID */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-stone-800 flex items-center justify-between">
                      <span>Email Address <span className="text-rose-500">*</span></span>
                      <span className="text-[10px] text-stone-500 font-medium">To receive official GST PDF tax invoice</span>
                    </label>
                    <input
                      ref={emailRef}
                      type="email"
                      inputMode="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="Email address for tax invoice"
                      className="w-full h-12 sm:h-11 px-3.5 text-base sm:text-xs rounded-xl border border-[#d2d2d7] bg-white text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Delivery Destination */}
              <div className="bg-white rounded-3xl border border-[#d2d2d7]/80 p-6 sm:p-7 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-[#d2d2d7]/50 pb-3">
                  <h2 className="text-xs font-bold text-[#1d1d1f] uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#1d1d1f] text-white flex items-center justify-center text-[10px] font-semibold">2</span>
                    <span>Delivery Destination</span>
                  </h2>
                  <span className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-semibold">
                    All-India Insured Doorstep Delivery
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Country (Default: India) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#1d1d1f] flex items-center justify-between">
                      <span>Country / Territory</span>
                      <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Default: India
                      </span>
                    </label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full h-12 sm:h-11 px-3.5 text-base sm:text-xs rounded-xl border border-[#d2d2d7] bg-white text-[#1d1d1f] font-medium focus:outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all cursor-pointer"
                    >
                      <option value="India">India 🇮🇳 (National Insured Courier Delivery)</option>
                    </select>
                  </div>

                  {/* Flat / House No / Building / Apartment */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-800">
                      <span>Flat, House No., Building, Apartment <span className="text-rose-500">*</span></span>
                    </label>
                    <input
                      ref={flatBuildingRef}
                      type="text"
                      required
                      value={flatBuilding}
                      onChange={(e) => {
                        setFlatBuilding(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="Flat, House no., Building, Apartment"
                      className="w-full h-12 sm:h-11 px-3.5 text-base sm:text-xs rounded-xl border border-[#d2d2d7] bg-white text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all font-medium"
                    />
                  </div>

                  {/* Area / Street / Sector / Village */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-800">
                      <span>Area, Street, Sector, Road <span className="text-rose-500">*</span></span>
                    </label>
                    <input
                      ref={areaStreetRef}
                      type="text"
                      required
                      value={areaStreet}
                      onChange={(e) => {
                        setAreaStreet(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="Area, Street, Sector, Road"
                      className="w-full h-12 sm:h-11 px-3.5 text-base sm:text-xs rounded-xl border border-[#d2d2d7] bg-white text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all font-medium"
                    />
                  </div>

                  {/* Landmark */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-800 flex items-center justify-between">
                      <span>Landmark</span>
                      <span className="text-[10px] text-stone-400 font-normal">Optional</span>
                    </label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="Nearby landmark (optional)"
                      className="w-full h-12 sm:h-11 px-3.5 text-base sm:text-xs rounded-xl border border-[#d2d2d7] bg-white text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all font-medium"
                    />
                  </div>

                  {/* 3 Column Grid: PIN Code, Town/City, State */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* PIN Code */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-stone-800 flex items-center justify-between">
                        <span>PIN Code <span className="text-rose-500">*</span></span>
                        {postalCode.length === 6 && isValidIndianPin(postalCode) && (
                          <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Valid
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          ref={postalCodeRef}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          required
                          maxLength={6}
                          value={postalCode}
                          onChange={(e) => {
                            handlePincodeChange(e.target.value);
                            if (errorMessage) setErrorMessage(null);
                          }}
                          placeholder="6-digit PIN code"
                          className="w-full h-12 sm:h-11 px-3.5 pr-8 text-base sm:text-xs rounded-xl border border-[#d2d2d7] bg-white text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all font-mono font-bold"
                        />
                        {pinLoading && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0071e3]" />
                          </div>
                        )}
                      </div>
                      {pinAutoDetected ? (
                        <div className="text-[10px] text-emerald-800 font-semibold flex items-center justify-between pt-0.5">
                          <span className="truncate">✓ Auto: {pinAutoDetected}</span>
                          <button
                            type="button"
                            onClick={() => fetchPinDetails(postalCode)}
                            className="text-[9px] text-[#0071e3] hover:underline cursor-pointer shrink-0 ml-1 flex items-center gap-0.5"
                          >
                            <RefreshCw className="w-2.5 h-2.5" /> Re-check
                          </button>
                        </div>
                      ) : postalCode.length > 0 && postalCode.length < 6 ? (
                        <p className="text-[10px] text-[#86868b]">Enter 6 digits for courier calculation</p>
                      ) : pinError ? (
                        <p className="text-[10px] text-rose-600">{pinError}</p>
                      ) : null}

                      {district && (
                        <div className="mt-1 flex items-center flex-wrap gap-1.5 text-[10px]">
                          <span className="text-stone-500">District:</span>
                          <span className="text-stone-900 font-bold">{district}</span>
                          {districtVerified ? (
                            <span className="inline-flex items-center gap-0.5 text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full text-[9px]">
                              <Check className="w-2.5 h-2.5 text-emerald-600" /> Pincode Serviceable: YES
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-rose-700 font-bold bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded-full text-[9px]">
                              ✕ Pincode Serviceable: NO
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Town / City */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-stone-800 flex items-center justify-between">
                        <span>Town / City <span className="text-rose-500">*</span></span>
                        {availableTowns.length > 0 && (
                          <span className="text-[10px] text-stone-500">
                            {availableTowns.length} {availableTowns.length === 1 ? 'locality' : 'localities'}
                          </span>
                        )}
                      </label>
                      <input
                        ref={cityRef}
                        type="text"
                        required
                        value={city}
                        onChange={(e) => {
                          setCity(e.target.value);
                          setPinAutoDetected(`${e.target.value}${e.target.value && state ? ', ' : ''}${state}`);
                          if (errorMessage) setErrorMessage(null);
                        }}
                        placeholder="Town or City"
                        className="w-full h-12 sm:h-11 px-3.5 text-base sm:text-xs rounded-xl border border-[#d2d2d7] bg-white text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all font-medium"
                      />
                      {availableTowns.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5 max-h-16 overflow-y-auto">
                          {availableTowns.slice(0, 6).map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => {
                                setCity(t);
                                setPinAutoDetected(`${t}, ${state}`);
                              }}
                              className={`text-[9px] px-1.5 py-0.5 rounded-md transition-colors cursor-pointer border ${city === t
                                ? 'bg-[#0071e3] text-white border-[#0071e3] font-semibold'
                                : 'bg-[#f5f5f7] hover:bg-stone-100 text-[#1d1d1f] border-[#d2d2d7]'
                                }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* State: Dropdown containing all 28 States and 8 Union Territories */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-stone-800">
                        <span>State <span className="text-rose-500">*</span></span>
                      </label>
                      <select
                        required
                        value={state}
                        onChange={(e) => {
                          setState(e.target.value);
                          setPinAutoDetected(`${city}${city && e.target.value ? ', ' : ''}${e.target.value}`);
                        }}
                        className="w-full h-12 sm:h-11 px-3.5 text-base sm:text-xs rounded-xl border border-[#d2d2d7] bg-white text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all cursor-pointer font-medium"
                      >
                        <optgroup label="States (28)">
                          {INDIAN_STATES.filter((s) => s.type === 'STATE').map((s) => (
                            <option key={s.code} value={s.name}>
                              {s.name} ({s.code})
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Union Territories (8)">
                          {INDIAN_STATES.filter((s) => s.type === 'UT').map((s) => (
                            <option key={s.code} value={s.name}>
                              {s.name} ({s.code})
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                  </div>

                  {/* Live Airway Bill (AWB) Preview - ONLY shown when required contact and destination are complete */}
                  {isFormValid && (
                    <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/90 text-xs space-y-2 animate-in fade-in duration-300 mt-2">
                      <div className="flex items-center justify-between text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                        <span className="flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-[#0071e3]" />
                          Insured Airway Bill (AWB) Preview
                        </span>
                        <span className="text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          Insured Glass Safe
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <p className="text-[10px] text-stone-500 uppercase font-semibold">Consignee (Receiver)</p>
                          <p className="font-bold text-stone-900 text-xs">
                            {fullName}
                          </p>
                          <p className="text-stone-600 font-mono text-[11px]">
                            +91 {phone.slice(0, 5)} {phone.slice(5)}
                          </p>
                          <p className="text-stone-500 text-[10px] truncate">{email}</p>
                        </div>

                        <div>
                          <p className="text-[10px] text-stone-500 uppercase font-semibold">Destination Address</p>
                          <p className="text-stone-700 leading-relaxed text-[11px]">
                            {flatBuilding}, {areaStreet}
                            {landmark ? `, Near ${landmark}` : ''}
                            <br />
                            {city}, {state} - <span className="font-mono font-bold">{postalCode}</span>
                          </p>
                        </div>
                      </div>

                      {delhiveryRate && (
                        <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-[10px] text-stone-600">
                          <span>
                            Logistics Zone: <strong className="text-stone-950 font-bold">{delhiveryRate.zoneName}</strong>
                          </span>
                          <span className="font-mono font-bold text-stone-900">
                            {delhiveryRate.billableWeightGrams}g Consignment Weight
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Desktop Sidebar: Sticky Order Summary, Coupons & Razorpay Pay */}
            <div className="space-y-4">
              <div className="bg-white rounded-3xl border border-stone-200/90 p-6 space-y-4 shadow-sm lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto no-scrollbar overscroll-contain z-10">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                    Order Summary ({items.length} {items.length === 1 ? 'jar' : 'jars'})
                  </h3>
                  {showClearConfirm ? (
                    <div className="flex items-center gap-1.5 animate-in fade-in">
                      <span className="text-[11px] text-stone-500 font-medium">Empty bag?</span>
                      <button
                        type="button"
                        onClick={() => {
                          clearCart();
                          setShowClearConfirm(false);
                        }}
                        className="text-[11px] bg-rose-600 text-white px-2 py-0.5 rounded-full font-bold hover:bg-rose-700 cursor-pointer"
                      >
                        Yes, Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowClearConfirm(false)}
                        className="text-[11px] bg-stone-200 text-stone-700 px-2 py-0.5 rounded-full font-medium hover:bg-stone-300 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(true)}
                      className="text-[11px] text-rose-600 hover:text-rose-800 flex items-center gap-1 font-semibold hover:underline cursor-pointer transition-colors"
                      title="Empty entire bag"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear Bag</span>
                    </button>
                  )}
                </div>

                {/* Items List */}
                <div className="divide-y divide-stone-100">
                  {items.map((item) => (
                    <div key={item.productId} className="py-2.5 flex items-center justify-between text-xs gap-3">
                      <div className="pr-1 flex-1 min-w-0">
                        <p className="font-semibold text-stone-900 line-clamp-1">{item.productName}</p>
                        <p className="text-[10px] text-stone-500 font-mono">
                          {item.weight || (item.productName.includes('1kg') ? '1kg Solid Glass Jar' : item.productName.includes('250g') ? '250g Solid Glass Jar' : '500g Solid Glass Jar')}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 flex-nowrap">
                          <div className="inline-flex items-center flex-nowrap shrink-0 border border-stone-200 rounded-full bg-stone-50 shadow-2xs select-none h-6 px-0.5">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="w-5 h-5 flex items-center justify-center text-[#1d1d1f] hover:text-[#0071e3] hover:bg-stone-200/60 rounded-full transition-colors text-xs font-bold shrink-0 cursor-pointer"
                              title="Decrease"
                              aria-label="Decrease quantity"
                            >
                              -
                            </button>
                            <span className="min-w-[18px] text-center text-[11px] font-bold text-[#1d1d1f] font-mono shrink-0 select-none px-0.5">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="w-5 h-5 flex items-center justify-center text-[#1d1d1f] hover:text-[#0071e3] hover:bg-stone-200/60 rounded-full transition-colors text-xs font-bold shrink-0 cursor-pointer"
                              title="Increase"
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-[11px] text-stone-500 font-medium whitespace-nowrap shrink-0">
                            × {formatCurrency(item.price)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold text-stone-950 font-mono">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.productId)}
                          className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                          title="Remove item"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* DISCOUNT COUPON ENTRY BOX */}
                <div className="pt-3 border-t border-stone-100 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#1d1d1f] flex items-center gap-1.5">
                      <TicketPercent className="w-3.5 h-3.5 text-[#0071e3]" />
                      <span>Discount Coupon</span>
                    </label>
                    {appliedCoupon && (
                      <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                        Active
                      </span>
                    )}
                  </div>

                  {appliedCoupon ? (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{appliedCoupon.code}</span>
                          <span className="text-[11px] font-normal text-emerald-800">
                            (-{formatCurrency(appliedCoupon.discountAmount)})
                          </span>
                        </div>
                        {appliedCoupon.assignedToManagerName && (
                          <p className="text-[10px] text-emerald-700">
                            Assigned by Manager {appliedCoupon.assignedToManagerName}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-xs text-rose-600 hover:text-rose-800 p-1 rounded-full hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remove coupon"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          placeholder="e.g. VIKRAM15"
                          className="flex-1 h-9 px-3 text-xs uppercase font-mono font-bold rounded-xl border border-[#d2d2d7] bg-white text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                        />
                        <button
                          type="button"
                          disabled={couponLoading || !couponInput.trim()}
                          onClick={() => validateAndApplyCoupon()}
                          className="px-4 h-9 rounded-xl bg-[#1d1d1f] hover:bg-black text-white text-xs font-semibold cursor-pointer disabled:opacity-40 transition-all"
                        >
                          {couponLoading ? 'Checking...' : 'Apply'}
                        </button>
                      </div>

                      {/* Public Offers Accordion */}
                      <div className="pt-0.5">
                        <button
                          type="button"
                          onClick={fetchPublicOffers}
                          disabled={isLoadingOffers}
                          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#0071e3] hover:text-[#0077ed] transition-colors cursor-pointer py-0.5"
                        >
                          <RefreshCw className={`w-3 h-3 ${isLoadingOffers ? 'animate-spin' : ''}`} />
                          <span>
                            {showPublicOffers ? 'Refresh Available Offers' : 'View Available Offers'}
                          </span>
                        </button>

                        {showPublicOffers && (
                          <div className="mt-2 space-y-1.5 animate-in fade-in">
                            {publicOffers.length === 0 ? (
                              <p className="text-[11px] text-[#86868b] italic">
                                No public offers active right now. Enter your promo code above.
                              </p>
                            ) : (
                              publicOffers.map((offer) => (
                                <div
                                  key={offer.code}
                                  className="p-2.5 rounded-xl bg-[#f5f5f7] border border-[#d2d2d7] flex items-center justify-between text-xs transition-all hover:border-[#0071e3]"
                                >
                                  <div className="space-y-0.5 pr-2">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono font-bold text-[#1d1d1f] text-xs">
                                        {offer.code}
                                      </span>
                                      <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-[#0071e3]/10 text-[#0071e3]">
                                        {offer.discountType === 'PERCENTAGE'
                                          ? `${offer.value}% OFF`
                                          : `₹${offer.value / 100} OFF`}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-[#86868b] leading-snug">
                                      {offer.description}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCouponInput(offer.code);
                                      validateAndApplyCoupon(offer.code);
                                    }}
                                    className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-white hover:bg-stone-900 hover:text-white border border-stone-300 text-stone-900 transition-all cursor-pointer shrink-0 shadow-2xs"
                                  >
                                    Apply
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {couponError && (
                    <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{couponError}</span>
                    </p>
                  )}
                  {couponSuccessMsg && !couponError && (
                    <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                      <Sparkles className="w-3 h-3 shrink-0" />
                      <span>{couponSuccessMsg}</span>
                    </p>
                  )}
                </div>

                {/* Calculation Details & Statutory Breakdown */}
                <div className="pt-2 border-t border-stone-100 space-y-2.5 text-xs text-stone-600">
                  {/* 1. Items Subtotal */}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5 font-semibold text-stone-900">
                        <span>Items Total</span>
                        {hasProductGst && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#f5f5f7] border border-[#d2d2d7] text-[#1d1d1f] font-semibold font-mono">
                            {productGstRate}% GST
                          </span>
                        )}
                      </div>
                      {hasProductGst && (
                        <p className="text-[10px] text-stone-400 mt-0.5">
                          Base: {formatCurrency(productTaxable)} + {productGstRate}% GST: {formatCurrency(productGst)}
                        </p>
                      )}
                    </div>
                    <span className="font-bold text-stone-950 font-mono">{formatCurrency(subtotal)}</span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between text-emerald-800 font-bold pl-2 border-l-2 border-emerald-500 text-[11px]">
                      <span>Coupon Discount ({appliedCoupon.code})</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}

                  {/* 2. Single Bundled Delivery Line Item */}
                  <div className="flex justify-between items-start gap-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-xs text-stone-900">
                          Shipping &amp; Delivery (Insured Express)
                        </span>
                        {hasDeliveryGst && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-stone-100 text-stone-700 font-bold font-mono whitespace-nowrap border border-stone-200">
                            {deliveryGstRate}% GST
                          </span>
                        )}
                        {delhiveryRate && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-800 font-bold whitespace-nowrap border border-emerald-200">
                            Insured Solid Glass
                          </span>
                        )}
                      </div>
                      {delhiveryRate ? (
                        <div className="mt-0.5 space-y-0.5">
                          <p className="text-[10px] text-[#1d1d1f] font-medium leading-tight">
                            Estimated Delivery: {delhiveryRate.estimatedDays || 2}-3 business days
                          </p>
                          {hasDeliveryGst ? (
                            <p className="text-[10px] text-[#86868b] font-mono">
                              Base: {formatCurrency(bundledShippingBase)} + {deliveryGstRate}% GST: {formatCurrency(bundledShippingGst)}
                            </p>
                          ) : (
                            <p className="text-[10px] text-[#86868b] font-mono">
                              Courier Freight: {formatCurrency(bundledShippingTotal)}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-[10px] text-[#86868b] mt-0.5 leading-relaxed">
                          {isCalculatingFreight
                            ? 'Calculating live express freight...'
                            : isFreeShipping
                              ? 'Free Insured Delivery Applied'
                              : postalCode.length === 6 && isValidIndianPin(postalCode)
                                ? (hasDeliveryGst
                                    ? `Base: ${formatCurrency(bundledShippingBase)} + ${deliveryGstRate}% GST: ${formatCurrency(bundledShippingGst)}`
                                    : `Standard Freight: ${formatCurrency(bundledShippingTotal)}`)
                                : 'Enter 6-digit PIN code to calculate exact delivery charges'}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right pt-0.5">
                      {isFreeShipping ? (
                        <span className="text-emerald-700 font-bold text-xs whitespace-nowrap">FREE</span>
                      ) : isCalculatingFreight ? (
                        <span className="text-xs text-[#0071e3] font-semibold flex items-center gap-1 whitespace-nowrap">
                          <Loader2 className="w-3 h-3 animate-spin" /> Calculating...
                        </span>
                      ) : delhiveryRate || (postalCode.length === 6 && isValidIndianPin(postalCode) && bundledShippingTotal > 0) ? (
                        <div>
                          <span className="font-bold text-xs text-stone-950 font-mono whitespace-nowrap block">
                            {formatCurrency(bundledShippingTotal)}
                          </span>
                          {hasDeliveryGst && (
                            <span className="text-[9px] text-stone-400 font-normal whitespace-nowrap block">
                              (incl. {deliveryGstRate}% GST)
                            </span>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={scrollToPinInput}
                          className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-[#0071e3]/10 hover:bg-[#0071e3]/20 border border-[#0071e3]/30 text-[#0071e3] font-bold whitespace-nowrap cursor-pointer transition-all hover:scale-105 active:scale-95"
                          title="Click to enter your 6-digit delivery PIN code"
                        >
                          <span>Enter PIN</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 3. Platform Service Fee (Dynamic & Configurable) */}
                  {showPlatformFee && (
                    <div className="flex justify-between items-start gap-2.5 pt-2 border-t border-stone-100">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-xs text-stone-900">
                            Platform Service Fee
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-stone-100 text-stone-700 font-bold font-mono whitespace-nowrap border border-stone-200">
                            SAC 9971
                          </span>
                          {platformFeeGst > 0 && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-stone-100 text-stone-700 font-bold font-mono whitespace-nowrap border border-stone-200">
                              18% GST
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#86868b] mt-0.5">
                          {platformFeeGst > 0
                            ? `Base: ${formatCurrency(platformFeeBase)} + 18% GST: ${formatCurrency(platformFeeGst)}`
                            : `Base Service Fee: ${formatCurrency(platformFeeBase)}`}
                        </p>
                      </div>
                      <div className="shrink-0 text-right pt-0.5">
                        <span className="font-bold text-xs text-stone-950 font-mono whitespace-nowrap block">
                          {formatCurrency(platformFeeTotal)}
                        </span>
                        {platformFeeGst > 0 && (
                          <span className="text-[9px] text-stone-400 font-normal whitespace-nowrap block">
                            (incl. 18% GST)
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Statutory Tax Summary (Expandable Breakdown) */}
                  {hasTaxBreakdown && (
                    <div className="pt-2 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={() => setShowGstBreakdown(!showGstBreakdown)}
                        className="w-full flex items-center justify-between text-left text-[11px] font-semibold text-[#1d1d1f] hover:text-[#0071e3] transition-colors cursor-pointer py-0.5"
                      >
                        <span className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          <span>Statutory GST Breakdown ({formatCurrency(totalTax)} total)</span>
                        </span>
                        {showGstBreakdown ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {showGstBreakdown && (
                        <div className="mt-2 p-3 rounded-xl bg-stone-50 border border-stone-200 text-[10px] space-y-1.5 animate-in fade-in">
                          {hasProductGst && (
                            <div className="flex justify-between text-stone-600">
                              <span>Raw Honey GST ({productGstRate}% on {formatCurrency(productTaxable)}):</span>
                              <span className="font-mono font-semibold text-stone-900">{formatCurrency(productGst)}</span>
                            </div>
                          )}
                          {hasDeliveryGst && (
                            <div className="flex justify-between text-stone-600">
                              <span>Delivery &amp; Logistics GST ({deliveryGstRate}% on {formatCurrency(bundledShippingBase)}):</span>
                              <span className="font-mono font-semibold text-stone-900">{formatCurrency(bundledShippingGst)}</span>
                            </div>
                          )}
                          {showPlatformFee && platformFeeGst > 0 && (
                            <div className="flex justify-between text-stone-600">
                              <span>Platform Tech Fee GST (18% on {formatCurrency(platformFeeBase)}):</span>
                              <span className="font-mono font-semibold text-stone-900">{formatCurrency(platformFeeGst)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-bold text-stone-900 pt-1 border-t border-stone-200">
                            <span>Total Combined GST (CGST + SGST):</span>
                            <span className="font-mono text-emerald-800">{formatCurrency(totalTax)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between items-baseline text-base font-bold text-[#1d1d1f] pt-3 border-t border-[#d2d2d7]">
                    <div>
                      <span className="font-bold text-base text-[#1d1d1f]">Total Amount</span>
                      <p className="text-[10px] font-normal text-[#86868b]">
                        {isFreeShipping
                          ? 'All taxes & free delivery included'
                          : postalCode.length === 6 && isValidIndianPin(postalCode)
                            ? 'All taxes & express delivery included'
                            : hasProductGst
                              ? `Includes ${productGstRate}% GST • Delivery calculated upon PIN entry`
                              : 'Delivery calculated upon PIN entry'}
                      </p>
                    </div>
                    <span className="text-2xl font-bold text-[#1d1d1f] font-mono">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>

                {/* Desktop Pay Button */}
                <div className="hidden lg:block pt-2 space-y-2.5">
                  <button
                    type="button"
                    onClick={(e) => handleInitiatePayment(e, false)}
                    disabled={isProcessing}
                    className="w-full py-4 px-6 rounded-full text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all cursor-pointer bg-[#0071e3] hover:bg-[#0077ed] active:bg-[#0062c4] disabled:opacity-50 disabled:cursor-wait"
                  >
                    <Lock className="w-4 h-4 text-white/80" />
                    <span>
                      {isProcessing
                        ? processingStep || 'Processing...'
                        : `Pay ${formatCurrency(totalAmount)} with Razorpay`}
                    </span>
                  </button>

                  {missingStep ? (
                    <button
                      type="button"
                      onClick={missingStep.action}
                      className="w-full text-[11px] text-amber-800 bg-amber-50/90 hover:bg-amber-100 border border-amber-200/80 px-3 py-2 rounded-xl text-center font-semibold cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <span>Next: {missingStep.label}</span>
                      <ArrowRight className="w-3 h-3 shrink-0" />
                    </button>
                  ) : (
                    <div className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-center font-semibold flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>All shipping details verified • Ready for instant payment</span>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#86868b] text-center">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>100% Prepaid • 256-Bit SSL Encrypted Razorpay</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Mobile Bottom Bar (Apple Pay Style) */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white/95 backdrop-blur-md border-t border-[#d2d2d7] shadow-xl z-30">
              <div className="max-w-md mx-auto flex items-center justify-between gap-3">
                <div className="shrink-0">
                  <span className="text-[10px] text-[#86868b] uppercase tracking-wider block font-semibold">
                    Grand Total
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-[#1d1d1f] font-mono">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                  <span className="text-[9px] text-[#86868b] block font-normal">
                    {postalCode.length === 6 && isValidIndianPin(postalCode)
                      ? 'Taxes & delivery incl.'
                      : 'GST incl. • PIN for delivery'}
                  </span>
                </div>

                <div className="flex flex-col items-end gap-1 flex-1">
                  <button
                    type="button"
                    onClick={(e) => handleInitiatePayment(e, false)}
                    disabled={isProcessing}
                    className="w-full max-w-[260px] py-3.5 px-5 rounded-full text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer bg-[#0071e3] hover:bg-[#0077ed] active:bg-[#0062c4] disabled:opacity-50 disabled:cursor-wait"
                  >
                    <Lock className="w-3.5 h-3.5 shrink-0 text-white/80" />
                    <span>
                      {isProcessing
                        ? processingStep || 'Processing...'
                        : `Pay ${formatCurrency(totalAmount)}`}
                    </span>
                  </button>
                  {missingStep ? (
                    <button
                      type="button"
                      onClick={missingStep.action}
                      className="text-[10px] text-amber-800 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <span>Next: {missingStep.label}</span>
                      <ArrowRight className="w-2.5 h-2.5 shrink-0" />
                    </button>
                  ) : (
                    <span className="text-[9px] text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5 shrink-0 text-emerald-600" />
                      <span>Details verified</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

          </form>
        </div>
      </div>
    </StoreProvider>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-[#f5f5f7] min-h-screen flex items-center justify-center p-8">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#1d1d1f] font-medium">Preparing Secure Checkout...</p>
          </div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
