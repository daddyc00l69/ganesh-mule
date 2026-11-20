'use client';

import React from 'react';
import Link from 'next/link';

export const StorefrontFooter: React.FC = () => {
  return (
    <footer className="bg-[#f5f5f2] border-t border-stone-200/70 text-stone-500 text-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-20 sm:pb-14 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="font-semibold text-stone-900 mb-3">Ganesh Mule</h4>
            <p className="text-xs text-stone-500 leading-relaxed">
              Single-origin raw forest honey from the Western Ghats, bottled exclusively in solid glass.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-stone-900 mb-3">Jars</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/shop" className="hover:text-stone-950 transition-colors">
                  All Harvests
                </Link>
              </li>
              <li>
                <Link href="/product/wild-forest-raw-honey-300g" className="hover:text-stone-950 transition-colors">
                  Wild Forest Honey (300g)
                </Link>
              </li>
              <li>
                <Link href="/product/wild-forest-raw-honey-750g" className="hover:text-stone-950 transition-colors">
                  Wild Forest Honey (750g)
                </Link>
              </li>
              <li>
                <Link href="/product/wild-forest-raw-honey-1050g" className="hover:text-stone-950 transition-colors">
                  Wild Forest Honey (1050g)
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-stone-900 mb-3">Account</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/account" className="hover:text-stone-950 transition-colors">
                  Orders &amp; Invoices
                </Link>
              </li>
              <li>
                <Link href="/checkout" className="hover:text-stone-950 transition-colors">
                  Checkout
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-stone-900 mb-3">Purity &amp; Help</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/support" className="hover:text-stone-950 transition-colors">
                  NMR Lab Reports
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-stone-950 transition-colors">
                  Shipping &amp; Care
                </Link>
              </li>
              <li>
                <Link href="/portal" className="hover:text-stone-950 transition-colors">
                  Staff Portal
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-stone-200/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-stone-400">
          <p>© 2026 Ganesh Mule Pure Honey. All rights reserved.</p>
          <p>Insured Solid Glass Delivery across India</p>
        </div>
      </div>
    </footer>
  );
};
