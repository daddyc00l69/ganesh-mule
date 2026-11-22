import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Lock, FileText, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | Ganesh Mule',
  description: 'Privacy Policy and data protection standards for Ganesh Mule single-origin raw honey.',
};

export default function PrivacyPolicyPage() {
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
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#1d1d1f]">Privacy Policy</h1>
              <p className="text-xs text-[#86868b] mt-0.5">Last updated: November 2026 • Effective immediately</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm p-6 sm:p-8 space-y-6 text-sm leading-relaxed text-[#424245]">
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[#1d1d1f] flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600" /> 1. Commitment to Your Privacy
            </h2>
            <p>
              At Ganesh Mule Pure Honey (&quot;Ganesh Mule&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), we are committed to safeguarding
              the personal information of our customers, beekeepers, and partners. This Privacy Policy details how we collect, use,
              and protect your information when you visit <strong>ganesh-mule.vercel.app</strong>, purchase raw honey, or use Google Sign-In.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[#1d1d1f] flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" /> 2. Information We Collect
            </h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Google Sign-In / Account Authentication:</strong> When you sign in using Google OAuth 2.0, we receive your verified name, email address, and profile avatar solely to authenticate your session and link your orders. We do not access contacts, files, or sensitive Google data.
              </li>
              <li>
                <strong>Shipping &amp; Delivery Information:</strong> Full recipient name, delivery address, postal PIN code, and contact phone number required to generate insured courier waybills via Delhivery One logistics.
              </li>
              <li>
                <strong>Payment Information:</strong> All financial transactions are securely processed through RBI-authorized payment gateways (Razorpay). Ganesh Mule never stores raw credit/debit card numbers or UPI PINs.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[#1d1d1f] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-600" /> 3. How We Use Your Information
            </h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>To confirm, process, package in solid glass, and dispatch your pure raw honey orders.</li>
              <li>To provide live Delhivery consignment tracking updates via SMS and email.</li>
              <li>To generate statutory GST tax invoices compliant with Indian tax laws.</li>
              <li>To deliver genuine customer support and preserve account security.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[#1d1d1f]">4. Data Protection &amp; Confidentiality</h2>
            <p>
              We implement industry-standard 256-bit TLS encryption, HTTPS-only secure transport, and hardened session storage. We do not sell, rent, or trade your personal data to third-party advertisers or marketers under any circumstances.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[#1d1d1f]">5. Contact Us</h2>
            <p>
              If you have any questions or data access requests regarding this policy, please reach out to:
            </p>
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-xs space-y-1">
              <p><strong>Ganesh Mule Pure Honey</strong></p>
              <p>Pune Apiary Dispatch Center, Maharashtra, India</p>
              <p>Email: <a href="mailto:aradhyetushar@gmail.com" className="text-amber-700 underline">aradhyetushar@gmail.com</a></p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
