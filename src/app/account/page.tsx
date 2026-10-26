'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StoreProvider } from '@/components/storefront/store-provider';
import { OrderRecord } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  User,
  ShoppingBag,
  MapPin,
  LogOut,
  Truck,
  RotateCcw,
  CheckCircle2,
  Package,
  FileText,
  Clock,
  ShieldCheck,
  AlertCircle,
  Search,
  ChevronRight,
  RefreshCw,
  Droplets,
  Sparkles,
  ArrowRight,
  Mail,
  KeyRound,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { BRAND_NAME, SUPPORT_EMAIL, SUPPORT_PHONE } from '@/lib/constants/brand';

export default function CustomerAccountPage() {
  const [activeTab, setActiveTab] = useState<'ORDERS' | 'TRACK_ORDER' | 'ADDRESSES'>('ORDERS');
  const [unauthTab, setUnauthTab] = useState<'LOGIN' | 'DIRECT_TRACK'>('LOGIN');

  const [user, setUser] = useState<{ email: string; name: string; role: string; phone?: string } | null>(null);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Direct Tracking state
  const [trackNumberInput, setTrackNumberInput] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<OrderRecord | null>(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState<string | null>(null);

  // Transit claim state
  const [claimOrderId, setClaimOrderId] = useState<string | null>(null);

  // Passwordless Email OTP Login state
  const [inlineEmail, setInlineEmail] = useState('');
  const [inlineOtp, setInlineOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isSubmittingOtp, setIsSubmittingOtp] = useState(false);
  const [loginFeedback, setLoginFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  useEffect(() => {
    loadCustomerData();
  }, []);

  const loadCustomerData = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      // 1. Check authenticated session
      const meRes = await fetch('/api/account/me');
      if (!meRes.ok) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const meData = await meRes.json();
      if (meData?.authenticated && meData?.user) {
        setUser(meData.user);
        // 2. Fetch customer's orders
        const ordersRes = await fetch('/api/account/orders');
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setOrders(ordersData.orders || []);
        }
      } else {
        setUser(null);
      }
    } catch {
      setErrorMsg('Unable to retrieve account details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendInlineOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineEmail.trim() || !inlineEmail.includes('@')) {
      setLoginFeedback({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }
    setIsSubmittingOtp(true);
    setLoginFeedback(null);
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inlineEmail.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch passcode.');
      setOtpSent(true);
      setLoginFeedback({
        type: 'success',
        message: data.message || `6-digit passcode sent to ${inlineEmail.trim()}. Check your inbox.`,
      });
    } catch (err: any) {
      setLoginFeedback({ type: 'error', message: err.message || 'Unable to send passcode.' });
    } finally {
      setIsSubmittingOtp(false);
    }
  };

  const handleVerifyInlineOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineOtp.trim() || inlineOtp.trim().length < 6) {
      setLoginFeedback({ type: 'error', message: 'Please enter the 6-digit code received on your email.' });
      return;
    }
    setIsSubmittingOtp(true);
    setLoginFeedback(null);
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inlineEmail.trim().toLowerCase(), otp: inlineOtp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid or expired passcode.');
      await loadCustomerData();
    } catch (err: any) {
      setLoginFeedback({ type: 'error', message: err.message || 'Verification failed.' });
    } finally {
      setIsSubmittingOtp(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setUser(null);
    setOrders([]);
    setOtpSent(false);
    setInlineEmail('');
    setInlineOtp('');
    setLoginFeedback(null);
  };

  const handleTrackDirectOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackNumberInput.trim()) return;

    setTrackLoading(true);
    setTrackError(null);
    setTrackedOrder(null);

    try {
      const res = await fetch(`/api/account/orders?orderNumber=${encodeURIComponent(trackNumberInput.trim())}`);
      const data = await res.json();
      if (!res.ok || !data.orders || data.orders.length === 0) {
        throw new Error(data.error || 'No order found matching this reference number.');
      }
      setTrackedOrder(data.orders[0]);
    } catch (err: any) {
      setTrackError(err.message || 'Order not found. Please verify your order number.');
    } finally {
      setTrackLoading(false);
    }
  };

  const getFulfillmentStage = (order: OrderRecord) => {
    if (order.orderStatus === 'DELIVERED') return 5;
    if (order.orderStatus === 'SHIPPED') return 4;
    if (order.orderStatus === 'CONFIRMED') return 3;
    if (order.orderStatus === 'PROCESSING') return 2;
    return 1;
  };

  return (
    <StoreProvider>
      <div className="bg-[#FAF9F5] min-h-screen py-10 sm:py-14 text-stone-900 selection:bg-amber-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

          {/* Top Breadcrumbs */}
          <div className="flex items-center justify-between text-xs font-medium text-stone-500">
            <div className="flex items-center gap-2">
              <Link href="/" className="hover:text-amber-800 transition-colors">Home</Link>
              <span>/</span>
              <span className="text-stone-900 font-semibold">Customer Account</span>
            </div>
            <Link
              href="/shop"
              className="text-amber-800 hover:text-amber-950 font-semibold inline-flex items-center gap-1 transition-colors"
            >
              <span>Explore Raw Harvests</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Authenticated Customer Header */}
          {user ? (
            <div className="bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-stone-100">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-amber-900 flex items-center justify-center font-bold font-serif text-xl border border-amber-300/40 shadow-xs">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'G'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-stone-950">
                        Welcome, {user.name}.
                      </h1>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100/70 border border-amber-200 px-2.5 py-0.5 rounded-full">
                        <Sparkles className="w-3 h-3 text-amber-700" />
                        Verified Member
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mt-1 font-mono">
                      {user.email} {user.phone ? `• ${user.phone}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-stretch sm:self-auto">
                  <button
                    type="button"
                    onClick={loadCustomerData}
                    className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-semibold rounded-full bg-stone-50 border border-stone-200 text-stone-700 hover:bg-stone-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Refresh order history"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-semibold rounded-full bg-stone-50 border border-stone-200 text-rose-700 hover:bg-rose-50 hover:border-rose-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-1 p-1 bg-stone-100/80 rounded-2xl max-w-fit">
                <button
                  type="button"
                  onClick={() => setActiveTab('ORDERS')}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                    activeTab === 'ORDERS'
                      ? 'bg-white text-stone-950 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  My Orders ({orders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('TRACK_ORDER')}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                    activeTab === 'TRACK_ORDER'
                      ? 'bg-white text-stone-950 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Track Shipment
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('ADDRESSES')}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                    activeTab === 'ADDRESSES'
                      ? 'bg-white text-stone-950 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Saved Addresses
                </button>
              </div>
            </div>
          ) : !isLoading ? (
            /* Unauthenticated Portal: Soft & Premium Sign-in or Direct Track */
            <div className="max-w-lg mx-auto bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-10 shadow-[0_10px_40px_rgba(40,25,10,0.03)] space-y-6">
              
              {/* Soft Segmented Pill: Sign In vs Track Directly */}
              <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-2xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setUnauthTab('LOGIN')}
                  className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    unauthTab === 'LOGIN'
                      ? 'bg-white text-stone-950 shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Customer Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUnauthTab('DIRECT_TRACK')}
                  className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    unauthTab === 'DIRECT_TRACK'
                      ? 'bg-white text-stone-950 shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Track An Order</span>
                </button>
              </div>

              {unauthTab === 'LOGIN' ? (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto shadow-2xs">
                      <Droplets className="w-6 h-6 stroke-[1.75]" />
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-stone-950">
                      Access Your Honey Cellar
                    </h2>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
                      Enter your email to receive a 6-digit verification code. No passwords required.
                    </p>
                  </div>

                  {!otpSent ? (
                    <form onSubmit={handleSendInlineOtp} className="space-y-4">
                      <div className="space-y-1.5 text-left">
                        <label className="text-xs font-semibold text-stone-800">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            required
                            value={inlineEmail}
                            onChange={(e) => setInlineEmail(e.target.value)}
                            placeholder="vikram@example.com"
                            className="w-full h-11 pl-10 pr-3.5 text-xs rounded-2xl border border-stone-200 bg-stone-50/60 text-stone-900 focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-4 focus:ring-amber-500/10 transition-all font-medium"
                          />
                        </div>
                      </div>

                      {loginFeedback && (
                        <div className={`p-3 rounded-2xl text-xs flex items-center gap-2 ${
                          loginFeedback.type === 'error'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}>
                          {loginFeedback.type === 'error' ? (
                            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                          )}
                          <span className="font-medium">{loginFeedback.message}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isSubmittingOtp}
                        className="w-full py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white text-xs font-semibold shadow-md shadow-amber-600/15 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isSubmittingOtp ? (
                          <>
                            <LoaderIcon />
                            <span>Sending Passcode...</span>
                          </>
                        ) : (
                          <>
                            <span>Send Secure Passcode</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>

                      <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-400 pt-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Instant passwordless access via Resend</span>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyInlineOtp} className="space-y-4">
                      <div className="space-y-1.5 text-left">
                        <label className="text-xs font-semibold text-stone-800">
                          Enter 6-Digit Passcode sent to <span className="font-mono text-amber-800 font-bold">{inlineEmail}</span>
                        </label>
                        <div className="relative">
                          <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            maxLength={6}
                            required
                            value={inlineOtp}
                            onChange={(e) => setInlineOtp(e.target.value.replace(/\D/g, ''))}
                            placeholder="123456"
                            className="w-full h-11 pl-10 pr-3.5 text-center font-mono font-bold text-base tracking-widest rounded-2xl border border-stone-200 bg-stone-50/60 text-stone-900 focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-4 focus:ring-amber-500/10 transition-all"
                          />
                        </div>
                      </div>

                      {loginFeedback && (
                        <div className={`p-3 rounded-2xl text-xs flex items-center gap-2 ${
                          loginFeedback.type === 'error'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}>
                          {loginFeedback.type === 'error' ? (
                            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                          )}
                          <span className="font-medium">{loginFeedback.message}</span>
                        </div>
                      )}

                      <div className="flex gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setOtpSent(false);
                            setLoginFeedback(null);
                          }}
                          className="w-1/3 py-3 rounded-2xl border border-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-50 cursor-pointer transition-colors"
                        >
                          Change Email
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingOtp || inlineOtp.length < 6}
                          className="w-2/3 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white text-xs font-semibold shadow-md shadow-amber-600/15 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          {isSubmittingOtp ? (
                            <>
                              <LoaderIcon />
                              <span>Verifying...</span>
                            </>
                          ) : (
                            <>
                              <span>Verify &amp; Enter</span>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                /* Tab B: Direct Order & AWB Tracker (No Login Required) */
                <div className="space-y-5">
                  <div className="text-center space-y-1.5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto shadow-2xs">
                      <Truck className="w-6 h-6 stroke-[1.75]" />
                    </div>
                    <h3 className="text-xl font-serif font-bold text-stone-950">
                      Direct Order Tracking
                    </h3>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
                      Track the real-time fulfillment and Delhivery dispatch status of any order without signing in.
                    </p>
                  </div>

                  <form onSubmit={handleTrackDirectOrder} className="space-y-3">
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-semibold text-stone-800">
                        Order Number or Courier AWB
                      </label>
                      <input
                        type="text"
                        required
                        value={trackNumberInput}
                        onChange={(e) => setTrackNumberInput(e.target.value)}
                        placeholder="e.g. SG-2026-8492 or 143275200..."
                        className="w-full h-11 px-3.5 text-xs font-mono font-bold rounded-2xl border border-stone-200 bg-stone-50/60 text-stone-900 focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-4 focus:ring-amber-500/10 transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={trackLoading || !trackNumberInput.trim()}
                      className="w-full py-3.5 rounded-2xl bg-stone-900 hover:bg-black text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {trackLoading ? (
                        <>
                          <LoaderIcon />
                          <span>Locating Order...</span>
                        </>
                      ) : (
                        <>
                          <Search className="w-3.5 h-3.5 text-amber-400" />
                          <span>Track Dispatch Status</span>
                        </>
                      )}
                    </button>
                  </form>

                  {trackError && (
                    <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span className="font-medium">{trackError}</span>
                    </div>
                  )}

                  {trackedOrder && (
                    <div className="p-5 rounded-3xl bg-stone-50 border border-stone-200/90 space-y-4 text-left animate-in fade-in">
                      <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                        <div>
                          <span className="font-mono font-bold text-sm text-stone-950">
                            #{trackedOrder.orderNumber}
                          </span>
                          <p className="text-[11px] text-stone-500">
                            Placed on {formatDate(trackedOrder.createdAt)}
                          </p>
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100/70 text-emerald-900 border border-emerald-300">
                          {trackedOrder.orderStatus}
                        </span>
                      </div>

                      <div className="text-xs space-y-2 text-stone-600">
                        <div className="flex justify-between">
                          <span className="text-stone-500">Logistics Carrier:</span>
                          <span className="font-semibold text-stone-900">{trackedOrder.carrier || 'Delhivery One'}</span>
                        </div>
                        {trackedOrder.trackingNumber && (
                          <div className="flex justify-between">
                            <span className="text-stone-500">Delhivery AWB:</span>
                            <span className="font-mono font-bold text-amber-800">{trackedOrder.trackingNumber}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-stone-500">Destination:</span>
                          <span className="font-medium text-stone-900">
                            {trackedOrder.shippingAddress.city}, {trackedOrder.shippingAddress.state} ({trackedOrder.shippingAddress.postalCode})
                          </span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-stone-200">
                          <span className="text-stone-700 font-semibold">Total Paid:</span>
                          <span className="font-mono font-bold text-stone-950">{formatCurrency(trackedOrder.totalAmount)}</span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <Link
                          href={`/invoice/${trackedOrder.orderNumber}`}
                          target="_blank"
                          className="w-full py-2.5 rounded-xl bg-white border border-stone-200 text-stone-800 hover:bg-stone-100 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-700" />
                          <span>Download Tax Invoice (PDF)</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-lg mx-auto p-12 bg-white rounded-3xl border border-stone-200/80 text-center space-y-3 shadow-sm animate-pulse">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 mx-auto" />
              <div className="h-4 w-40 bg-stone-100 rounded-md mx-auto" />
              <div className="h-3 w-56 bg-stone-100 rounded-md mx-auto" />
            </div>
          )}

          {/* Authenticated Tabs Content */}
          {user && (
            <>
              {/* Transit Breakage Guarantee Notice */}
              {claimOrderId && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold">
                      <ShieldCheck className="w-4 h-4 text-amber-700" />
                      <span>100% Free Glass Breakage Replacement Guarantee (Order #{claimOrderId})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setClaimOrderId(null)}
                      className="text-xs font-semibold text-amber-800 hover:underline cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-900/80">
                    Sealed honey consumables are non-refundable for hygiene standards. However, our <strong>100% Solid Glass Guarantee</strong> covers any breakage during transit. Simply email a photo of the damaged jar to{' '}
                    <a href={`mailto:${SUPPORT_EMAIL}?subject=Transit Replacement Claim for Order #${claimOrderId}`} className="font-bold underline text-amber-950">
                      {SUPPORT_EMAIL}
                    </a>{' '}
                    or WhatsApp {SUPPORT_PHONE}, and our dispatch desk will immediately release a fresh replacement jar.
                  </p>
                </div>
              )}

              {/* Tab 1: Orders List */}
              {activeTab === 'ORDERS' && (
                <div className="space-y-5">
                  {isLoading ? (
                    <div className="p-12 text-center text-xs text-stone-500 space-y-2 bg-white rounded-3xl border border-stone-200/80 shadow-sm">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto text-amber-600" />
                      <p>Loading your verified order records...</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-stone-200/80 p-12 text-center space-y-4 shadow-sm">
                      <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/60 text-amber-700 flex items-center justify-center mx-auto">
                        <Package className="w-8 h-8 stroke-[1.75]" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-serif font-bold text-stone-950">No Orders Placed Yet</h3>
                        <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
                          Your orders placed with {user.email} will appear here with live Delhivery tracking, batch details, and official tax invoices.
                        </p>
                      </div>
                      <div className="pt-2">
                        <Link
                          href="/shop"
                          className="inline-flex items-center gap-2 px-6 py-3 text-xs font-semibold rounded-full bg-amber-600 text-white hover:bg-amber-700 shadow-md shadow-amber-600/20 transition-all cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Browse Pure Honey Harvests</span>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    orders.map((order) => {
                      const stage = getFulfillmentStage(order);
                      return (
                        <div
                          key={order.id}
                          className="bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-7 space-y-5 shadow-sm hover:shadow-md transition-shadow"
                        >
                          {/* Top Order Metadata Bar */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 gap-3">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-bold text-stone-950 text-base">
                                  #{order.orderNumber}
                                </span>
                                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200">
                                  {order.paymentStatus === 'PAID' ? '100% Prepaid (Verified)' : order.paymentStatus}
                                </span>
                              </div>
                              <p className="text-xs text-stone-400 mt-1">
                                Placed on {formatDate(order.createdAt)}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
                                  order.orderStatus === 'DELIVERED'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : order.orderStatus === 'SHIPPED'
                                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                                    : order.orderStatus === 'CONFIRMED'
                                    ? 'bg-amber-50 text-amber-900 border-amber-200'
                                    : 'bg-stone-100 text-stone-800 border-stone-200'
                                }`}
                              >
                                Status: {order.orderStatus}
                              </span>
                            </div>
                          </div>

                          {/* 5-Stage Live Fulfillment Timeline */}
                          <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-4 space-y-3">
                            <div className="flex items-center justify-between text-xs font-semibold text-stone-900">
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-amber-700" />
                                <span>Delhivery One Fulfillment Progress</span>
                              </span>
                              {order.trackingNumber && (
                                <span className="text-[11px] font-mono text-amber-800 font-bold">
                                  {order.carrier || 'Delhivery One'} • AWB: {order.trackingNumber}
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-5 gap-1.5 text-center pt-1">
                              {[
                                { name: 'Prepaid', desc: 'Verified 24/7' },
                                { name: '12:30 AM Batch', desc: 'Reconciled' },
                                { name: 'Packaging', desc: 'Solid Glass' },
                                { name: 'In Transit', desc: 'Insured' },
                                { name: 'Delivered', desc: 'Intact Seal' },
                              ].map((step, idx) => {
                                const isCompleted = stage >= idx + 1;
                                const isCurrent = stage === idx + 1;
                                return (
                                  <div key={step.name} className="space-y-1">
                                    <div
                                      className={`h-1.5 rounded-full transition-all ${
                                        isCompleted
                                          ? 'bg-amber-600'
                                          : 'bg-stone-200'
                                      }`}
                                    />
                                    <p
                                      className={`text-[10px] font-bold leading-tight ${
                                        isCurrent
                                          ? 'text-amber-800'
                                          : isCompleted
                                          ? 'text-stone-900'
                                          : 'text-stone-400'
                                      }`}
                                    >
                                      {step.name}
                                    </p>
                                    <p className="text-[9px] text-stone-400 hidden sm:block">
                                      {step.desc}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Line Items */}
                          <div className="divide-y divide-stone-100 text-xs">
                            {order.items.map((item) => (
                              <div key={item.id} className="py-2.5 flex items-center justify-between">
                                <div>
                                  <p className="font-semibold text-stone-900">{item.productName}</p>
                                  <p className="text-[11px] text-stone-400 font-mono">
                                    SKU: {item.sku} • Qty: {item.quantity}
                                  </p>
                                </div>
                                <span className="font-bold text-stone-950 font-mono">
                                  {formatCurrency(item.total)}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Pricing Summary */}
                          <div className="bg-stone-50/80 rounded-2xl p-4 space-y-1.5 text-xs text-stone-600 border border-stone-200/60">
                            <div className="flex justify-between">
                              <span>Subtotal:</span>
                              <span className="text-stone-900 font-medium font-mono">{formatCurrency(order.subtotal)}</span>
                            </div>
                            {order.discountAmount > 0 && (
                              <div className="flex justify-between text-emerald-800 font-bold">
                                <span>Coupon Discount ({order.couponCode || 'APPLIED'}):</span>
                                <span>-{formatCurrency(order.discountAmount)}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span>Shipping &amp; Delivery (Delhivery One):</span>
                              <span className="text-stone-900 font-medium font-mono">
                                {formatCurrency(order.shippingCost || 7000)} (incl. 18% GST)
                              </span>
                            </div>
                            <div className="flex justify-between text-sm font-bold text-stone-950 pt-2 border-t border-stone-200">
                              <span>Total Paid:</span>
                              <span className="font-mono text-amber-900">{formatCurrency(order.totalAmount)}</span>
                            </div>
                          </div>

                          {/* Actions Row */}
                          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-3">
                            <div className="text-[11px] text-stone-500">
                              Destination: <strong className="text-stone-900">{order.shippingAddress.city}, {order.shippingAddress.state}</strong> ({order.shippingAddress.postalCode})
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              <Link
                                href={`/invoice/${order.orderNumber}`}
                                target="_blank"
                                className="px-4 py-2 text-xs font-semibold rounded-full bg-amber-50 border border-amber-200 text-amber-950 hover:bg-amber-100 flex items-center gap-1.5 transition-colors cursor-pointer"
                                title="Download official GST Tax Invoice"
                              >
                                <FileText className="w-3.5 h-3.5 text-amber-700" />
                                <span>Tax Invoice (PDF)</span>
                              </Link>

                              <button
                                type="button"
                                onClick={() => setClaimOrderId(order.orderNumber)}
                                className="px-4 py-2 text-xs font-medium rounded-full border border-stone-200 text-stone-700 hover:bg-stone-50 cursor-pointer transition-colors"
                              >
                                Breakage Claim
                              </button>

                              <Link
                                href="/support"
                                className="px-4 py-2 text-xs font-medium rounded-full bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors"
                              >
                                Care Desk
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Tab 2: Track Order Direct Lookup */}
              {activeTab === 'TRACK_ORDER' && (
                <div className="bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-8 space-y-6 shadow-sm">
                  <div className="space-y-1">
                    <h3 className="text-base font-serif font-bold text-stone-950">Instant Courier &amp; Order Lookup</h3>
                    <p className="text-xs text-stone-500 leading-relaxed">
                      Enter any Order Number (e.g. SG-2026-6572) or Delhivery AWB tracking code to inspect real-time dispatch progress.
                    </p>
                  </div>

                  <form onSubmit={handleTrackDirectOrder} className="flex gap-2 max-w-lg">
                    <input
                      type="text"
                      required
                      value={trackNumberInput}
                      onChange={(e) => setTrackNumberInput(e.target.value)}
                      placeholder="e.g. SG-2026-6572 or 143275200..."
                      className="flex-1 h-11 px-3.5 text-xs font-mono font-bold rounded-2xl border border-stone-200 bg-stone-50/60 text-stone-900 focus:outline-none focus:bg-white focus:border-amber-600"
                    />
                    <button
                      type="submit"
                      disabled={trackLoading || !trackNumberInput.trim()}
                      className="px-5 h-11 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-40 transition-all flex items-center gap-1.5 shadow-md shadow-amber-600/15"
                    >
                      {trackLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                      <span>Search</span>
                    </button>
                  </form>

                  {trackError && (
                    <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{trackError}</span>
                    </div>
                  )}

                  {trackedOrder && (
                    <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4 animate-in fade-in">
                      <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                        <div>
                          <span className="font-mono font-bold text-sm text-stone-950">#{trackedOrder.orderNumber}</span>
                          <p className="text-xs text-stone-500">{trackedOrder.customerName} • Placed {formatDate(trackedOrder.createdAt)}</p>
                        </div>
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200">
                          {trackedOrder.orderStatus}
                        </span>
                      </div>

                      <div className="text-xs space-y-2">
                        <p className="text-stone-900 font-medium">
                          Carrier: <strong className="font-bold">{trackedOrder.carrier || 'Delhivery One'}</strong>
                        </p>
                        {trackedOrder.trackingNumber ? (
                          <p className="text-amber-800 font-mono font-bold">
                            AWB Tracking Number: {trackedOrder.trackingNumber}
                          </p>
                        ) : (
                          <p className="text-stone-500">Scheduled for 12:30 AM IST warehouse batch queue reconciliation</p>
                        )}
                        <p className="text-stone-500">
                          Delivery Destination: {trackedOrder.shippingAddress.street}, {trackedOrder.shippingAddress.city}, {trackedOrder.shippingAddress.state} - {trackedOrder.shippingAddress.postalCode}
                        </p>
                      </div>

                      <div className="pt-2">
                        <Link
                          href={`/invoice/${trackedOrder.orderNumber}`}
                          target="_blank"
                          className="px-4 py-2 text-xs font-semibold rounded-full bg-white border border-stone-200 text-stone-900 hover:bg-stone-100 inline-flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-700" />
                          <span>View Official GST Invoice (PDF)</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Saved Delivery Addresses */}
              {activeTab === 'ADDRESSES' && (
                <div className="space-y-4">
                  {orders.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {orders.map((order, idx) => (
                        <div
                          key={order.id}
                          className="bg-white rounded-3xl border border-stone-200/80 p-6 space-y-3 shadow-sm"
                        >
                          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                            <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-amber-700" />
                              <span>Destination (Order #{order.orderNumber})</span>
                            </span>
                            {idx === 0 && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Most Recent
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-stone-800 space-y-1">
                            <p className="font-bold">{order.shippingAddress.fullName || order.customerName}</p>
                            <p className="text-stone-600 leading-relaxed">
                              {order.shippingAddress.street}
                            </p>
                            <p className="text-stone-600">
                              {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}
                            </p>
                            <p className="text-stone-400 font-mono">{order.shippingAddress.phone || order.customerPhone}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl border border-stone-200/80 p-8 text-center text-xs text-stone-500">
                      No delivery addresses saved yet. Addresses are automatically recorded during your first checkout.
                    </div>
                  )}
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </StoreProvider>
  );
}

function LoaderIcon() {
  return <RefreshCw className="w-3.5 h-3.5 animate-spin" />;
}
