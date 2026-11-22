'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassBadge } from '@/components/ui/glass-badge';
import { SearchInput } from '@/components/ui/search-input';
import {
  ShoppingBag,
  CreditCard,
  RefreshCw,
  FileSpreadsheet,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  X,
  Code,
  ArrowRight,
} from 'lucide-react';

interface PlatformTx {
  id: string;
  orderId: string;
  orderNumber: string;
  customerRef: string;
  paymentRef: string | null;
  grossOrderAmountPaise: number;
  platformFeePaise: number;
  platformGstRate: number;
  platformGstPaise: number;
  totalPlatformServicePaise: number;
  paymentStatus: string;
  settlementStatus: string;
  createdAt: string;
  order?: {
    customerName: string;
    customerEmail: string;
    totalAmount: number;
    orderStatus: string;
    financialSnapshot?: any;
  };
}

export default function PlatformTransactionsPage() {
  const [transactions, setTransactions] = useState<PlatformTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [settlementFilter, setSettlementFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedTx, setSelectedTx] = useState<PlatformTx | null>(null);
  const [showJsonRaw, setShowJsonRaw] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [syncSecondsAgo, setSyncSecondsAgo] = useState(0);

  const fetchTransactions = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (searchQuery) params.set('q', searchQuery);
      if (statusFilter) params.set('status', statusFilter);
      if (settlementFilter) params.set('settlement', settlementFilter);

      const res = await fetch(`/api/developer/finance/transactions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
        setLastSyncedAt(new Date());
        setSyncSecondsAgo(0);
      }
    } catch (err) {
      console.warn('Failed to fetch transactions:', err);
    } finally {
      if (!silent) setIsRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, statusFilter, settlementFilter]);

  useEffect(() => {
    const secTimer = setInterval(() => {
      if (lastSyncedAt) {
        setSyncSecondsAgo(Math.floor((Date.now() - lastSyncedAt.getTime()) / 1000));
      }
    }, 1000);

    const pollTimer = setInterval(() => {
      // Auto-poll silently if no modal open and page is active
      if (!selectedTx && typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchTransactions(true);
      }
    }, 15000);

    return () => {
      clearInterval(secTimer);
      clearInterval(pollTimer);
    };
  }, [lastSyncedAt, selectedTx, page, statusFilter, settlementFilter, searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  const formatINR = (paise: number = 0) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(paise / 100);
  };

  return (
    <DashboardLayout role="DEVELOPER" title="Orders & Platform Transactions">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 border border-blue-500/20 backdrop-blur-md">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold tracking-wider uppercase">
                Order Ledger
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {totalCount} Total Transactions Recorded
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Platform Transaction Ledger
            </h1>
            <p className="text-xs text-muted-foreground max-w-2xl">
              Immutable per-order financial records, platform tech fees, statutory GST attribution, and gateway settlement states.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background/50 border border-border/40 text-[11px] font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-muted-foreground">
                {isRefreshing ? 'Syncing...' : syncSecondsAgo === 0 ? 'Live (0s)' : `Live (${syncSecondsAgo}s)`}
              </span>
            </div>

            <GlassButton
              variant="outline"
              size="sm"
              onClick={() => fetchTransactions(false)}
              disabled={isRefreshing}
              className="gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </GlassButton>
            <Link href="/developer/finance/exports?type=transactions">
              <GlassButton variant="primary" size="sm" className="gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Ledger (.xlsx)</span>
              </GlassButton>
            </Link>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <GlassCard variant="card" className="p-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <SearchInput
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search order number, customer email, or payment ID..."
                  className="w-full"
                />
              </div>
              <GlassButton type="submit" variant="secondary" size="sm">
                Search
              </GlassButton>
            </form>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 rounded-xl bg-muted/40 border border-border/40 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Payment Status: All</option>
                <option value="PAID">Paid</option>
                <option value="PENDING">Pending</option>
                <option value="REFUNDED">Refunded</option>
                <option value="FAILED">Failed</option>
              </select>

              <select
                value={settlementFilter}
                onChange={(e) => {
                  setSettlementFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 rounded-xl bg-muted/40 border border-border/40 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Settlement: All</option>
                <option value="SETTLED">Settled</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
          </div>
        </GlassCard>

        {/* Transactions Table */}
        <GlassCard variant="card" className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20 font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-4">Order / ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4 text-right">Gross Order</th>
                  <th className="py-3 px-4 text-right">Platform Fee</th>
                  <th className="py-3 px-4 text-right">GST (18%)</th>
                  <th className="py-3 px-4 text-right">Platform Total</th>
                  <th className="py-3 px-4 text-center">Payment</th>
                  <th className="py-3 px-4 text-center">Settlement</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-muted-foreground">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                      Loading platform transactions...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-muted-foreground">
                      No platform transactions found.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedTx(tx)}
                    >
                      <td className="py-3 px-4 font-mono font-medium text-foreground">
                        <div className="flex items-center gap-1.5">
                          <ShoppingBag className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span>{tx.orderNumber}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                          {tx.id}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-foreground truncate max-w-[140px]">
                          {tx.order?.customerName || tx.customerRef}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono truncate max-w-[140px]">
                          {tx.customerRef}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-foreground">
                        {formatINR(tx.grossOrderAmountPaise)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatINR(tx.platformFeePaise)}
                      </td>
                      <td className="py-3 px-4 text-right text-blue-600 dark:text-blue-400">
                        {formatINR(tx.platformGstPaise)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-foreground">
                        {formatINR(tx.totalPlatformServicePaise)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${
                            tx.paymentStatus === 'PAID'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : tx.paymentStatus === 'PENDING'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {tx.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${
                            tx.settlementStatus === 'SETTLED'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                              : 'bg-muted/40 text-muted-foreground border border-border/40'
                          }`}
                        >
                          {tx.settlementStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTx(tx);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-[11px] font-medium transition-colors"
                        >
                          Snapshot
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 text-xs">
              <span className="text-muted-foreground">
                Page {page} of {totalPages} ({totalCount} items)
              </span>
              <div className="flex items-center gap-1">
                <GlassButton
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </GlassButton>
                <GlassButton
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </GlassButton>
              </div>
            </div>
          )}
        </GlassCard>

        {/* Snapshot Modal */}
        {selectedTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in">
            <div className="w-full max-w-2xl bg-card border border-border/50 rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base text-foreground">
                      Financial Snapshot — {selectedTx.orderNumber}
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono">
                      Tx ID: {selectedTx.id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedTx(null);
                    setShowJsonRaw(false);
                  }}
                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto py-4 space-y-4 flex-1">
                {/* Status Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-muted/30 border border-border/40 text-xs">
                  <div>
                    <span className="text-muted-foreground">Order Date: </span>
                    <span className="font-medium text-foreground">
                      {new Date(selectedTx.createdAt).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GlassBadge variant="default" size="sm">
                      {selectedTx.paymentStatus}
                    </GlassBadge>
                    <GlassBadge variant="info" size="sm">
                      {selectedTx.settlementStatus}
                    </GlassBadge>
                  </div>
                </div>

                {/* Statutory Breakdown Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-muted/20 border border-border/40 space-y-1">
                    <span className="text-muted-foreground">Customer Billed Amount</span>
                    <p className="text-base font-bold text-foreground">
                      {formatINR(selectedTx.grossOrderAmountPaise)}
                    </p>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Ref: {selectedTx.paymentRef || 'razorpay_prepaid'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                    <span className="text-emerald-700 dark:text-emerald-300">
                      Platform Tech Fee (SAC 9971)
                    </span>
                    <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                      {formatINR(selectedTx.platformFeePaise)}
                    </p>
                    <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">
                      Base developer revenue
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-1">
                    <span className="text-blue-700 dark:text-blue-300">
                      Platform GST @ {selectedTx.platformGstRate}%
                    </span>
                    <p className="text-base font-bold text-blue-600 dark:text-blue-400">
                      {formatINR(selectedTx.platformGstPaise)}
                    </p>
                    <span className="text-[10px] text-blue-600/80 dark:text-blue-400/80">
                      Statutory tax obligation
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-1">
                    <span className="text-purple-700 dark:text-purple-300">
                      Total Platform Revenue
                    </span>
                    <p className="text-base font-bold text-purple-600 dark:text-purple-400">
                      {formatINR(selectedTx.totalPlatformServicePaise)}
                    </p>
                    <span className="text-[10px] text-purple-600/80 dark:text-purple-400/80">
                      Fee + GST total
                    </span>
                  </div>
                </div>

                {/* Raw Snapshot Viewer Toggle */}
                <div className="pt-2">
                  <button
                    onClick={() => setShowJsonRaw(!showJsonRaw)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>{showJsonRaw ? 'Hide JSON Snapshot' : 'Inspect Raw Immutable Snapshot'}</span>
                  </button>

                  {showJsonRaw && (
                    <pre className="mt-2 p-3 rounded-xl bg-black/90 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-60 border border-border/40">
                      {JSON.stringify(selectedTx, null, 2)}
                    </pre>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-border/40 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Immutable record: Protected from retroactive alteration.</span>
                </span>
                <GlassButton
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTx(null)}
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