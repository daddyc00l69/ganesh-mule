'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Printer,
  ArrowLeft,
  ShieldCheck,
  FileText,
  Copy,
  Check,
  Building,
  Truck,
  Tag,
  Package,
  Layers,
  AlertTriangle,
  QrCode,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { TaxInvoiceData } from '@/lib/invoice';
import { OrderRecord } from '@/types';

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const orderNumber = params?.orderNumber as string;

  const [invoice, setInvoice] = useState<TaxInvoiceData | null>(null);
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoiceCopy, setInvoiceCopy] = useState<'ORIGINAL' | 'DUPLICATE' | 'TRIPLICATE'>('ORIGINAL');
  const [viewMode, setViewMode] = useState<'INVOICE' | 'PACKING_SLIP' | 'BOTH'>('BOTH');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!orderNumber) return;

    async function fetchInvoice() {
      try {
        setLoading(true);
        const res = await fetch(`/api/invoices/${encodeURIComponent(orderNumber)}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to load invoice records');
        }

        setInvoice(data.invoice);
        if (data.order) setOrder(data.order);
      } catch (err: any) {
        setError(err.message || 'Unable to retrieve invoice and packing slip records.');
      } finally {
        setLoading(false);
      }
    }

    fetchInvoice();
  }, [orderNumber]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-amber-600/20 border-t-amber-600 rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-stone-600">Generating Official GST Tax Invoice &amp; Packing Slip...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
          <FileText className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-stone-900 mb-2">Invoice Not Found</h1>
        <p className="text-sm text-stone-600 max-w-md mb-6">{error || 'Could not find order records for this invoice.'}</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 rounded-full border border-stone-300 bg-white text-stone-800 text-xs font-semibold hover:bg-stone-50 transition-colors cursor-pointer"
          >
            Go Back
          </button>
          <Link
            href="/shop"
            className="px-6 py-2.5 rounded-full bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors"
          >
            Return to Store
          </Link>
        </div>
      </div>
    );
  }

  const isIntraState = invoice.customer.stateCode === '27';
  const totalUnits = invoice.items.reduce((acc, it) => acc + it.quantity, 0);

  return (
    <div className="min-h-screen bg-[#f1f3f5] text-stone-900 print:bg-white print:p-0">
      {/* TOP FLOATING ACTION BAR (Hidden during native print) */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 px-4 sm:px-8 py-3.5 shadow-sm print:hidden">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-stone-100 text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
              title="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-stone-900 text-sm">Official Order Documents</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium font-mono">
                  {invoice.invoiceNumber}
                </span>
              </div>
              <p className="text-xs text-stone-500 font-mono">Order: {invoice.orderNumber}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle: Invoice vs Packing Slip vs Both */}
            <div className="flex items-center bg-stone-100 rounded-lg p-0.5 text-xs font-medium text-stone-600">
              <button
                type="button"
                onClick={() => setViewMode('BOTH')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  viewMode === 'BOTH' ? 'bg-white text-stone-900 shadow-xs font-semibold' : 'hover:text-stone-900'
                }`}
              >
                All Documents (Print Both)
              </button>
              <button
                type="button"
                onClick={() => setViewMode('INVOICE')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  viewMode === 'INVOICE' ? 'bg-white text-stone-900 shadow-xs font-semibold' : 'hover:text-stone-900'
                }`}
              >
                Tax Invoice Only
              </button>
              <button
                type="button"
                onClick={() => setViewMode('PACKING_SLIP')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  viewMode === 'PACKING_SLIP' ? 'bg-white text-stone-900 shadow-xs font-semibold' : 'hover:text-stone-900'
                }`}
              >
                Packing Slip Only
              </button>
            </div>

            {/* Copy Selector (Applies to Tax Invoice) */}
            {viewMode !== 'PACKING_SLIP' && (
              <div className="hidden sm:flex items-center bg-stone-100 rounded-lg p-0.5 text-xs font-medium text-stone-600">
                <button
                  onClick={() => setInvoiceCopy('ORIGINAL')}
                  className={`px-2 py-1 rounded-md transition-all cursor-pointer text-[11px] ${
                    invoiceCopy === 'ORIGINAL' ? 'bg-white text-stone-900 shadow-xs' : 'hover:text-stone-900'
                  }`}
                >
                  Original
                </button>
                <button
                  onClick={() => setInvoiceCopy('DUPLICATE')}
                  className={`px-2 py-1 rounded-md transition-all cursor-pointer text-[11px] ${
                    invoiceCopy === 'DUPLICATE' ? 'bg-white text-stone-900 shadow-xs' : 'hover:text-stone-900'
                  }`}
                >
                  Transporter
                </button>
                <button
                  onClick={() => setInvoiceCopy('TRIPLICATE')}
                  className={`px-2 py-1 rounded-md transition-all cursor-pointer text-[11px] ${
                    invoiceCopy === 'TRIPLICATE' ? 'bg-white text-stone-900 shadow-xs' : 'hover:text-stone-900'
                  }`}
                >
                  Supplier
                </button>
              </div>
            )}

            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-medium transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied' : 'Share Link'}</span>
            </button>

            {/* Print Trigger */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Download PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* DOCUMENT CANVASES */}
      <div className="max-w-4xl mx-auto my-6 sm:my-10 print:my-0 print:max-w-none space-y-10 print:space-y-0">
        
        {/* ========================================================================= */}
        {/* 1. OFFICIAL GST TAX INVOICE */}
        {/* ========================================================================= */}
        {(viewMode === 'INVOICE' || viewMode === 'BOTH') && (
          <div
            id="printable-tax-invoice"
            className="bg-white rounded-xl sm:shadow-lg border border-stone-200/80 p-6 sm:p-10 text-stone-800 text-xs font-sans print:shadow-none print:border-none print:p-6 print:break-after-page"
          >
            {/* Header: Company Branding & Statutory Registrations */}
            <div className="border-b-2 border-stone-900 pb-5">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-base shadow-sm">
                      G
                    </div>
                    <div>
                      <h1 className="text-lg sm:text-xl font-bold tracking-tight text-stone-950 uppercase">
                        Ganesh Mule Artisanal Apiaries
                      </h1>
                      <p className="text-[10px] text-stone-500 tracking-wider uppercase font-semibold">
                        100% Raw Forest Honey • Heavy Solid Glass Packaging
                      </p>
                    </div>
                  </div>
                  <div className="text-[11px] text-stone-600 leading-relaxed mt-2 space-y-0.5">
                    <p className="font-semibold text-stone-800">{invoice.seller.legalName}</p>
                    <p>{invoice.seller.address}</p>
                    <p>
                      {invoice.seller.city}, {invoice.seller.state} - {invoice.seller.pincode}, India
                    </p>
                    <p className="pt-0.5">
                      <span className="font-medium text-stone-800">Support:</span> {invoice.seller.phone} |{' '}
                      <span className="font-medium text-stone-800">Email:</span> {invoice.seller.email}
                    </p>
                  </div>
                </div>

                {/* Statutory Registrations Badge */}
                <div className="text-right sm:text-right bg-stone-50 p-3 rounded-lg border border-stone-200/80 min-w-[240px]">
                  <div className="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px] uppercase tracking-wider mb-2">
                    TAX INVOICE
                  </div>
                  <div className="text-[10px] text-stone-600 space-y-0.5 font-mono">
                    <p>
                      <span className="font-sans font-semibold text-stone-800">GSTIN:</span>{' '}
                      <strong className="text-stone-900 font-mono">{invoice.seller.gstin}</strong>
                    </p>
                    <p>
                      <span className="font-sans font-semibold text-stone-800">FSSAI Lic:</span>{' '}
                      {invoice.seller.fssaiLicense}
                    </p>
                    <p>
                      <span className="font-sans font-semibold text-stone-800">PAN:</span> {invoice.seller.pan}
                    </p>
                    <p>
                      <span className="font-sans font-semibold text-stone-800">CIN:</span> {invoice.seller.cin}
                    </p>
                    <p>
                      <span className="font-sans font-semibold text-stone-800">State Code:</span> {invoice.seller.stateCode} ({invoice.seller.state})
                    </p>
                  </div>
                </div>
              </div>

              {/* Statutory Notice & Copy Type */}
              <div className="mt-4 pt-3 border-t border-stone-200/80 flex flex-wrap justify-between items-center text-[10px] text-stone-500">
                <span className="italic">
                  Issued under Section 31 of CGST Act, 2017 read with Rule 46 of CGST Rules, 2017
                </span>
                <span className="font-bold tracking-wider uppercase px-2.5 py-0.5 rounded bg-stone-900 text-white text-[9px]">
                  {invoiceCopy === 'ORIGINAL' && 'ORIGINAL FOR RECIPIENT'}
                  {invoiceCopy === 'DUPLICATE' && 'DUPLICATE FOR TRANSPORTER'}
                  {invoiceCopy === 'TRIPLICATE' && 'TRIPLICATE FOR SUPPLIER'}
                </span>
              </div>
            </div>

            {/* Invoice & Order Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-stone-200">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold">Invoice No</p>
                <p className="font-mono font-bold text-stone-900 text-xs mt-0.5">{invoice.invoiceNumber}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold">Invoice Date</p>
                <p className="font-medium text-stone-900 text-xs mt-0.5">{formatDate(invoice.invoiceDate)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold">Order Reference</p>
                <p className="font-mono font-bold text-stone-900 text-xs mt-0.5">{invoice.orderNumber}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold">Payment Method</p>
                <p className="font-medium text-stone-900 text-xs mt-0.5">Online (Razorpay UPI / Cards)</p>
              </div>
            </div>

            {/* Bill To & Ship To 2-Column Split */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-4 border-b border-stone-200">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-stone-500 font-bold flex items-center gap-1.5">
                  <Building className="w-3 h-3 text-stone-400" />
                  <span>Billed To (Customer):</span>
                </p>
                <p className="font-bold text-stone-900 text-xs">{invoice.customer.name}</p>
                <p className="text-[11px] text-stone-600 leading-relaxed">{invoice.customer.billingAddress}</p>
                <p className="text-[11px] text-stone-600 pt-0.5">
                  <span className="font-medium">Phone:</span> {invoice.customer.phone} |{' '}
                  <span className="font-medium">Email:</span> {invoice.customer.email}
                </p>
                <p className="text-[10px] text-stone-500 font-mono">
                  State: {invoice.customer.state} ({invoice.customer.stateCode})
                </p>
              </div>

              <div className="space-y-1 sm:border-l sm:border-stone-200 sm:pl-6">
                <p className="text-[10px] uppercase tracking-wider text-stone-500 font-bold flex items-center gap-1.5">
                  <Truck className="w-3 h-3 text-stone-400" />
                  <span>Shipped To (Consignee):</span>
                </p>
                <p className="font-bold text-stone-900 text-xs">{invoice.customer.name}</p>
                <p className="text-[11px] text-stone-600 leading-relaxed">{invoice.customer.shippingAddress}</p>
                <p className="text-[11px] text-stone-600 pt-0.5">
                  <span className="font-medium">Place of Supply:</span> {invoice.customer.placeOfSupply}
                </p>
                <p className="text-[10px] text-stone-500 font-mono">
                  Delivery PIN: {invoice.customer.pincode} • Carrier: Delhivery One Express
                </p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="py-4 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-300 text-[10px] uppercase tracking-wider text-stone-600 font-bold bg-stone-50/80">
                    <th className="py-2.5 px-2">#</th>
                    <th className="py-2.5 px-2">Description of Goods</th>
                    <th className="py-2.5 px-2 font-mono">HSN Code</th>
                    <th className="py-2.5 px-2 text-right">Qty</th>
                    <th className="py-2.5 px-2 text-right">Unit Price</th>
                    <th className="py-2.5 px-2 text-right">Taxable Value</th>
                    <th className="py-2.5 px-2 text-right">GST Rate</th>
                    {isIntraState ? (
                      <>
                        <th className="py-2.5 px-2 text-right">CGST</th>
                        <th className="py-2.5 px-2 text-right">SGST</th>
                      </>
                    ) : (
                      <th className="py-2.5 px-2 text-right">IGST</th>
                    )}
                    <th className="py-2.5 px-2 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {invoice.items.map((item, idx) => (
                    <tr key={item.id} className="text-stone-700">
                      <td className="py-2.5 px-2 text-stone-400">{idx + 1}</td>
                      <td className="py-2.5 px-2 font-medium text-stone-900">
                        {item.name}
                        <span className="block text-[10px] text-stone-400 font-mono">{item.sku}</span>
                      </td>
                      <td className="py-2.5 px-2 font-mono text-[11px] text-stone-600">{item.hsnCode}</td>
                      <td className="py-2.5 px-2 text-right font-semibold">{item.quantity}</td>
                      <td className="py-2.5 px-2 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-2.5 px-2 text-right font-mono">{formatCurrency(item.taxableValue)}</td>
                      <td className="py-2.5 px-2 text-right font-mono">{item.gstRate}%</td>
                      {isIntraState ? (
                        <>
                          <td className="py-2.5 px-2 text-right font-mono text-[11px] text-stone-600">
                            {formatCurrency(item.cgstAmount)}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-[11px] text-stone-600">
                            {formatCurrency(item.sgstAmount)}
                          </td>
                        </>
                      ) : (
                        <td className="py-2.5 px-2 text-right font-mono text-[11px] text-stone-600">
                          {formatCurrency(item.igstAmount)}
                        </td>
                      )}
                      <td className="py-2.5 px-2 text-right font-bold font-mono text-stone-900">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations & Totals Summary */}
            <div className="border-t-2 border-stone-900 pt-4 grid grid-cols-1 sm:grid-cols-12 gap-6">
              <div className="sm:col-span-6 space-y-2 text-[11px]">
                <p className="font-semibold text-stone-900 uppercase tracking-wider text-[10px]">
                  Amount in Words (INR):
                </p>
                <p className="font-medium text-stone-800 italic bg-stone-50 p-2.5 rounded border border-stone-200 leading-relaxed">
                  {invoice.grandTotalInWords}
                </p>
                <div className="pt-2 text-[10px] text-stone-500 space-y-1">
                  <p>• Certified that the particulars given above are true and correct.</p>
                  <p>• 100% Raw Forest Honey Bottled Exclusively in Solid Food-Safe Glass.</p>
                </div>
              </div>

              <div className="sm:col-span-6 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between items-center text-stone-600">
                  <span>Items Gross Subtotal:</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>

                {invoice.discountAmount > 0 && (
                  <div className="flex justify-between items-center text-emerald-700">
                    <span>Discount ({invoice.appliedCouponCode || 'PROMO'}):</span>
                    <span>-{formatCurrency(invoice.discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-stone-600 border-t border-stone-200 pt-1.5">
                  <span>Taxable Value:</span>
                  <span className="font-medium text-stone-800">
                    {formatCurrency(invoice.items.reduce((acc, it) => acc + it.taxableValue, 0))}
                  </span>
                </div>

                {isIntraState ? (
                  <>
                    <div className="flex justify-between items-center text-stone-600 text-[10px]">
                      <span>Total CGST:</span>
                      <span>+{formatCurrency(invoice.cgstTotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-stone-600 text-[10px]">
                      <span>Total SGST:</span>
                      <span>+{formatCurrency(invoice.sgstTotal)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between items-center text-stone-600 text-[10px]">
                    <span>Total IGST:</span>
                    <span>+{formatCurrency(invoice.igstTotal)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-stone-600 text-[10px]">
                  <span>Total Tax Amount:</span>
                  <span>{formatCurrency(invoice.totalTax)}</span>
                </div>

                <div className="flex justify-between items-center text-stone-600">
                  <span>Shipping &amp; Courier Freight (SAC 9965):</span>
                  <span>
                    {invoice.shippingCost === 0 ? (
                      <span className="text-emerald-700 font-semibold font-sans uppercase text-[10px]">FREE</span>
                    ) : (
                      <span>
                        {invoice.shippingBase
                          ? `${formatCurrency(invoice.shippingBase)} + 18% GST`
                          : formatCurrency(invoice.shippingCost)}
                      </span>
                    )}
                  </span>
                </div>

                {invoice.delhiveryLogistics && (
                  <div className="bg-stone-50 border border-stone-200/90 rounded-lg p-2.5 my-1 text-[10px] space-y-1 font-mono text-stone-600">
                    <div className="flex justify-between items-center text-stone-900 font-semibold font-sans">
                      <span className="flex items-center gap-1">
                        <Truck className="w-3 h-3 text-amber-700" />
                        <span>Delhivery One Courier Freight:</span>
                      </span>
                      <span>{invoice.delhiveryLogistics.zone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Base Freight (Docket):</span>
                      <span>{formatCurrency(invoice.delhiveryLogistics.baseFreightPaise)}</span>
                    </div>
                    {(invoice.delhiveryLogistics.lastMilePaise > 0 || invoice.delhiveryLogistics.peakSurchargePaise > 0) && (
                      <div className="flex justify-between">
                        <span>• Last-Mile &amp; Peak Surcharges:</span>
                        <span>{formatCurrency(invoice.delhiveryLogistics.lastMilePaise + invoice.delhiveryLogistics.peakSurchargePaise)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>• Courier GST (18% SAC 9965):</span>
                      <span>{formatCurrency(invoice.delhiveryLogistics.gstAmountPaise)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-stone-900 pt-0.5 border-t border-stone-200">
                      <span>Total Delhivery Freight:</span>
                      <span>{formatCurrency(invoice.delhiveryLogistics.totalFreightPaise)}</span>
                    </div>
                  </div>
                )}

                {(invoice.platformBase ?? 0) > 0 && (
                  <div className="flex justify-between items-center text-stone-600">
                    <span>Platform Fee (SAC 9971):</span>
                    <span>{formatCurrency(invoice.platformBase || 0)} + 18% GST</span>
                  </div>
                )}

                <div className="border-t-2 border-stone-800 pt-2 flex justify-between items-baseline font-bold text-stone-950 text-sm">
                  <span className="font-sans">Grand Total:</span>
                  <span className="text-base text-amber-700">{formatCurrency(invoice.grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Signature & Authenticity Stamp */}
            <div className="mt-8 pt-4 border-t border-stone-200 flex flex-col sm:flex-row justify-between items-end gap-6">
              <div className="space-y-1 text-[10px] text-stone-500">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Digitally Authenticated GST E-Invoice</span>
                </div>
                <p className="font-mono text-[9px] text-stone-400">Cryptographic Signature Hash: {invoice.verificationHash}</p>
                <p className="text-[9px]">Generated on {new Date(invoice.invoiceDate).toLocaleString('en-IN')}</p>
              </div>

              <div className="text-right sm:text-right border-t border-dashed border-stone-300 pt-2 min-w-[220px]">
                <div className="h-10 flex items-center justify-end">
                  <span className="font-serif italic text-amber-900 font-bold text-sm select-none">
                    Ganesh Mule
                  </span>
                </div>
                <p className="font-bold text-stone-900 text-[10px] uppercase tracking-wider">Authorized Signatory</p>
                <p className="text-[9px] text-stone-500">For Ganesh Mule Artisanal Apiaries Pvt Ltd</p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. WAREHOUSE PACKING SLIP & DISPATCH MANIFEST */}
        {/* ========================================================================= */}
        {(viewMode === 'PACKING_SLIP' || viewMode === 'BOTH') && (
          <div
            id="printable-packing-slip"
            className="bg-white rounded-xl sm:shadow-lg border border-stone-200/80 p-6 sm:p-10 text-stone-800 text-xs font-sans print:shadow-none print:border-none print:p-6 print:break-before-page"
          >
            {/* Header: Warehouse Slip Branding */}
            <div className="border-b-2 border-stone-900 pb-5">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center font-bold text-base shadow-sm">
                      <Package className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold tracking-tight text-stone-950 uppercase">
                        Warehouse Packing Slip &amp; Dispatch Manifest
                      </h2>
                      <p className="text-[10px] text-stone-500 tracking-wider uppercase font-semibold">
                        Ganesh Mule Artisanal Apiaries • Lonavala Central Dispatch Hub
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] text-stone-600 mt-2">
                    Fulfillment Hub: Plot 42, Western Ghats Agro-Park, Deciduous Canopy Estate, Maharashtra - 410401
                  </p>
                </div>

                <div className="text-right bg-stone-50 p-3 rounded-lg border border-stone-200/80 min-w-[220px]">
                  <div className="inline-block px-2.5 py-0.5 rounded bg-blue-100 text-blue-900 font-bold text-[10px] uppercase tracking-wider mb-1.5">
                    PACKING SLIP
                  </div>
                  <p className="font-mono font-bold text-sm text-stone-900">{invoice.orderNumber}</p>
                  <p className="text-[10px] text-stone-500 font-mono">Date: {formatDate(invoice.orderDate)}</p>
                  <p className="text-[10px] text-emerald-700 font-semibold mt-1">Status: PAYMENT VERIFIED (PAID)</p>
                </div>
              </div>

              {/* Barcode / Reference Simulation */}
              <div className="mt-4 pt-3 border-t border-stone-200 flex flex-wrap justify-between items-center text-[10px] text-stone-500 font-mono">
                <span>BARCODE REF: *{invoice.orderNumber.replace(/[^A-Za-z0-9]/g, '')}*</span>
                <span>CARRIER: DELHIVERY ONE EXPRESS</span>
                <span>TOTAL CONSIGNMENT UNITS: {totalUnits} JARS</span>
              </div>
            </div>

            {/* Consignee & Shipping Destination */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-4 border-b border-stone-200">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-stone-500 font-bold flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-stone-500" />
                  <span>Ship To / Delivery Destination:</span>
                </p>
                <p className="font-bold text-stone-900 text-sm">{invoice.customer.name}</p>
                <p className="text-xs text-stone-700 leading-relaxed font-medium">{invoice.customer.shippingAddress}</p>
                <div className="pt-1.5 space-y-0.5 text-xs text-stone-700">
                  <p>
                    <span className="font-semibold text-stone-900">Destination PIN:</span>{' '}
                    <strong className="text-sm font-mono text-stone-950 bg-amber-100 px-2 py-0.5 rounded">
                      {invoice.customer.pincode}
                    </strong>
                  </p>
                  <p>
                    <span className="font-semibold text-stone-900">Contact Phone:</span> {invoice.customer.phone}
                  </p>
                  <p>
                    <span className="font-semibold text-stone-900">Customer Email:</span> {invoice.customer.email}
                  </p>
                </div>
              </div>

              {/* Courier & Special Instructions Card */}
              <div className="space-y-2 bg-stone-50 p-4 rounded-xl border border-stone-200">
                <p className="text-[10px] uppercase tracking-wider text-stone-600 font-bold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-stone-500" />
                  <span>Courier &amp; Handling Protocol:</span>
                </p>
                <div className="text-xs space-y-1 text-stone-700">
                  <p>
                    <span className="font-medium text-stone-900">Courier Partner:</span>{' '}
                    {invoice.delhiveryLogistics?.carrier || order?.carrier || 'Delhivery One (Surface)'}
                  </p>
                  <p>
                    <span className="font-medium text-stone-900">Waybill / Tracking:</span>{' '}
                    <span className="font-mono text-stone-900 font-semibold">
                      {order?.trackingNumber || order?.delhiveryWaybill || invoice.delhiveryLogistics?.waybill || `DLHV-${invoice.orderNumber.replace(/[^0-9]/g, '')}`}
                    </span>
                  </p>
                  {invoice.delhiveryLogistics && (
                    <p>
                      <span className="font-medium text-stone-900">Routing &amp; Zone:</span>{' '}
                      <span className="font-mono text-stone-800 font-medium">
                        {invoice.delhiveryLogistics.zone} ({invoice.delhiveryLogistics.weightGrams}g Billable)
                      </span>
                    </p>
                  )}
                  <p>
                    <span className="font-medium text-stone-900">Package Type:</span> Heavy Food-Safe Solid Glass Jar with Airtight Seal
                  </p>
                </div>

                <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-2 text-amber-900 text-[11px] mt-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>FRAGILE SHIPMENT:</strong> Contains heavy solid glass honey jars. Cushion with bubble wrap and seal in heavy double-wall corrugated cartons.
                  </span>
                </div>
              </div>
            </div>

            {/* Itemized Fulfillment Checklist */}
            <div className="py-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 mb-2.5 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-stone-600" />
                <span>Order Items Fulfillment Checklist:</span>
              </h3>

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-300 text-[10px] uppercase tracking-wider text-stone-600 font-bold bg-stone-50/80">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Product Name &amp; Weight Variant</th>
                    <th className="py-2.5 px-3 font-mono">SKU</th>
                    <th className="py-2.5 px-3 text-right">Qty Ordered</th>
                    <th className="py-2.5 px-3 text-right">Packaging Type</th>
                    <th className="py-2.5 px-3 text-center">Warehouse Check</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {invoice.items.map((item, idx) => (
                    <tr key={item.id} className="text-stone-800">
                      <td className="py-3 px-3 text-stone-400">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-stone-900 text-xs">{item.name}</p>
                        <p className="text-[11px] text-stone-500">100% Raw Forest Honey (Unheated &amp; Unfiltered)</p>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-stone-600">{item.sku}</td>
                      <td className="py-3 px-3 text-right font-bold text-sm text-stone-950 font-mono">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-3 text-right text-[11px] text-stone-600">
                        Solid Glass Jar + Hermetic Cap
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block w-5 h-5 rounded border-2 border-stone-400 bg-white" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Warehouse Dispatch Sign-off */}
            <div className="border-t-2 border-stone-900 pt-5 mt-4 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
              <div className="space-y-1 bg-stone-50 p-3.5 rounded-lg border border-stone-200">
                <p className="font-bold uppercase tracking-wider text-[10px] text-stone-600">1. Picker Verification</p>
                <p className="text-stone-700">All items inspected for tamper-seal integrity and zero glass cracks.</p>
                <div className="pt-2 text-[10px] text-stone-500">
                  Picker Signature: __________________
                </div>
              </div>

              <div className="space-y-1 bg-stone-50 p-3.5 rounded-lg border border-stone-200">
                <p className="font-bold uppercase tracking-wider text-[10px] text-stone-600">2. Packing &amp; Cushioning</p>
                <p className="text-stone-700">Shock-absorbing double honeycomb cushioning applied.</p>
                <div className="pt-2 text-[10px] text-stone-500">
                  Packer Signature: __________________
                </div>
              </div>

              <div className="space-y-1 bg-stone-50 p-3.5 rounded-lg border border-stone-200">
                <p className="font-bold uppercase tracking-wider text-[10px] text-stone-600">3. Dispatch Approval</p>
                <p className="text-stone-700">Handed over to Delhivery courier with security waybill.</p>
                <div className="pt-2 text-[10px] text-stone-500">
                  Manager Sign: _____________________
                </div>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="mt-6 pt-3 border-t border-stone-200 text-center text-[10px] text-stone-400">
              Ganesh Mule Artisanal Apiaries Pvt Ltd • Certified Pure Raw Honey • Packed at Western Ghats Apiary Estate
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
