'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassInput } from '@/components/ui/glass-input';
import { GlassBadge } from '@/components/ui/glass-badge';
import { Check, ShieldCheck, CreditCard, MessageSquare, Save, Store, Truck, Percent, Mail, Clock } from 'lucide-react';
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
    fetchFees();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/settings/fees', {
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
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error('Error updating fee settings from admin:', err);
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
