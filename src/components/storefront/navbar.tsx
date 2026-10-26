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
  ArrowRight,
} from 'lucide-react';

export const StorefrontNavbar: React.FC = () => {
  const pathname = usePathname();
  const { totalItems, setIsCartOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Store', href: '/' },
    { label: 'The Shop', href: '/shop' },
    { label: 'Purity & NMR', href: '/support' },
    { label: 'Account', href: '/account' },
  ];

  return (
    <>
      {/* Apple Store Top Banner Notice */}
      <div className="bg-[#f5f5f7] border-b border-[#e5e5e7] text-[#1d1d1f] text-[11px] sm:text-[12px] py-2 px-4 text-center font-normal tracking-tight">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
          <span className="font-medium text-[#1d1d1f]">Insured Doorstep Courier Delivery Across India (Delhivery One) • 100% Solid Glass Safe Transit Guarantee</span>
          <Link href="/shop" className="text-[#0066cc] hover:underline inline-flex items-center gap-0.5 font-medium">
            <span>Shop pure honey</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Apple Translucent Navigation Bar */}
      <header className="sticky top-0 z-50 w-full apple-glass border-b border-[#d2d2d7]/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-11 sm:h-12 flex items-center justify-between">
          {/* Apple-Style Monogram / Brand */}
          <Link href="/" className="flex items-center gap-2 text-[#1d1d1f] hover:opacity-80 transition-opacity">
            <Droplets className="w-4 h-4 fill-[#1d1d1f]" />
            <span className="font-semibold text-sm tracking-tight text-[#1d1d1f]">
              Ganesh Mule
            </span>
          </Link>

          {/* Desktop Links (Apple-Style 12px Clean Text) */}
          <nav className="hidden md:flex items-center gap-8 text-[12px]">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-colors font-normal tracking-tight ${
                    isActive
                      ? 'text-[#1d1d1f] font-semibold'
                      : 'text-[#1d1d1f]/75 hover:text-[#1d1d1f]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Action Icons: User & Bag */}
          <div className="flex items-center gap-4">
            <Link
              href="/account"
              className="text-[#1d1d1f]/75 hover:text-[#1d1d1f] transition-colors p-1"
              title="Your Account"
            >
              <User className="w-4 h-4" />
            </Link>

            {/* Apple Store Bag Button */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative p-1 text-[#1d1d1f]/75 hover:text-[#1d1d1f] transition-colors cursor-pointer"
              title="Shopping Bag"
              aria-label="Shopping Bag"
            >
              <ShoppingBag className="w-4 h-4" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#1d1d1f] text-white text-[9px] font-bold flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden text-[#1d1d1f]/75 hover:text-[#1d1d1f] p-1"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#d2d2d7]/50 bg-white/95 backdrop-blur-xl px-6 py-4 space-y-3 animate-in slide-in-from-top-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-medium text-[#1d1d1f] hover:text-[#0066cc] py-1 border-b border-[#f5f5f7]"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2">
              <Link
                href="/portal"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-medium text-[#6e6e73] hover:text-[#1d1d1f]"
              >
                Staff Operations Portal →
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
