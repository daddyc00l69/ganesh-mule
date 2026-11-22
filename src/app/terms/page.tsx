import React from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, ShieldCheck, Scale, Truck, RotateCcw } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service | Ganesh Mule',
  description: 'Terms of service and purchasing conditions for Ganesh Mule raw forest honey products.',
};

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-[#faf8f5] text-[#1d1d1f] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[#86868b] hover:text-[#1d1d1f] transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Store
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#1d1d1f]">Terms of Service</h1>
              <p className="text-xs text-[#86868b] mt-0.5">Last updated: November 2026 • Effective immediately</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm p-6 sm:p-8 space-y-6 text-sm leading-relaxed text-[#424245]">
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[#1d1d1f] flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" /> 1. Agreement to Terms
            </h2>
            <p>
              By accessing or purchasing from <strong>Ganesh Mule</strong> (ganesh-mule.vercel.app), you agree to be bound
              by these Terms of Service. If you do not agree with any part of these terms, please do not use our services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[#1d1d1f] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600" /> 2. Product Authenticity &amp; Purity
            </h2>
            <p>
              All Ganesh Mule products consist of authentic, unprocessed, single-origin raw honey harvested directly
              from certified Western Ghats apiaries. Natural crystallization may occur in raw honey and is a natural mark
              of pure, unpasteurized honey.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[#1d1d1f] flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-600" /> 3. Shipping &amp; Insured Glass Delivery
            </h2>
            <p>
              Orders are dispatched in custom shock-absorbing insulated solid glass packaging through Delhivery One Surface Logistics.
              Consignment tracking numbers (AWB) are allocated upon dispatch. Delivery times are typically 2 to 4 business days
              depending on destination PIN code.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[#1d1d1f] flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-600" /> 4. Transit Damage &amp; Replacement
            </h2>
            <p>
              In the unlikely event of transit breakage of solid glass jars, customers must provide clear photo evidence within
              24 hours of delivery. We will promptly dispatch a replacement jar free of charge or issue an immediate refund.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[#1d1d1f]">5. Contact &amp; Governance</h2>
            <p>
              These terms are governed by the laws of Maharashtra, India. For inquiries, contact:
              <br />
              <strong>Email:</strong> aradhyetushar@gmail.com
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
