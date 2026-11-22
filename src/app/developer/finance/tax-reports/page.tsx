'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { StatCard } from '@/components/ui/stat-card';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassBadge } from '@/components/ui/glass-badge';
import {
  Layers,
  FileSpreadsheet,
  RefreshCw,
  CheckCircle2,
  Calendar,
  Building,
  TrendingUp,
  Download,
  AlertCircle,
  FileText,
} from 'lucide-react';

export default function TaxReportsPage() {
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('30d');
  const [stats, setStats] = useState<any>(null);

  const fetchTaxData = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/developer/finance/stats?range=${dateRange}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.warn('Failed to load tax data:', err);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxData();
  }, [dateRange]);

  const formatINR = (paise: number = 0) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(paise / 100);
  };

  const platformFeeRevenue = stats?.overview?.totalPlatformFeeRevenuePaise || 0;
  const platformGstCollected = stats?.overview?.totalPlatformGstCollectedPaise || 0;
  const halfPlatformGst = Math.round(platformGstCollected / 2);

  return (
    <DashboardLayout role="DEVELOPER" title="Statutory GST Reports">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-teal-600/10 via-cyan-600/10 to-blue-600/10 border border-teal-500/20 backdrop-blur-md">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-teal-600 text-white text-[10px] font-bold tracking-wider uppercase">
                Statutory GST Reconciliation
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                GSTR-1 &amp; GSTR-3B Compatible
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Tax Reports &amp; GST Liability Ledger
            </h1>
            <p className="text-xs text-muted-foreground max-w-2xl">
              Strict accounting separation between Honey Products (5% GST), Courier Delivery (18% GST), and Platform Tech Fees (18% GST) under Section 170.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <GlassButton
              variant="outline"
              size="sm"
              onClick={fetchTaxData}
              disabled={isRefreshing}
              className="gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </GlassButton>
            <a
              href="/api/developer/finance/exports?type=gst"
              download
              className="inline-block"
            >
              <GlassButton variant="primary" size="sm" className="gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Tax Ledger (.xlsx)</span>
              </GlassButton>
            </a>
          </div>
        </div>

        {/* GST Category Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GlassCard variant="card" className="p-5 border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Honey Products
              </span>
              <GlassBadge variant="warning" size="sm">HSN: 0409 (5%)</GlassBadge>
            </div>
            <h3 className="text-lg font-bold text-foreground mt-2">Natural Honey Tax</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Statutory 5% GST on farm produce honey, collected on behalf of agricultural merchant.
            </p>
            <div className="mt-4 pt-3 border-t border-border/40 flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Applicable Rate</span>
              <span className="font-semibold text-foreground">CGST 2.5% + SGST 2.5%</span>
            </div>
          </GlassCard>

          <GlassCard variant="card" className="p-5 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Platform Services
              </span>
              <GlassBadge variant="info" size="sm">SAC: 9971 (18%)</GlassBadge>
            </div>
            <h3 className="text-lg font-bold text-foreground mt-2">Tech Fee Liability</h3>
            <p className="text-xs text-muted-foreground mt-1">
              18% GST on platform technology access &amp; transaction management service fees.
            </p>
            <div className="mt-4 pt-3 border-t border-border/40 flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Collected Tax</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {formatINR(platformGstCollected)}
              </span>
            </div>
          </GlassCard>

          <GlassCard variant="card" className="p-5 border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Logistics &amp; Courier
              </span>
              <GlassBadge variant="success" size="sm">SAC: 9965 (18%)</GlassBadge>
            </div>
            <h3 className="text-lg font-bold text-foreground mt-2">Delhivery Freight Tax</h3>
            <p className="text-xs text-muted-foreground mt-1">
              18% GST applicable on road/air courier transport and heavy solid glass shockproof freight.
            </p>
            <div className="mt-4 pt-3 border-t border-border/40 flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Applicable Rate</span>
              <span className="font-semibold text-foreground">CGST 9% + SGST 9%</span>
            </div>
          </GlassCard>
        </div>

        {/* Chartered Accountant Filing Reconciliation Table */}
        <GlassCard variant="card" className="p-0 overflow-hidden">
          <div className="p-4 border-b border-border/40 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                GSTR-1 Outward Taxable Supplies Schedule
              </h3>
              <p className="text-xs text-muted-foreground">
                Summary of outward supplies for statutory monthly/quarterly GST returns
              </p>
            </div>
            <GlassBadge variant="default" size="sm">
              Section 170 Compliant
            </GlassBadge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20 font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-4">HSN / SAC</th>
                  <th className="py-3 px-4">Classification &amp; Description</th>
                  <th className="py-3 px-4 text-center">Tax Rate</th>
                  <th className="py-3 px-4 text-right">Taxable Turnover</th>
                  <th className="py-3 px-4 text-right">CGST</th>
                  <th className="py-3 px-4 text-right">SGST</th>
                  <th className="py-3 px-4 text-right">IGST</th>
                  <th className="py-3 px-4 text-right">Total Tax Liability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                <tr>
                  <td className="py-3.5 px-4 font-mono font-bold text-foreground">SAC 9971</td>
                  <td className="py-3.5 px-4">
                    <p className="font-medium text-foreground">Platform Technology &amp; Payment Service Fees</p>
                    <p className="text-[10px] text-muted-foreground">Developer tech operations, transaction facilitation</p>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-foreground">18%</td>
                  <td className="py-3.5 px-4 text-right font-medium text-foreground">
                    {formatINR(platformFeeRevenue)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-muted-foreground">
                    {formatINR(halfPlatformGst)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-muted-foreground">
                    {formatINR(halfPlatformGst)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-muted-foreground">
                    ₹0.00
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-blue-600 dark:text-blue-400">
                    {formatINR(platformGstCollected)}
                  </td>
                </tr>

                <tr>
                  <td className="py-3.5 px-4 font-mono font-bold text-foreground">HSN 0409</td>
                  <td className="py-3.5 px-4">
                    <p className="font-medium text-foreground">Natural Honey Comb &amp; Raw Jars (Farm Produce)</p>
                    <p className="text-[10px] text-muted-foreground">Pure unprocessed natural agricultural honey</p>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-foreground">5%</td>
                  <td className="py-3.5 px-4 text-right font-medium text-foreground">
                    Tax Inclusive
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-muted-foreground">
                    2.5%
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-muted-foreground">
                    2.5%
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-muted-foreground">
                    5.0%
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-amber-600 dark:text-amber-400">
                    As per invoices
                  </td>
                </tr>

                <tr>
                  <td className="py-3.5 px-4 font-mono font-bold text-foreground">SAC 9965</td>
                  <td className="py-3.5 px-4">
                    <p className="font-medium text-foreground">Goods Transport Services (Delhivery Courier Logistics)</p>
                    <p className="text-[10px] text-muted-foreground">Door-to-door insured transit for fragile honey jars</p>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-foreground">18%</td>
                  <td className="py-3.5 px-4 text-right font-medium text-foreground">
                    Freight Base
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-muted-foreground">
                    9.0%
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-muted-foreground">
                    9.0%
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-muted-foreground">
                    18.0%
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    As per manifest
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Compliance Notes Card */}
        <div className="p-4 rounded-xl bg-muted/20 border border-border/40 text-xs text-muted-foreground space-y-2">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Chartered Accountant Compliance Verification</span>
          </div>
          <p className="leading-relaxed">
            All amounts are strictly calculated using Indian GST Section 170 rules (`ROUND_HALF_UP` on total invoice liability). Product GST remains segregated from platform technology service turnover. When generating GSTR-1 or filing GSTR-3B, download the authoritative Excel workbook via the button above.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}