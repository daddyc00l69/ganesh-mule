'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import {
  Settings,
  ShieldCheck,
  Save,
  RotateCcw,
  Sparkles,
  Percent,
  Truck,
  Eye,
  EyeOff,
  Building2,
  History,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Info,
  DollarSign,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { PlatformFinanceConfig, PlatformBusinessProfileConfig } from '@/lib/finance/settings-store';

export default function DeveloperFinanceSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [settings, setSettings] = useState<PlatformFinanceConfig | null>(null);
  const [profile, setProfile] = useState<PlatformBusinessProfileConfig | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<'platform' | 'delivery' | 'product' | 'visibility' | 'business' | 'history'>('platform');
  const [saveReason, setSaveReason] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Load active configurations from server
  const loadData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/developer/finance/settings', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Failed to load developer financial configuration');
      }
      const data = await res.json();
      if (data.settings) setSettings(data.settings);
      if (data.businessProfile) setProfile(data.businessProfile);
      if (data.history) setHistory(data.history);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error connecting to financial settings API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async () => {
    if (!settings || !profile) return;
    setSaving(true);
    setSaveSuccess(null);
    setErrorMessage(null);
    setShowConfirmModal(false);

    try {
      const res = await fetch('/api/developer/finance/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings,
          businessProfile: profile,
          reason: saveReason.trim() || 'Financial parameters updated via Developer Control Centre',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update financial settings');
      }

      setSaveSuccess(`Version ${data.settings.version} successfully persisted to database.`);
      setSettings(data.settings);
      setProfile(data.businessProfile);
      setSaveReason('');
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving financial settings');
    } finally {
      setSaving(false);
    }
  };

  // Live simulation of platform fee calculation
  const sampleOrderPaise = 89900; // ₹899.00
  let previewPlatformBasePaise = 0;
  if (settings?.platformFeeEnabled) {
    if (settings.feeType === 'PERCENTAGE') {
      const calc = Math.round((sampleOrderPaise * settings.feePercent) / 100);
      previewPlatformBasePaise = Math.max(settings.minFeePaise, Math.min(calc, settings.maxFeePaise));
    } else {
      previewPlatformBasePaise = settings.fixedFeePaise;
    }
  }
  const previewPlatformGstPaise = settings?.platformGstEnabled
    ? Math.round((previewPlatformBasePaise * (settings.platformGstRate || 18)) / 100)
    : 0;
  const previewPlatformTotalPaise = previewPlatformBasePaise + previewPlatformGstPaise;

  return (
    <DashboardLayout role="DEVELOPER" title="Financial Settings & Fee Control">
      <div className="space-y-6">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#d2d2d7]/50">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center font-bold">
                <Settings className="w-4 h-4" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-[#1d1d1f]">
                Developer Financial Control Centre
              </h1>
              {settings && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Config v{settings.version}
                </span>
              )}
            </div>
            <p className="text-xs text-[#86868b] mt-1">
              Configure per-order platform tech fees, statutory GST parameters, delivery defaults, and client admin isolation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              disabled={loading || saving}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-[#d2d2d7] bg-white text-[#1d1d1f] hover:bg-[#f5f5f7] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Reset</span>
            </button>
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              disabled={loading || saving}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Changes</span>
            </button>
          </div>
        </div>

        {/* Feedback Banners */}
        {saveSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{saveSuccess}</span>
            </div>
            <button type="button" onClick={() => setSaveSuccess(null)} className="text-xs text-emerald-700 underline font-semibold">
              Dismiss
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold">{errorMessage}</span>
            </div>
            <button type="button" onClick={() => setErrorMessage(null)} className="text-xs text-rose-700 underline font-semibold">
              Dismiss
            </button>
          </div>
        )}

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 border-b border-[#d2d2d7]/40 text-xs">
          {[
            { id: 'platform', label: 'Platform Fee & GST', icon: Sparkles },
            { id: 'delivery', label: 'Delivery & Logistics', icon: Truck },
            { id: 'product', label: 'Product GST Classification', icon: Percent },
            { id: 'visibility', label: 'Client Admin Isolation', icon: EyeOff },
            { id: 'business', label: 'Platform Business Profile', icon: Building2 },
            { id: 'history', label: 'Change History', icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#1d1d1f] text-white shadow-xs'
                    : 'text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Loading Spinner */}
        {loading && !settings ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#0071e3] mx-auto" />
            <p className="text-xs text-[#86868b]">Loading authoritative financial settings...</p>
          </div>
        ) : settings && profile ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Main Configuration Card (2 cols) */}
            <div className="lg:col-span-2 space-y-6">

              {/* TAB 1: Platform Fee */}
              {activeTab === 'platform' && (
                <div className="bg-white rounded-3xl border border-[#d2d2d7]/80 p-6 sm:p-7 space-y-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#d2d2d7]/50 pb-4">
                    <div>
                      <h2 className="text-sm font-bold text-[#1d1d1f] uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#0071e3]" />
                        <span>Platform Technology Service Fee</span>
                      </h2>
                      <p className="text-[11px] text-[#86868b] mt-0.5">
                        Charge per-order platform infrastructure and marketplace technology fees.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.platformFeeEnabled}
                        onChange={(e) => setSettings({ ...settings, platformFeeEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0071e3]" />
                    </label>
                  </div>

                  {settings.platformFeeEnabled ? (
                    <div className="space-y-5 animate-in fade-in">
                      {/* Fee Mode (Fixed vs Percentage) */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-[#1d1d1f]">Fee Calculation Model</label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setSettings({ ...settings, feeType: 'FIXED' })}
                            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                              settings.feeType === 'FIXED'
                                ? 'border-[#0071e3] bg-[#0071e3]/5 ring-1 ring-[#0071e3]'
                                : 'border-[#d2d2d7] bg-[#f5f5f7] hover:border-stone-400'
                            }`}
                          >
                            <p className="text-xs font-bold text-[#1d1d1f]">Fixed Amount</p>
                            <p className="text-[10px] text-[#86868b] mt-0.5">Flat charge per order (default ₹30.00)</p>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSettings({ ...settings, feeType: 'PERCENTAGE' })}
                            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                              settings.feeType === 'PERCENTAGE'
                                ? 'border-[#0071e3] bg-[#0071e3]/5 ring-1 ring-[#0071e3]'
                                : 'border-[#d2d2d7] bg-[#f5f5f7] hover:border-stone-400'
                            }`}
                          >
                            <p className="text-xs font-bold text-[#1d1d1f]">Percentage Margin</p>
                            <p className="text-[10px] text-[#86868b] mt-0.5">Dynamic % of order value with min/max caps</p>
                          </button>
                        </div>
                      </div>

                      {/* Fee Controls */}
                      {settings.feeType === 'FIXED' ? (
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-[#1d1d1f]">Fixed Platform Fee (₹)</label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-500 font-mono">₹</span>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={settings.fixedFeePaise / 100}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  fixedFeePaise: Math.round(Math.max(0, parseFloat(e.target.value) || 0) * 100),
                                })
                              }
                              className="w-full h-11 pl-8 pr-3.5 text-xs rounded-xl border border-[#d2d2d7] bg-white font-mono font-bold text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                            />
                          </div>
                          <p className="text-[10px] text-[#86868b]">Default recommended: ₹30.00 per completed order.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[#1d1d1f]">Fee Percentage (%)</label>
                            <input
                              type="number"
                              min="0"
                              max="50"
                              step="0.1"
                              value={settings.feePercent}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  feePercent: Math.max(0, parseFloat(e.target.value) || 0),
                                })
                              }
                              className="w-full h-11 px-3.5 text-xs rounded-xl border border-[#d2d2d7] bg-white font-mono font-bold text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[#1d1d1f]">Min Floor Fee (₹)</label>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={settings.minFeePaise / 100}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  minFeePaise: Math.round(Math.max(0, parseFloat(e.target.value) || 0) * 100),
                                })
                              }
                              className="w-full h-11 px-3.5 text-xs rounded-xl border border-[#d2d2d7] bg-white font-mono font-bold text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[#1d1d1f]">Max Cap Fee (₹)</label>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={settings.maxFeePaise / 100}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  maxFeePaise: Math.round(Math.max(0, parseFloat(e.target.value) || 0) * 100),
                                })
                              }
                              className="w-full h-11 px-3.5 text-xs rounded-xl border border-[#d2d2d7] bg-white font-mono font-bold text-[#1d1d1f] focus:outline-none focus:border-[#0071e3]"
                            />
                          </div>
                        </div>
                      )}

                      {/* GST on Platform Fee */}
                      <div className="pt-4 border-t border-[#d2d2d7]/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-[#1d1d1f]">Apply GST on Platform Service Fee (SAC 9971)</p>
                            <p className="text-[10px] text-[#86868b]">18% Statutory GST on technology services (CGST 9% + SGST 9% or IGST 18%)</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.platformGstEnabled}
                            onChange={(e) => setSettings({ ...settings, platformGstEnabled: e.target.checked })}
                            className="w-4 h-4 rounded text-[#0071e3] focus:ring-[#0071e3] cursor-pointer"
                          />
                        </div>

                        {settings.platformGstEnabled && (
                          <div className="grid grid-cols-2 gap-3 pt-1">
                            <div className="space-y-1">
                              <label className="text-[11px] font-semibold text-stone-700">Platform GST Rate (%)</label>
                              <input
                                type="number"
                                min="0"
                                max="28"
                                value={settings.platformGstRate}
                                onChange={(e) =>
                                  setSettings({ ...settings, platformGstRate: parseFloat(e.target.value) || 18 })
                                }
                                className="w-full h-10 px-3 text-xs rounded-xl border border-[#d2d2d7] font-mono font-bold"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[11px] font-semibold text-stone-700">GST Treatment Mode</label>
                              <select
                                value={settings.platformGstInclusive ? 'INCLUSIVE' : 'EXCLUSIVE'}
                                onChange={(e) =>
                                  setSettings({
                                    ...settings,
                                    platformGstInclusive: e.target.value === 'INCLUSIVE',
                                  })
                                }
                                className="w-full h-10 px-3 text-xs rounded-xl border border-[#d2d2d7] bg-white cursor-pointer"
                              >
                                <option value="EXCLUSIVE">Tax-Exclusive (+18% added on top)</option>
                                <option value="INCLUSIVE">Tax-Inclusive (Extracted from fee)</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Customer Disclosure */}
                      <div className="pt-3 border-t border-[#d2d2d7]/50 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-[#1d1d1f]">Customer Checkout Disclosure</p>
                          <p className="text-[10px] text-[#86868b]">Display "Platform Technology Fee" explicitly on checkout summary ribbon</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.customerDisclosed}
                          onChange={(e) => setSettings({ ...settings, customerDisclosed: e.target.checked })}
                          className="w-4 h-4 rounded text-[#0071e3] focus:ring-[#0071e3] cursor-pointer"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-800 space-y-1">
                      <p className="font-semibold">Platform Fee Disabled</p>
                      <p className="text-[11px] text-amber-700">
                        Orders will process without adding platform service fees or platform GST to the customer total.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Delivery & Logistics */}
              {activeTab === 'delivery' && (
                <div className="bg-white rounded-3xl border border-[#d2d2d7]/80 p-6 sm:p-7 space-y-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#d2d2d7]/50 pb-4">
                    <div>
                      <h2 className="text-sm font-bold text-[#1d1d1f] uppercase tracking-wider flex items-center gap-2">
                        <Truck className="w-4 h-4 text-[#0071e3]" />
                        <span>Delivery & Logistics Configuration</span>
                      </h2>
                      <p className="text-[11px] text-[#86868b] mt-0.5">
                        Courier freight charges, Delhivery API integration, and statutory 18% freight GST.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.deliveryEnabled}
                        onChange={(e) => setSettings({ ...settings, deliveryEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0071e3]" />
                    </label>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#1d1d1f]">Default Courier Base Rate (₹)</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-500 font-mono">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={settings.deliveryFeePaise / 100}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              deliveryFeePaise: Math.round(Math.max(0, parseFloat(e.target.value) || 0) * 100),
                            })
                          }
                          className="w-full h-11 pl-8 pr-3.5 text-xs rounded-xl border border-[#d2d2d7] bg-white font-mono font-bold text-[#1d1d1f]"
                        />
                      </div>
                      <p className="text-[10px] text-[#86868b]">Used as fallback when live Delhivery API quote is unavailable.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-stone-700">Delivery GST Rate (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="28"
                          value={settings.deliveryGstRate}
                          onChange={(e) =>
                            setSettings({ ...settings, deliveryGstRate: parseFloat(e.target.value) || 18 })
                          }
                          className="w-full h-10 px-3 text-xs rounded-xl border border-[#d2d2d7] font-mono font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-stone-700">Delivery GST Applicability</label>
                        <select
                          value={settings.deliveryGstEnabled ? 'YES' : 'NO'}
                          onChange={(e) =>
                            setSettings({ ...settings, deliveryGstEnabled: e.target.value === 'YES' })
                          }
                          className="w-full h-10 px-3 text-xs rounded-xl border border-[#d2d2d7] bg-white cursor-pointer"
                        >
                          <option value="YES">Enabled (18% GST SAC 9965)</option>
                          <option value="NO">Disabled (0% Tax)</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#d2d2d7]/50 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-[#1d1d1f]">Customer Breakdown Visibility</p>
                        <p className="text-[10px] text-[#86868b]">Show Base Freight and 18% GST sub-details on checkout order summary</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.deliveryCustomerDisclosed}
                        onChange={(e) => setSettings({ ...settings, deliveryCustomerDisclosed: e.target.checked })}
                        className="w-4 h-4 rounded text-[#0071e3] focus:ring-[#0071e3] cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Product GST */}
              {activeTab === 'product' && (
                <div className="bg-white rounded-3xl border border-[#d2d2d7]/80 p-6 sm:p-7 space-y-6 shadow-sm">
                  <div className="border-b border-[#d2d2d7]/50 pb-4">
                    <h2 className="text-sm font-bold text-[#1d1d1f] uppercase tracking-wider flex items-center gap-2">
                      <Percent className="w-4 h-4 text-[#0071e3]" />
                      <span>Product Tax Classification & Pricing</span>
                    </h2>
                    <p className="text-[11px] text-[#86868b] mt-0.5">
                      Statutory GST classification verified for pure natural honey and agricultural apiary harvests.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-900">Standard HSN 0409: Pure Natural Honey</span>
                        <span className="px-2 py-0.5 rounded-full font-mono font-bold bg-[#0071e3]/10 text-[#0071e3]">5% GST</span>
                      </div>
                      <p className="text-[11px] text-stone-600 leading-relaxed">
                        Pure natural honey sold in retail packaged solid glass containers attracts 5% GST under HSN Chapter 0409 (CGST 2.5% + SGST 2.5%).
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#1d1d1f]">Default Product GST Rate (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="28"
                          value={settings.defaultProductGstRate}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              defaultProductGstRate: parseFloat(e.target.value) || 5,
                            })
                          }
                          className="w-full h-11 px-3.5 text-xs rounded-xl border border-[#d2d2d7] font-mono font-bold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#1d1d1f]">Product Pricing Model</label>
                        <select
                          value={settings.productPricesGstInclusive ? 'INCLUSIVE' : 'EXCLUSIVE'}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              productPricesGstInclusive: e.target.value === 'INCLUSIVE',
                            })
                          }
                          className="w-full h-11 px-3.5 text-xs rounded-xl border border-[#d2d2d7] bg-white cursor-pointer font-medium"
                        >
                          <option value="INCLUSIVE">Tax-Inclusive (MRP includes GST, no extra charges)</option>
                          <option value="EXCLUSIVE">Tax-Exclusive (GST added on top of product price)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: Client Admin Isolation & Visibility */}
              {activeTab === 'visibility' && (
                <div className="bg-white rounded-3xl border border-[#d2d2d7]/80 p-6 sm:p-7 space-y-6 shadow-sm">
                  <div className="border-b border-[#d2d2d7]/50 pb-4">
                    <h2 className="text-sm font-bold text-[#1d1d1f] uppercase tracking-wider flex items-center gap-2">
                      <EyeOff className="w-4 h-4 text-[#0071e3]" />
                      <span>Client Admin Dashboard Isolation</span>
                    </h2>
                    <p className="text-[11px] text-[#86868b] mt-0.5">
                      Configure what the client business owner sees in their `/admin` portal vs confidential developer platform earnings.
                    </p>
                  </div>

                  <div className="space-y-3 divide-y divide-[#d2d2d7]/40">
                    <div className="pt-2 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-[#1d1d1f]">Show Platform Service Fee to Client Admin</p>
                        <p className="text-[10px] text-[#86868b]">If enabled, client admin can view the platform tech fee line item.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.showPlatformFeeToClient}
                        onChange={(e) => setSettings({ ...settings, showPlatformFeeToClient: e.target.checked })}
                        className="w-4 h-4 rounded text-[#0071e3] cursor-pointer"
                      />
                    </div>

                    <div className="pt-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-[#1d1d1f]">Show Platform Fee GST to Client Admin</p>
                        <p className="text-[10px] text-[#86868b]">Displays statutory GST on platform service fees in client admin reports.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.showPlatformGstToClient}
                        onChange={(e) => setSettings({ ...settings, showPlatformGstToClient: e.target.checked })}
                        className="w-4 h-4 rounded text-[#0071e3] cursor-pointer"
                      />
                    </div>

                    <div className="pt-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-[#1d1d1f]">Show Courier Delivery Charges to Client Admin</p>
                        <p className="text-[10px] text-[#86868b]">Allows client admin to see delivery freight breakdown.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.showDeliveryToClient}
                        onChange={(e) => setSettings({ ...settings, showDeliveryToClient: e.target.checked })}
                        className="w-4 h-4 rounded text-[#0071e3] cursor-pointer"
                      />
                    </div>

                    <div className="pt-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-[#1d1d1f]">Show Product GST Breakdown in Client Reports</p>
                        <p className="text-[10px] text-[#86868b]">Permits client CA to view statutory 5% honey GST reports in client admin.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.showProductGstBreakdown}
                        onChange={(e) => setSettings({ ...settings, showProductGstBreakdown: e.target.checked })}
                        className="w-4 h-4 rounded text-[#0071e3] cursor-pointer"
                      />
                    </div>

                    <div className="pt-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-[#1d1d1f]">Expose Platform Revenue Analytics to Client Admin</p>
                        <p className="text-[10px] text-rose-600 font-bold">Strictly Restricted: Developer earnings remain confidential by default.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.showPlatformRevenueAnalytics}
                        onChange={(e) => setSettings({ ...settings, showPlatformRevenueAnalytics: e.target.checked })}
                        className="w-4 h-4 rounded text-[#0071e3] cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: Business Profile */}
              {activeTab === 'business' && (
                <div className="bg-white rounded-3xl border border-[#d2d2d7]/80 p-6 sm:p-7 space-y-6 shadow-sm">
                  <div className="border-b border-[#d2d2d7]/50 pb-4">
                    <h2 className="text-sm font-bold text-[#1d1d1f] uppercase tracking-wider flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#0071e3]" />
                      <span>Developer Platform Entity Profile</span>
                    </h2>
                    <p className="text-[11px] text-[#86868b] mt-0.5">
                      Legal entity details stamped on Platform Service Invoices issued to client businesses.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-[#1d1d1f]">Supplier Legal Entity Name</label>
                      <input
                        type="text"
                        value={profile.legalName}
                        onChange={(e) => setProfile({ ...profile, legalName: e.target.value })}
                        className="w-full h-11 px-3.5 text-xs rounded-xl border border-[#d2d2d7] bg-white font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#1d1d1f]">Trade / Brand Name</label>
                      <input
                        type="text"
                        value={profile.tradeName || ''}
                        onChange={(e) => setProfile({ ...profile, tradeName: e.target.value })}
                        className="w-full h-11 px-3.5 text-xs rounded-xl border border-[#d2d2d7] bg-white font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#1d1d1f]">Platform GSTIN (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. 27AAAAA0000A1Z5"
                        value={profile.gstin || ''}
                        onChange={(e) => setProfile({ ...profile, gstin: e.target.value.toUpperCase() || null })}
                        className="w-full h-11 px-3.5 text-xs rounded-xl border border-[#d2d2d7] bg-white font-mono font-bold uppercase"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-[#1d1d1f]">Registered Office Address</label>
                      <input
                        type="text"
                        value={profile.address}
                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                        className="w-full h-11 px-3.5 text-xs rounded-xl border border-[#d2d2d7] bg-white font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#1d1d1f]">Town / City</label>
                      <input
                        type="text"
                        value={profile.city}
                        onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                        className="w-full h-11 px-3.5 text-xs rounded-xl border border-[#d2d2d7] bg-white font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#1d1d1f]">PIN Code</label>
                      <input
                        type="text"
                        maxLength={6}
                        value={profile.pincode}
                        onChange={(e) => setProfile({ ...profile, pincode: e.target.value })}
                        className="w-full h-11 px-3.5 text-xs rounded-xl border border-[#d2d2d7] bg-white font-mono font-bold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#1d1d1f]">Invoice Prefix</label>
                      <input
                        type="text"
                        value={profile.invoicePrefix}
                        onChange={(e) => setProfile({ ...profile, invoicePrefix: e.target.value.toUpperCase() })}
                        className="w-full h-11 px-3.5 text-xs rounded-xl border border-[#d2d2d7] bg-white font-mono font-bold uppercase"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#1d1d1f]">Next Invoice Sequence</label>
                      <input
                        type="number"
                        value={profile.nextInvoiceSeq}
                        onChange={(e) => setProfile({ ...profile, nextInvoiceSeq: parseInt(e.target.value, 10) || 1001 })}
                        className="w-full h-11 px-3.5 text-xs rounded-xl border border-[#d2d2d7] bg-white font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: History */}
              {activeTab === 'history' && (
                <div className="bg-white rounded-3xl border border-[#d2d2d7]/80 p-6 sm:p-7 space-y-4 shadow-sm">
                  <div className="border-b border-[#d2d2d7]/50 pb-3">
                    <h2 className="text-sm font-bold text-[#1d1d1f] uppercase tracking-wider flex items-center gap-2">
                      <History className="w-4 h-4 text-[#0071e3]" />
                      <span>Configuration Change History</span>
                    </h2>
                    <p className="text-[11px] text-[#86868b] mt-0.5">
                      Complete versioned audit trail of financial parameters.
                    </p>
                  </div>

                  {history.length === 0 ? (
                    <p className="text-xs text-[#86868b] italic py-6 text-center">
                      No previous configuration versions recorded yet. Current version is v{settings.version}.
                    </p>
                  ) : (
                    <div className="divide-y divide-[#d2d2d7]/40 text-xs">
                      {history.map((h) => (
                        <div key={h.id} className="py-3 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-[#1d1d1f]">
                              Version {h.version}
                            </p>
                            <p className="text-[11px] text-[#86868b]">{h.reason || 'Settings update'}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-mono text-stone-500">
                              {new Date(h.createdAt).toLocaleString('en-IN')}
                            </span>
                            <p className="text-[10px] text-stone-600 font-semibold">{h.updatedBy}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Sidebar Live Preview Card (1 col) */}
            <div className="space-y-4">
              <div className="bg-white rounded-3xl border border-[#d2d2d7]/90 p-6 space-y-4 shadow-sm sticky top-6">
                <div className="flex items-center gap-2 pb-3 border-b border-[#d2d2d7]/50">
                  <DollarSign className="w-4 h-4 text-[#0071e3]" />
                  <h3 className="text-xs font-bold text-[#1d1d1f] uppercase tracking-wider">
                    Live Calculation Preview
                  </h3>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#f5f5f7] border border-[#d2d2d7] space-y-2.5 text-xs">
                  <div className="flex justify-between items-center text-stone-600">
                    <span>Sample Order Subtotal:</span>
                    <span className="font-mono font-bold text-[#1d1d1f]">{formatCurrency(sampleOrderPaise)}</span>
                  </div>

                  <div className="pt-2 border-t border-stone-200/80 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-stone-800">Platform Tech Fee:</span>
                      <span className="font-mono font-bold text-stone-900">
                        {settings.platformFeeEnabled ? formatCurrency(previewPlatformBasePaise) : '₹0.00 (Disabled)'}
                      </span>
                    </div>

                    {settings.platformGstEnabled && settings.platformFeeEnabled && (
                      <div className="flex justify-between items-center text-[11px] text-stone-500">
                        <span>Platform GST ({settings.platformGstRate}%):</span>
                        <span className="font-mono font-semibold">{formatCurrency(previewPlatformGstPaise)}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-1.5 border-t border-stone-200 font-bold text-[#0071e3]">
                      <span>Total Platform Margin:</span>
                      <span className="font-mono text-sm">{formatCurrency(previewPlatformTotalPaise)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-[11px] text-stone-600 space-y-1.5">
                  <p className="font-semibold text-stone-800 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Statutory Compliance Guarantee</span>
                  </p>
                  <p className="leading-relaxed">
                    Financial calculations evaluate using exact decimal arithmetic. Historical orders retain their immutable creation snapshots and are never recalculated.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={loading || saving}
                  className="w-full py-3 px-4 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Persist Configuration</span>
                </button>
              </div>
            </div>

          </div>
        ) : null}

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl border border-[#d2d2d7] p-6 max-w-md w-full space-y-4 shadow-2xl">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1d1d1f]">Confirm Financial Setting Updates</h3>
                  <p className="text-[11px] text-[#86868b]">This will create a new immutable version v{(settings?.version || 1) + 1}.</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-800">Reason for Change (Audit Log)</label>
                <input
                  type="text"
                  placeholder="e.g. Adjusted platform fee rate per CA advisory"
                  value={saveReason}
                  onChange={(e) => setSaveReason(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-[#d2d2d7] bg-white font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#d2d2d7] hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white cursor-pointer"
                >
                  Confirm &amp; Apply
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
