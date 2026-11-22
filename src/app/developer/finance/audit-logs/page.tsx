'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassBadge } from '@/components/ui/glass-badge';
import {
  ShieldCheck,
  RefreshCw,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Code,
  X,
  User,
  Clock,
  Layers,
  Settings,
  Receipt,
  RotateCcw,
} from 'lucide-react';

interface AuditLog {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  category: string;
  action: string;
  targetId: string | null;
  previousValue: any;
  newValue: any;
  reason: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export default function FinancialAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    setIsRefreshing(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '25',
      });
      if (categoryFilter) params.set('category', categoryFilter);

      const res = await fetch(`/api/developer/finance/audit-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
      }
    } catch (err) {
      console.warn('Failed to load audit logs:', err);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, categoryFilter]);

  const getCategoryBadgeVariant = (cat: string) => {
    switch (cat) {
      case 'SETTINGS_CHANGE':
        return 'warning';
      case 'INVOICE_GENERATED':
        return 'info';
      case 'REFUND_PROCESSED':
        return 'destructive';
      case 'FINANCIAL_EXPORT':
        return 'default';
      default:
        return 'success';
    }
  };

  return (
    <DashboardLayout role="DEVELOPER" title="Financial Audit Logs">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 border border-blue-500/20 backdrop-blur-md">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold tracking-wider uppercase">
                Append-Only Audit Trail
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {totalCount} Logged Financial Events
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Financial Audit &amp; Compliance Logs
            </h1>
            <p className="text-xs text-muted-foreground max-w-2xl">
              Strict immutable timeline of every fee policy change, tax profile modification, B2B invoice generation, refund, and Excel workbook export.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <GlassButton
              variant="outline"
              size="sm"
              onClick={fetchLogs}
              disabled={isRefreshing}
              className="gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </GlassButton>
            <Link href="/developer/finance/exports?type=audit-logs">
              <GlassButton variant="primary" size="sm" className="gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Audit Trail (.xlsx)</span>
              </GlassButton>
            </Link>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <GlassCard variant="card" className="p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground">Filter Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 rounded-xl bg-muted/40 border border-border/40 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All Categories</option>
                <option value="SETTINGS_CHANGE">Settings Changes</option>
                <option value="INVOICE_GENERATED">Invoices Issued</option>
                <option value="REFUND_PROCESSED">Refunds &amp; Adjustments</option>
                <option value="FINANCIAL_EXPORT">Excel Exports</option>
                <option value="MANUAL_ADJUSTMENT">Manual Adjustments</option>
              </select>
            </div>

            <span className="text-xs text-muted-foreground">
              Showing {logs.length} of {totalCount} records
            </span>
          </div>
        </GlassCard>

        {/* Logs Table */}
        <GlassCard variant="card" className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20 font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                  <th className="py-3 px-4 text-center">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                      Loading financial audit logs...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      No financial audit logs found for this filter.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      <td className="py-3 px-4 whitespace-nowrap text-muted-foreground font-mono">
                        {new Date(log.createdAt).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-foreground truncate max-w-[160px]">
                          {log.actorEmail || 'System Process'}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono uppercase">
                          {log.actorRole || 'SYSTEM'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <GlassBadge
                          variant={getCategoryBadgeVariant(log.category)}
                          size="sm"
                        >
                          {log.category}
                        </GlassBadge>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-foreground">
                        {log.action}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground truncate max-w-[280px]">
                        {log.reason || '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {(log.previousValue || log.newValue) ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLog(log);
                            }}
                            className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-mono hover:bg-primary/20"
                          >
                            Diff
                          </button>
                        ) : (
                          <span className="text-muted-foreground text-[10px]">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 text-xs">
              <span className="text-muted-foreground">
                Page {page} of {totalPages}
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

        {/* Selected Log Inspector Modal */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in">
            <div className="w-full max-w-xl bg-card border border-border/50 rounded-2xl shadow-2xl p-6 flex flex-col max-h-[85vh]">
              <div className="flex items-center justify-between pb-3 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-500" />
                  <h3 className="font-semibold text-base text-foreground">
                    Audit Log Entry — {selectedLog.action}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-4 space-y-3 overflow-y-auto text-xs flex-1">
                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-muted/20 border border-border/40">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Actor:</span>
                    <span className="font-medium text-foreground">{selectedLog.actorEmail || 'System'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Role:</span>
                    <span className="font-medium text-foreground">{selectedLog.actorRole || 'SYSTEM'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Category:</span>
                    <span className="font-medium text-foreground">{selectedLog.category}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Timestamp:</span>
                    <span className="font-medium text-foreground">
                      {new Date(selectedLog.createdAt).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {selectedLog.reason && (
                  <div>
                    <span className="text-muted-foreground block mb-1">Reason / Description:</span>
                    <p className="p-3 rounded-xl bg-muted/30 border border-border/40 text-foreground font-mono text-[11px]">
                      {selectedLog.reason}
                    </p>
                  </div>
                )}

                {selectedLog.previousValue && (
                  <div>
                    <span className="text-muted-foreground block mb-1">Previous State:</span>
                    <pre className="p-3 rounded-xl bg-rose-500/10 text-rose-300 font-mono text-[10px] overflow-x-auto max-h-40 border border-rose-500/20">
                      {JSON.stringify(selectedLog.previousValue, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.newValue && (
                  <div>
                    <span className="text-muted-foreground block mb-1">New State:</span>
                    <pre className="p-3 rounded-xl bg-emerald-500/10 text-emerald-300 font-mono text-[10px] overflow-x-auto max-h-40 border border-emerald-500/20">
                      {JSON.stringify(selectedLog.newValue, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-border/40 flex justify-end">
                <GlassButton
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedLog(null)}
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