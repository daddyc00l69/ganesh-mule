'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Droplets,
} from 'lucide-react';
import { BRAND_NAME, BRAND_SHORT, SUPPORT_EMAIL, SUPPORT_PHONE } from '@/lib/constants/brand';

export default function CustomerAccountPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'ORDERS' | 'TRACK_ORDER' | 'ADDRESSES'>('ORDERS');
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

  // Inline Email OTP Login state (Orders hidden until authenticated)
  const [inlineEmail, setInlineEmail] = useState('');
  const [inlineOtp, setInlineOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isSubmittingOtp, setIsSubmittingOtp] = useState(false);
  const [loginFeedback, setLoginFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

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
      setLoginFeedback({ type: 'success', message: data.message || `6-digit passcode sent to ${inlineEmail.trim()}.` });
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

  useEffect(() => {
    loadCustomerData();
  }, []);

  const loadCustomerData = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      // 1. Check session
      const meRes = await fetch('/api/account/me');
      if (!meRes.ok) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const meData = await meRes.json();
      setUser(meData.user);

      // 2. Fetch real orders
      const ordersRes = await fetch('/api/account/orders');
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData.orders || []);
      }
    } catch (err: any) {
      setErrorMsg('Unable to retrieve account details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setUser(null);
    setOrders([]);
    router.push('/login');
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
      setTrackError(err.message || 'Order not found');
    } finally {
      setTrackLoading(false);
    }
  };

  // Helper to determine fulfillment stage for timeline
  const getFulfillmentStage = (order: OrderRecord) => {
    if (order.orderStatus === 'DELIVERED') return 5;
    if (order.orderStatus === 'SHIPPED') return 4;
    if (order.orderStatus === 'CONFIRMED') return 3;
    if (order.orderStatus === 'PROCESSING') return 2;
    return 1;
  };

  return (
    <StoreProvider>
      <div className="bg-[#f5f5f7] min-h-screen py-10 sm:py-14 text-[#1d1d1f]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Header Profile / Sign-in Prompt */}
          {user ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#d2d2d7]/50">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold text-xl border border-amber-500/20 shadow-2xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1d1d1f]">
                    Hi, {user.name}.
                  </h1>
                  <p className="text-xs text-[#6e6e73] mt-0.5">
                    {user.email} {user.phone ? `• ${user.phone}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadCustomerData}
                  className="px-3.5 py-2 text-xs font-medium rounded-full bg-white border border-[#d2d2d7] text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Refresh order history"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-4 py-2 text-xs font-medium rounded-full bg-white border border-[#d2d2d7] text-[#1d1d1f] hover:text-[#e30000] hover:bg-[#fff2f2] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : !isLoading ? (
            <div className="bg-white rounded-[28px] border border-[#d2d2d7]/70 p-8 sm:p-12 shadow-sm max-w-lg mx-auto space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-700 flex items-center justify-center mx-auto border border-amber-500/20">
                  <Package className="w-6 h-6 text-amber-600" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-[#1d1d1f]">
                  Sign In to Access Orders
                </h2>
                <p className="text-xs text-[#6e6e73] leading-relaxed">
                  Your order history and live delivery tracking are protected. Please enter your email to receive a 6-digit one-time passcode.
                </p>
              </div>

              {!otpSent ? (
                <form onSubmit={handleSendInlineOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#1d1d1f] mb-1.5 text-left">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={inlineEmail}
                      onChange={(e) => setInlineEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#d2d2d7] bg-[#fbfbfd] text-sm focus:outline-none focus:border-[#0071e3] transition-colors"
                    />
                  </div>

                  {loginFeedback && (
                    <div className={`p-3 rounded-xl text-xs ${loginFeedback.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
                      {loginFeedback.message}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmittingOtp}
                    className="w-full py-3 rounded-full bg-[#1d1d1f] hover:bg-black text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingOtp ? 'Sending Passcode...' : 'Send 6-Digit Email Passcode →'}
                  </button>

                  <p className="text-[11px] text-[#86868b] text-center">
                    No passwords required • One-time secure passcode sent via Resend
                  </p>
                </form>
              ) : (
                <form onSubmit={handleVerifyInlineOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#1d1d1f] mb-1.5 text-left">
                      Enter 6-Digit Code sent to <span className="font-mono text-amber-700">{inlineEmail}</span>
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={inlineOtp}
                      onChange={(e) => setInlineOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••••"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#d2d2d7] bg-[#fbfbfd] text-center font-mono text-lg tracking-widest focus:outline-none focus:border-[#0071e3] transition-colors"
                    />
                  </div>

                  {loginFeedback && (
                    <div className={`p-3 rounded-xl text-xs ${loginFeedback.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
                      {loginFeedback.message}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setOtpSent(false); setLoginFeedback(null); }}
                      className="w-1/3 py-2.5 rounded-full border border-[#d2d2d7] text-[#1d1d1f] text-xs font-medium hover:bg-[#f5f5f7] cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingOtp || inlineOtp.length < 6}
                      className="w-2/3 py-2.5 rounded-full bg-[#1d1d1f] hover:bg-black text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingOtp ? 'Verifying...' : 'Verify & View Orders →'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="h-16 flex items-center gap-3 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-[#e8e8ed]" />
              <div className="space-y-2">
                <div className="w-48 h-5 bg-[#e8e8ed] rounded-md" />
                <div className="w-32 h-3 bg-[#e8e8ed] rounded-md" />
              </div>
            </div>
          )}

          {/* Segmented Navigation Tabs and Order Lists (Rendered ONLY when Authenticated) */}
          {user && (
            <>
              <div className="inline-flex p-1 bg-[#e8e8ed] rounded-full gap-1">
                <button
                  onClick={() => setActiveTab('ORDERS')}
                  className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer ${
                    activeTab === 'ORDERS'
                      ? 'bg-white text-[#1d1d1f] shadow-xs'
                      : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                  }`}
                >
                  My Orders ({orders.length})
                </button>
                <button
                  onClick={() => setActiveTab('ADDRESSES')}
                  className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer ${
                    activeTab === 'ADDRESSES'
                      ? 'bg-white text-[#1d1d1f] shadow-xs'
                      : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                  }`}
                >
                  Delivery Addresses
                </button>
              </div>

          {/* Transit Claim Banner Modal/Notice */}
          {claimOrderId && (
            <div className="p-4 rounded-[18px] bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span>100% Free Glass Breakage Replacement Guarantee (Order #{claimOrderId})</span>
                </div>
                <button
                  onClick={() => setClaimOrderId(null)}
                  className="text-xs font-medium text-amber-800 hover:underline cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800/90">
                In adherence with national food safety compliance, sealed raw honey consumables are strictly non-refundable. However, our <strong>100% Zero-Breakage Guarantee</strong> covers any damage during courier transit. Please email photos of the damaged glass jar to <a href={`mailto:${SUPPORT_EMAIL}?subject=Transit Breakage Claim for Order #${claimOrderId}`} className="font-semibold underline text-amber-950">{SUPPORT_EMAIL}</a> or WhatsApp {SUPPORT_PHONE}. Our fulfillment desk will immediately dispatch a fresh replacement jar at zero charge.
              </p>
            </div>
          )}

          {/* Tab 1: Orders List View */}
          {activeTab === 'ORDERS' && (
            <div className="space-y-5">
              {isLoading ? (
                <div className="p-12 text-center text-xs text-[#86868b] space-y-2 bg-white rounded-[20px] border border-[#d2d2d7]/50 shadow-sm">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-amber-600" />
                  <p>Loading your verified order records...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="bg-white rounded-[20px] border border-[#d2d2d7]/50 p-12 text-center space-y-4 shadow-sm">
                  <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200/60">
                    <Package className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-[#1d1d1f]">No Orders Found</h3>
                    <p className="text-xs text-[#6e6e73] max-w-sm mx-auto">
                      {user
                        ? `No orders placed yet with ${user.email}. Browse our cold-extracted raw honey harvests and pristine solid glass jars.`
                        : 'Sign in to see orders placed with your email, or use the "Track by Order #" tab.'}
                    </p>
                  </div>
                  <div className="pt-2">
                    <Link
                      href="/shop"
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-full bg-[#1d1d1f] text-white hover:bg-black transition-colors"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-amber-300" />
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
                      className="bg-white rounded-[20px] border border-[#d2d2d7]/60 p-6 space-y-5 shadow-sm hover:shadow-md transition-shadow"
                    >
                      {/* Top Order Metadata Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#d2d2d7]/40 gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#1d1d1f] text-sm sm:text-base">
                              #{order.orderNumber}
                            </span>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {order.paymentStatus === 'PAID' ? '100% Prepaid (Verified)' : order.paymentStatus}
                            </span>
                          </div>
                          <p className="text-xs text-[#86868b] mt-1">
                            Placed on {formatDate(order.createdAt)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[11px] font-semibold px-3 py-1 rounded-full border ${
                              order.orderStatus === 'DELIVERED'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : order.orderStatus === 'SHIPPED'
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : order.orderStatus === 'CONFIRMED'
                                ? 'bg-amber-50 text-amber-900 border-amber-200'
                                : 'bg-[#f5f5f7] text-[#1d1d1f] border-[#d2d2d7]'
                            }`}
                          >
                            Status: {order.orderStatus}
                          </span>
                        </div>
                      </div>

                      {/* 5-Stage Live Fulfillment Timeline */}
                      <div className="bg-[#f9f9fb] border border-[#e5e5ea] rounded-[16px] p-4 space-y-3">
                        <div className="flex items-center justify-between text-xs font-semibold text-[#1d1d1f]">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Live Fulfillment Progress</span>
                          </span>
                          {order.trackingNumber && (
                            <span className="text-[11px] font-mono text-[#0071e3] font-medium">
                              {order.carrier || 'Delhivery Insured Air'} • AWB: {order.trackingNumber}
                            </span>
                          )}
                        </div>

                        {/* Progress Tracker Bar */}
                        <div className="grid grid-cols-5 gap-1.5 text-center pt-1">
                          {[
                            { name: 'Prepaid', desc: 'Verified 24/7' },
                            { name: '12:30 AM Batch', desc: 'Reconciled' },
                            { name: 'Packaging', desc: 'Solid Glass' },
                            { name: 'In Transit', desc: 'Insured Air' },
                            { name: 'Delivered', desc: 'Intact Seal' },
                          ].map((step, idx) => {
                            const isCompleted = stage >= idx + 1;
                            const isCurrent = stage === idx + 1;
                            return (
                              <div key={step.name} className="space-y-1">
                                <div
                                  className={`h-1.5 rounded-full transition-all ${
                                    isCompleted
                                      ? 'bg-amber-500'
                                      : 'bg-[#d2d2d7]'
                                  }`}
                                />
                                <p
                                  className={`text-[10px] font-semibold leading-tight ${
                                    isCurrent
                                      ? 'text-amber-800 font-bold'
                                      : isCompleted
                                      ? 'text-[#1d1d1f]'
                                      : 'text-[#86868b]'
                                  }`}
                                >
                                  {step.name}
                                </p>
                                <p className="text-[9px] text-[#86868b] hidden sm:block">
                                  {step.desc}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Line Items */}
                      <div className="divide-y divide-[#d2d2d7]/30 text-xs">
                        {order.items.map((item) => (
                          <div key={item.id} className="py-2.5 flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-[#1d1d1f]">{item.productName}</p>
                              <p className="text-[11px] text-[#86868b] font-mono">
                                SKU: {item.sku} • Qty: {item.quantity}
                              </p>
                            </div>
                            <span className="font-semibold text-[#1d1d1f]">
                              {formatCurrency(item.total)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Pricing Breakdown Summary */}
                      <div className="bg-[#f5f5f7]/60 rounded-[14px] p-3.5 space-y-1.5 text-xs text-[#6e6e73] border border-[#d2d2d7]/40">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span className="text-[#1d1d1f] font-medium">{formatCurrency(order.subtotal)}</span>
                        </div>
                        {order.discountAmount > 0 && (
                          <div className="flex justify-between text-emerald-700 font-semibold">
                            <span>Coupon Discount ({order.couponCode || 'APPLIED'}):</span>
                            <span>-{formatCurrency(order.discountAmount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Express Courier Shipping (Insured Air):</span>
                          <span className="text-[#1d1d1f] font-medium">
                            {formatCurrency(order.shippingCost || 7000)} + 18% GST ({formatCurrency(order.shippingGst || 1260)})
                          </span>
                        </div>
                        {order.platformFee && (
                          <div className="flex justify-between">
                            <span>Convenience &amp; Platform Fee:</span>
                            <span className="text-[#1d1d1f] font-medium">
                              {formatCurrency(order.platformFee)} + 18% GST ({formatCurrency(order.platformFeeGst || 360)})
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm font-bold text-[#1d1d1f] pt-2 border-t border-[#d2d2d7]/50">
                          <span>Total Paid:</span>
                          <span className="font-mono text-amber-700">{formatCurrency(order.totalAmount)}</span>
                        </div>
                      </div>

                      {/* Bottom Actions Row */}
                      <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-3">
                        <div className="text-[11px] text-[#86868b]">
                          Destination: <strong className="text-[#1d1d1f]">{order.shippingAddress.city}, {order.shippingAddress.state}</strong> ({order.shippingAddress.postalCode})
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/invoice/${order.orderNumber}`}
                            target="_blank"
                            className="px-3.5 py-1.5 text-xs font-semibold rounded-full bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Download official GST Tax Invoice"
                          >
                            <FileText className="w-3.5 h-3.5 text-amber-700" />
                            <span>Tax Invoice (PDF)</span>
                          </Link>

                          <button
                            type="button"
                            onClick={() => setClaimOrderId(order.orderNumber)}
                            className="px-3.5 py-1.5 text-xs font-medium rounded-full border border-[#d2d2d7] text-[#1d1d1f] hover:bg-[#f5f5f7] cursor-pointer transition-colors"
                          >
                            Breakage Claim Guarantee
                          </button>

                          <Link
                            href="/support"
                            className="px-3.5 py-1.5 text-xs font-medium rounded-full bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed] transition-colors"
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
            <div className="bg-white rounded-[24px] border border-[#d2d2d7]/60 p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-[#1d1d1f]">Instant Courier &amp; Order Lookup</h3>
                <p className="text-xs text-[#6e6e73]">
                  Enter your Order Number (e.g. SG-2026-6572) or courier tracking number to inspect real-time dispatch progress.
                </p>
              </div>

              <form onSubmit={handleTrackDirectOrder} className="flex gap-2 max-w-lg">
                <input
                  type="text"
                  required
                  value={trackNumberInput}
                  onChange={(e) => setTrackNumberInput(e.target.value)}
                  placeholder="e.g. SG-2026-6572 or DEL-AIR-..."
                  className="flex-1 h-11 px-3.5 text-xs font-mono rounded-[12px] border border-[#d2d2d7] bg-[#f5f5f7]/60 text-[#1d1d1f] focus:outline-none focus:bg-white focus:border-[#0071e3]"
                />
                <button
                  type="submit"
                  disabled={trackLoading || !trackNumberInput.trim()}
                  className="px-5 h-11 rounded-[12px] bg-[#1d1d1f] hover:bg-black text-white text-xs font-semibold cursor-pointer disabled:opacity-40 transition-all flex items-center gap-1.5"
                >
                  {trackLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>Search</span>
                </button>
              </form>

              {trackError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{trackError}</span>
                </div>
              )}

              {trackedOrder && (
                <div className="p-5 rounded-[18px] bg-[#f9f9fb] border border-[#e5e5ea] space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-[#e5e5ea]">
                    <div>
                      <span className="font-mono font-bold text-sm text-[#1d1d1f]">#{trackedOrder.orderNumber}</span>
                      <p className="text-xs text-[#86868b]">{trackedOrder.customerName} • Placed {formatDate(trackedOrder.createdAt)}</p>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {trackedOrder.orderStatus}
                    </span>
                  </div>

                  <div className="text-xs space-y-1.5">
                    <p className="text-[#1d1d1f] font-medium">
                      Carrier: <strong>{trackedOrder.carrier || 'Delhivery Insured Air'}</strong>
                    </p>
                    {trackedOrder.trackingNumber ? (
                      <p className="text-[#0071e3] font-mono">
                        AWB Tracking Number: <strong>{trackedOrder.trackingNumber}</strong>
                      </p>
                    ) : (
                      <p className="text-[#86868b]">Scheduled for 12:30 AM IST warehouse batch queue reconciliation</p>
                    )}
                    <p className="text-[#86868b]">
                      Delivery Address: {trackedOrder.shippingAddress.street}, {trackedOrder.shippingAddress.city}, {trackedOrder.shippingAddress.state} - {trackedOrder.shippingAddress.postalCode}
                    </p>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <Link
                      href={`/invoice/${trackedOrder.orderNumber}`}
                      target="_blank"
                      className="px-4 py-1.5 text-xs font-semibold rounded-full bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-700" />
                      <span>View GST Invoice</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Delivery Addresses View */}
          {activeTab === 'ADDRESSES' && (
            <div className="space-y-4">
              {orders.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {orders.map((order, idx) => (
                    <div
                      key={order.id}
                      className="bg-white rounded-[20px] border border-[#d2d2d7]/50 p-6 space-y-3 shadow-sm"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-[#d2d2d7]/30">
                        <span className="text-xs font-semibold text-[#1d1d1f] flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-amber-600" />
                          <span>Saved Destination (Order #{order.orderNumber})</span>
                        </span>
                        {idx === 0 && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Most Recent
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#1d1d1f] space-y-1">
                        <p className="font-semibold">{order.shippingAddress.fullName || order.customerName}</p>
                        <p className="text-[#6e6e73] leading-relaxed">
                          {order.shippingAddress.street}
                        </p>
                        <p className="text-[#6e6e73]">
                          {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}
                        </p>
                        <p className="text-[#86868b] font-mono">{order.shippingAddress.phone || order.customerPhone}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-[20px] border border-[#d2d2d7]/50 p-8 text-center text-xs text-[#86868b]">
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
