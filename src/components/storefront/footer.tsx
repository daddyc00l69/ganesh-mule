'use client';

import React from 'react';
import Link from 'next/link';

export const StorefrontFooter: React.FC = () => {
  return (
    <footer className="bg-[#f5f5f7] border-t border-[#d2d2d7]/70 text-[#86868b] text-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-20 sm:pb-14 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="font-semibold text-[#1d1d1f] mb-3">Ganesh Mule</h4>
            <p className="text-xs text-[#6e6e73] leading-relaxed">
              Single-origin raw forest honey from the Western Ghats, bottled exclusively in solid glass.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-[#1d1d1f] mb-3">Shop Collections</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/shop" className="hover:text-[#1d1d1f] hover:underline transition-colors">
                  All 10 Products
                </Link>
              </li>
              <li>
                <Link href="/product/multiflora-honey" className="hover:text-[#1d1d1f] hover:underline transition-colors">
                  Multiflora Honey
                </Link>
              </li>
              <li>
                <Link href="/product/raw-honey-comb" className="hover:text-[#1d1d1f] hover:underline transition-colors">
                  Raw Honey Comb
                </Link>
              </li>
              <li>
                <Link href="/product/honey-with-comb" className="hover:text-[#1d1d1f] hover:underline transition-colors">
                  Honey with Comb
                </Link>
              </li>
              <li>
                <Link href="/product/6-flavour-honey-gift-box" className="hover:text-[#1d1d1f] hover:underline transition-colors">
                  6 Flavour Gift Box
                </Link>
              </li>
              <li>
                <Link href="/product/4-flavour-honey-gift-box" className="hover:text-[#1d1d1f] hover:underline transition-colors">
                  4 Flavour Gift Box
                </Link>
              </li>
              <li>
                <Link href="/product/forest-honey" className="hover:text-[#1d1d1f] hover:underline transition-colors">
                  Wild Forest Honey
                </Link>
              </li>
              <li>
                <Link href="/product/saunf-honey" className="hover:text-[#1d1d1f] hover:underline transition-colors">
                  Saunf (Fennel) Honey
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-[#1d1d1f] mb-3">Account</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/account" className="hover:text-[#1d1d1f] hover:underline transition-colors">
                  Orders &amp; Invoices
                </Link>
              </li>
              <li>
                <Link href="/checkout" className="hover:text-[#1d1d1f] hover:underline transition-colors">
                  Checkout
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-[#1d1d1f] mb-3">Purity &amp; Help</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/support" className="hover:text-[#1d1d1f] hover:underline transition-colors">
                  NMR Lab Reports
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-[#1d1d1f] hover:underline transition-colors">
                  Shipping &amp; Care
                </Link>
              </li>
              <li>
                <Link href="/portal" className="hover:text-[#1d1d1f] hover:underline transition-colors">
                  Staff Portal
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-[#d2d2d7]/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-[#86868b]">
          <p>© 2026 Ganesh Mule Pure Honey. All rights reserved.</p>
          <p>Insured Solid Glass Delivery across India</p>
        </div>
      </div>
    </footer>
  );
};
