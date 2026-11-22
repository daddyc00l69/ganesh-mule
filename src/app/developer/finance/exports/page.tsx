'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassBadge } from '@/components/ui/glass-badge';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Layers,
  ShoppingBag,
  DollarSign,
  Receipt,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Clock,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface ExportCardConfig {
  id: string;
  type: string;
  title: string;
  badge: string;
  badgeVariant: 'default' | 'success' | 'info' | 'warning' | 'destructive';
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  sheets: string[];
}

const EXPORT_CARDS: ExportCardConfig[] = [
  {
    id: 'master',
    type: 'complete',
    title: 'Complete Master Financial Ledger',
    badge: 'ALL-IN-ONE WORKBOOK',
    badgeVariant: 'default',
    description: 'Consolidated multi-sheet workbook containing order breakdowns, platform earnings, GST liability, invoices, refunds, and audit trail.',
    icon: Sparkles,
    sheets: ['Order Financial Breakdown', 'Platform Service Earnings', 'GST Compliance Register', 'Platform Invoices', 'Refunds & Credit Notes', 'Financial Audit Trail'],
  },
  {
    id: 'orders',
    type: 'order-breakdown',
    title: 'Order Financial Breakdown',
    badge: 'ORDER-WISE',
    badgeVariant: 'info',
    description: 'Detailed financial snapshots for every customer order: Honey subtotal, 5% product tax, Delhivery courier freight, 18% shipping GST, and platform fees.',
    icon: ShoppingBag,
    sheets: ['Order Financial Breakdown with Excel SUM formulas'],
  },
  {
    id: 'earnings',
    type: 'earnings',
    title: 'Platform Service Earnings',
    badge: 'DEVELOPER MARGIN',
    badgeVariant: 'success',
    description: 'B2B platform tech fees (SAC 9971), 18% GST liability, gateway transaction references, and settlement statuses.',
    icon: DollarSign,
    sheets: ['Platform Service Earnings (SAC 9971)'],
  },
  {
    id: 'gst',
    type: 'gst',
    title: 'Statutory GST Compliance Register',
    badge: 'CA FILING READY',
    badgeVariant: 'warning',
    description: 'Statutory tax register categorized by HSN 0409 (5% Honey) and SAC 9965/9971 (18% Logistics/Platform) with CGST, SGST, and IGST splits.',
    icon: Layers,
    sheets: ['GST Compliance Register (Section 170 Compliant)'],
  },
  {
    id: 'invoices',
    type: 'invoices',
    title: 'Platform Invoices Register',
    badge: 'B2B INVOICES',
    badgeVariant: 'default',
    description: 'Comprehensive register of all generated platform tax invoices (PINV-YYYY-XXXX) issued to the merchant client.',
    icon: Receipt,
    sheets: ['Platform Invoices (PINV series)'],
  },
  {
    id: 'refunds',
    type: 'refunds',
    title: 'Refunds & Credit Notes Register',
    badge: 'CREDIT NOTES',
    badgeVariant: 'destructive',
    description: 'Log of order cancellations, partial/full refunds, platform fee adjustments, and statutory credit notes (PCN series).',
    icon: RotateCcw,
    sheets: ['Refunds & Credit Notes (PCN series)'],
  },
  {
    id: 'audit',
    type: 'audit-logs',
    title: 'Financial Audit Trail & Settings Log',
    badge: 'SECURITY AUDIT',
    badgeVariant: 'info',
    description: 'Immutable timeline of financial settings adjustments, fee updates, invoice issuance, and administrator actions.',
    icon: ShieldCheck,
    sheets: ['Financial Audit Trail'],
  },
];

export default function ExcelExportsHubPage() {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<'all' | '30d' | '90d' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleDownload = async (card: ExportCardConfig) => {
    setDownloadingId(card.id);
    try {
      const params = new URLSearchParams({ type: card.type });

      const now = new Date();
      if (dateFilter === '30d') {
        const d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        params.set('startDate', d.toISOString());
      } else if (dateFilter === '90d') {
        const d = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        params.set('startDate', d.toISOString());
      } else if (dateFilter === 'custom') {
        if (startDate) params.set('startDate', new Date(startDate).toISOString());
        if (endDate) params.set('endDate', new Date(endDate).toISOString());
      }

      const url = `/api/developer/finance/exports?${params.toString()}`;
      const link = document.createElement('a');
      link.href = url;
      link.download = `ganesh_honey_${card.type}_${Date.now()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export download error:', err);
      alert('Failed to trigger export download');
    } finally {
      setTimeout(() => setDownloadingId(null), 1000);
    }
  };

  return (
    <DashboardLayout role="DEVELOPER" title="Excel Financial Exports">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-600/10 via-teal-600/10 to-blue-600/10 border border-emerald-500/20 backdrop-blur-md">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold tracking-wider uppercase">
                ExcelJS Powered
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                Native SUM Formulas • Segoe UI Typography • Currency Formatting
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Excel Export Control Hub
            </h1>
            <p className="text-xs text-muted-foreground max-w-2xl">
              Download professionally formatted, audit-ready Microsoft Excel (.xlsx) workbooks for CA review, GST filing, and internal financial records.
            </p>
          </div>
        </div>

        {/* Date Filter Bar */}
        <GlassCard variant="card" className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">Reporting Period:</span>
              <div className="flex items-center rounded-xl bg-muted/40 p-1 border border-border/40 text-xs">
                {(['all', '30d', '90d', 'custom'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setDateFilter(mode)}
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${
                      dateFilter === mode
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {mode === 'all'
                      ? 'All Time'
                      : mode === '30d'
                      ? 'Last 30 Days'
                      : mode === '90d'
                      ? 'Last 90 Days'
                      : 'Custom'}
                  </button>
                ))}
              </div>
            </div>

            {dateFilter === 'custom' && (
              <div className="flex items-center gap-2 text-xs">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-muted/40 border border-border/40 text-foreground"
                />
                <span className="text-muted-foreground">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-muted/40 border border-border/40 text-foreground"
                />
              </div>
            )}
          </div>
        </GlassCard>

        {/* Export Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {EXPORT_CARDS.map((card) => {
            const Icon = card.icon;
            const isDownloading = downloadingId === card.id;

            return (
              <GlassCard
                key={card.id}
                variant="card"
                className="flex flex-col justify-between p-5 hover:border-primary/40 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Icon className="w-5 h-5" />
                    </div>
                    <GlassBadge variant={card.badgeVariant} size="sm">
                      {card.badge}
                    </GlassBadge>
                  </div>

                  <h3 className="text-base font-semibold text-foreground mt-4">
                    {card.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    {card.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-border/40 space-y-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Included Worksheets:
                    </span>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {card.sheets.map((s, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span className="truncate">{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-border/40">
                  <GlassButton
                    variant="primary"
                    size="sm"
                    onClick={() => handleDownload(card)}
                    disabled={isDownloading}
                    className="w-full justify-center gap-2"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Generating .xlsx...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Excel (.xlsx)</span>
                      </>
                    )}
                  </GlassButton>
                </div>
              </GlassCard>
            );
          })}
        </div>

        {/* Technical Quality Guarantee */}
        <div className="p-4 rounded-xl bg-muted/20 border border-border/40 text-xs text-muted-foreground flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
          <p className="leading-relaxed">
            All workbooks strictly enforce zero floating-point arithmetic drift by extracting native integer paise snapshots. Cells are properly tagged with <code className="text-foreground">"₹"#,##0.00</code> currency formatting and native Excel <code className="text-foreground">SUM(range)</code> totals rather than baked static text.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}