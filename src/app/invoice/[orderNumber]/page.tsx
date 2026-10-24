'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Printer,
  ArrowLeft,
  Share2,
  CheckCircle2,
  ShieldCheck,
  FileText,
  Copy,
  Check,
  Building,
  Truck,
  Tag,
  Download,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { TaxInvoiceData } from '@/lib/invoice';

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const orderNumber = params?.orderNumber as string;

  const [invoice, setInvoice] = useState<TaxInvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoiceCopy, setInvoiceCopy] = useState<'ORIGINAL' | 'DUPLICATE' | 'TRIPLICATE'>('ORIGINAL');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!orderNumber) return;

    async function fetchInvoice() {
      try {
        setLoading(true);
        const res = await fetch(`/api/invoices/${orderNumber}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to load invoice');
        }

        setInvoice(data.invoice);
      } catch (err: any) {
        setError(err.message || 'Unable to retrieve invoice record.');
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
        <p className="text-sm font-medium text-stone-600">Generating Official GST Tax Invoice...</p>
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
        <Link
          href="/shop"
          className="px-6 py-2.5 rounded-full bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors"
        >
          Return to Store
        </Link>
      </div>
    );
  }

  const isIntraState = invoice.customer.stateCode === '27';

  return (
    <div className="min-h-screen bg-[#f1f3f5] text-stone-900 print:bg-white print:p-0">
      {/* ACTION BAR (Hidden in Print) */}
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
                <span className="font-semibold text-stone-900 text-sm">GST Tax Invoice</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                  {invoice.invoiceNumber}
                </span>
              </div>
              <p className="text-xs text-stone-500">Order Ref: {invoice.orderNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Copy selector */}
            <div className="flex items-center bg-stone-100 rounded-lg p-0.5 text-xs font-medium text-stone-600">
              <button
                onClick={() => setInvoiceCopy('ORIGINAL')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  invoiceCopy === 'ORIGINAL' ? 'bg-white text-stone-900 shadow-xs' : 'hover:text-stone-900'
                }`}
              >
                Original (Client)
              </button>
              <button
                onClick={() => setInvoiceCopy('DUPLICATE')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  invoiceCopy === 'DUPLICATE' ? 'bg-white text-stone-900 shadow-xs' : 'hover:text-stone-900'
                }`}
              >
                Transporter
              </button>
              <button
                onClick={() => setInvoiceCopy('TRIPLICATE')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  invoiceCopy === 'TRIPLICATE' ? 'bg-white text-stone-900 shadow-xs' : 'hover:text-stone-900'
                }`}
              >
                Supplier
              </button>
            </div>

            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-medium transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied' : 'Share'}</span>
            </button>

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

      {/* INVOICE CANVAS */}
      <div className="max-w-4xl mx-auto my-6 sm:my-10 print:my-0 print:max-w-none">
        <div
          id="printable-invoice"
          className="bg-white rounded-xl sm:shadow-lg border border-stone-200/80 p-6 sm:p-10 text-stone-800 text-xs font-sans print:shadow-none print:border-none print:p-6"
        >
          {/* HEADER: COMPANY BRANDING & LEGAL DETAILS */}
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

              {/* STATUTORY REGISTRATIONS BADGE */}
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

            {/* STATUTORY NOTICE & COPY TYPE */}
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

          {/* INVOICE & ORDER METADATA GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-stone-200">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold">Invoice No</p>
              <p className="font-bold text-stone-950 font-mono text-sm">{invoice.invoiceNumber}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold">Invoice Date</p>
              <p className="font-semibold text-stone-800">
                {new Date(invoice.invoiceDate).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold">Order Number</p>
              <p className="font-bold text-stone-950 font-mono">{invoice.orderNumber}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold">Place of Supply</p>
              <p className="font-semibold text-stone-800">{invoice.customer.placeOfSupply}</p>
            </div>
          </div>

          {/* PAYMENT & LOGISTICS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-3 border-b border-stone-200 text-[11px] bg-stone-50/70 -mx-6 sm:-mx-10 px-6 sm:px-10">
            <div>
              <span className="text-stone-500">Payment Gateway:</span>{' '}
              <span className="font-semibold text-stone-800">Razorpay Secured Checkout</span>
            </div>
            <div>
              <span className="text-stone-500">Payment ID:</span>{' '}
              <span className="font-mono font-semibold text-stone-800">{invoice.paymentId}</span>
            </div>
            <div>
              <span className="text-stone-500">Payment Status:</span>{' '}
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 uppercase">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {invoice.paymentStatus}
              </span>
            </div>
          </div>

          {/* BILLED TO / SHIPPED TO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-4 border-b border-stone-200">
            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5 flex items-center gap-1">
                <Building className="w-3 h-3 text-stone-500" />
                Billed To (Customer Details)
              </h2>
              <div className="space-y-0.5 text-[11px] leading-relaxed">
                <p className="font-bold text-stone-900 text-xs">{invoice.customer.name}</p>
                <p className="text-stone-600">{invoice.customer.billingAddress}</p>
                <p className="text-stone-600">
                  <span className="font-medium text-stone-800">State:</span> {invoice.customer.state} (Code: {invoice.customer.stateCode})
                </p>
                <p className="text-stone-600">
                  <span className="font-medium text-stone-800">Phone:</span> {invoice.customer.phone} |{' '}
                  <span className="font-medium text-stone-800">Email:</span> {invoice.customer.email}
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5 flex items-center gap-1">
                <Truck className="w-3 h-3 text-stone-500" />
                Shipped To (Delivery Destination)
              </h2>
              <div className="space-y-0.5 text-[11px] leading-relaxed">
                <p className="font-bold text-stone-900 text-xs">{invoice.customer.name}</p>
                <p className="text-stone-600">{invoice.customer.shippingAddress}</p>
                <p className="text-stone-600">
                  <span className="font-medium text-stone-800">Destination State:</span> {invoice.customer.state} ({invoice.customer.country})
                </p>
                <p className="text-stone-500 text-[10px]">
                  Carrier: Delhivery Insured Air Cargo (Breakage Guaranteed Free Replacement)
                </p>
              </div>
            </div>
          </div>

          {/* ITEMIZATION TABLE */}
          <div className="py-4">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">
              Particulars of Goods Supplied
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr className="border-y-2 border-stone-800 bg-stone-100/80 text-stone-800 font-semibold text-[10px] uppercase tracking-wider">
                    <th className="py-2 px-2 text-center w-8">#</th>
                    <th className="py-2 px-2 text-left">Description of Goods</th>
                    <th className="py-2 px-2 text-center">HSN/SAC</th>
                    <th className="py-2 px-2 text-center">Qty</th>
                    <th className="py-2 px-2 text-right">Unit Rate</th>
                    <th className="py-2 px-2 text-right">Taxable Val</th>
                    {isIntraState ? (
                      <>
                        <th className="py-2 px-2 text-right">CGST</th>
                        <th className="py-2 px-2 text-right">SGST</th>
                      </>
                    ) : (
                      <th className="py-2 px-2 text-right">IGST</th>
                    )}
                    <th className="py-2 px-2 text-right">Total (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {invoice.items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-stone-50/50">
                      <td className="py-2.5 px-2 text-center text-stone-500 font-mono">{idx + 1}</td>
                      <td className="py-2.5 px-2">
                        <p className="font-semibold text-stone-950">{item.name}</p>
                        <p className="text-[10px] text-stone-500 font-mono">
                          SKU: {item.sku} • Solid Glass Jar • NMR Tested Pure
                        </p>
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-stone-700">{item.hsnCode}</td>
                      <td className="py-2.5 px-2 text-center font-semibold text-stone-800">{item.quantity}</td>
                      <td className="py-2.5 px-2 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-2.5 px-2 text-right font-mono font-medium">{formatCurrency(item.taxableValue)}</td>
                      {isIntraState ? (
                        <>
                          <td className="py-2.5 px-2 text-right font-mono text-[10px]">
                            {formatCurrency(item.cgstAmount)}
                            <span className="block text-stone-400">({item.gstRate / 2}%)</span>
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-[10px]">
                            {formatCurrency(item.sgstAmount)}
                            <span className="block text-stone-400">({item.gstRate / 2}%)</span>
                          </td>
                        </>
                      ) : (
                        <td className="py-2.5 px-2 text-right font-mono text-[10px]">
                          {formatCurrency(item.igstAmount)}
                          <span className="block text-stone-400">({item.gstRate}%)</span>
                        </td>
                      )}
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-stone-950">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SUMMARY & TAX BREAKDOWN */}
          <div className="border-t-2 border-stone-800 pt-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
              {/* AMOUNT IN WORDS & DECLARATIONS */}
              <div className="sm:col-span-7 space-y-3">
                <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-200/70">
                  <p className="text-[10px] uppercase tracking-wider text-amber-900/80 font-bold mb-0.5">
                    Invoice Amount in Words:
                  </p>
                  <p className="font-semibold text-stone-900 text-xs italic">
                    {invoice.grandTotalInWords}
                  </p>
                </div>

                {invoice.appliedCouponCode && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      Promotional Discount Code Applied:{' '}
                      <strong className="font-mono uppercase">{invoice.appliedCouponCode}</strong> (-
                      {formatCurrency(invoice.discountAmount)})
                    </span>
                  </div>
                )}

                <div className="text-[10px] text-stone-500 space-y-1 pt-1 leading-relaxed">
                  <p className="font-bold text-stone-700 uppercase">Terms & Conditions:</p>
                  <ol className="list-decimal pl-3 space-y-0.5">
                    <li>Certified 100% natural raw forest honey directly from registered bee boxes.</li>
                    <li>FSSAI certified purity standard. Batch tested on Bruker NMR spectroscopy.</li>
                    <li>Fragile glassware transit breakage guaranteed with no-charge instant replacement.</li>
                    <li>Subject to Mumbai jurisdiction only.</li>
                  </ol>
                </div>

                <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200 text-[10px] text-stone-600 font-mono">
                  <p className="font-bold text-stone-800 font-sans mb-0.5">Direct Settlement Bank Details:</p>
                  <p>HDFC Bank Ltd • A/C: 50200088921440 • IFSC: HDFC0000180 • Fort, Mumbai</p>
                </div>
              </div>

              {/* NUMERICAL TOTALS */}
              <div className="sm:col-span-5 bg-stone-50 rounded-lg p-3.5 border border-stone-200 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between items-center text-stone-600">
                  <span>Gross Subtotal:</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>

                {invoice.discountAmount > 0 && (
                  <div className="flex justify-between items-center text-emerald-700 font-semibold">
                    <span>Discount Applied:</span>
                    <span>-{formatCurrency(invoice.discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-stone-600 border-t border-stone-200 pt-1.5">
                  <span>Taxable Value:</span>
                  <span className="font-medium text-stone-800">
                    {formatCurrency(
                      invoice.items.reduce((acc, it) => acc + it.taxableValue, 0)
                    )}
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
                  <span>Shipping &amp; Freight (SAC 9965):</span>
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

                {(invoice.platformBase ?? 0) > 0 && (
                  <div className="flex justify-between items-center text-stone-600">
                    <span>Platform Fee (SAC 9971):</span>
                    <span>
                      {formatCurrency(invoice.platformBase || 0)} + 18% GST
                    </span>
                  </div>
                )}

                <div className="border-t-2 border-stone-800 pt-2 flex justify-between items-baseline font-bold text-stone-950 text-sm">
                  <span className="font-sans">Grand Total:</span>
                  <span className="text-base text-amber-700">{formatCurrency(invoice.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SIGNATURE & AUTHENTICITY STAMP */}
          <div className="mt-8 pt-4 border-t border-stone-200 flex flex-col sm:flex-row justify-between items-end gap-6">
            <div className="space-y-1 text-[10px] text-stone-500">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Digitally Authenticated GST E-Invoice</span>
              </div>
              <p className="font-mono text-[9px] text-stone-400">Cryptographic Signature Hash: {invoice.verificationHash}</p>
              <p className="text-[9px]">Generated automatically on {new Date().toLocaleString('en-IN')}</p>
            </div>

            <div className="text-right sm:text-right border-t border-dashed border-stone-300 pt-2 min-w-[220px]">
              <div className="h-10 flex items-center justify-end">
                <span className="font-serif italic text-amber-900 font-bold text-sm select-none">
                  Ganesh Mule
                </span>
              </div>
              <p className="font-bold text-stone-900 text-[10px] uppercase tracking-wider">
                Authorized Signatory
              </p>
              <p className="text-[9px] text-stone-500">
                For Ganesh Mule Artisanal Apiaries Pvt Ltd
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
