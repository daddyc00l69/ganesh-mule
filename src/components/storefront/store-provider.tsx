'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { StorefrontNavbar } from './navbar';
import { StorefrontFooter } from './footer';
import { CartDrawer } from './cart-drawer';
import { ChatwootWidget } from './chatwoot-widget';

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const isCheckout = Boolean(pathname === '/checkout' || pathname?.startsWith('/checkout'));

  React.useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f7] text-[#1d1d1f] antialiased">
      {!isCheckout && <StorefrontNavbar />}
      <main className="flex-1">{children}</main>
      {!isCheckout && <StorefrontFooter />}
      {!isCheckout && <CartDrawer />}
      <ChatwootWidget />
    </div>
  );
};
