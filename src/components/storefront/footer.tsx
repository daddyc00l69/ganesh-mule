'use client';

import React from 'react';
import Link from 'next/link';

export const StorefrontFooter: React.FC = () => {
  return (
    <footer className="bg-[#f5f5f7] border-t border-[#d2d2d7]/60 text-[#6e6e73] text-[12px] font-normal tracking-tight pb-20 sm:pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-4">
        
        {/* 1. Apple-Style Numbered Footnotes */}
        <div className="space-y-1.5 pb-4 border-b border-[#d2d2d7]/50 text-[11px] leading-relaxed text-[#86868b]">
          <p>
            1. Nuclear Magnetic Resonance (NMR) spectroscopy and isotopic ratio mass spectrometry testing are conducted on every seasonal apiary harvest by certified German testing laboratories to verify 0.0% added invert, rice, or corn sugar syrups.
          </p>
          <p>
            2. Insured national express courier delivery across India is charged at flat ₹70.00 base + 18% GST (Total ₹82.60). Each solid glass jar is cushioned in engineered shock-absorbing kraft protection with a 100% Zero-Breakage Replacement Guarantee.
          </p>
          <p>
            3. Pure raw honey naturally crystallises over time below 20°C due to intact live wildflower pollen grains and natural glucose. Crystallisation is the biological hallmark of unpasteurised, unboiled honey.
          </p>
        </div>

        {/* 2. Apple Directory Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 py-3 text-[12px]">
          {/* Column 1: Shop and Learn */}
          <div>
            <h4 className="font-semibold text-[#1d1d1f] mb-2.5">Shop and Learn</h4>
            <ul className="space-y-2 text-[#424245]">
              <li>
                <Link href="/shop" className="hover:text-[#1d1d1f] hover:underline transition-colors">
                  All Harvests
                </Link>
              </li>
              <li>
                <Link href="/product/wild-forest-raw-honey-500g" className="hover:text-[#1d1d1f] hover:underline transition-colors">
                  Wild Forest Honey
                </Link>
              </li>
              <li>
                <Link href="/product/himalayan-white-acacia-honey" className="hover:text-[#1d1d1f] hover:underline transition-colors">
                  Himalayan White Acacia
                </Link>
              </li>
              <li>
                <Link href="/product/kashmiri-saffron-infused-raw-honey" className="hover:text-[#1d1d1f] hover:underline transition-colors">
                  Kashmiri Saffron Infusion
                </Link>
              </li>
              <li>
                <Link href="/product/artisan-raw-honeycomb-slab" className="hover:text-[#1d1d1f] hover:underline transition-colors">
                  Virgin Artisan Honeycomb
                </Link>
              </li>
              <li>
                <Link href="/product/handcrafted-olive-wood-honey-dipper" className="hover:text-[#1d1d1f] hover:underline transition-colors">
                  Handcrafted Olivewood Dipper
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Account */}
          <div>
            <h4 className="font-semibold text-[#1d1d1f] mb-2.5">Account</h4>
            <ul className="space-y-2 text-[#424245]">
              <li>
                <Link href="/account" className="hover:text-[#1d1d1f] hover:underline transition-colors">
                  Manage Your Account
                </Link>
              </li>
              <li>
                <Link href="/account" className="hover:text-[#1d1d1f] hover:underline transition-colors">
                  Order Status &amp; Invoices
                </Link>
              </li>
              <li>
                <Link href="/checkout" className="hover:text-[#1d1d1f] hover:underline transition-colors">
                  Express Checkout
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Honey Purity & Values */}
          <div>
            <h4 className="font-semibold text-[#1d1d1f] mb-2.5">Purity &amp; Standards</h4>
            <ul className="space-y-2 text-[#424245]">
              <li>
                <Link href="/support" className="hover:text-[#1d1d1f] hover:underline transition-colors">
                  NMR Lab Test Reports
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-[#1d1d1f] hover:underline transition-colors">
                  Cold-Extraction Philosophy
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-[#1d1d1f] hover:underline transition-colors">
                  Solid Glass Inert Guarantee
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-[#1d1d1f] hover:underline transition-colors">
                  Raw Honey Crystallisation Care
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: About & Operations */}
          <div>
            <h4 className="font-semibold text-[#1d1d1f] mb-2.5">About Ganesh Mule</h4>
            <ul className="space-y-2 text-[#424245]">
              <li>
                <Link href="/support" className="hover:text-[#1d1d1f] hover:underline transition-colors">
                  Western Ghats Reserves
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-[#1d1d1f] hover:underline transition-colors">
                  Sustainable Cliff Foraging
                </Link>
              </li>
              <li>
                <Link href="/portal" className="hover:text-[#1d1d1f] hover:underline transition-colors font-medium text-[#1d1d1f]">
                  Staff Operations Portal ↗
                </Link>
              </li>
              <li>
                <Link href="/manager/inventory" className="hover:text-[#1d1d1f] hover:underline transition-colors">
                  Manager Inventory Desk
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* 3. Apple Store Bottom Legal & Copyright Bar */}
        <div className="pt-4 border-t border-[#d2d2d7]/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5 text-[11px] text-[#86868b]">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 flex-wrap">
            <p>Copyright © 2026 Ganesh Mule Pure Honey. All rights reserved.</p>
            <div className="flex items-center gap-2 flex-wrap">
              <Link href="/support" className="hover:text-[#1d1d1f] hover:underline">
                Privacy Policy
              </Link>
              <span>•</span>
              <Link href="/support" className="hover:text-[#1d1d1f] hover:underline">
                Terms of Sale
              </Link>
              <span>•</span>
              <Link href="/support" className="hover:text-[#1d1d1f] hover:underline">
                Lab Traceability
              </Link>
              <span>•</span>
              <Link href="/portal" className="hover:text-[#1d1d1f] hover:underline">
                Staff Portal
              </Link>
            </div>
          </div>

          <div className="text-[#1d1d1f] font-medium shrink-0">
            India
          </div>
        </div>
      </div>
    </footer>
  );
};
