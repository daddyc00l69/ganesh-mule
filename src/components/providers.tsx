'use client';

import React from 'react';
import { CartProvider } from '@/lib/cart/cart-context';
import { ThemeProvider } from '@/components/theme-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <CartProvider>{children}</CartProvider>
    </ThemeProvider>
  );
}
