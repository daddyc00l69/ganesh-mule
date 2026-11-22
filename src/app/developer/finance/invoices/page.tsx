'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassBadge } from '@/components/ui/glass-badge';
import { SearchInput } from '@/components/ui/search-input';
import {
  Receipt,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Printer,
  X,
  Building,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Download,
} from 'lucide-react';

interface PlatformInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  clientBusinessName: string;
  clientGstin: string | null;
  placeOfSupplyStateCode: string;
  taxableAmountPaise: number;
  gstRate: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalAmountPaise: number;
  status: string;
  serviceDescription: string;
  notes: string | null;
  createdAt: string;
}

export default function PlatformInvoicesPage() {
  const [invoices, setInvoices] = useState<PlatformInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<PlatformInvoice | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [syncSecondsAgo, setSyncSecondsAgo] = useState(0);

  // New Invoice form state
  const [formTaxable, setFormTaxable] = useState('3000'); // ₹30 in rupees
  const [formClient, setFormClient] = useState('Ganesh Mule Pure Honey & Natural Apiary');
  const [formGstin, setFormGstin] = useState('27AADCG1234M1Z5');
  const [formStateCode, setFormStateCode] = useState('27');
  const [formDescription, setFormDescription] = useState('Platform Technology Services, Payment Gateway Infrastructure & Automated Delivery Routing (SAC 9971)');
  const [formNotes, setFormNotes] = useState('Consolidated platform service fee billing for processed e-commerce customer transactions.');

  const fetchInvoices = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const res = await fetch(`/api/developer/finance/invoices?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices || []);
        setLastSyncedAt(new Date());
        setSyncSecondsAgo(0);
      }
    } catch (err) {
      console.warn('Failed to fetch invoices:', err);
    } finally {
      if (!silent) setIsRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [searchQuery]);

  useEffect(() => {
    const secTimer = setInterval(() => {
      if (lastSyncedAt) {
        setSyncSecondsAgo(Math.floor((Date.now() - lastSyncedAt.getTime()) / 1000));
      }
    }, 1000);

    const pollTimer = setInterval(() => {
      if (!isCreating && !selectedInvoice && typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchInvoices(true);
      }
    }, 20000);

    return () => {
      clearInterval(secTimer);
      clearInterval(pollTimer);
    };
  }, [lastSyncedAt, isCreating, selectedInvoice, searchQuery]);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateSubmitting(true);
    try {
      const taxablePaise = Math.round(parseFloat(formTaxable || '0') * 100);
      const res = await fetch('/api/developer/finance/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientBusinessName: formClient,
          clientGstin: formGstin || null,
          taxableAmountPaise: taxablePaise,
          placeOfSupplyStateCode: formStateCode,
          serviceDescription: formDescription,
          notes: formNotes,
        }),
      });

      if (res.ok) {
        setIsCreating(false);
        fetchInvoices();
      } else {
        const data = await res.json();
        alert(`Failed to create invoice: ${data.error || 'Server error'}`);
      }
    } catch (err) {
      alert('Network error while issuing invoice');
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <DashboardLayout role="DEVELOPER" title="Platform Invoices">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-purple-600/10 via-indigo-600/10 to-blue-600/10 border border-purple-500/20 backdrop-blur-md">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-bold tracking-wider uppercase">
                B2B Invoicing
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                SAC: 9971 (Platform Tech Fees)
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Platform Tax Invoices &amp; Billing
            </h1>
            <p className="text-xs text-muted-foreground max-w-2xl">
              Issue and maintain official GST tax invoices from platform provider to merchant client for software services rendered.
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
              onClick={() => fetchInvoices(false)}
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
              <span>Issue Invoice</span>
            </GlassButton>
          </div>
        </div>

        {/* Invoices List Table */}
        <GlassCard variant="card" className="p-0 overflow-hidden">
          <div className="p-4 border-b border-border/40 flex items-center justify-between gap-3">
            <div className="max-w-md w-full">
              <SearchInput
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search invoice number, client name..."
              />
            </div>
            <Link href="/developer/finance/exports?type=invoices">
              <GlassButton variant="outline" size="sm" className="gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Invoices (.xlsx)</span>
              </GlassButton>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20 font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Billed Client</th>
                  <th className="py-3 px-4">Place of Supply</th>
                  <th className="py-3 px-4 text-right">Taxable (₹)</th>
                  <th className="py-3 px-4 text-right">GST (18%)</th>
                  <th className="py-3 px-4 text-right">Invoice Total (₹)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-muted-foreground">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                      Loading platform invoices...
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-muted-foreground">
                      No platform invoices found. Click "Issue Invoice" above to create one.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedInvoice(inv)}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-foreground">
                        <div className="flex items-center gap-1.5">
                          <Receipt className="w-3.5 h-3.5 text-purple-500" />
                          <span>{inv.invoiceNumber}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4 font-medium text-foreground">
                        {inv.clientBusinessName}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground font-mono">
                        {inv.placeOfSupplyStateCode === '27' ? '27 (Maharashtra)' : inv.placeOfSupplyStateCode}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-foreground">
                        {formatINR(inv.taxableAmountPaise)}
                      </td>
                      <td className="py-3 px-4 text-right text-blue-600 dark:text-blue-400">
                        {formatINR((inv.cgstPaise || 0) + (inv.sgstPaise || 0) + (inv.igstPaise || 0))}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-foreground">
                        {formatINR(inv.totalAmountPaise)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <GlassBadge variant={inv.status === 'PAID' ? 'success' : 'default'} size="sm">
                          {inv.status}
                        </GlassBadge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedInvoice(inv);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-[11px] font-medium transition-colors"
                        >
                          View &amp; Print
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Create Invoice Modal */}
        {isCreating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in">
            <div className="w-full max-w-lg bg-card border border-border/50 rounded-2xl shadow-2xl p-6">
              <div className="flex items-center justify-between pb-4 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base text-foreground">
                      Issue Platform Service Invoice
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      B2B Tax Invoice for platform tech services (SAC 9971)
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

              <form onSubmit={handleCreateInvoice} className="py-4 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Client Business Name</label>
                  <input
                    type="text"
                    value={formClient}
                    onChange={(e) => setFormClient(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-muted/30 border border-border/40 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">Client GSTIN / URP</label>
                    <input
                      type="text"
                      value={formGstin}
                      onChange={(e) => setFormGstin(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-muted/30 border border-border/40 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">Place of Supply (State Code)</label>
                    <input
                      type="text"
                      value={formStateCode}
                      onChange={(e) => setFormStateCode(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-muted/30 border border-border/40 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Taxable Platform Service Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={formTaxable}
                    onChange={(e) => setFormTaxable(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-muted/30 border border-border/40 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                  <p className="text-[10px] text-muted-foreground">
                    18% GST (CGST 9% + SGST 9% or IGST 18%) will be automatically computed and added.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Service Description</label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-muted/30 border border-border/40 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
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
                    variant="primary"
                    size="sm"
                    disabled={createSubmitting}
                  >
                    {createSubmitting ? 'Issuing...' : 'Issue Invoice'}
                  </GlassButton>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Printable Invoice Modal */}
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in">
            <div className="w-full max-w-3xl bg-card border border-border/50 rounded-2xl shadow-2xl p-6 sm:p-8 overflow-y-auto max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold tracking-wider uppercase">
                    Tax Invoice
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">
                    {selectedInvoice.invoiceNumber}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <GlassButton
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                    className="gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </GlassButton>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable Content Body */}
              <div className="py-6 space-y-6 text-foreground" id="printable-invoice">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/40 pb-6">
                  <div>
                    <h2 className="text-lg font-bold tracking-tight">PLATFORM SERVICE TAX INVOICE</h2>
                    <p className="text-xs text-muted-foreground">Original for Recipient</p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-mono font-bold text-sm text-foreground">
                      {selectedInvoice.invoiceNumber}
                    </p>
                    <p className="text-muted-foreground">
                      Date: {new Date(selectedInvoice.invoiceDate || selectedInvoice.createdAt).toLocaleDateString('en-IN')}
                    </p>
                    <p className="text-muted-foreground">
                      Place of Supply: {selectedInvoice.placeOfSupplyStateCode} (Maharashtra)
                    </p>
                  </div>
                </div>

                {/* Supplier & Recipient Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs p-4 rounded-xl bg-muted/20 border border-border/40">
                  <div className="space-y-1">
                    <p className="font-bold text-[11px] uppercase tracking-wider text-primary">
                      Supplier / Platform Provider:
                    </p>
                    <p className="font-semibold text-foreground">Ganesh Mule Platform Infrastructure</p>
                    <p className="text-muted-foreground">Developer Tech &amp; E-Commerce Operations Hub</p>
                    <p className="text-muted-foreground">GSTIN: 27AABCT9983M1Z2</p>
                    <p className="text-muted-foreground">State: 27 (Maharashtra)</p>
                  </div>

                  <div className="space-y-1">
                    <p className="font-bold text-[11px] uppercase tracking-wider text-primary">
                      Billed To (Client / Merchant):
                    </p>
                    <p className="font-semibold text-foreground">{selectedInvoice.clientBusinessName}</p>
                    <p className="text-muted-foreground">Honey Production &amp; Distribution Desk</p>
                    <p className="text-muted-foreground">
                      GSTIN / Pan: {selectedInvoice.clientGstin || 'Unregistered Person (URP)'}
                    </p>
                    <p className="text-muted-foreground">
                      State Code: {selectedInvoice.placeOfSupplyStateCode}
                    </p>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-border/40 rounded-xl overflow-hidden">
                    <thead className="bg-muted/40 font-semibold text-muted-foreground uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Service Description</th>
                        <th className="py-2.5 px-3">SAC</th>
                        <th className="py-2.5 px-3 text-right">Taxable (₹)</th>
                        <th className="py-2.5 px-3 text-right">CGST 9%</th>
                        <th className="py-2.5 px-3 text-right">SGST 9%</th>
                        <th className="py-2.5 px-3 text-right">IGST 18%</th>
                        <th className="py-2.5 px-3 text-right">Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      <tr>
                        <td className="py-3 px-3">
                          <p className="font-medium text-foreground">{selectedInvoice.serviceDescription}</p>
                          <p className="text-[10px] text-muted-foreground">
                            Order transaction technical facilitation and maintenance
                          </p>
                        </td>
                        <td className="py-3 px-3 font-mono">9971</td>
                        <td className="py-3 px-3 text-right font-medium">
                          {formatINR(selectedInvoice.taxableAmountPaise)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono">
                          {formatINR(selectedInvoice.cgstPaise)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono">
                          {formatINR(selectedInvoice.sgstPaise)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono">
                          {formatINR(selectedInvoice.igstPaise)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-foreground">
                          {formatINR(selectedInvoice.totalAmountPaise)}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot className="bg-muted/30 font-bold border-t border-border/40">
                      <tr>
                        <td colSpan={2} className="py-2.5 px-3 text-right uppercase text-[10px]">
                          Invoice Total:
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {formatINR(selectedInvoice.taxableAmountPaise)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {formatINR(selectedInvoice.cgstPaise)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {formatINR(selectedInvoice.sgstPaise)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {formatINR(selectedInvoice.igstPaise)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {formatINR(selectedInvoice.totalAmountPaise)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Legal & Declarations */}
                <div className="p-4 rounded-xl bg-muted/20 border border-border/40 text-[11px] text-muted-foreground space-y-1.5">
                  <p className="font-semibold text-foreground">Statutory GST Declarations:</p>
                  <p>1. Whether tax is payable on reverse charge basis: <strong>NO</strong>.</p>
                  <p>2. Electronic invoice generated under Section 170 of Indian GST Act with automated micro-unit decimal precision.</p>
                  <p>3. This is a computer generated invoice and requires no physical signature.</p>
                </div>
              </div>

              <div className="pt-4 border-t border-border/40 flex justify-end">
                <GlassButton
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedInvoice(null)}
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