'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassInput } from '@/components/ui/glass-input';
import { GlassBadge } from '@/components/ui/glass-badge';
import { formatCurrency } from '@/lib/utils';
import {
  Truck,
  CreditCard,
  Percent,
  Calculator,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { FeeSettings, DEFAULT_FEE_SETTINGS, calculateOrderFees } from '@/lib/config/fee-settings';

export default function ManagerSettingsPage() {
  const [settings, setSettings] = useState<FeeSettings>(DEFAULT_FEE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states in user-friendly units (Rupees, Percentages)
  const [shippingRupees, setShippingRupees] = useState(70);
  const [shippingGst, setShippingGst] = useState(18);
  const [freeShippingThresholdRupees, setFreeShippingThresholdRupees] = useState(999);
  const [freeShippingEnabled, setFreeShippingEnabled] = useState(true);

  const [platformFeeRupees, setPlatformFeeRupees] = useState(20);
  const [platformGst, setPlatformGst] = useState(18);
  const [pgPercent, setPgPercent] = useState(2.0);
  const [pgGst, setPgGst] = useState(18);
  const [feeMode, setFeeMode] = useState<'FLAT_20' | 'PERCENT_2' | 'BOTH'>('FLAT_20');

  // Simulator test amount
  const [simCartSubtotalRupees, setSimCartSubtotalRupees] = useState(1000);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const res = await fetch('/api/settings/fees');
        const data = await res.json();
        if (data.success && data.settings) {
          const s = data.settings;
          setSettings(s);
          setShippingRupees(Math.round(s.shippingBaseFee / 100));
          setShippingGst(s.shippingGstRate);
          setFreeShippingThresholdRupees(Math.round(s.freeShippingThreshold / 100));
          setFreeShippingEnabled(s.freeShippingEnabled);

          setPlatformFeeRupees(Math.round(s.platformBaseFee / 100));
          setPlatformGst(s.platformGstRate);
          setPgPercent(s.paymentGatewayPercent);
          setPgGst(s.paymentGatewayGstRate);
          setFeeMode(s.feeMode);
        }
      } catch (err: any) {
        setErrorMsg('Failed to load active fee settings');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSaveSuccess(false);

    try {
      const payload: Partial<FeeSettings> = {
        shippingBaseFee: Math.round(shippingRupees * 100),
        shippingGstRate: Number(shippingGst),
        freeShippingThreshold: Math.round(freeShippingThresholdRupees * 100),
        freeShippingEnabled,
        platformBaseFee: Math.round(platformFeeRupees * 100),
        platformGstRate: Number(platformGst),
        paymentGatewayPercent: Number(pgPercent),
        paymentGatewayGstRate: Number(pgGst),
        feeMode,
      };

      const res = await fetch('/api/settings/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to commit updates');
      }

      setSettings(data.settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating fee parameters');
    } finally {
      setSaving(false);
    }
  };

  // Run live simulation on user-input subtotal
  const livePreviewSettings: FeeSettings = {
    ...settings,
    shippingBaseFee: Math.round(shippingRupees * 100),
    shippingGstRate: Number(shippingGst),
    freeShippingThreshold: Math.round(freeShippingThresholdRupees * 100),
    freeShippingEnabled,
    platformBaseFee: Math.round(platformFeeRupees * 100),
    platformGstRate: Number(platformGst),
    paymentGatewayPercent: Number(pgPercent),
    paymentGatewayGstRate: Number(pgGst),
    feeMode,
  };

  const simResult = calculateOrderFees(
    Math.round(simCartSubtotalRupees * 100),
    0,
    livePreviewSettings
  );

  return (
    <DashboardLayout
      role="MANAGER"
      title="Fees, Shipping & Gateway Charges"
      userName="Vikram Mehta"
    >
      <div className="space-y-6">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>Operational Charges &amp; GST Rates</span>
              <GlassBadge variant="info" size="sm">
                Manager Managed
              </GlassBadge>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure shipping freight, platform handling charges, payment gateway convenience fees, and 18% statutory GST rules.
            </p>
          </div>

          <div className="text-xs text-muted-foreground font-mono bg-card/60 px-3 py-1.5 rounded-lg border border-border/40">
            Last Updated: {new Date(settings.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} by {settings.updatedBy}
          </div>
        </div>

        {/* Success Alert */}
        {saveSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-medium">
              Fee parameters updated successfully! Checkout calculations and GST Tax Invoices are now using these settings.
            </span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Config Panels (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. SHIPPING CHARGES (70 + 18% GST) */}
            <GlassCard variant="card" className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Delivery &amp; Freight Charges
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Insured air cargo break-proof shipping parameters (SAC 9965)
                    </p>
                  </div>
                </div>
                <GlassBadge variant="default" size="sm">
                  ₹{shippingRupees} + {shippingGst}% GST
                </GlassBadge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <GlassInput
                  label="Base Shipping Charge (₹ INR)"
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={shippingRupees}
                  onChange={(e) => setShippingRupees(Number(e.target.value))}
                  hint="Base freight fee before GST (Default: ₹70.00)"
                />

                <GlassInput
                  label="Shipping GST Rate (%)"
                  type="number"
                  min="0"
                  max="28"
                  step="0.5"
                  required
                  value={shippingGst}
                  onChange={(e) => setShippingGst(Number(e.target.value))}
                  hint="Statutory service tax for freight (Standard: 18%)"
                />

                <GlassInput
                  label="Free Shipping Cart Value (₹ INR)"
                  type="number"
                  min="0"
                  step="10"
                  value={freeShippingThresholdRupees}
                  onChange={(e) => setFreeShippingThresholdRupees(Number(e.target.value))}
                  hint="Cart value above which shipping becomes FREE (₹999)"
                />

                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-medium text-foreground">Free Shipping Rule</label>
                  <label className="flex items-center gap-2.5 h-10 px-3 rounded-control border border-border/40 bg-card cursor-pointer">
                    <input
                      type="checkbox"
                      checked={freeShippingEnabled}
                      onChange={(e) => setFreeShippingEnabled(e.target.checked)}
                      className="rounded border-border text-brand focus:ring-brand w-4 h-4"
                    />
                    <span className="text-xs text-foreground font-medium">
                      Enable Free Shipping above ₹{freeShippingThresholdRupees}
                    </span>
                  </label>
                </div>
              </div>
            </GlassCard>

            {/* 2. PLATFORM & PAYMENT GATEWAY CHARGES */}
            <GlassCard variant="card" className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Platform Fee &amp; Payment Gateway Charges
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Digital convenience, payment processing, and checkout infrastructure fee (SAC 9971)
                    </p>
                  </div>
                </div>
                <GlassBadge variant="default" size="sm">
                  {feeMode === 'FLAT_20' && `Flat ₹${platformFeeRupees} + 18% GST`}
                  {feeMode === 'PERCENT_2' && `${pgPercent}% PG Fee + 18% GST`}
                  {feeMode === 'BOTH' && `Flat ₹${platformFeeRupees} + ${pgPercent}% PG`}
                </GlassBadge>
              </div>

              {/* Mode Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Fee Application Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFeeMode('FLAT_20')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      feeMode === 'FLAT_20'
                        ? 'border-brand bg-brand/10 text-foreground font-semibold shadow-xs'
                        : 'border-border/40 bg-card hover:bg-card/80 text-muted-foreground'
                    }`}
                  >
                    <p className="text-xs font-bold text-foreground">1. Flat Platform Fee</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      ₹{platformFeeRupees} flat + {platformGst}% GST per order
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFeeMode('PERCENT_2')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      feeMode === 'PERCENT_2'
                        ? 'border-brand bg-brand/10 text-foreground font-semibold shadow-xs'
                        : 'border-border/40 bg-card hover:bg-card/80 text-muted-foreground'
                    }`}
                  >
                    <p className="text-xs font-bold text-foreground">2. Payment Gateway %</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {pgPercent}% of cart + {pgGst}% GST on fee
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFeeMode('BOTH')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      feeMode === 'BOTH'
                        ? 'border-brand bg-brand/10 text-foreground font-semibold shadow-xs'
                        : 'border-border/40 bg-card hover:bg-card/80 text-muted-foreground'
                    }`}
                  >
                    <p className="text-xs font-bold text-foreground">3. Combined (Flat + %)</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      ₹{platformFeeRupees} flat + {pgPercent}% PG fee
                    </p>
                  </button>
                </div>
              </div>

              {/* Fee Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <GlassInput
                  label="Flat Platform Fee (₹ INR)"
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={platformFeeRupees}
                  onChange={(e) => setPlatformFeeRupees(Number(e.target.value))}
                  hint="Convenience charge for solid glass protection (Default: ₹20.00)"
                />

                <GlassInput
                  label="Platform Fee GST Rate (%)"
                  type="number"
                  min="0"
                  max="28"
                  step="0.5"
                  required
                  value={platformGst}
                  onChange={(e) => setPlatformGst(Number(e.target.value))}
                  hint="Statutory service tax for platform fee (Standard: 18%)"
                />

                <GlassInput
                  label="Gateway Fee Percentage (%)"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  required
                  value={pgPercent}
                  onChange={(e) => setPgPercent(Number(e.target.value))}
                  hint="Razorpay transaction charge rate (Default: 2.0%)"
                />

                <GlassInput
                  label="Gateway Fee GST Rate (%)"
                  type="number"
                  min="0"
                  max="28"
                  step="0.5"
                  required
                  value={pgGst}
                  onChange={(e) => setPgGst(Number(e.target.value))}
                  hint="GST on the payment gateway charge (Standard: 18%)"
                />
              </div>
            </GlassCard>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <GlassButton
                type="submit"
                variant="primary"
                size="md"
                isLoading={saving}
                className="gap-2 px-8"
              >
                <Save className="w-4 h-4" />
                <span>Save &amp; Apply Changes Live</span>
              </GlassButton>
            </div>
          </div>

          {/* Right Column: Live Simulator & Checkout Preview (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <GlassCard variant="card" className="space-y-4 sticky top-6">
              <div className="flex items-center justify-between pb-3 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-sm font-semibold text-foreground">Live Fee Simulator</h3>
                </div>
                <GlassBadge variant="success" size="sm">
                  Active Math
                </GlassBadge>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Test Cart Subtotal (₹ INR)</label>
                <input
                  type="number"
                  step="50"
                  min="100"
                  value={simCartSubtotalRupees}
                  onChange={(e) => setSimCartSubtotalRupees(Number(e.target.value))}
                  className="glass-input w-full h-10 px-3 text-xs rounded-control text-foreground font-mono bg-card"
                />
                <p className="text-[10px] text-muted-foreground">Adjust to see checkout price and tax splits live.</p>
              </div>

              {/* Breakdown Table */}
              <div className="p-3.5 rounded-xl bg-card/70 border border-border/40 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-muted-foreground">
                  <span>Cart Subtotal:</span>
                  <span>{formatCurrency(simResult.subtotal)}</span>
                </div>

                <div className="pt-2 border-t border-border/40 space-y-1">
                  <div className="flex justify-between text-foreground">
                    <span className="flex items-center gap-1 font-sans font-medium text-[11px]">
                      <Truck className="w-3 h-3 text-blue-500" /> Shipping Base:
                    </span>
                    <span>{simResult.isFreeShipping ? 'FREE' : formatCurrency(simResult.shippingBase)}</span>
                  </div>
                  {!simResult.isFreeShipping && simResult.shippingGst > 0 && (
                    <div className="flex justify-between text-[10px] text-muted-foreground pl-4">
                      <span>+ {shippingGst}% GST on Shipping:</span>
                      <span>+{formatCurrency(simResult.shippingGst)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[11px] font-semibold text-foreground">
                    <span>Shipping Total:</span>
                    <span>{simResult.isFreeShipping ? 'FREE' : formatCurrency(simResult.shippingTotal)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/40 space-y-1">
                  <div className="flex justify-between text-foreground">
                    <span className="flex items-center gap-1 font-sans font-medium text-[11px]">
                      <CreditCard className="w-3 h-3 text-amber-500" /> Platform Fee Base:
                    </span>
                    <span>{formatCurrency(simResult.platformBase)}</span>
                  </div>
                  {simResult.platformGst > 0 && (
                    <div className="flex justify-between text-[10px] text-muted-foreground pl-4">
                      <span>+ {platformGst}% GST on Platform:</span>
                      <span>+{formatCurrency(simResult.platformGst)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[11px] font-semibold text-foreground">
                    <span>Platform Fee Total:</span>
                    <span>{formatCurrency(simResult.platformTotal)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/40 space-y-1">
                  <div className="flex justify-between text-muted-foreground text-[10px]">
                    <span>Product GST (5% Honey):</span>
                    <span>{formatCurrency(simResult.productGst)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground text-[10px]">
                    <span>Total GST Collected:</span>
                    <span className="font-semibold text-foreground">{formatCurrency(simResult.totalTax)}</span>
                  </div>
                </div>

                <div className="pt-2.5 border-t-2 border-foreground/30 flex justify-between items-baseline text-sm font-bold text-foreground font-sans">
                  <span>Grand Total:</span>
                  <span className="text-base text-brand font-mono">{formatCurrency(simResult.grandTotal)}</span>
                </div>
              </div>

              {/* Explanatory Note */}
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-600 dark:text-blue-400 space-y-1 leading-relaxed">
                <p className="font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Statutory GST Compliance:
                </p>
                <p>
                  Shipping (SAC 9965) and Platform Convenience (SAC 9971) attract statutory 18% GST and will be itemized on the client&apos;s GST Tax Invoice.
                </p>
              </div>
            </GlassCard>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
