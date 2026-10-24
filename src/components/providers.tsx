'use client';

import React from 'react';
import { CartProvider } from '@/lib/cart/cart-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}
