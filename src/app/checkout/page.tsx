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

  // Billable package weight based on Delhivery slabs (300g -> 500g, 750g -> 1000g, 1050g -> 1500g)
  const consignmentWeightGrams = items.reduce((acc, item) => {
    const name = (item.productName || (item as any).name || '').toLowerCase();
    const id = (item.productId || '').toLowerCase();
    if (name.includes('1050') || id.includes('1050')) return acc + 1500 * item.quantity;
    if (name.includes('750') || id.includes('750')) return acc + 1000 * item.quantity;
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

  // Automatically purge cart on completed order
  useEffect(() => {
    if (completedOrder) {
      clearCart();
      try {
        localStorage.removeItem('sg_cart');
        localStorage.setItem('sg_cart', '[]');
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('cart-cleared'));
      } catch {}
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
      } catch {}
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
      } catch {}
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

  // Dynamic calculations with statutory GST and manager-controlled fees
  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const feeBreakdown = calculateOrderFees(
    subtotal,
    discountAmount,
    feeSettings,
    delhiveryRate
      ? delhiveryRate.subtotalPaise
      : postalCode.length === 6 && isValidIndianPin(postalCode)
      ? undefined
      : 0,
    delhiveryRate ? delhiveryRate.totalPaise : undefined
  );

  const {
    discountedSubtotal,
    shippingBase,
    shippingGst,
    shippingTotal,
    isFreeShipping,
    bundledShippingBase,
    bundledShippingGst,
    bundledShippingTotal,
    productTaxable,
    productGst,
    totalTax,
    grandTotal: totalAmount,
  } = feeBreakdown;

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
          subtotal,
          customerEmail: email,
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
    } catch {}
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
      return;
    }

    if (phone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number for courier delivery updates.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address to receive your official GST Tax Invoice.');
      return;
    }

    if (!isValidIndianPin(postalCode)) {
      setErrorMessage('Please enter a valid 6-digit Indian PIN Code to calculate Delhivery courier rates.');
      return;
    }

    if (!flatBuilding.trim() || !areaStreet.trim()) {
      setErrorMessage('Please provide your complete street address (Flat/Building & Area/Road).');
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
        }).catch(() => {});
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
        <div className="bg-[#FAF8F5] min-h-screen py-24 px-4 flex items-center justify-center text-stone-900">
          <div className="max-w-md w-full bg-white rounded-3xl border border-stone-200/90 p-8 sm:p-10 text-center space-y-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center mx-auto text-amber-700">
              <ShoppingBag className="w-8 h-8 stroke-[1.75]" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-serif font-bold text-stone-950">Your Bag is Empty</h1>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-xs mx-auto">
                Explore our cold-extracted wild forest harvests bottled exclusively in heavy solid glass jars.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-semibold bg-amber-600 hover:bg-amber-700 active:scale-95 text-white shadow-md shadow-amber-600/20 transition-all cursor-pointer"
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
        <div className="bg-[#FAF8F5] min-h-screen py-16 px-4 sm:px-6 text-stone-900">
          <div className="max-w-xl mx-auto text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9 stroke-[2]" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-emerald-100/80 text-emerald-900 border border-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                Payment Verified • Delhivery Insured Booking
              </span>
              <h1 className="text-3xl font-serif font-bold tracking-tight text-stone-950">
                Thank You for Your Order.
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
                Your solid glass jars are being cushioned in custom shock-absorbing kraft packaging at our Western Ghats dispatch hub.
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-7 text-left space-y-3.5 shadow-sm">
              <div className="flex justify-between items-center pb-3 border-b border-stone-100 text-xs">
                <span className="text-stone-500">Order Number</span>
                <span className="font-mono font-bold text-stone-900 text-sm">
                  {completedOrder.orderNumber}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-stone-100 text-xs">
                <span className="text-stone-500">Razorpay Payment ID</span>
                <span className="font-mono text-stone-600 text-[11px]">
                  {completedOrder.paymentId}
                </span>
              </div>
              {completedOrder.couponCode && (
                <div className="flex justify-between items-center pb-3 border-b border-stone-100 text-xs">
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    Coupon Applied ({completedOrder.couponCode})
                  </span>
                  <span className="font-semibold text-emerald-700">
                    -{formatCurrency(completedOrder.discountAmount || 0)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pb-3 border-b border-stone-100 text-xs">
                <span className="text-stone-500">Dispatched Via</span>
                <span className="font-semibold text-amber-800">
                  {shippingMode === 'Express' ? 'Delhivery One Air Express' : 'Delhivery One Surface'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs pt-1">
                <span className="text-stone-600 font-medium">Total Paid</span>
                <span className="font-bold text-stone-950 text-base sm:text-lg">
                  {formatCurrency(completedOrder.amount)}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href={`/invoice/${completedOrder.orderNumber}`}
                target="_blank"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-amber-400" />
                <span>View Official Tax Invoice (PDF)</span>
              </Link>
              <Link
                href="/account"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <span>Track in My Orders</span>
              </Link>
              <Link
                href="/shop"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white border border-stone-300 text-stone-800 hover:bg-stone-50 font-medium text-xs transition-all cursor-pointer"
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
      <div className="bg-[#FAF8F5] min-h-screen pb-36 lg:pb-24 text-stone-900 selection:bg-amber-200">
        
        {/* Top Progress & Guarantee Header */}
        <div className="border-b border-stone-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
            <Link
              href="/shop"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700 hover:text-amber-700 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Shop</span>
            </Link>

            {/* Stepper Breadcrumbs */}
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>1. Bag</span>
              </div>
              <span className="text-stone-300">/</span>
              <div className="flex items-center gap-1.5 text-amber-900 font-bold bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                <MapPin className="w-3.5 h-3.5 text-amber-700" />
                <span>2. Address &amp; Delhivery Speed</span>
              </div>
              <span className="text-stone-300">/</span>
              <div className="flex items-center gap-1.5 text-stone-400">
                <Lock className="w-3.5 h-3.5" />
                <span>3. 100% Prepaid Payment</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                100% Solid Glass Guarantee
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

          {/* Heading and Quality Pillars */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/70 border border-amber-200/80 px-2.5 py-0.5 rounded-full">
                Western Ghats Direct Dispatch
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 bg-stone-100 border border-stone-200 px-2.5 py-0.5 rounded-full">
                Delhivery One Automated Courier
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-950 tracking-tight">
              Checkout &amp; Shipment Speed.
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 max-w-2xl leading-relaxed">
              Real-time Delhivery One transit speeds and rates calculated based on your 6-digit delivery PIN code.
              Every jar is secured with tamper-proof NMR seal and shock-absorbing kraft protection.
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
          <div className="lg:hidden bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setIsOrderSummaryOpen(!isOrderSummaryOpen)}
              className="w-full p-4 flex items-center justify-between text-left text-xs font-medium cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-amber-600" />
                <span className="font-semibold text-stone-900">
                  Order Summary ({totalQuantity} {totalQuantity === 1 ? 'jar' : 'jars'})
                </span>
                <span className="text-stone-300">•</span>
                <span className="font-bold text-amber-900">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
              <div className="flex items-center gap-1 text-amber-700 font-semibold text-xs">
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
                  <button
                    type="button"
                    onClick={() => clearCart()}
                    className="text-[10px] text-rose-600 hover:text-rose-800 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Clear Bag
                  </button>
                </div>
                <div className="divide-y divide-stone-100 max-h-56 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.productId} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-stone-900 line-clamp-1">{item.productName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center border border-stone-200 rounded-full bg-white shadow-2xs">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="px-2 py-0.5 text-stone-700 hover:text-amber-700 font-bold"
                            >
                              -
                            </button>
                            <span className="px-2 text-[11px] font-bold text-stone-900">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="px-2 py-0.5 text-stone-700 hover:text-amber-700 font-bold"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-[11px] text-stone-500 font-medium">× {formatCurrency(item.price)}</span>
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
              <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-7 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center text-[10px] font-bold">1</span>
                    <span>Contact Details</span>
                  </h2>
                  <span className="text-[11px] text-stone-500 font-medium">SMS Courier Tracking &amp; PDF Invoice</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Customer Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-800 flex items-center justify-between">
                      <span>Customer Full Name <span className="text-rose-500">*</span></span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Vikramaditya Sharma"
                      className="w-full h-11 px-3.5 text-xs rounded-xl border border-stone-200 bg-stone-50/60 text-stone-900 focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
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
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        placeholder="98200 00000"
                        className="w-full h-11 pl-20 pr-3.5 text-xs rounded-xl border border-stone-200 bg-stone-50/60 text-stone-900 focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 transition-all font-mono font-medium"
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
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vikram@example.com"
                      className="w-full h-11 px-3.5 text-xs rounded-xl border border-stone-200 bg-stone-50/60 text-stone-900 focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Delivery Destination */}
              <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-7 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center text-[10px] font-bold">2</span>
                    <span>Delivery Destination</span>
                  </h2>
                  <span className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-semibold">
                    All-India Insured Doorstep Delivery
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Country (Default: India) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-800 flex items-center justify-between">
                      <span>Country / Territory</span>
                      <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Default: India
                      </span>
                    </label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full h-11 px-3.5 text-xs rounded-xl border border-stone-200 bg-stone-50/80 text-stone-900 font-medium focus:outline-none focus:bg-white focus:border-amber-600 transition-all cursor-pointer"
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
                      type="text"
                      required
                      value={flatBuilding}
                      onChange={(e) => setFlatBuilding(e.target.value)}
                      placeholder="e.g. Flat 402, 4th Floor, Oberoi Splendor"
                      className="w-full h-11 px-3.5 text-xs rounded-xl border border-stone-200 bg-stone-50/60 text-stone-900 focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
                    />
                  </div>

                  {/* Area / Street / Sector / Village */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-800">
                      <span>Area, Street, Sector, Road <span className="text-rose-500">*</span></span>
                    </label>
                    <input
                      type="text"
                      required
                      value={areaStreet}
                      onChange={(e) => setAreaStreet(e.target.value)}
                      placeholder="e.g. JVLR Road, Andheri East"
                      className="w-full h-11 px-3.5 text-xs rounded-xl border border-stone-200 bg-stone-50/60 text-stone-900 focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
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
                      placeholder="e.g. Near Seepz Main Gate / Opposite High Point Restaurant"
                      className="w-full h-11 px-3.5 text-xs rounded-xl border border-stone-200 bg-stone-50/60 text-stone-900 focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
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
                          type="text"
                          required
                          maxLength={6}
                          value={postalCode}
                          onChange={(e) => handlePincodeChange(e.target.value)}
                          placeholder="e.g. 400093"
                          className="w-full h-11 px-3.5 pr-8 text-xs rounded-xl border border-stone-200 bg-stone-50/60 text-stone-900 focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 transition-all font-mono font-bold"
                        />
                        {pinLoading && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                          </div>
                        )}
                      </div>
                      {pinAutoDetected ? (
                        <div className="text-[10px] text-emerald-800 font-semibold flex items-center justify-between pt-0.5">
                          <span className="truncate">✓ Auto: {pinAutoDetected}</span>
                          <button
                            type="button"
                            onClick={() => fetchPinDetails(postalCode)}
                            className="text-[9px] text-amber-700 hover:underline cursor-pointer shrink-0 ml-1 flex items-center gap-0.5"
                          >
                            <RefreshCw className="w-2.5 h-2.5" /> Re-check
                          </button>
                        </div>
                      ) : postalCode.length > 0 && postalCode.length < 6 ? (
                        <p className="text-[10px] text-amber-700">Enter 6 digits for courier calculation</p>
                      ) : pinError ? (
                        <p className="text-[10px] text-amber-600">{pinError}</p>
                      ) : null}

                      {district && (
                        <div className="mt-1 flex items-center flex-wrap gap-1.5 text-[10px]">
                          <span className="text-stone-500">District:</span>
                          <span className="text-stone-900 font-bold">{district}</span>
                          {districtVerified ? (
                            <span className="inline-flex items-center gap-0.5 text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full text-[9px]">
                              <Check className="w-2.5 h-2.5 text-emerald-600" /> Verified by Delhivery: YES
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-rose-700 font-bold bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded-full text-[9px]">
                              ✕ Verified by Delhivery: NO
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
                        type="text"
                        required
                        value={city}
                        onChange={(e) => {
                          setCity(e.target.value);
                          setPinAutoDetected(`${e.target.value}${e.target.value && state ? ', ' : ''}${state}`);
                        }}
                        placeholder="Town or City"
                        className="w-full h-11 px-3.5 text-xs rounded-xl border border-stone-200 bg-stone-50/60 text-stone-900 focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
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
                              className={`text-[9px] px-1.5 py-0.5 rounded-md transition-colors cursor-pointer border ${
                                city === t
                                  ? 'bg-amber-600 text-white border-amber-600 font-semibold'
                                  : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
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
                        className="w-full h-11 px-3.5 text-xs rounded-xl border border-stone-200 bg-stone-50/60 text-stone-900 focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 transition-all cursor-pointer font-medium"
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
                </div>
              </div>

              {/* 3. SELECT SHIPMENT SPEED (DELHIVERY ONE) — DEPENDENT ON PINCODE */}
              <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-7 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                  <div>
                    <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center text-[10px] font-bold">3</span>
                      <span>Select Shipment Speed (Delhivery One)</span>
                    </h2>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Transit speeds &amp; live rates depend on your 6-digit delivery PIN code
                    </p>
                  </div>

                  {postalCode.length === 6 && isValidIndianPin(postalCode) && (
                    <div className="flex items-center gap-1.5 self-start sm:self-auto">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                        <Truck className="w-3 h-3 text-amber-600" />
                        PIN: {postalCode}
                      </span>
                      {speedQuotes.express?.available ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Air &amp; Surface Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-800 border border-stone-200">
                          Surface Mode Enabled
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* PIN Prompt Guidance (When PIN not yet entered) */}
                {(!postalCode || postalCode.length < 6 || !isValidIndianPin(postalCode)) ? (
                  <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/50 p-5 text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-2xs">
                      <MapPin className="w-5 h-5 text-amber-700" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                        Enter 6-Digit Delivery PIN to Compare Delhivery Speeds
                      </h3>
                      <p className="text-xs text-amber-900/80 max-w-md mx-auto leading-relaxed">
                        Delhivery One Surface (Road Logistics) and Air Express (Priority Flight) live rates, transit timelines, and delivery dates will unlock automatically for your destination zone.
                      </p>
                    </div>

                    {/* Teaser Preview Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left opacity-75">
                      <div className="p-3.5 rounded-xl border border-stone-200 bg-white">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-xs text-stone-800">
                            <Truck className="w-4 h-4 text-amber-700" />
                            <span>Surface Standard</span>
                          </div>
                          <span className="text-[9px] bg-stone-100 text-stone-600 font-semibold px-2 py-0.5 rounded-full">
                            3-5 Days
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-1">Ground freight for solid glass jars</p>
                        <span className="text-[10px] text-amber-700 font-semibold block mt-2">Enter PIN to view rate</span>
                      </div>

                      <div className="p-3.5 rounded-xl border border-stone-200 bg-white">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-xs text-stone-800">
                            <Plane className="w-4 h-4 text-emerald-700" />
                            <span>Air Express Priority</span>
                          </div>
                          <span className="text-[9px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                            1-2 Days
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-1">Fastest door-to-door domestic air transit</p>
                        <span className="text-[10px] text-amber-700 font-semibold block mt-2">Enter PIN to view rate</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Interactive Delhivery One Speed Option Cards */
                  <div className="space-y-3">
                    {isCalculatingFreight && (
                      <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 font-medium animate-pulse">
                        <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
                        <span>Querying Delhivery One rate calculation API for PIN {postalCode}...</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      
                      {/* 1. Surface Standard Card */}
                      <button
                        type="button"
                        onClick={() => handleSelectSpeedMode('Surface')}
                        className={`p-4 rounded-2xl text-left transition-all border-2 relative flex flex-col justify-between cursor-pointer ${
                          shippingMode === 'Surface'
                            ? 'bg-amber-50/40 border-amber-600 ring-2 ring-amber-500/20 shadow-sm'
                            : 'bg-white hover:bg-stone-50 border-stone-200'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                                shippingMode === 'Surface' ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-700'
                              }`}>
                                <Truck className="w-4 h-4" />
                              </div>
                              <div>
                                <h3 className="text-xs font-bold text-stone-950">Surface Standard</h3>
                                <p className="text-[10px] text-stone-500">Delhivery Ground Road Logistics</p>
                              </div>
                            </div>

                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              shippingMode === 'Surface'
                                ? 'border-amber-600 bg-amber-600 text-white'
                                : 'border-stone-300 bg-white'
                            }`}>
                              {shippingMode === 'Surface' && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </div>

                          <div className="space-y-1 pt-1">
                            <div className="flex items-baseline justify-between">
                              <span className="text-[11px] font-semibold text-stone-700">Estimated Delivery:</span>
                              <span className="text-xs font-bold text-stone-900 font-mono">
                                {speedQuotes.surface?.estimatedDeliveryDate || '3-5 Business Days'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-stone-500">Transit Speed:</span>
                              <span className="font-semibold text-stone-800">
                                {speedQuotes.surface?.estimatedDays || 3}-5 business days
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <Shield className="w-3 h-3 text-emerald-600" />
                            Insured Glass Transit
                          </span>
                          <span className="text-sm font-bold text-stone-950 font-mono">
                            {speedQuotes.surface
                              ? formatCurrency(speedQuotes.surface.bundledDeliveryTotal)
                              : isCalculatingFreight
                              ? '...'
                              : formatCurrency(bundledShippingTotal)}
                          </span>
                        </div>
                      </button>

                      {/* 2. Air Express Priority Card */}
                      <button
                        type="button"
                        disabled={speedQuotes.express !== null && !speedQuotes.express.available}
                        onClick={() => handleSelectSpeedMode('Express')}
                        className={`p-4 rounded-2xl text-left transition-all border-2 relative flex flex-col justify-between ${
                          speedQuotes.express && !speedQuotes.express.available
                            ? 'bg-stone-50 border-stone-200 opacity-60 cursor-not-allowed'
                            : shippingMode === 'Express'
                            ? 'bg-amber-50/40 border-amber-600 ring-2 ring-amber-500/20 shadow-sm cursor-pointer'
                            : 'bg-white hover:bg-stone-50 border-stone-200 cursor-pointer'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                                shippingMode === 'Express' ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-700'
                              }`}>
                                <Plane className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <h3 className="text-xs font-bold text-stone-950">Air Express Priority</h3>
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                    ⚡ Fastest
                                  </span>
                                </div>
                                <p className="text-[10px] text-stone-500">Delhivery Priority Aviation Freight</p>
                              </div>
                            </div>

                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              shippingMode === 'Express'
                                ? 'border-amber-600 bg-amber-600 text-white'
                                : 'border-stone-300 bg-white'
                            }`}>
                              {shippingMode === 'Express' && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </div>

                          <div className="space-y-1 pt-1">
                            <div className="flex items-baseline justify-between">
                              <span className="text-[11px] font-semibold text-stone-700">Estimated Delivery:</span>
                              <span className="text-xs font-bold text-emerald-800 font-mono">
                                {speedQuotes.express?.estimatedDeliveryDate || '1-2 Business Days'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-stone-500">Transit Speed:</span>
                              <span className="font-semibold text-emerald-800">
                                {speedQuotes.express?.estimatedDays || 1}-2 business days
                              </span>
                            </div>
                          </div>
                        </div>

                        {speedQuotes.express && !speedQuotes.express.available ? (
                          <div className="pt-2 mt-2 border-t border-stone-100">
                            <p className="text-[10px] text-amber-800 font-medium bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                              {speedQuotes.express.restrictionReason || `Air transport restricted for liquid glass consignments to PIN ${postalCode}. Surface transit is active.`}
                            </p>
                          </div>
                        ) : (
                          <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100/70 border border-amber-200 px-2 py-0.5 rounded-full">
                              <Zap className="w-3 h-3 text-amber-700" />
                              Priority Dispatch
                            </span>
                            <span className="text-sm font-bold text-stone-950 font-mono">
                              {speedQuotes.express
                                ? formatCurrency(speedQuotes.express.bundledDeliveryTotal)
                                : isCalculatingFreight
                                ? '...'
                                : formatCurrency(bundledShippingTotal)}
                            </span>
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Live Airway Bill (AWB) & Shipping Destination Confirmation */}
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/90 text-xs space-y-2">
                  <div className="flex items-center justify-between text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-amber-700" />
                      Delhivery One Airway Bill (AWB) Preview
                    </span>
                    <span className="text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Insured Glass Safe
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <p className="text-[10px] text-stone-500 uppercase font-semibold">Consignee (Receiver)</p>
                      <p className="font-bold text-stone-900 text-xs">
                        {fullName || 'Vikramaditya Sharma'}
                      </p>
                      <p className="text-stone-600 font-mono text-[11px]">
                        {phone.length === 10 ? `+91 ${phone.slice(0, 5)} ${phone.slice(5)}` : '+91 98200 00000'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] text-stone-500 uppercase font-semibold">Destination Address</p>
                      <p className="text-stone-700 leading-relaxed text-[11px]">
                        {flatBuilding || 'Flat / House No.'}, {areaStreet || 'Road / Street'}
                        {landmark ? `, Near ${landmark}` : ''}
                        <br />
                        {city || 'Town/City'}, {state} - <span className="font-mono font-bold">{postalCode || '400093'}</span>
                      </p>
                    </div>
                  </div>

                  {delhiveryRate && (
                    <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-[10px] text-stone-600">
                      <span>
                        Courier: <strong className="text-stone-950 font-bold">{delhiveryRate.carrier}</strong> ({delhiveryRate.zoneName})
                      </span>
                      <span className="font-mono font-bold text-stone-900">
                        {delhiveryRate.billableWeightGrams}g Consignment Weight
                      </span>
                    </div>
                  )}
                </div>

                {/* 4. Payment Method: Strictly 100% Prepaid */}
                <div className="space-y-2 pt-2 border-t border-stone-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-amber-700" />
                      <span>Payment Method</span>
                    </label>
                    <span className="text-[10px] text-emerald-900 bg-emerald-100/70 border border-emerald-300 px-2.5 py-0.5 rounded-full font-bold">
                      100% Prepaid Online
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl border-2 border-amber-600/60 bg-amber-50/30 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-950">
                          Instant Online Payment (Razorpay Encrypted)
                        </span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                          ✓ 256-Bit SSL
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600 leading-relaxed">
                        Instant checkout via UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards &amp; NetBanking.
                        No Cash on Delivery (COD) to safeguard tamper-evident sealed glass consignments.
                      </p>
                      <div className="flex items-center gap-2 pt-1 flex-wrap text-[10px] font-semibold text-stone-500">
                        <span className="bg-white border border-stone-200 px-2 py-0.5 rounded-md">Google Pay</span>
                        <span className="bg-white border border-stone-200 px-2 py-0.5 rounded-md">PhonePe</span>
                        <span className="bg-white border border-stone-200 px-2 py-0.5 rounded-md">Paytm</span>
                        <span className="bg-white border border-stone-200 px-2 py-0.5 rounded-md">Visa / Mastercard / RuPay</span>
                      </div>
                    </div>
                    <div className="w-5 h-5 rounded-full border-2 border-amber-600 bg-amber-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Desktop Sidebar: Sticky Order Summary, Coupons & Razorpay Pay */}
            <div className="space-y-4">
              <div className="bg-white rounded-3xl border border-stone-200/90 p-6 space-y-4 shadow-sm lg:sticky lg:top-20">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                    Order Summary ({items.length} {items.length === 1 ? 'jar' : 'jars'})
                  </h3>
                  <button
                    type="button"
                    onClick={() => clearCart()}
                    className="text-[11px] text-rose-600 hover:text-rose-800 flex items-center gap-1 font-semibold hover:underline cursor-pointer"
                    title="Empty entire bag"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear Bag</span>
                  </button>
                </div>

                {/* Items List */}
                <div className="divide-y divide-stone-100 max-h-56 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.productId} className="py-2.5 flex items-center justify-between text-xs gap-3">
                      <div className="pr-1 flex-1 min-w-0">
                        <p className="font-semibold text-stone-900 line-clamp-1">{item.productName}</p>
                        <p className="text-[10px] text-stone-500 font-mono">
                          {item.weight || (item.productName.includes('1050') ? '1050g Glass Jar' : item.productName.includes('750') ? '750g Glass Jar' : '300g Glass Jar')}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex items-center border border-stone-200 rounded-full bg-stone-50 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="px-2 py-0.5 text-stone-700 hover:text-amber-700 font-bold"
                              title="Decrease"
                            >
                              -
                            </button>
                            <span className="px-1.5 text-[11px] font-bold text-stone-900">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="px-2 py-0.5 text-stone-700 hover:text-amber-700 font-bold"
                              title="Increase"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-[11px] text-stone-500 font-medium">× {formatCurrency(item.price)}</span>
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
                    <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                      <TicketPercent className="w-3.5 h-3.5 text-amber-700" />
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
                          className="flex-1 h-9 px-3 text-xs uppercase font-mono font-bold rounded-xl border border-stone-200 bg-stone-50/70 text-stone-900 focus:outline-none focus:bg-white focus:border-amber-600"
                        />
                        <button
                          type="button"
                          disabled={couponLoading || !couponInput.trim()}
                          onClick={() => validateAndApplyCoupon()}
                          className="px-4 h-9 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-semibold cursor-pointer disabled:opacity-40 transition-all"
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
                          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 hover:text-amber-900 transition-colors cursor-pointer py-0.5"
                        >
                          <RefreshCw className={`w-3 h-3 ${isLoadingOffers ? 'animate-spin' : ''}`} />
                          <span>
                            {showPublicOffers ? 'Refresh Available Offers' : 'View Available Offers'}
                          </span>
                        </button>

                        {showPublicOffers && (
                          <div className="mt-2 space-y-1.5 animate-in fade-in">
                            {publicOffers.length === 0 ? (
                              <p className="text-[11px] text-stone-500 italic">
                                No public offers active right now. Enter your promo code above.
                              </p>
                            ) : (
                              publicOffers.map((offer) => (
                                <div
                                  key={offer.code}
                                  className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs transition-all hover:border-amber-400"
                                >
                                  <div className="space-y-0.5 pr-2">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono font-bold text-stone-950 text-xs">
                                        {offer.code}
                                      </span>
                                      <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-amber-100 text-amber-900">
                                        {offer.discountType === 'PERCENTAGE'
                                          ? `${offer.value}% OFF`
                                          : `₹${offer.value / 100} OFF`}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-stone-500 leading-snug">
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
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-bold font-mono">5% GST</span>
                      </div>
                      <p className="text-[10px] text-stone-400 mt-0.5">
                        Base: {formatCurrency(productTaxable)} + 5% GST: {formatCurrency(productGst)}
                      </p>
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
                          Shipping &amp; Delivery (Delhivery One)
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-stone-100 text-stone-700 font-bold font-mono whitespace-nowrap border border-stone-200">
                          18% GST
                        </span>
                        {delhiveryRate && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-800 font-bold whitespace-nowrap border border-emerald-200">
                            {shippingMode === 'Express' ? 'Air Express' : 'Surface'}
                          </span>
                        )}
                      </div>
                      {delhiveryRate ? (
                        <div className="mt-0.5 space-y-0.5">
                          <p className="text-[10px] text-amber-800 font-semibold leading-tight">
                            Estimated Delivery: {delhiveryRate.estimatedDays || 2}-3 business days
                          </p>
                          <p className="text-[10px] text-stone-400 font-mono">
                            Base: {formatCurrency(bundledShippingBase)} + 18% GST: {formatCurrency(bundledShippingGst)}
                          </p>
                        </div>
                      ) : (
                        <p className="text-[10px] text-stone-400 mt-0.5 leading-relaxed">
                          {isCalculatingFreight
                            ? 'Calculating live freight with Delhivery One API...'
                            : isFreeShipping
                            ? 'Free Express Courier Delivery Applied'
                            : postalCode.length === 6 && isValidIndianPin(postalCode)
                            ? `Base: ${formatCurrency(bundledShippingBase)} + 18% GST: ${formatCurrency(bundledShippingGst)}`
                            : 'Enter 6-digit PIN code to calculate exact delivery charges'}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right pt-0.5">
                      {isFreeShipping ? (
                        <span className="text-emerald-700 font-bold text-xs whitespace-nowrap">FREE</span>
                      ) : isCalculatingFreight ? (
                        <span className="text-xs text-amber-700 font-semibold flex items-center gap-1 whitespace-nowrap">
                          <Loader2 className="w-3 h-3 animate-spin" /> Calculating...
                        </span>
                      ) : delhiveryRate || (postalCode.length === 6 && isValidIndianPin(postalCode) && bundledShippingTotal > 0) ? (
                        <div>
                          <span className="font-bold text-xs text-stone-950 font-mono whitespace-nowrap block">
                            {formatCurrency(bundledShippingTotal)}
                          </span>
                          <span className="text-[9px] text-stone-400 font-normal whitespace-nowrap block">(incl. 18% GST)</span>
                        </div>
                      ) : (
                        <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-stone-100 border border-stone-200 text-stone-600 font-semibold whitespace-nowrap">
                          Enter PIN
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Statutory Tax Summary (Expandable Breakdown) */}
                  <div className="pt-2 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => setShowGstBreakdown(!showGstBreakdown)}
                      className="w-full flex items-center justify-between text-left text-[11px] font-semibold text-amber-800 hover:text-amber-950 cursor-pointer py-0.5"
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
                        <div className="flex justify-between text-stone-600">
                          <span>Raw Honey GST (5% on {formatCurrency(productTaxable)}):</span>
                          <span className="font-mono font-semibold text-stone-900">{formatCurrency(productGst)}</span>
                        </div>
                        <div className="flex justify-between text-stone-600">
                          <span>Delivery &amp; Logistics GST (18% on {formatCurrency(bundledShippingBase)}):</span>
                          <span className="font-mono font-semibold text-stone-900">{formatCurrency(bundledShippingGst)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-stone-900 pt-1 border-t border-stone-200">
                          <span>Total Combined GST (CGST + SGST):</span>
                          <span className="font-mono text-emerald-800">{formatCurrency(totalTax)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-baseline text-base font-bold text-stone-950 pt-3 border-t border-stone-200">
                    <div>
                      <span className="font-serif text-lg">Total Amount</span>
                      <p className="text-[10px] font-normal text-stone-500">All taxes, shipping &amp; handling included</p>
                    </div>
                    <span className="text-xl font-bold text-amber-950 font-mono">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>

                {/* Desktop Pay Button */}
                <div className="hidden lg:block pt-2 space-y-2.5">
                  <button
                    type="button"
                    onClick={(e) => handleInitiatePayment(e, false)}
                    disabled={isProcessing}
                    className="w-full py-4 px-6 rounded-full text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 transition-all cursor-pointer disabled:opacity-60 bg-amber-600 hover:bg-amber-700 active:bg-amber-800"
                  >
                    <Lock className="w-4 h-4 text-amber-200" />
                    <span>
                      {isProcessing
                        ? processingStep || 'Processing...'
                        : `Pay ${formatCurrency(totalAmount)} with Razorpay`}
                    </span>
                  </button>

                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-500 text-center">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>100% Prepaid • 256-Bit SSL Encrypted Razorpay</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Mobile Bottom Bar */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-xl z-30">
              <div className="max-w-md mx-auto flex items-center justify-between gap-3">
                <div className="shrink-0">
                  <span className="text-[10px] text-stone-500 uppercase tracking-wider block font-semibold">
                    Grand Total
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-stone-950 font-mono">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-1 justify-end">
                  <button
                    type="button"
                    onClick={(e) => handleInitiatePayment(e, false)}
                    disabled={isProcessing}
                    className="w-full max-w-[260px] py-3.5 px-5 rounded-full text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-600/20 transition-all cursor-pointer disabled:opacity-60 bg-amber-600 hover:bg-amber-700 active:bg-amber-800"
                  >
                    <Lock className="w-3.5 h-3.5 shrink-0 text-amber-200" />
                    <span>
                      {isProcessing
                        ? processingStep || 'Processing...'
                        : `Pay ${formatCurrency(totalAmount)}`}
                    </span>
                  </button>
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
        <div className="bg-[#FAF8F5] min-h-screen flex items-center justify-center p-8">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-stone-600 font-semibold">Preparing Secure Checkout...</p>
          </div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
