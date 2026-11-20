'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/lib/cart/cart-context';
import {
  ShoppingBag,
  User,
  Menu,
  X,
  Droplets,
} from 'lucide-react';

export const StorefrontNavbar: React.FC = () => {
  const pathname = usePathname();
  const { totalItems, setIsCartOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Shop', href: '/shop' },
    { label: 'Purity & NMR', href: '/support' },
    { label: 'Orders', href: '/account' },
  ];

  return (
    <header className="w-full bg-[#FCFBF7] border-b border-stone-200/70">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link
          href="/shop"
          className="flex items-center gap-2 text-stone-900 hover:opacity-75 transition-opacity"
        >
          <Droplets className="w-4 h-4 fill-amber-600 text-amber-700" />
          <span className="font-serif font-semibold text-base tracking-tight text-stone-950">
            Ganesh Mule
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-[13px]">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors ${
                  isActive
                    ? 'text-stone-950 font-medium'
                    : 'text-stone-500 hover:text-stone-950'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/account"
            className="text-stone-600 hover:text-stone-950 transition-colors p-1.5 rounded-full hover:bg-stone-100"
            title="Your Account"
            aria-label="Your Account"
          >
            <User className="w-4 h-4" />
          </Link>

          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="relative p-1.5 rounded-full text-stone-600 hover:text-stone-950 hover:bg-stone-100 transition-colors cursor-pointer"
            title="Shopping Bag"
            aria-label="Shopping Bag"
          >
            <ShoppingBag className="w-4 h-4" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-stone-950 text-white text-[10px] font-semibold flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden text-stone-600 hover:text-stone-950 p-1.5"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200/70 bg-[#FCFBF7] px-6 py-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-stone-800 hover:text-amber-800 py-2 border-b border-stone-100 last:border-b-0"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};
