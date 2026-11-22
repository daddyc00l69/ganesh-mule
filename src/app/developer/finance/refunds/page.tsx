'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { StatCard } from '@/components/ui/stat-card';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassBadge } from '@/components/ui/glass-badge';
import {
  RotateCcw,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  X,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  FileText,
  DollarSign,
  TrendingDown,
  ShieldCheck,
} from 'lucide-react';

interface RefundRecord {
  id: string;
  orderId: string;
  platformTransactionId: string | null;
  refundType: string;
  grossRefundPaise: number;
  platformFeeRefundPaise: number;
  gstAdjustmentPaise: number;
  reason: string;
  creditNoteNumber: string | null;
  status: string;
  createdAt: string;
}

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<RefundRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<RefundRecord | null>(null);

  // New refund form state
  const [formOrderId, setFormOrderId] = useState('');
  const [formRefundType, setFormRefundType] = useState<'FULL' | 'PARTIAL' | 'PLATFORM_FEE_ONLY'>('FULL');
  const [formGrossAmount, setFormGrossAmount] = useState('899'); // ₹899
  const [formPlatformFeeRefund, setFormPlatformFeeRefund] = useState('30'); // ₹30
  const [formReason, setFormReason] = useState('Order cancelled by customer before dispatch');
  const [formGenerateCreditNote, setFormGenerateCreditNote] = useState(true);

  const fetchRefunds = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/developer/finance/refunds');
      if (res.ok) {
        const data = await res.json();
        setRefunds(data.refunds || []);
      }
    } catch (err) {
      console.warn('Failed to fetch refunds:', err);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  const handleCreateRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateSubmitting(true);
    try {
      const grossPaise = Math.round(parseFloat(formGrossAmount || '0') * 100);
      const feePaise = Math.round(parseFloat(formPlatformFeeRefund || '0') * 100);
      const gstAdjPaise = Math.round(feePaise * 0.18);

      const res = await fetch('/api/developer/finance/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: formOrderId.trim(),
          refundType: formRefundType,
          grossRefundPaise: grossPaise,
          platformFeeRefundPaise: feePaise,
          gstAdjustmentPaise: gstAdjPaise,
          reason: formReason.trim(),
          generateCreditNote: formGenerateCreditNote,
        }),
      });

      if (res.ok) {
        setIsCreating(false);
        setFormOrderId('');
        fetchRefunds();
      } else {
        const errData = await res.json();
        alert(`Failed to record refund: ${errData.error || 'Server error'}`);
      }
    } catch (err) {
      alert('Network error while processing refund record');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const formatINR = (paise: number = 0) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(paise / 100);
  };

  const totalGrossRefunded = refunds.reduce((acc, r) => acc + (r.grossRefundPaise || 0), 0);
  const totalPlatformFeesAdjusted = refunds.reduce((acc, r) => acc + (r.platformFeeRefundPaise || 0), 0);
  const totalGstAdjusted = refunds.reduce((acc, r) => acc + (r.gstAdjustmentPaise || 0), 0);

  return (
    <DashboardLayout role="DEVELOPER" title="Refunds & Financial Adjustments">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-rose-600/10 via-amber-600/10 to-orange-600/10 border border-rose-500/20 backdrop-blur-md">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold tracking-wider uppercase">
                Adjustments &amp; Credit Notes
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                PCN Series • Statutory Ledger Reversals
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Refunds &amp; Platform Fee Adjustments
            </h1>
            <p className="text-xs text-muted-foreground max-w-2xl">
              Manage order cancellations, partial customer refunds, fee reversals, and issue statutory credit notes for GST compliance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <GlassButton
              variant="outline"
              size="sm"
              onClick={fetchRefunds}
              disabled={isRefreshing}
              className="gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </GlassButton>
            <GlassButton
              variant="primary"
              size="sm"
              onClick={() => setIsCreating(true)}
              className="gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Refund</span>
            </GlassButton>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Total Gross Refunds"
            value={formatINR(totalGrossRefunded)}
            description="Customer funds returned"
            icon={<RotateCcw className="w-4 h-4 text-rose-500" />}
          />
          <StatCard
            title="Platform Fees Adjusted"
            value={formatINR(totalPlatformFeesAdjusted)}
            description="Developer fee reversals"
            icon={<TrendingDown className="w-4 h-4 text-amber-500" />}
          />
          <StatCard
            title="GST Liability Adjusted"
            value={formatINR(totalGstAdjusted)}
            description="Statutory tax offset"
            icon={<ShieldCheck className="w-4 h-4 text-blue-500" />}
          />
        </div>

        {/* Refunds Register Table */}
        <GlassCard variant="card" className="p-0 overflow-hidden">
          <div className="p-4 border-b border-border/40 flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">
              Refund &amp; Credit Note Ledger
            </h3>
            <Link href="/developer/finance/exports?type=refunds">
              <GlassButton variant="outline" size="sm" className="gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Refunds (.xlsx)</span>
              </GlassButton>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20 font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-4">Credit Note #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Gross Refund (₹)</th>
                  <th className="py-3 px-4 text-right">Platform Fee Adj (₹)</th>
                  <th className="py-3 px-4 text-right">GST Adj (18%)</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-muted-foreground">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                      Loading refunds...
                    </td>
                  </tr>
                ) : refunds.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-muted-foreground">
                      No refunds or credit notes recorded yet.
                    </td>
                  </tr>
                ) : (
                  refunds.map((ref) => (
                    <tr
                      key={ref.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedRefund(ref)}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-foreground">
                        <div className="flex items-center gap-1.5">
                          <Receipt className="w-3.5 h-3.5 text-rose-500" />
                          <span>{ref.creditNoteNumber || `PCN-${ref.id.slice(0, 8)}`}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(ref.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">
                        {ref.orderId}
                      </td>
                      <td className="py-3 px-4">
                        <GlassBadge variant={ref.refundType === 'FULL' ? 'destructive' : 'warning'} size="sm">
                          {ref.refundType}
                        </GlassBadge>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-rose-600 dark:text-rose-400">
                        {formatINR(ref.grossRefundPaise)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-amber-600 dark:text-amber-400">
                        {formatINR(ref.platformFeeRefundPaise)}
                      </td>
                      <td className="py-3 px-4 text-right text-blue-600 dark:text-blue-400">
                        {formatINR(ref.gstAdjustmentPaise)}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground truncate max-w-[200px]">
                        {ref.reason}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <GlassBadge variant="success" size="sm">
                          {ref.status}
                        </GlassBadge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Record Refund Modal */}
        {isCreating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in">
            <div className="w-full max-w-lg bg-card border border-border/50 rounded-2xl shadow-2xl p-6">
              <div className="flex items-center justify-between pb-4 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base text-foreground">
                      Record Refund &amp; Credit Note
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Reconcile platform ledger and reverse tax obligations
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreating(false)}
                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateRefund} className="py-4 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Order ID or Order Number</label>
                  <input
                    type="text"
                    value={formOrderId}
                    onChange={(e) => setFormOrderId(e.target.value)}
                    placeholder="e.g. ord-1234 or GH-2026-..."
                    className="w-full px-3 py-2 rounded-xl bg-muted/30 border border-border/40 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">Refund Scope</label>
                    <select
                      value={formRefundType}
                      onChange={(e) => setFormRefundType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-muted/30 border border-border/40 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="FULL">Full Order Refund</option>
                      <option value="PARTIAL">Partial Customer Refund</option>
                      <option value="PLATFORM_FEE_ONLY">Platform Fee Waiver Only</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">Gross Refund Amount (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formGrossAmount}
                      onChange={(e) => setFormGrossAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-muted/30 border border-border/40 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Platform Fee Adjustment (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formPlatformFeeRefund}
                    onChange={(e) => setFormPlatformFeeRefund(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-muted/30 border border-border/40 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                  <p className="text-[10px] text-muted-foreground">
                    18% GST reversal will be automatically computed on this fee.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Reason for Refund</label>
                  <textarea
                    rows={2}
                    value={formReason}
                    onChange={(e) => setFormReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-muted/30 border border-border/40 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="genCreditNote"
                    checked={formGenerateCreditNote}
                    onChange={(e) => setFormGenerateCreditNote(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <label htmlFor="genCreditNote" className="text-xs text-foreground">
                    Auto-generate statutory GST Credit Note (PCN series)
                  </label>
                </div>

                <div className="pt-3 border-t border-border/40 flex items-center justify-end gap-2">
                  <GlassButton
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreating(false)}
                  >
                    Cancel
                  </GlassButton>
                  <GlassButton
                    type="submit"
                    variant="destructive"
                    size="sm"
                    disabled={createSubmitting}
                  >
                    {createSubmitting ? 'Recording...' : 'Record Refund'}
                  </GlassButton>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Selected Refund Modal */}
        {selectedRefund && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in">
            <div className="w-full max-w-md bg-card border border-border/50 rounded-2xl shadow-2xl p-6">
              <div className="flex items-center justify-between pb-3 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-rose-500" />
                  <h3 className="font-semibold text-base text-foreground">
                    Credit Note {selectedRefund.creditNoteNumber || selectedRefund.id}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedRefund(null)}
                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-4 space-y-3 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-border/30">
                  <span className="text-muted-foreground">Order ID</span>
                  <span className="font-mono text-foreground">{selectedRefund.orderId}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-border/30">
                  <span className="text-muted-foreground">Date Issued</span>
                  <span className="text-foreground">
                    {new Date(selectedRefund.createdAt).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-border/30">
                  <span className="text-muted-foreground">Gross Refund</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    {formatINR(selectedRefund.grossRefundPaise)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-border/30">
                  <span className="text-muted-foreground">Platform Fee Reversal</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {formatINR(selectedRefund.platformFeeRefundPaise)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-border/30">
                  <span className="text-muted-foreground">GST Reversal (18%)</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {formatINR(selectedRefund.gstAdjustmentPaise)}
                  </span>
                </div>
                <div className="py-2">
                  <span className="text-muted-foreground block mb-1">Reason:</span>
                  <p className="p-2.5 rounded-xl bg-muted/30 border border-border/40 text-foreground">
                    {selectedRefund.reason}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-border/40 flex justify-end">
                <GlassButton
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedRefund(null)}
                >
                  Close
                </GlassButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}