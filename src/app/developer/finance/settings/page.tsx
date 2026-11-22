'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Radio,
  Sliders,
  Calculator,
  RefreshCw,
  Clock,
  Layers,
  ArrowUpRight,
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
  const [initialJson, setInitialJson] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'platform' | 'delivery' | 'product' | 'visibility' | 'business' | 'history'>('platform');
  const [saveReason, setSaveReason] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Live Sync Telemetry
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [isLiveSyncing, setIsLiveSyncing] = useState(false);
  const [syncSecondsAgo, setSyncSecondsAgo] = useState(0);

  // Real-Time Order Simulator States
  const [simSubtotalRupees, setSimSubtotalRupees] = useState<number>(899);
  const [simDestination, setSimDestination] = useState<'INTRA_STATE' | 'INTER_STATE'>('INTRA_STATE');
  const [simPinEntered, setSimPinEntered] = useState<boolean>(true);

  // Load active configurations from server
  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    setIsLiveSyncing(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/developer/finance/settings', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Failed to load developer financial configuration');
      }
      const data = await res.json();
      if (data.settings) {
        setSettings(data.settings);
        if (!initialJson) {
          setInitialJson(JSON.stringify({ s: data.settings, p: data.businessProfile }));
        }
      }
      if (data.businessProfile) setProfile(data.businessProfile);
      if (data.history) setHistory(data.history);
      setLastSyncedAt(new Date());
      setSyncSecondsAgo(0);
    } catch (err: any) {
      if (!silent) {
        setErrorMessage(err.message || 'Error connecting to financial settings API');
      }
    } finally {
      setLoading(false);
      setIsLiveSyncing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Live Sync Heartbeat: tick seconds elapsed & poll server periodically if clean
  const hasUnsavedChanges = useMemo(() => {
    if (!settings || !profile || !initialJson) return false;
    return initialJson !== JSON.stringify({ s: settings, p: profile });
  }, [settings, profile, initialJson]);

  useEffect(() => {
    const secTimer = setInterval(() => {
      if (lastSyncedAt) {
        setSyncSecondsAgo(Math.floor((Date.now() - lastSyncedAt.getTime()) / 1000));
      }
    }, 1000);

    const pollTimer = setInterval(() => {
      // Auto-poll every 20s only if user doesn't have unsaved draft modifications
      if (!hasUnsavedChanges) {
        loadData(true);
      }
    }, 20000);

    return () => {
      clearInterval(secTimer);
      clearInterval(pollTimer);
    };
  }, [lastSyncedAt, hasUnsavedChanges]);

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
      setInitialJson(JSON.stringify({ s: data.settings, p: data.businessProfile }));
      setSaveReason('');
      setLastSyncedAt(new Date());
      setSyncSecondsAgo(0);
      loadData(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving financial settings');
    } finally {
      setSaving(false);
    }
  };

  // Real-Time High-Precision Sandbox Simulator Calculations
  const simCalculations = useMemo(() => {
    if (!settings) {
      return {
        productBasePaise: 0,
        productGstPaise: 0,
        productGrossPaise: 0,
        deliveryBasePaise: 0,
        deliveryGstPaise: 0,
        deliveryTotalPaise: 0,
        platformBasePaise: 0,
        platformGstPaise: 0,
        platformTotalPaise: 0,
        totalGstPaise: 0,
        grandTotalPaise: 0,
        merchantNetPaise: 0,
        platformRetainedPaise: 0,
      };
    }

    const orderGrossPaise = Math.round(Math.max(0, simSubtotalRupees) * 100);

    // 1. Product GST Calculation (HSN 0409)
    let productBasePaise = orderGrossPaise;
    let productGstPaise = 0;
    const isProductGstOn = settings.productGstEnabled && settings.defaultProductGstRate > 0;

    if (isProductGstOn) {
      const rate = settings.defaultProductGstRate;
      if (settings.productPricesGstInclusive) {
        // Base = Gross / (1 + rate / 100)
        productBasePaise = Math.round((orderGrossPaise * 100) / (100 + rate));
        productGstPaise = orderGrossPaise - productBasePaise;
      } else {
        productGstPaise = Math.round((orderGrossPaise * rate) / 100);
      }
    }
    const productGrossPaise = orderGrossPaise;

    // 2. Delivery Calculation (SAC 9965)
    let deliveryBasePaise = 0;
    let deliveryGstPaise = 0;
    let deliveryTotalPaise = 0;

    if (settings.deliveryEnabled && simPinEntered && orderGrossPaise > 0) {
      deliveryBasePaise = settings.deliveryFeePaise;
      if (settings.deliveryGstEnabled && settings.deliveryGstRate > 0) {
        deliveryGstPaise = Math.round((deliveryBasePaise * settings.deliveryGstRate) / 100);
      }
      deliveryTotalPaise = deliveryBasePaise + deliveryGstPaise;
    }

    // 3. Platform Technology Fee (SAC 9971)
    let platformBasePaise = 0;
    let platformGstPaise = 0;
    let platformTotalPaise = 0;

    if (settings.platformFeeEnabled && orderGrossPaise > 0) {
      if (settings.feeType === 'PERCENTAGE') {
        const raw = Math.round((orderGrossPaise * settings.feePercent) / 100);
        platformBasePaise = Math.max(settings.minFeePaise, Math.min(raw, settings.maxFeePaise));
      } else {
        platformBasePaise = settings.fixedFeePaise;
      }

      if (settings.platformGstEnabled && settings.platformGstRate > 0) {
        platformGstPaise = Math.round((platformBasePaise * settings.platformGstRate) / 100);
      }
      platformTotalPaise = platformBasePaise + platformGstPaise;
    }

    // 4. Consolidated Totals
    const totalGstPaise = productGstPaise + deliveryGstPaise + platformGstPaise;
    const grandTotalPaise = productGrossPaise + deliveryTotalPaise + platformTotalPaise;
    const merchantNetPaise = productGrossPaise + deliveryTotalPaise;
    const platformRetainedPaise = platformTotalPaise;

    return {
      productBasePaise,
      productGstPaise,
      productGrossPaise,
      deliveryBasePaise,
      deliveryGstPaise,
      deliveryTotalPaise,
      platformBasePaise,
      platformGstPaise,
      platformTotalPaise,
      totalGstPaise,
      grandTotalPaise,
      merchantNetPaise,
      platformRetainedPaise,
    };
  }, [settings, simSubtotalRupees, simDestination, simPinEntered]);

  return (
    <DashboardLayout role="DEVELOPER" title="Developer Finance Control Centre">
      <div className="space-y-6">

        {/* Top Header Banner & Live Sync Status */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white border border-stone-800 shadow-xl">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-[#0071e3] text-white text-[10px] font-bold tracking-wider uppercase font-mono">
                Fintech Engine v2.0
              </span>
              {settings && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active Config v{settings.version}
                </span>
              )}
              {hasUnsavedChanges && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ● Unsaved Draft Edits
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Financial Control Centre &amp; Dynamic Fee Hub</span>
            </h1>
            <p className="text-xs text-stone-400 max-w-2xl leading-relaxed">
              Authoritative parameters for per-order platform technology margins, statutory GST (HSN 0409 / SAC 9971), courier logistics, and client dashboard isolation.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Live Sync Status Indicator */}
            <div className="hidden sm:flex flex-col items-end text-right px-3 py-1.5 rounded-2xl bg-white/5 border border-white/10 text-xs">
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Live Data Sync</span>
              </div>
              <span className="text-[10px] text-stone-400">
                {isLiveSyncing ? 'Synchronizing...' : syncSecondsAgo === 0 ? 'Just now' : `${syncSecondsAgo}s ago`}
              </span>
            </div>

            <button
              type="button"
              onClick={() => loadData(false)}
              disabled={loading || saving}
              className="px-3.5 py-2.5 text-xs font-semibold rounded-2xl border border-stone-700 bg-stone-800 text-stone-200 hover:bg-stone-700 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Reload authoritative database configuration"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLiveSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>

            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              disabled={loading || saving || !hasUnsavedChanges}
              className={`px-5 py-2.5 text-xs font-semibold rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer ${
                hasUnsavedChanges
                  ? 'bg-[#0071e3] hover:bg-[#0077ed] text-white hover:scale-102 active:scale-98'
                  : 'bg-stone-800 text-stone-400 border border-stone-700 cursor-not-allowed opacity-60'
              }`}
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{hasUnsavedChanges ? 'Persist Updates' : 'Config Saved'}</span>
            </button>
          </div>
        </div>

        {/* Feedback Banners */}
        {saveSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{saveSuccess}</span>
            </div>
            <button type="button" onClick={() => setSaveSuccess(null)} className="text-xs text-emerald-700 underline font-semibold cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold">{errorMessage}</span>
            </div>
            <button type="button" onClick={() => setErrorMessage(null)} className="text-xs text-rose-700 underline font-semibold cursor-pointer">
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
                className={`px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
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
          <div className="py-24 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#0071e3] mx-auto" />
            <p className="text-xs text-[#86868b]">Loading authoritative financial settings...</p>
          </div>
        ) : settings && profile ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Main Configuration Card (2 cols) */}
            <div className="lg:col-span-2 space-y-6">

              {/* TAB 1: Platform Fee & GST */}
              {activeTab === 'platform' && (
                <div className="bg-white rounded-3xl border border-[#d2d2d7]/80 p-6 sm:p-7 space-y-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#d2d2d7]/50 pb-4">
                    <div>
                      <h2 className="text-sm font-bold text-[#1d1d1f] uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#0071e3]" />
                        <span>Platform Technology Service Fee</span>
                      </h2>
                      <p className="text-[11px] text-[#86868b] mt-0.5">
                        Charge per-order platform software, cloud infrastructure, and marketplace technology fees.
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
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setSettings({
                                  ...settings,
                                  fixedFeePaise: Math.round(Math.max(0, isNaN(val) ? 0 : val) * 100),
                                });
                              }}
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
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setSettings({
                                  ...settings,
                                  feePercent: Math.max(0, isNaN(val) ? 0 : val),
                                });
                              }}
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
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setSettings({
                                  ...settings,
                                  minFeePaise: Math.round(Math.max(0, isNaN(val) ? 0 : val) * 100),
                                });
                              }}
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
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setSettings({
                                  ...settings,
                                  maxFeePaise: Math.round(Math.max(0, isNaN(val) ? 0 : val) * 100),
                                });
                              }}
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
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  setSettings({ ...settings, platformGstRate: Math.max(0, isNaN(val) ? 0 : val) });
                                }}
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
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setSettings({
                              ...settings,
                              deliveryFeePaise: Math.round(Math.max(0, isNaN(val) ? 0 : val) * 100),
                            });
                          }}
                          className="w-full h-11 pl-8 pr-3.5 text-xs rounded-xl border border-[#d2d2d7] bg-white font-mono font-bold text-[#1d1d1f]"
                        />
                      </div>
                      <p className="text-[10px] text-[#86868b]">Used as fallback when live Delhivery courier quote is unavailable.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-stone-700">Delivery GST Rate (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="28"
                          value={settings.deliveryGstRate}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setSettings({ ...settings, deliveryGstRate: Math.max(0, isNaN(val) ? 0 : val) });
                          }}
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
                          className="w-full h-10 px-3 text-xs rounded-xl border border-[#d2d2d7] bg-white cursor-pointer font-medium"
                        >
                          <option value="YES">Enabled (18% GST SAC 9965)</option>
                          <option value="NO">Disabled (0% Tax / Exempt)</option>
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

              {/* TAB 3: Product GST Classification & Master Switch */}
              {activeTab === 'product' && (
                <div className="bg-white rounded-3xl border border-[#d2d2d7]/80 p-6 sm:p-7 space-y-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#d2d2d7]/50 pb-4">
                    <div>
                      <h2 className="text-sm font-bold text-[#1d1d1f] uppercase tracking-wider flex items-center gap-2">
                        <Percent className="w-4 h-4 text-[#0071e3]" />
                        <span>Product GST (HSN 0409) Master Switch</span>
                      </h2>
                      <p className="text-[11px] text-[#86868b] mt-0.5">
                        Statutory GST classification for pure natural honey and agricultural apiary harvests.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.productGstEnabled}
                        onChange={(e) => setSettings({ ...settings, productGstEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0071e3]" />
                    </label>
                  </div>

                  <div className="space-y-4">
                    <div className={`p-4 rounded-2xl border text-xs space-y-2 transition-all ${
                      settings.productGstEnabled
                        ? 'bg-blue-50/60 border-blue-200 text-blue-950'
                        : 'bg-amber-50/70 border-amber-200/60 text-amber-900'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold">
                          {settings.productGstEnabled
                            ? 'Standard HSN 0409: Pure Natural Honey (Active)'
                            : 'Product GST Suppressed (Tax-Exempt Mode)'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full font-mono font-bold ${
                          settings.productGstEnabled
                            ? 'bg-[#0071e3]/10 text-[#0071e3]'
                            : 'bg-amber-500/20 text-amber-800'
                        }`}>
                          {settings.productGstEnabled ? `${settings.defaultProductGstRate}% GST` : '0% GST'}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-90">
                        {settings.productGstEnabled
                          ? 'Pure natural honey sold in retail packaged solid glass containers attracts 5% GST under HSN Chapter 0409 (CGST 2.5% + SGST 2.5%).'
                          : 'Product GST is completely disabled. Customer checkout will show 0% product tax, suppress the 5% GST badge, and omit tax lines.'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#1d1d1f]">Default Honey GST Rate (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="28"
                          value={settings.defaultProductGstRate}
                          disabled={!settings.productGstEnabled}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setSettings({
                              ...settings,
                              defaultProductGstRate: Math.max(0, isNaN(val) ? 0 : val),
                            });
                          }}
                          className="w-full h-11 px-3.5 text-xs rounded-xl border border-[#d2d2d7] font-mono font-bold disabled:opacity-50"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#1d1d1f]">Product Pricing Model</label>
                        <select
                          value={settings.productPricesGstInclusive ? 'INCLUSIVE' : 'EXCLUSIVE'}
                          disabled={!settings.productGstEnabled}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              productPricesGstInclusive: e.target.value === 'INCLUSIVE',
                            })
                          }
                          className="w-full h-11 px-3.5 text-xs rounded-xl border border-[#d2d2d7] bg-white cursor-pointer font-medium disabled:opacity-50"
                        >
                          <option value="INCLUSIVE">Tax-Inclusive (MRP includes GST, no extra charges)</option>
                          <option value="EXCLUSIVE">Tax-Exclusive (GST added on top of product price)</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#d2d2d7]/50 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-[#1d1d1f]">Customer Checkout Breakdown Disclosure</p>
                        <p className="text-[10px] text-[#86868b]">Display 5% GST badge and statutory tax lines to customers on checkout</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.customerGstBreakdownVisible}
                        onChange={(e) => setSettings({ ...settings, customerGstBreakdownVisible: e.target.checked })}
                        className="w-4 h-4 rounded text-[#0071e3] focus:ring-[#0071e3] cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: Client Admin Dashboard Isolation */}
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

              {/* TAB 5: Developer Entity Profile */}
              {activeTab === 'business' && (
                <div className="bg-white rounded-3xl border border-[#d2d2d7]/80 p-6 sm:p-7 space-y-6 shadow-sm">
                  <div className="border-b border-[#d2d2d7]/50 pb-4">
                    <h2 className="text-sm font-bold text-[#1d1d1f] uppercase tracking-wider flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#0071e3]" />
                      <span>Developer Platform Entity Profile</span>
                    </h2>
                    <p className="text-[11px] text-[#86868b] mt-0.5">
                      Statutory business details used on official B2B platform invoices and GSTR-1 filings.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-[#1d1d1f]">Legal Entity Name</label>
                      <input
                        type="text"
                        value={profile.legalName}
                        onChange={(e) => setProfile({ ...profile, legalName: e.target.value })}
                        className="w-full h-11 px-3.5 text-xs rounded-xl border border-[#d2d2d7] bg-white font-medium text-[#1d1d1f]"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-[#1d1d1f]">Trade / Operating Name</label>
                      <input
                        type="text"
                        value={profile.tradeName || ''}
                        onChange={(e) => setProfile({ ...profile, tradeName: e.target.value })}
                        className="w-full h-11 px-3.5 text-xs rounded-xl border border-[#d2d2d7] bg-white font-medium text-[#1d1d1f]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#1d1d1f]">Supplier GSTIN</label>
                      <input
                        type="text"
                        placeholder="e.g. 27ABCDE1234F1Z5"
                        value={profile.gstin || ''}
                        onChange={(e) => setProfile({ ...profile, gstin: e.target.value.toUpperCase() })}
                        className="w-full h-11 px-3.5 text-xs rounded-xl border border-[#d2d2d7] bg-white font-mono font-bold uppercase"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#1d1d1f]">Income Tax PAN</label>
                      <input
                        type="text"
                        placeholder="e.g. ABCDE1234F"
                        value={profile.pan || ''}
                        onChange={(e) => setProfile({ ...profile, pan: e.target.value.toUpperCase() })}
                        className="w-full h-11 px-3.5 text-xs rounded-xl border border-[#d2d2d7] bg-white font-mono font-bold uppercase"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-[#1d1d1f]">Registered Address</label>
                      <input
                        type="text"
                        value={profile.address}
                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                        className="w-full h-11 px-3.5 text-xs rounded-xl border border-[#d2d2d7] bg-white text-xs font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#1d1d1f]">City</label>
                      <input
                        type="text"
                        value={profile.city}
                        onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                        className="w-full h-11 px-3.5 text-xs rounded-xl border border-[#d2d2d7] bg-white text-xs font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#1d1d1f]">State &amp; State Code</label>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={profile.state}
                          onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                          className="col-span-2 h-11 px-3 text-xs rounded-xl border border-[#d2d2d7] bg-white text-xs font-medium"
                        />
                        <input
                          type="text"
                          value={profile.stateCode}
                          onChange={(e) => setProfile({ ...profile, stateCode: e.target.value })}
                          className="h-11 px-2 text-xs rounded-xl border border-[#d2d2d7] bg-white font-mono font-bold text-center"
                        />
                      </div>
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
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setProfile({ ...profile, nextInvoiceSeq: isNaN(val) ? 1001 : Math.max(1, val) });
                        }}
                        className="w-full h-11 px-3.5 text-xs rounded-xl border border-[#d2d2d7] bg-white font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: Version History */}
              {activeTab === 'history' && (
                <div className="bg-white rounded-3xl border border-[#d2d2d7]/80 p-6 sm:p-7 space-y-4 shadow-sm">
                  <div className="border-b border-[#d2d2d7]/50 pb-3">
                    <h2 className="text-sm font-bold text-[#1d1d1f] uppercase tracking-wider flex items-center gap-2">
                      <History className="w-4 h-4 text-[#0071e3]" />
                      <span>Configuration Change History</span>
                    </h2>
                    <p className="text-[11px] text-[#86868b] mt-0.5">
                      Complete versioned audit trail of financial parameters with snapshot inspection.
                    </p>
                  </div>

                  {history.length === 0 ? (
                    <p className="text-xs text-[#86868b] italic py-8 text-center">
                      No previous configuration versions recorded yet. Current active version is v{settings.version}.
                    </p>
                  ) : (
                    <div className="divide-y divide-[#d2d2d7]/40 text-xs">
                      {history.map((h) => (
                        <div key={h.id} className="py-3.5 flex items-center justify-between gap-4">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#1d1d1f] font-mono">Version v{h.version}</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-stone-100 text-stone-600 font-mono">
                                Snapshot
                              </span>
                            </div>
                            <p className="text-[11px] text-[#86868b]">{h.reason || 'Financial configuration updated'}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] font-mono text-stone-500 block">
                              {new Date(h.createdAt).toLocaleString('en-IN')}
                            </span>
                            <p className="text-[10px] text-stone-700 font-semibold">{h.updatedBy}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Sidebar Real-Time Interactive Sandbox Order Simulator */}
            <div className="space-y-4">
              <div className="bg-white rounded-3xl border border-[#d2d2d7]/90 p-5 sm:p-6 space-y-5 shadow-sm sticky top-6">
                
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#d2d2d7]/50">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center font-bold">
                      <Calculator className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-[#1d1d1f] uppercase tracking-wider">
                        Live Order Simulator
                      </h3>
                      <p className="text-[10px] text-[#86868b]">Real-time quote sandbox</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                    Active
                  </span>
                </div>

                {/* Simulator Controls */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                      Sample Honey Order Value:
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap mb-2">
                      {[199, 499, 749, 899, 1499].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setSimSubtotalRupees(amt)}
                          className={`px-2 py-1 text-[11px] font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                            simSubtotalRupees === amt
                              ? 'bg-[#1d1d1f] text-white border-[#1d1d1f]'
                              : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          ₹{amt}
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-500 font-mono">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={simSubtotalRupees}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setSimSubtotalRupees(Math.max(0, isNaN(val) ? 0 : val));
                        }}
                        className="w-full h-9 pl-7 pr-3 text-xs rounded-xl border border-[#d2d2d7] bg-[#f5f5f7] font-mono font-bold text-[#1d1d1f]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setSimPinEntered(!simPinEntered)}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        simPinEntered
                          ? 'border-[#0071e3] bg-[#0071e3]/5 text-[#0071e3] font-bold'
                          : 'border-stone-200 bg-stone-50 text-stone-500'
                      }`}
                    >
                      {simPinEntered ? '✓ PIN 411001 Entered' : 'PIN Pending'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimDestination(simDestination === 'INTRA_STATE' ? 'INTER_STATE' : 'INTRA_STATE')}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                        simDestination === 'INTRA_STATE'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                          : 'border-purple-500 bg-purple-50 text-purple-800'
                      }`}
                    >
                      {simDestination === 'INTRA_STATE' ? 'Intra-State (MH)' : 'Inter-State (IGST)'}
                    </button>
                  </div>
                </div>

                {/* Real-time Order Summary Preview */}
                <div className="p-4 rounded-2xl bg-[#f5f5f7] border border-[#d2d2d7] space-y-2.5 text-xs">
                  <div className="flex justify-between items-center text-stone-700">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold">Items Total</span>
                      {settings.productGstEnabled && settings.customerGstBreakdownVisible && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-white text-stone-800 font-mono font-bold border border-stone-200">
                          {settings.defaultProductGstRate}% GST
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-bold text-[#1d1d1f]">
                      {formatCurrency(simCalculations.productGrossPaise)}
                    </span>
                  </div>

                  {settings.productGstEnabled && settings.customerGstBreakdownVisible && (
                    <p className="text-[10px] text-stone-500">
                      Base: {formatCurrency(simCalculations.productBasePaise)} + {settings.defaultProductGstRate}% GST: {formatCurrency(simCalculations.productGstPaise)}
                    </p>
                  )}

                  <div className="flex justify-between items-center text-stone-700 pt-1.5 border-t border-stone-200/80">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold">Shipping &amp; Delivery</span>
                      {settings.deliveryEnabled && settings.deliveryGstEnabled && simPinEntered && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-white text-stone-800 font-mono font-bold border border-stone-200">
                          {settings.deliveryGstRate}% GST
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-bold text-[#1d1d1f]">
                      {simPinEntered ? formatCurrency(simCalculations.deliveryTotalPaise) : 'Pending PIN'}
                    </span>
                  </div>

                  {settings.platformFeeEnabled && (
                    <div className="flex justify-between items-center text-stone-700 pt-1.5 border-t border-stone-200/80">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold">Platform Tech Fee</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-white text-stone-800 font-mono font-bold border border-stone-200">
                          SAC 9971
                        </span>
                      </div>
                      <span className="font-mono font-bold text-[#1d1d1f]">
                        {formatCurrency(simCalculations.platformTotalPaise)}
                      </span>
                    </div>
                  )}

                  {/* Statutory Tax Summary (if taxes active) */}
                  {simCalculations.totalGstPaise > 0 && settings.customerGstBreakdownVisible && (
                    <div className="pt-2 border-t border-stone-200 space-y-1 text-[10px] text-stone-600 bg-white/60 p-2 rounded-xl">
                      <span className="font-bold text-stone-800 block">Statutory GST Breakdown:</span>
                      {settings.productGstEnabled && simCalculations.productGstPaise > 0 && (
                        <div className="flex justify-between">
                          <span>Honey ({settings.defaultProductGstRate}%):</span>
                          <span className="font-mono font-semibold">{formatCurrency(simCalculations.productGstPaise)}</span>
                        </div>
                      )}
                      {settings.deliveryEnabled && simCalculations.deliveryGstPaise > 0 && (
                        <div className="flex justify-between">
                          <span>Freight ({settings.deliveryGstRate}%):</span>
                          <span className="font-mono font-semibold">{formatCurrency(simCalculations.deliveryGstPaise)}</span>
                        </div>
                      )}
                      {settings.platformFeeEnabled && simCalculations.platformGstPaise > 0 && (
                        <div className="flex justify-between">
                          <span>Platform ({settings.platformGstRate}%):</span>
                          <span className="font-mono font-semibold">{formatCurrency(simCalculations.platformGstPaise)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Grand Total */}
                  <div className="flex justify-between items-baseline pt-2 border-t border-stone-300 font-bold text-[#1d1d1f]">
                    <span>Total Payable:</span>
                    <span className="font-mono text-base text-[#0071e3]">
                      {formatCurrency(simCalculations.grandTotalPaise)}
                    </span>
                  </div>
                </div>

                {/* Internal Merchant P&L Split */}
                <div className="p-3.5 rounded-2xl bg-stone-900 text-white space-y-2 text-xs">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest font-mono">
                    Merchant Settlement Split
                  </p>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-stone-300">Client Store Payout:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {formatCurrency(simCalculations.merchantNetPaise)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-stone-800">
                    <span className="text-stone-300">Platform Retained Margin:</span>
                    <span className="font-mono font-bold text-blue-400">
                      {formatCurrency(simCalculations.platformRetainedPaise)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={loading || saving}
                  className="w-full py-3 px-4 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 hover:scale-101 active:scale-99"
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
                <label className="text-xs font-semibold text-stone-800">Reason for Change (Audit Trail)</label>
                <input
                  type="text"
                  placeholder="e.g. Adjusted product GST switch and delivery freight"
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
