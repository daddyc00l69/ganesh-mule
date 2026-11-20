import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { StoreProvider } from '@/components/storefront/store-provider';
import { ShopClient } from '@/components/storefront/shop-client';

export const metadata: Metadata = {
  title: 'The Honey Shop | 100% Raw Wild Forest Honey in Solid Glass',
  description:
    'Single-origin, unheated raw wild forest honey from the Western Ghats, bottled exclusively in solid glass jars (300g, 750g, 1050g).',
};

export default function ShopPage() {
  return (
    <StoreProvider>
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-12 text-center text-xs text-stone-400">
            <span>Loading artisanal honey reserves...</span>
          </div>
        }
      >
        <ShopClient />
      </Suspense>
    </StoreProvider>
  );
}
