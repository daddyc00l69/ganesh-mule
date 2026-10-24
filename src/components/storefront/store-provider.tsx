'use client';

import React from 'react';
import { StorefrontNavbar } from './navbar';
import { StorefrontFooter } from './footer';
import { CartDrawer } from './cart-drawer';
import { ChatwootWidget } from './chatwoot-widget';

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  React.useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFBF7] text-[#1C1917] antialiased">
      <StorefrontNavbar />
      <main className="flex-1">{children}</main>
      <StorefrontFooter />
      <CartDrawer />
      <ChatwootWidget />
    </div>
  );
};
