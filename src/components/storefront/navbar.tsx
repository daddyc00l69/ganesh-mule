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
    { label: 'Home', href: '/' },
    { label: 'Shop Harvests', href: '/shop' },
    { label: 'Purity & NMR', href: '/support' },
    { label: 'Orders', href: '/account' },
  ];

  return (
    <header className="w-full bg-white/80 backdrop-blur-md border-b border-[#d2d2d7]/80 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-12 sm:h-14 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-[#1d1d1f] hover:opacity-75 transition-opacity"
        >
          <Droplets className="w-4 h-4 fill-amber-500 text-amber-600" />
          <span className="font-semibold text-sm sm:text-base tracking-tight text-[#1d1d1f]">
            Ganesh Mule
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-[12px] sm:text-[13px] tracking-tight">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors ${
                  isActive
                    ? 'text-[#1d1d1f] font-semibold'
                    : 'text-[#1d1d1f]/70 hover:text-[#1d1d1f]'
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
            className="text-[#1d1d1f]/70 hover:text-[#1d1d1f] transition-colors p-1.5 rounded-full hover:bg-black/5"
            title="Your Account"
            aria-label="Your Account"
          >
            <User className="w-4 h-4" />
          </Link>

          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="relative p-1.5 rounded-full text-[#1d1d1f]/70 hover:text-[#1d1d1f] hover:bg-black/5 transition-colors cursor-pointer"
            title="Shopping Bag"
            aria-label="Shopping Bag"
          >
            <ShoppingBag className="w-4 h-4" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-[#0071e3] text-white text-[10px] font-semibold flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden text-[#1d1d1f]/70 hover:text-[#1d1d1f] p-1.5"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#d2d2d7]/80 bg-white/95 backdrop-blur-md px-6 py-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-[#1d1d1f] hover:text-[#0071e3] py-2 border-b border-zinc-100 last:border-b-0"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};
