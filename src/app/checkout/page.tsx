'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
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
  Printer,
  MapPin,
  Building,
  Home,
  Navigation,
  Globe,
  Clock,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  INDIAN_STATES,
  guessCityStateFromPin,
  isValidIndianPin,
  isValidIndianMobile,
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

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, subtotal, clearCart } = useCart();

  // Dynamic fee configuration manageable by operations managers
  const [feeSettings, setFeeSettings] = useState<FeeSettings>(DEFAULT_FEE_SETTINGS);
  const [showGstBreakdown, setShowGstBreakdown] = useState(false);

  // Customer & Contact Details (clean inputs, zero prefill)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(''); // 10-digit Indian Mobile

  // Indian Structured Delivery Address (Country default: India)
  const [country, setCountry] = useState('India');
  const [flatBuilding, setFlatBuilding] = useState('');
  const [areaStreet, setAreaStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pinAutoDetected, setPinAutoDetected] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [availableTowns, setAvailableTowns] = useState<string[]>([]);
  const pincodeAbortRef = useRef<AbortController | null>(null);

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

  // Pre-load Razorpay checkout SDK instantaneously in background on page mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as any).Razorpay) return;
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

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

  // Dynamic calculations with statutory GST and manager-controlled fees
  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const feeBreakdown = calculateOrderFees(subtotal, discountAmount, feeSettings);
  const {
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
    paymentGatewayPercent,
    prePgTotal,
    productTaxable,
    productGst,
    productGstRate,
    totalTax,
    grandTotal: totalAmount,
  } = feeBreakdown;
  const shippingCost = shippingTotal;

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
          if (local.city) setCity(local.city);
          if (local.state) setState(local.state);
          setPinAutoDetected(`${local.city || ''}${local.city && local.state ? ', ' : ''}${local.state || ''}`);
        } else {
          setPinAutoDetected(null);
          setPinError('Could not auto-detect. Please enter Town/City manually.');
        }
      }
    } finally {
      setPinLoading(false);
    }
  };

  // PIN Code input handler with auto-detection of Town/City & State
  const handlePincodeChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 6);
    setPostalCode(clean);

    if (clean.length < 6) {
      if (pincodeAbortRef.current) {
        pincodeAbortRef.current.abort();
      }
      setPinAutoDetected(null);
      setPinError(null);
      setAvailableTowns([]);
      return;
    }

    if (clean.length === 6) {
      // 1. Instant local guess for 0ms UI update
      const instant = guessCityStateFromPin(clean);
      if (instant) {
        if (instant.city) setCity(instant.city);
        if (instant.state) setState(instant.state);
        setPinAutoDetected(`${instant.city || ''}${instant.city && instant.state ? ', ' : ''}${instant.state || ''}`);
      }

      // 2. Authoritative live resolution (fetches all post offices & exact district)
      fetchPinDetails(clean);
    }
  };

  // Indian mobile number input handler (preserves 10 digits cleanly)
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

    if (phone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number for courier delivery updates.');
      return;
    }

    if (!isValidIndianPin(postalCode)) {
      setErrorMessage('Please enter a valid 6-digit Indian PIN Code (e.g. 400053).');
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
      // 1. Create Order on backend with couponCode and structured address (Fast: ~150ms)
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
          couponCode: appliedCoupon?.code,
        }),
      });

      const orderData = await res.json();
      if (!res.ok) {
        throw new Error(orderData.error || 'Failed to initiate checkout order');
      }

      const { razorpayOrderId, orderNumber, amount, currency, keyId } = orderData;

      // 2. Direct Instant Test Mode (Lightning-fast 0.2s order confirmation for test cards / demo)
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

      // 3. Mount Razorpay Modal with preloaded SDK
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
        image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=200&q=80',
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
            setProcessingStep('Verifying signature & generating invoice...');
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

      // Listen for payment failure to record failure and trigger recovery email
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
        <div className="bg-[#f5f5f7] min-h-screen py-20 px-4 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-[24px] border border-[#d2d2d7]/50 p-8 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-[#f5f5f7] flex items-center justify-center mx-auto text-[#86868b]">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-semibold text-[#1d1d1f]">Your Bag is empty.</h1>
            <p className="text-xs text-[#6e6e73] leading-relaxed max-w-xs mx-auto">
              Please choose from our cold-extracted wild forest harvests bottled in heavy solid glass jars before checking out.
            </p>
            <div className="pt-2">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs sm:text-sm font-medium bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <span>Continue Shopping</span>
                <Droplets className="w-3.5 h-3.5" />
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
        <div className="bg-[#f5f5f7] min-h-screen py-16 px-4 sm:px-6">
          <div className="max-w-xl mx-auto text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                Payment Verified • Insured Packing
              </span>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1d1d1f]">
                Thank you for your order.
              </h1>
              <p className="text-xs sm:text-sm text-[#6e6e73] max-w-sm mx-auto">
                Your solid glass jars are being cushioned in custom shock-absorbing kraft packaging at our Western Ghats dispatch hub.
              </p>
            </div>

            <div className="bg-white rounded-[24px] border border-[#d2d2d7]/50 p-6 text-left space-y-3.5 shadow-sm">
              <div className="flex justify-between items-center pb-3 border-b border-[#d2d2d7]/40 text-xs">
                <span className="text-[#6e6e73]">Order Number:</span>
                <span className="font-mono font-semibold text-[#1d1d1f] text-sm">
                  {completedOrder.orderNumber}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-[#d2d2d7]/40 text-xs">
                <span className="text-[#6e6e73]">Razorpay Payment ID:</span>
                <span className="font-mono text-[#6e6e73]">
                  {completedOrder.paymentId}
                </span>
              </div>
              {completedOrder.couponCode && (
                <div className="flex justify-between items-center pb-3 border-b border-[#d2d2d7]/40 text-xs">
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    Coupon Applied ({completedOrder.couponCode}):
                  </span>
                  <span className="font-semibold text-emerald-700">
                    -{formatCurrency(completedOrder.discountAmount || 0)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pb-3 border-b border-[#d2d2d7]/40 text-xs">
                <span className="text-[#6e6e73]">Estimated Dispatch:</span>
                <span className="font-medium text-emerald-700">
                  12:30 AM Reconciled • 1:00 PM Express Courier Pickup
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-[#d2d2d7]/40 text-xs">
                <span className="text-[#6e6e73]">Email Confirmation:</span>
                <span className="font-medium text-[#0071e3] flex items-center gap-1">
                  <span>Dispatched via Resend</span>
                </span>
              </div>
              <div className="flex justify-between items-center text-xs pt-1">
                <span className="text-[#6e6e73]">Total Paid:</span>
                <span className="font-semibold text-[#1d1d1f] text-base">
                  {formatCurrency(completedOrder.amount)}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href={`/invoice/${completedOrder.orderNumber}`}
                target="_blank"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View & Download Tax Invoice (PDF)</span>
              </Link>
              <Link
                href="/account"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <span>Track in My Orders</span>
              </Link>
              <Link
                href="/shop"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-white border border-[#d2d2d7] text-[#1d1d1f] hover:bg-[#f5f5f7] font-medium text-xs transition-all cursor-pointer"
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
      <div className="bg-[#f5f5f7] min-h-screen pb-36 lg:pb-20 text-[#1d1d1f]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
          {/* Top Navigation */}
          <div className="flex items-center justify-between">
            <Link
              href="/shop"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1d1d1f] hover:text-[#0071e3] bg-white border border-[#d2d2d7] px-3.5 py-1.5 rounded-full transition-colors shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Continue Shopping</span>
            </Link>
          </div>

          {/* Heading */}
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1d1d1f]">
              Checkout.
            </h1>
            <p className="text-xs text-[#6e6e73] mt-1">
              Secure 256-bit Razorpay encryption • 100% Solid glass breakage guarantee
            </p>

            {/* Strict Policy & Warehouse Schedule Badges */}
            <div className="flex items-center gap-2 flex-wrap pt-3">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                100% Prepaid Orders Only (No COD)
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                Sealed Consumables Non-Refundable (Free Breakage Replacement)
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                IST Warehouse Schedule: 1:00 PM &amp; 4:00 PM Daily Cutoff
              </span>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-[16px] bg-[#fff2f2] text-[#c91818] text-xs flex items-center justify-between border border-[#ffc4c4] animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#c91818]" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-xs font-medium underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Mobile Collapsible Order Summary Ribbon */}
          <div className="lg:hidden bg-white rounded-[20px] border border-[#d2d2d7]/50 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setIsOrderSummaryOpen(!isOrderSummaryOpen)}
              className="w-full p-4 flex items-center justify-between text-left text-xs font-medium cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-[#0071e3]" />
                <span className="text-[#1d1d1f]">
                  Order Summary ({totalQuantity} {totalQuantity === 1 ? 'item' : 'items'})
                </span>
                <span className="text-[#86868b]">•</span>
                <span className="font-semibold text-[#1d1d1f]">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[#0071e3] text-xs">
                <span>{isOrderSummaryOpen ? 'Hide' : 'Details'}</span>
                {isOrderSummaryOpen ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </div>
            </button>

            {isOrderSummaryOpen && (
              <div className="px-5 pb-5 pt-2 border-t border-[#d2d2d7]/30 space-y-3 text-xs bg-[#f5f5f7]/60">
                <div className="divide-y divide-[#d2d2d7]/30 max-h-52 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.productId} className="py-2.5 flex items-center justify-between">
                      <div className="pr-2">
                        <p className="font-medium text-[#1d1d1f] line-clamp-1">{item.productName}</p>
                        <p className="text-[11px] text-[#86868b]">
                          Qty: {item.quantity} × {formatCurrency(item.price)}
                        </p>
                      </div>
                      <span className="font-semibold text-[#1d1d1f] shrink-0">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2.5 border-t border-[#d2d2d7]/40 space-y-2.5 text-xs text-[#6e6e73]">
                  {/* 1. Item Subtotal */}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1 font-medium text-[#1d1d1f]">
                        <span>1. Items Total</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-semibold font-mono">5% GST</span>
                      </div>
                      <p className="text-[10px] text-[#86868b] mt-0.5">
                        Base: {formatCurrency(productTaxable)} + 5% GST: {formatCurrency(productGst)}
                      </p>
                    </div>
                    <span className="font-semibold text-[#1d1d1f]">{formatCurrency(subtotal)}</span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between text-emerald-700 font-medium pl-2 border-l-2 border-emerald-500 text-[11px]">
                      <span>Coupon Discount ({appliedCoupon.code})</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}

                  {/* 2. Payment Gateway (PG) */}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1 font-medium text-[#1d1d1f]">
                        <span>2. Payment Gateway (PG)</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-900 font-semibold font-mono">18% GST</span>
                      </div>
                      <p className="text-[10px] text-[#86868b] mt-0.5">
                        {pgTotal > 0
                          ? `Base (${paymentGatewayPercent}% on Total ${formatCurrency(prePgTotal)}): ${formatCurrency(pgBase)} + 18% GST: ${formatCurrency(pgGst)}`
                          : '0% Surcharge • 18% GST: ₹0.00 (Absorbed)'}
                      </p>
                    </div>
                    <span className="font-semibold text-[#1d1d1f]">
                      {pgTotal > 0 ? formatCurrency(pgTotal) : <span className="text-emerald-700 font-medium">FREE</span>}
                    </span>
                  </div>

                  {/* 3. Shipping & Freight */}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1 font-medium text-[#1d1d1f]">
                        <span>3. Shipping &amp; Freight</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-900 font-semibold font-mono">18% GST</span>
                      </div>
                      <p className="text-[10px] text-[#86868b] mt-0.5">
                        {isFreeShipping || shippingTotal === 0
                          ? 'Free Courier Delivery'
                          : `Base: ${formatCurrency(shippingBase)} + 18% GST: ${formatCurrency(shippingGst)}`}
                      </p>
                    </div>
                    <span className="font-semibold text-[#1d1d1f]">
                      {isFreeShipping || shippingTotal === 0 ? (
                        <span className="text-emerald-700 font-medium">FREE</span>
                      ) : (
                        formatCurrency(shippingTotal)
                      )}
                    </span>
                  </div>

                  {/* 4. Platform Convenience Fee */}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1 font-medium text-[#1d1d1f]">
                        <span>4. Platform Fee</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-100 text-stone-800 font-semibold font-mono">18% GST</span>
                      </div>
                      <p className="text-[10px] text-[#86868b] mt-0.5">
                        {platformTotal > 0
                          ? `Base: ${formatCurrency(platformBase)} + 18% GST: ${formatCurrency(platformGst)}`
                          : 'Zero platform fee'}
                      </p>
                    </div>
                    <span className="font-semibold text-[#1d1d1f]">
                      {platformTotal > 0 ? formatCurrency(platformTotal) : <span className="text-[#86868b]">₹0.00</span>}
                    </span>
                  </div>

                  {/* Combined GST */}
                  <div className="flex justify-between items-center pt-1.5 border-t border-[#d2d2d7]/50 text-[11px]">
                    <span className="font-medium text-[#1d1d1f]">Combined Statutory GST (CGST + SGST)</span>
                    <span className="font-semibold text-emerald-800">{formatCurrency(totalTax)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Checkout Grid */}
          <form onSubmit={handleInitiatePayment} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Columns: Fast Address & Contact Details */}
            <div className="lg:col-span-2 space-y-5">
              {/* Contact Information */}
              <div className="bg-white rounded-[20px] border border-[#d2d2d7]/50 p-6 sm:p-7 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-[#d2d2d7]/30 pb-3">
                  <h2 className="text-xs font-semibold text-[#1d1d1f] uppercase tracking-wider">
                    1. Contact &amp; Updates
                  </h2>
                  <span className="text-[11px] text-[#86868b]">Courier SMS &amp; Invoice Delivery</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Customer Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#1d1d1f] flex items-center justify-between">
                      <span>Customer Full Name <span className="text-rose-500">*</span></span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Receiver's full name"
                      className="w-full h-11 px-3.5 text-xs rounded-[12px] border border-[#d2d2d7] bg-[#f5f5f7]/50 text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all"
                    />
                  </div>

                  {/* Mobile Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#1d1d1f] flex items-center justify-between">
                      <span>Mobile Number <span className="text-rose-500">*</span></span>
                      <span className={`text-[10px] font-mono ${phone.length === 10 ? 'text-emerald-600 font-semibold' : 'text-[#86868b]'}`}>
                        {phone.length}/10 digits
                      </span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-xs font-semibold text-[#1d1d1f] flex items-center gap-1 border-r border-[#d2d2d7] pr-2 pointer-events-none select-none">
                        <span>🇮🇳</span>
                        <span>+91</span>
                      </span>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        placeholder="98200 00000"
                        className="w-full h-11 pl-20 pr-3.5 text-xs rounded-[12px] border border-[#d2d2d7] bg-[#f5f5f7]/50 text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Email ID */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-medium text-[#1d1d1f] flex items-center justify-between">
                      <span>Email ID <span className="text-rose-500">*</span></span>
                      <span className="text-[10px] text-[#86868b]">For GST Tax Invoice PDF</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full h-11 px-3.5 text-xs rounded-[12px] border border-[#d2d2d7] bg-[#f5f5f7]/50 text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Destination */}
              <div className="bg-white rounded-[20px] border border-[#d2d2d7]/50 p-6 sm:p-7 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-[#d2d2d7]/30 pb-3">
                  <h2 className="text-xs font-semibold text-[#1d1d1f] uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#0071e3]" />
                    <span>2. Delivery Destination</span>
                  </h2>
                  <span className="text-[11px] text-[#86868b]">All India Doorstep Delivery</span>
                </div>

                <div className="space-y-4">
                  {/* Country (Default: India) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#1d1d1f] flex items-center justify-between">
                      <span>Country / Territory</span>
                      <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Default: India
                      </span>
                    </label>
                    <div className="relative">
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full h-11 px-3.5 text-xs rounded-[12px] border border-[#d2d2d7] bg-[#f5f5f7]/60 text-[#1d1d1f] font-medium focus:outline-none focus:bg-white focus:border-[#0071e3] transition-all cursor-pointer"
                      >
                        <option value="India">India 🇮🇳 (National Insured Air Freight)</option>
                      </select>
                    </div>
                  </div>

                  {/* Flat / House No / Building / Apartment */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#1d1d1f]">
                      <span>Flat, House No., Building, Apartment <span className="text-rose-500">*</span></span>
                    </label>
                    <input
                      type="text"
                      required
                      value={flatBuilding}
                      onChange={(e) => setFlatBuilding(e.target.value)}
                      placeholder="e.g. Flat 402, 4th Floor, Oberoi Sky Heights"
                      className="w-full h-11 px-3.5 text-xs rounded-[12px] border border-[#d2d2d7] bg-[#f5f5f7]/50 text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all"
                    />
                  </div>

                  {/* Area / Street / Sector / Village */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#1d1d1f]">
                      <span>Area, Street, Sector, Village <span className="text-rose-500">*</span></span>
                    </label>
                    <input
                      type="text"
                      required
                      value={areaStreet}
                      onChange={(e) => setAreaStreet(e.target.value)}
                      placeholder="e.g. Lokhandwala Complex, 2nd Cross Road, Andheri West"
                      className="w-full h-11 px-3.5 text-xs rounded-[12px] border border-[#d2d2d7] bg-[#f5f5f7]/50 text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all"
                    />
                  </div>

                  {/* Landmark */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#1d1d1f] flex items-center justify-between">
                      <span>Landmark</span>
                      <span className="text-[10px] text-[#86868b] font-normal">Optional</span>
                    </label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="e.g. Near Apollo Pharmacy / Opposite High Point Restaurant"
                      className="w-full h-11 px-3.5 text-xs rounded-[12px] border border-[#d2d2d7] bg-[#f5f5f7]/50 text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all"
                    />
                  </div>

                  {/* 3 Column Grid: PIN Code, Town/City, State Dropdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* PIN Code */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#1d1d1f] flex items-center justify-between">
                        <span>PIN Code <span className="text-rose-500">*</span></span>
                        {postalCode.length === 6 && isValidIndianPin(postalCode) && (
                          <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5">
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
                          placeholder="e.g. 400053"
                          className="w-full h-11 px-3.5 pr-8 text-xs rounded-[12px] border border-[#d2d2d7] bg-[#f5f5f7]/50 text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all font-mono"
                        />
                        {pinLoading && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0071e3]" />
                          </div>
                        )}
                      </div>
                      {pinAutoDetected ? (
                        <div className="text-[10px] text-emerald-700 font-medium flex items-center justify-between">
                          <span className="truncate">Auto: {pinAutoDetected}</span>
                          <button
                            type="button"
                            onClick={() => fetchPinDetails(postalCode)}
                            className="text-[9px] text-[#0071e3] hover:underline cursor-pointer shrink-0 ml-1 flex items-center gap-0.5"
                          >
                            <RefreshCw className="w-2.5 h-2.5" /> Re-check
                          </button>
                        </div>
                      ) : postalCode.length > 0 && postalCode.length < 6 ? (
                        <p className="text-[10px] text-[#86868b]">Enter 6 digits for auto-fill</p>
                      ) : pinError ? (
                        <p className="text-[10px] text-amber-600">{pinError}</p>
                      ) : null}
                    </div>

                    {/* Town / City */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#1d1d1f] flex items-center justify-between">
                        <span>Town / City <span className="text-rose-500">*</span></span>
                        {availableTowns.length > 0 && (
                          <span className="text-[10px] text-[#86868b]">
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
                        className="w-full h-11 px-3.5 text-xs rounded-[12px] border border-[#d2d2d7] bg-[#f5f5f7]/50 text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all"
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
                                  ? 'bg-[#0071e3] text-white border-[#0071e3]'
                                  : 'bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] border-[#d2d2d7]/60'
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
                      <label className="text-xs font-medium text-[#1d1d1f]">
                        <span>State <span className="text-rose-500">*</span></span>
                      </label>
                      <select
                        required
                        value={state}
                        onChange={(e) => {
                          setState(e.target.value);
                          setPinAutoDetected(`${city}${city && e.target.value ? ', ' : ''}${e.target.value}`);
                        }}
                        className="w-full h-11 px-3.5 text-xs rounded-[12px] border border-[#d2d2d7] bg-[#f5f5f7]/50 text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 transition-all cursor-pointer"
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

                  {/* Live Shipping Label Preview Card */}
                  <div className="p-3.5 rounded-[16px] bg-[#f5f5f7]/70 border border-[#d2d2d7]/60 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px] uppercase font-semibold text-[#86868b] tracking-wider">
                      <span className="flex items-center gap-1">
                        <Truck className="w-3 h-3 text-[#0071e3]" />
                        Shipping Label &amp; GST Invoice Destination
                      </span>
                      <span className="text-emerald-700 font-bold">Insured Glass Transit</span>
                    </div>
                    <p className="font-semibold text-[#1d1d1f]">
                      {fullName || 'Customer Name'} • {phone.length === 10 ? `+91 ${phone.slice(0, 5)} ${phone.slice(5)}` : phone || '+91 98200 00000'}
                    </p>
                    <p className="text-[#6e6e73] leading-relaxed text-[11px]">
                      {flatBuilding || 'Flat / Building'}, {areaStreet || 'Area / Street'}
                      {landmark ? `, Near ${landmark}` : ''}
                      <br />
                      {city || 'Town/City'}, {state || 'State'} - <span className="font-mono">{postalCode || '400000'}</span>, {country}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Desktop Sidebar: Order Summary, Coupons & Pay */}
            <div className="space-y-4">
              <div className="bg-white rounded-[20px] border border-[#d2d2d7]/50 p-6 space-y-4 shadow-sm">
                <h3 className="text-xs font-semibold text-[#1d1d1f] uppercase tracking-wider pb-3 border-b border-[#d2d2d7]/30 hidden lg:block">
                  Order Summary ({items.length} {items.length === 1 ? 'item' : 'items'})
                </h3>

                {/* Items List (Desktop view) */}
                <div className="hidden lg:block divide-y divide-[#d2d2d7]/30 max-h-52 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.productId} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="pr-2">
                        <p className="font-medium text-[#1d1d1f] line-clamp-1">{item.productName}</p>
                        <p className="text-[11px] text-[#86868b]">
                          Qty: {item.quantity} × {formatCurrency(item.price)}
                        </p>
                      </div>
                      <span className="font-semibold text-[#1d1d1f] shrink-0">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* DISCOUNT COUPON ENTRY BOX */}
                <div className="pt-3 border-t border-[#d2d2d7]/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-[#1d1d1f] flex items-center gap-1.5">
                      <TicketPercent className="w-3.5 h-3.5 text-[#0071e3]" />
                      <span>Discount Coupon</span>
                    </label>
                    {appliedCoupon && (
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
                        Applied
                      </span>
                    )}
                  </div>

                  {appliedCoupon ? (
                    <div className="p-3 rounded-[14px] bg-emerald-50 border border-emerald-200/80 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-semibold text-emerald-900">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{appliedCoupon.code}</span>
                          <span className="text-[11px] font-normal text-emerald-700">
                            (-{formatCurrency(appliedCoupon.discountAmount)})
                          </span>
                        </div>
                        {appliedCoupon.assignedToManagerName && (
                          <p className="text-[10px] text-emerald-700">
                            Provided by Manager {appliedCoupon.assignedToManagerName}
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
                          className="flex-1 h-9 px-3 text-xs uppercase font-mono rounded-[10px] border border-[#d2d2d7] bg-[#f5f5f7]/50 text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#0071e3]"
                        />
                        <button
                          type="button"
                          disabled={couponLoading || !couponInput.trim()}
                          onClick={() => validateAndApplyCoupon()}
                          className="px-3.5 h-9 rounded-[10px] bg-[#1d1d1f] hover:bg-black text-white text-xs font-medium cursor-pointer disabled:opacity-40 transition-all"
                        >
                          {couponLoading ? 'Checking...' : 'Apply'}
                        </button>
                      </div>

                      {/* Refresh / View Available Offers Button */}
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={fetchPublicOffers}
                          disabled={isLoadingOffers}
                          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#0071e3] hover:text-[#0077ed] transition-colors cursor-pointer py-0.5"
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
                                  className="p-2.5 rounded-xl bg-[#f5f5f7] border border-[#d2d2d7]/80 flex items-center justify-between text-xs transition-all hover:border-[#0071e3]/40"
                                >
                                  <div className="space-y-0.5 pr-2">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono font-bold text-[#1d1d1f] tracking-wider text-xs">
                                        {offer.code}
                                      </span>
                                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-medium">
                                        {offer.discountType === 'PERCENTAGE'
                                          ? `${offer.value}% OFF`
                                          : `₹${offer.value / 100} OFF`}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-[#6e6e73] leading-snug">
                                      {offer.description}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCouponInput(offer.code);
                                      validateAndApplyCoupon(offer.code);
                                    }}
                                    className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-white hover:bg-[#1d1d1f] hover:text-white border border-[#d2d2d7] text-[#1d1d1f] transition-all cursor-pointer shrink-0 shadow-2xs"
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
                    <p className="text-[11px] text-rose-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{couponError}</span>
                    </p>
                  )}
                  {couponSuccessMsg && !couponError && (
                    <p className="text-[11px] text-emerald-700 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 shrink-0" />
                      <span>{couponSuccessMsg}</span>
                    </p>
                  )}
                </div>

                {/* Calculation Details & Transparent Statutory Breakdown */}
                <div className="pt-2 border-t border-[#d2d2d7]/30 space-y-2.5 text-xs text-[#6e6e73]">
                  {/* 1. Items Subtotal */}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5 font-medium text-[#1d1d1f]">
                        <span>1. Items Total</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-semibold font-mono">5% GST</span>
                      </div>
                      <p className="text-[10px] text-[#86868b] mt-0.5">
                        Base: {formatCurrency(productTaxable)} + 5% GST: {formatCurrency(productGst)}
                      </p>
                    </div>
                    <span className="font-semibold text-[#1d1d1f]">{formatCurrency(subtotal)}</span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between text-emerald-700 font-semibold pl-2 border-l-2 border-emerald-500 text-[11px]">
                      <span>Coupon Discount ({appliedCoupon.code})</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}

                  {/* 2. Payment Gateway (PG) Charges */}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5 font-medium text-[#1d1d1f]">
                        <span>2. Payment Gateway (PG)</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-900 font-semibold font-mono">18% GST</span>
                      </div>
                      <p className="text-[10px] text-[#86868b] mt-0.5">
                        {pgTotal > 0
                          ? `Base (${paymentGatewayPercent}% on Total ${formatCurrency(prePgTotal)}): ${formatCurrency(pgBase)} + 18% GST: ${formatCurrency(pgGst)}`
                          : 'Standard Razorpay Processing • 0% Surcharge • 18% GST: ₹0.00'}
                      </p>
                    </div>
                    <span className="font-semibold text-[#1d1d1f]">
                      {pgTotal > 0 ? formatCurrency(pgTotal) : <span className="text-emerald-700 font-medium">FREE</span>}
                    </span>
                  </div>

                  {/* 3. Shipping & Courier Freight */}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5 font-medium text-[#1d1d1f]">
                        <span>3. Shipping &amp; Courier Freight</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-900 font-semibold font-mono">18% GST</span>
                      </div>
                      <p className="text-[10px] text-[#86868b] mt-0.5">
                        {isFreeShipping || shippingTotal === 0
                          ? 'Free Express Courier Delivery Applied'
                          : `Base: ${formatCurrency(shippingBase)} + 18% GST: ${formatCurrency(shippingGst)}`}
                      </p>
                    </div>
                    <span className="font-semibold text-[#1d1d1f]">
                      {isFreeShipping || shippingTotal === 0 ? (
                        <span className="text-emerald-700 font-medium">FREE</span>
                      ) : (
                        formatCurrency(shippingTotal)
                      )}
                    </span>
                  </div>

                  {/* 4. Platform Convenience Fee */}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5 font-medium text-[#1d1d1f]">
                        <span>4. Platform Convenience Fee</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-100 text-stone-800 font-semibold font-mono">18% GST</span>
                      </div>
                      <p className="text-[10px] text-[#86868b] mt-0.5">
                        {platformTotal > 0
                          ? `Base: ${formatCurrency(platformBase)} + 18% GST: ${formatCurrency(platformGst)}`
                          : 'Zero platform fee'}
                      </p>
                    </div>
                    <span className="font-semibold text-[#1d1d1f]">
                      {platformTotal > 0 ? formatCurrency(platformTotal) : <span className="text-[#86868b]">₹0.00</span>}
                    </span>
                  </div>

                  {/* Statutory Tax Summary (Expandable Breakdown) */}
                  <div className="pt-2 border-t border-[#d2d2d7]/30">
                    <button
                      type="button"
                      onClick={() => setShowGstBreakdown(!showGstBreakdown)}
                      className="w-full flex items-center justify-between text-left text-[11px] font-medium text-[#0071e3] hover:underline cursor-pointer py-0.5"
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
                      <div className="mt-2 p-2.5 rounded-xl bg-[#f5f5f7] border border-[#d2d2d7]/60 text-[10px] space-y-1.5 animate-in fade-in">
                        <div className="flex justify-between text-[#6e6e73]">
                          <span>Raw Honey GST (5% on {formatCurrency(productTaxable)}):</span>
                          <span className="font-mono font-medium text-[#1d1d1f]">{formatCurrency(productGst)}</span>
                        </div>
                        <div className="flex justify-between text-[#6e6e73]">
                          <span>PG Gateway GST (18% on {formatCurrency(pgBase)}):</span>
                          <span className="font-mono font-medium text-[#1d1d1f]">{formatCurrency(pgGst)}</span>
                        </div>
                        <div className="flex justify-between text-[#6e6e73]">
                          <span>Courier Shipping GST (18% on {formatCurrency(shippingBase)}):</span>
                          <span className="font-mono font-medium text-[#1d1d1f]">{formatCurrency(shippingGst)}</span>
                        </div>
                        <div className="flex justify-between text-[#6e6e73]">
                          <span>Platform Service GST (18% on {formatCurrency(platformBase)}):</span>
                          <span className="font-mono font-medium text-[#1d1d1f]">{formatCurrency(platformGst)}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-[#1d1d1f] pt-1 border-t border-[#d2d2d7]">
                          <span>Total Combined GST (CGST + SGST):</span>
                          <span className="font-mono text-emerald-800">{formatCurrency(totalTax)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between text-base font-semibold text-[#1d1d1f] pt-3 border-t border-[#d2d2d7]/50">
                    <div>
                      <span>Total Amount</span>
                      <p className="text-[10px] font-normal text-[#86868b]">All taxes, shipping &amp; fees included</p>
                    </div>
                    <span className="text-lg font-bold text-[#1d1d1f]">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>

                {/* Desktop Pay Buttons */}
                <div className="hidden lg:block pt-2 space-y-2.5">
                  <button
                    type="button"
                    onClick={(e) => handleInitiatePayment(e, false)}
                    disabled={isProcessing}
                    className="w-full py-3.5 px-6 rounded-full bg-[#0071e3] hover:bg-[#0077ed] active:bg-[#0062c4] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-60"
                  >
                    <Lock className="w-4 h-4" />
                    <span>
                      {isProcessing
                        ? processingStep || 'Processing...'
                        : `Pay ${formatCurrency(totalAmount)} with Razorpay`}
                    </span>
                  </button>
                </div>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#86868b] pt-1 text-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>UPI, Cards &amp; NetBanking Protected by Razorpay</span>
                </div>
              </div>
            </div>

            {/* Sticky Mobile Bottom Bar: Fast, One-Thumb Checkout */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-white/90 backdrop-blur-md border-t border-[#d2d2d7]/50 shadow-xl z-30">
              <div className="max-w-md mx-auto flex items-center justify-between gap-3">
                <div className="shrink-0">
                  <span className="text-[10px] text-[#86868b] uppercase tracking-wider block font-medium">
                    Total
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base sm:text-lg font-semibold text-[#1d1d1f]">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-1 justify-end">
                  <button
                    type="button"
                    onClick={(e) => handleInitiatePayment(e, false)}
                    disabled={isProcessing}
                    className="w-full max-w-[260px] py-3 px-5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] active:bg-[#0062c4] text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-60"
                  >
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span>{isProcessing ? processingStep || 'Processing...' : `Pay ${formatCurrency(totalAmount)}`}</span>
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
        <div className="bg-[#f5f5f7] min-h-screen flex items-center justify-center p-8">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#6e6e73] font-medium">Preparing Secure Checkout...</p>
          </div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
