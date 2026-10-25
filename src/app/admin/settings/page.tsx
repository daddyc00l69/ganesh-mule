'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassInput } from '@/components/ui/glass-input';
import { GlassBadge } from '@/components/ui/glass-badge';
import { Check, ShieldCheck, CreditCard, MessageSquare, Save, Store, Truck, Percent, Mail, Clock, ExternalLink, Box, Sparkles, Search } from 'lucide-react';
import { DEFAULT_FEE_SETTINGS, FeeSettings } from '@/lib/config/fee-settings';

export default function AdminSettingsPage() {
  const [storeName, setStoreName] = useState('Ganesh Mule Pure Honey');
  const [supportEmail, setSupportEmail] = useState('support@ganeshmule.com');
  const [currency, setCurrency] = useState('INR');
  const [taxRate, setTaxRate] = useState(18.0);
  const [shippingRate, setShippingRate] = useState(70); // ₹70 base
  const [shippingGstRate, setShippingGstRate] = useState(18); // 18% GST
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(999);
  const [platformFee, setPlatformFee] = useState(20); // ₹20 base
  const [platformGstRate, setPlatformGstRate] = useState(18); // 18% GST
  const [pgPercent, setPgPercent] = useState(2.0); // 2% gateway
  const [feeMode, setFeeMode] = useState<'FLAT_20' | 'PERCENT_2' | 'BOTH'>('FLAT_20');
  const [chatwootEnabled, setChatwootEnabled] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  // Delhivery One State (https://one.delhivery.com)
  const [delhiveryApiKey, setDelhiveryApiKey] = useState('');
  const [delhiveryClientId, setDelhiveryClientId] = useState('GANESHMULE_ONE');
  const [delhiveryPickupLocation, setDelhiveryPickupLocation] = useState('Ganesh Mule Apiary Dispatch Center, Pune');
  const [delhiveryAutoShipping, setDelhiveryAutoShipping] = useState(true);
  const [delhiveryShippingMode, setDelhiveryShippingMode] = useState<'Express' | 'Surface'>('Express');
  const [delhiveryEnvironment, setDelhiveryEnvironment] = useState<'production' | 'staging'>('production');
  const [delhiveryTestPin, setDelhiveryTestPin] = useState('411001');
  const [delhiveryPinResult, setDelhiveryPinResult] = useState<any>(null);
  const [delhiveryCheckingPin, setDelhiveryCheckingPin] = useState(false);

  useEffect(() => {
    async function fetchFees() {
      try {
        const res = await fetch('/api/settings/fees');
        if (res.ok) {
          const data = await res.json();
          if (data?.settings) {
            const s: FeeSettings = data.settings;
            setShippingRate(s.shippingBaseFee / 100);
            setShippingGstRate(s.shippingGstRate);
            setFreeShippingThreshold(s.freeShippingThreshold / 100);
            setPlatformFee(s.platformBaseFee / 100);
            setPlatformGstRate(s.platformGstRate);
            setPgPercent(s.paymentGatewayPercent);
            setFeeMode(s.feeMode);
          }
        }
      } catch (err) {
        console.warn('Failed to load admin fee settings:', err);
      }
    }

    async function fetchDelhivery() {
      try {
        const res = await fetch('/api/shipping/delhivery/settings');
        if (res.ok) {
          const data = await res.json();
          if (data?.settings) {
            setDelhiveryApiKey(data.settings.apiKeyMasked || '');
            setDelhiveryClientId(data.settings.clientId || 'GANESHMULE_ONE');
            setDelhiveryPickupLocation(data.settings.pickupLocation || 'Ganesh Mule Apiary Dispatch Center, Pune');
            setDelhiveryAutoShipping(data.settings.autoShipping ?? true);
            setDelhiveryShippingMode(data.settings.shippingMode || 'Express');
            setDelhiveryEnvironment(data.settings.environment || 'production');
          }
        }
      } catch (err) {
        console.warn('Failed to load Delhivery settings:', err);
      }
    }

    fetchFees();
    fetchDelhivery();
  }, []);

  const handleTestDelhiveryPin = async () => {
    const clean = delhiveryTestPin.replace(/\D/g, '').slice(0, 6);
    if (clean.length < 6) return;
    setDelhiveryCheckingPin(true);
    setDelhiveryPinResult(null);
    try {
      const res = await fetch(`/api/shipping/delhivery/serviceability?pincode=${clean}`);
      const data = await res.json();
      if (data?.serviceability) {
        setDelhiveryPinResult(data.serviceability);
      } else {
        setDelhiveryPinResult({ error: data?.error || 'Verification failed' });
      }
    } catch (e: any) {
      setDelhiveryPinResult({ error: e.message });
    } finally {
      setDelhiveryCheckingPin(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await Promise.all([
        fetch('/api/settings/fees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shippingBaseFee: Math.round(shippingRate * 100),
            shippingGstRate,
            freeShippingThreshold: Math.round(freeShippingThreshold * 100),
            freeShippingEnabled: freeShippingThreshold > 0,
            platformBaseFee: Math.round(platformFee * 100),
            platformGstRate,
            platformFeeEnabled: platformFee > 0,
            paymentGatewayPercent: pgPercent,
            paymentGatewayGstRate: 18,
            feeMode,
            updatedBy: 'Super Admin',
          }),
        }),
        fetch('/api/shipping/delhivery/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey: delhiveryApiKey,
            clientId: delhiveryClientId,
            pickupLocation: delhiveryPickupLocation,
            autoShipping: delhiveryAutoShipping,
            shippingMode: delhiveryShippingMode,
            environment: delhiveryEnvironment,
          }),
        }),
      ]);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error('Error updating settings from admin:', err);
    }
  };

  return (
    <DashboardLayout role="ADMIN" title="Store & Integration Settings" userName="Super Admin">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          Platform Configuration
        </h2>
        <p className="text-xs text-muted-foreground">
          Configure business rules, tax rates, shipping calculation rules, and integration endpoints
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Business Profile */}
        <GlassCard variant="card" className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/40">
            <Store className="w-4 h-4 text-brand" />
            <h3 className="text-sm font-semibold text-foreground">General Store Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GlassInput
              label="Store Public Name"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
            />
            <GlassInput
              label="Primary Support Email"
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
            />
          </div>
        </GlassCard>

        {/* Taxes, Shipping & Statutory Gateway Fee Rules */}
        <GlassCard variant="card" className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-foreground">
                Shipping, Logistics &amp; Gateway Platform Fees
              </h3>
            </div>
            <GlassBadge variant="info" size="sm">
              Manager &amp; Admin Synced
            </GlassBadge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <GlassInput
              label="Shipping Base Rate (INR)"
              type="number"
              value={shippingRate}
              onChange={(e) => setShippingRate(Number(e.target.value))}
              hint="Base freight fee (Default: ₹70.00)"
            />
            <GlassInput
              label="Shipping GST Rate (%)"
              type="number"
              value={shippingGstRate}
              onChange={(e) => setShippingGstRate(Number(e.target.value))}
              hint="Statutory service tax (Default: 18%)"
            />
            <GlassInput
              label="Free Shipping Threshold (INR)"
              type="number"
              value={freeShippingThreshold}
              onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
              hint="Orders above this unlock free shipping (e.g. ₹999)"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <GlassInput
              label="Platform Fee Base (INR)"
              type="number"
              value={platformFee}
              onChange={(e) => setPlatformFee(Number(e.target.value))}
              hint="Convenience base charge (Default: ₹20.00)"
            />
            <GlassInput
              label="Platform Fee GST Rate (%)"
              type="number"
              value={platformGstRate}
              onChange={(e) => setPlatformGstRate(Number(e.target.value))}
              hint="Service tax on platform fee (Default: 18%)"
            />
            <GlassInput
              label="Payment Gateway Percent (%)"
              type="number"
              value={pgPercent}
              onChange={(e) => setPgPercent(Number(e.target.value))}
              hint="Razorpay gateway fee percent (Default: 2%)"
            />
          </div>

          <div className="p-3 bg-muted/40 rounded-xl flex items-center justify-between text-xs text-muted-foreground border border-border/30">
            <span>
              <strong>Effective Cost:</strong> Shipping: ₹{shippingRate} + 18% GST (₹{(shippingRate * 0.18).toFixed(2)}) = ₹{(shippingRate * 1.18).toFixed(2)} | Platform Fee: ₹{platformFee} + 18% GST (₹{(platformFee * 0.18).toFixed(2)}) = ₹{(platformFee * 1.18).toFixed(2)}
            </span>
          </div>
        </GlassCard>

        {/* Delhivery One Logistics Integration */}
        <GlassCard variant="card" className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-400" />
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span>Delhivery One Automated Shipping Engine</span>
                  <a
                    href="https://one.delhivery.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-brand hover:underline font-normal"
                  >
                    <span>one.delhivery.com</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </h3>
              </div>
            </div>
            <GlassBadge variant={delhiveryAutoShipping ? 'success' : 'outline'} size="sm">
              {delhiveryAutoShipping ? '⚡ Auto-Dispatch Active' : 'Manual Dispatch'}
            </GlassBadge>
          </div>

          <p className="text-xs text-muted-foreground">
            Connects to your unified enterprise account on <a href="https://one.delhivery.com" target="_blank" rel="noopener noreferrer" className="text-brand underline">Delhivery One</a> for automated AWB allocation, courier pickup booking, shipping label generation, and real-time tracking for solid glass packaging.
          </p>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-foreground block">Automatic Courier Booking Upon Payment</span>
              <span className="text-[11px] text-muted-foreground">
                When enabled, verified Razorpay payments immediately generate a Delhivery waybill and slot courier pickup.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={delhiveryAutoShipping}
                onChange={(e) => setDelhiveryAutoShipping(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GlassInput
              label="Delhivery One API Token"
              type="password"
              value={delhiveryApiKey}
              onChange={(e) => setDelhiveryApiKey(e.target.value)}
              placeholder="e.g. 7f20••••••••••••34a"
              hint="Generate from Delhivery One > Settings > API Credentials"
            />
            <GlassInput
              label="Client ID / Account Code"
              value={delhiveryClientId}
              onChange={(e) => setDelhiveryClientId(e.target.value)}
              placeholder="e.g. GANESHMULE_ONE"
              hint="Your registered Delhivery One corporate handle"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-foreground">Registered Pickup Warehouse Location</label>
              <GlassInput
                value={delhiveryPickupLocation}
                onChange={(e) => setDelhiveryPickupLocation(e.target.value)}
                placeholder="Ganesh Mule Apiary Dispatch Center, Pune"
                hint="Must match the warehouse name registered in Delhivery One portal"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Default Shipping Priority</label>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDelhiveryShippingMode('Express')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    delhiveryShippingMode === 'Express'
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-white/5 border-white/10 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Air Express (2-3d)
                </button>
                <button
                  type="button"
                  onClick={() => setDelhiveryShippingMode('Surface')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    delhiveryShippingMode === 'Surface'
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-white/5 border-white/10 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Surface (4-5d)
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Serviceability Check */}
          <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-brand" />
                <span>Test Delhivery One Pincode Serviceability &amp; Delivery Days</span>
              </span>
              <span className="text-[10px] text-muted-foreground">All India PIN Coverage</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                value={delhiveryTestPin}
                onChange={(e) => setDelhiveryTestPin(e.target.value)}
                placeholder="Enter 6-digit PIN"
                className="max-w-[160px] px-3 py-1.5 text-xs rounded-xl bg-white/5 border border-white/10 text-foreground font-mono focus:outline-none focus:border-primary"
              />
              <GlassButton
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestDelhiveryPin}
                isLoading={delhiveryCheckingPin}
              >
                Verify PIN
              </GlassButton>
            </div>

            {delhiveryPinResult && (
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs space-y-1 animate-in fade-in">
                {delhiveryPinResult.error ? (
                  <p className="text-destructive font-semibold">❌ {delhiveryPinResult.error}</p>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-emerald-400">
                        ✓ PIN {delhiveryPinResult.pincode}: Serviceable via {delhiveryPinResult.deliverySpeed}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Estimated Delivery: {delhiveryPinResult.expectedDeliveryDays} Business Days • Prepaid Policy: Active
                      </p>
                    </div>
                    <a
                      href="https://one.delhivery.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-brand hover:underline inline-flex items-center gap-1 shrink-0"
                    >
                      <span>Check on Delhivery One</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </GlassCard>

        {/* Payment Gateway Status (Razorpay) */}
        <GlassCard variant="card" className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-semibold text-foreground">Razorpay Payment Integration</h3>
            </div>
            <GlassBadge variant="success" size="sm">
              Operational (Test Mode)
            </GlassBadge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-xl glass-control space-y-1">
              <span className="text-muted-foreground font-medium">Public Client Key:</span>
              <p className="font-mono text-foreground font-semibold">rzp_test_YourTestKeyIdHere</p>
              <p className="text-[10px] text-muted-foreground">Safe for storefront client scripts</p>
            </div>
            <div className="p-3 rounded-xl glass-control space-y-1">
              <span className="text-muted-foreground font-medium">Server Secret & Webhook HMAC:</span>
              <p className="font-mono text-foreground font-semibold">••••••••••••••••••••</p>
              <p className="text-[10px] text-emerald-500">Configured in protected environment</p>
            </div>
          </div>
        </GlassCard>

        {/* Resend Email Delivery Engine */}
        <GlassCard variant="card" className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-foreground">Resend Transactional Email Engine</h3>
            </div>
            <GlassBadge variant="success" size="sm">
              API Active (8 Email Types)
            </GlassBadge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-xl glass-control space-y-1">
              <span className="text-muted-foreground font-medium">Resend API Key:</span>
              <p className="font-mono text-foreground font-semibold">re_•••••••• (Configured)</p>
              <p className="text-[10px] text-emerald-500">Live transactional delivery enabled</p>
            </div>
            <div className="p-3 rounded-xl glass-control space-y-1">
              <span className="text-muted-foreground font-medium">Verified Sender Address:</span>
              <p className="font-mono text-foreground font-semibold">Amber &amp; Glass &lt;onboarding@resend.dev&gt;</p>
              <p className="text-[10px] text-muted-foreground">Default development sandbox sender</p>
            </div>
            <div className="p-3 rounded-xl glass-control space-y-1">
              <span className="text-muted-foreground font-medium">Transactional Flows:</span>
              <p className="text-foreground font-semibold">Order Confirmed, Shipped, Delivered, Admin Reports</p>
              <p className="text-[10px] text-brand">Automated on checkout &amp; status transition</p>
            </div>
          </div>
        </GlassCard>

        {/* Warehouse Operational Schedule (IST) */}
        <GlassCard variant="card" className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-semibold text-foreground">Warehouse Fulfillment Schedule (Indian Standard Time)</h3>
            </div>
            <GlassBadge variant="info" size="sm">
              Prepaid Only • No COD
            </GlassBadge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-muted/30 border border-border/30">
              <span className="font-mono font-bold text-amber-500 text-[11px]">24/7 Continuous:</span>
              <p className="text-muted-foreground text-[11px] mt-0.5">Accept orders &amp; verify prepaid payments</p>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/30 border border-border/30">
              <span className="font-mono font-bold text-amber-500 text-[11px]">12:30 AM IST:</span>
              <p className="text-muted-foreground text-[11px] mt-0.5">Automated batch reconciliation &amp; queue</p>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/30 border border-border/30">
              <span className="font-mono font-bold text-amber-500 text-[11px]">09:00 AM IST:</span>
              <p className="text-muted-foreground text-[11px] mt-0.5">Employees start picking &amp; kraft packaging</p>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/30 border border-border/30">
              <span className="font-mono font-bold text-amber-500 text-[11px]">11:00 AM IST:</span>
              <p className="text-muted-foreground text-[11px] mt-0.5">Target first packing batch completion</p>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/30 border border-border/30">
              <span className="font-mono font-bold text-amber-500 text-[11px]">01:00 PM IST:</span>
              <p className="text-muted-foreground text-[11px] mt-0.5">Target Delhivery Insured Air courier pickup</p>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/30 border border-border/30">
              <span className="font-mono font-bold text-amber-500 text-[11px]">04:00 PM IST:</span>
              <p className="text-muted-foreground text-[11px] mt-0.5">Final same-day packing cutoff</p>
            </div>
          </div>
        </GlassCard>

        {/* Chatwoot Live Support Status */}
        <GlassCard variant="card" className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-semibold text-foreground">Chatwoot Live Customer Desk</h3>
            </div>
            <GlassBadge variant={chatwootEnabled ? 'success' : 'outline'} size="sm">
              {chatwootEnabled ? 'Connected & Live' : 'Disabled'}
            </GlassBadge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-xl glass-control space-y-1">
              <span className="text-muted-foreground font-medium">Chatwoot Endpoint:</span>
              <p className="font-mono text-foreground font-semibold">https://app.chatwoot.com</p>
              <p className="text-[10px] text-muted-foreground">Website widget inbox connected</p>
            </div>
            <div className="p-3 rounded-xl glass-control space-y-1">
              <span className="text-muted-foreground font-medium">Widget Channel Token:</span>
              <p className="font-mono text-foreground font-semibold">Configured (Client Safe)</p>
              <p className="text-[10px] text-muted-foreground">Provides live chat on storefront pages</p>
            </div>
          </div>
        </GlassCard>

        <div className="flex items-center justify-end gap-3 pt-2">
          {isSaved && (
            <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1 animate-in fade-in">
              <Check className="w-4 h-4" />
              <span>Settings successfully saved!</span>
            </span>
          )}
          <GlassButton type="submit" variant="primary" size="md" className="gap-2">
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </GlassButton>
        </div>
      </form>
    </DashboardLayout>
  );
}
