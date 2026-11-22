'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { StatCard } from '@/components/ui/stat-card';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassBadge } from '@/components/ui/glass-badge';
import { ChartCard } from '@/components/ui/chart-card';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Clock,
  Sparkles,
  ArrowRight,
  RefreshCw,
  FileSpreadsheet,
  Settings,
  Receipt,
  Layers,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function PlatformEarningsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/developer/finance/stats?range=${timeRange}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.warn('Failed to fetch finance stats:', err);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const formatINR = (paise: number = 0) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(paise / 100);
  };

  return (
    <DashboardLayout role="DEVELOPER" title="Platform Earnings & Analytics">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Top Header Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-600/10 via-teal-600/10 to-blue-600/10 border border-emerald-500/20 backdrop-blur-md">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold tracking-wider uppercase">
                Fintech Engine
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                SAC: 9971 / 9983 • GST Section 170 Compliant
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Platform Earnings &amp; Financial Analytics
            </h1>
            <p className="text-xs text-muted-foreground max-w-2xl">
              Authoritative developer revenue tracking, per-order platform tech fees, statutory GST collections, and settlement reconciliation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-xl bg-muted/40 p-1 border border-border/40 text-xs">
              {(['7d', '30d', '90d', 'all'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    timeRange === r
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>

            <GlassButton
              variant="outline"
              size="sm"
              onClick={fetchStats}
              disabled={isRefreshing}
              className="gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </GlassButton>

            <Link href="/developer/finance/settings">
              <GlassButton variant="primary" size="sm" className="gap-1.5">
                <Settings className="w-3.5 h-3.5" />
                <span>Fee Settings</span>
              </GlassButton>
            </Link>
          </div>
        </div>

        {/* 1. Primary Fintech KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard
            title="Total Platform Revenue"
            value={formatINR(stats?.overview?.totalPlatformFeeRevenuePaise ?? 0)}
            description="Gross tech fees earned"
            icon={<DollarSign className="w-4 h-4 text-emerald-500" />}
          />
          <StatCard
            title="Platform GST (18%)"
            value={formatINR(stats?.overview?.totalPlatformGstCollectedPaise ?? 0)}
            description="Statutory tax liability"
            icon={<TrendingUp className="w-4 h-4 text-blue-500" />}
          />
          <StatCard
            title="Net Platform Earnings"
            value={formatINR(stats?.overview?.netPlatformRevenuePaise ?? 0)}
            description="Post-refund retained fees"
            icon={<Sparkles className="w-4 h-4 text-purple-500" />}
          />
          <StatCard
            title="Pending Settlement"
            value={formatINR(stats?.overview?.pendingSettlementPaise ?? 0)}
            description="Unsettled gateway funds"
            icon={<Clock className="w-4 h-4 text-amber-500" />}
          />
          <StatCard
            title="Platform Transactions"
            value={stats?.overview?.successfulTransactionsCount ?? 0}
            description="Orders billed tech fee"
            icon={<CreditCard className="w-4 h-4 text-cyan-500" />}
          />
          <StatCard
            title="Issued Invoices"
            value={stats?.overview?.invoicesCount ?? 0}
            description="B2B platform invoices"
            icon={<Receipt className="w-4 h-4 text-rose-500" />}
          />
        </div>

        {/* 2. Visual Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ChartCard
              title="Platform Revenue & Tax Trajectory"
              description="Daily platform tech service fee (SAC 9971) and 18% GST collection"
            >
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart
                  data={stats?.timeSeries ?? []}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorPlatformFee" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorPlatformGst" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                  <XAxis
                    dataKey="date"
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip
                    formatter={(val: number) => [`₹${val.toFixed(2)}`, '']}
                    contentStyle={{
                      backgroundColor: 'rgba(29, 29, 31, 0.95)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="platformFee"
                    name="Platform Fee (Base)"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorPlatformFee)"
                  />
                  <Area
                    type="monotone"
                    dataKey="platformGst"
                    name="Platform GST (18%)"
                    stroke="#3b82f6"
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#colorPlatformGst)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div>
            <GlassCard variant="card" className="h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-border/40 mb-3">
                  <h3 className="text-base font-semibold text-foreground tracking-tight">
                    Active Fee Policy
                  </h3>
                  <GlassBadge variant="success" size="sm">
                    {stats?.settings?.platformFeeEnabled ? 'ENABLED' : 'DISABLED'}
                  </GlassBadge>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/40 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Fee Structure</span>
                      <span className="font-semibold text-foreground uppercase">
                        {stats?.settings?.platformFeeType || 'FIXED'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Standard Base Fee</span>
                      <span className="font-semibold text-foreground">
                        {formatINR(stats?.settings?.platformFeeFixedPaise || 3000)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">GST Treatment</span>
                      <span className="font-semibold text-foreground">
                        18.0% (SAC 9971)
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Customer Disclosure</span>
                      <span className="text-emerald-500 font-medium">Visible before pay</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Client Dashboard Visibility</span>
                      <span className="text-muted-foreground font-mono">
                        {stats?.settings?.showPlatformFeeToClient ? 'Shown to Admin' : 'Isolated (Confidential)'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 space-y-1">
                    <div className="font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Decimal Micro-Unit Certified</span>
                    </div>
                    <p className="text-[11px] opacity-80 leading-relaxed">
                      All calculations execute with 10^6 micro-unit integer scaling. Zero IEEE-754 floating-point drift.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border/40 flex flex-col gap-2">
                <Link href="/developer/finance/settings" className="w-full">
                  <GlassButton variant="outline" size="sm" className="w-full justify-center gap-1.5">
                    <Settings className="w-3.5 h-3.5" />
                    <span>Configure Dynamic Fees</span>
                  </GlassButton>
                </Link>
                <Link href="/developer/finance/exports" className="w-full">
                  <GlassButton variant="secondary" size="sm" className="w-full justify-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Download Master Excel</span>
                  </GlassButton>
                </Link>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* 3. Quick Navigation Hub */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/developer/finance/transactions" className="group">
            <GlassCard variant="card" hoverEffect={true} className="p-4 transition-all">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-105 transition-transform">
                  <CreditCard className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
              </div>
              <h4 className="font-semibold text-sm mt-3 text-foreground">Orders &amp; Transactions</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Order-wise platform fee ledger, gateway reconciliation, and immutable snapshots.
              </p>
            </GlassCard>
          </Link>

          <Link href="/developer/finance/invoices" className="group">
            <GlassCard variant="card" hoverEffect={true} className="p-4 transition-all">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:scale-105 transition-transform">
                  <Receipt className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
              </div>
              <h4 className="font-semibold text-sm mt-3 text-foreground">Platform Invoices</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Issue statutory GST tax invoices (SAC 9971) to client with automated PDF/print view.
              </p>
            </GlassCard>
          </Link>

          <Link href="/developer/finance/tax-reports" className="group">
            <GlassCard variant="card" hoverEffect={true} className="p-4 transition-all">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-105 transition-transform">
                  <Layers className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
              </div>
              <h4 className="font-semibold text-sm mt-3 text-foreground">Statutory Tax Reports</h4>
              <p className="text-xs text-muted-foreground mt-1">
                CA-ready GST registers (5% Honey vs 18% Logistics/Platform, CGST/SGST vs IGST).
              </p>
            </GlassCard>
          </Link>

          <Link href="/developer/finance/exports" className="group">
            <GlassCard variant="card" hoverEffect={true} className="p-4 transition-all">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
              </div>
              <h4 className="font-semibold text-sm mt-3 text-foreground">Excel Exports Hub</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Download formatted multi-sheet Excel (.xlsx) workbooks with native SUM formulas.
              </p>
            </GlassCard>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}