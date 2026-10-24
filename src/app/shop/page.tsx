import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { StoreProvider } from '@/components/storefront/store-provider';
import { ShopClient } from '@/components/storefront/shop-client';

export const metadata: Metadata = {
  title: 'The Honey Shop | 100% Raw Wild Forest Honey in Solid Glass',
  description:
    'Explore our 6 artisanal single-origin wild forest honey varieties, alpine acacia, royal saffron infusions, and virgin comb slabs.',
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
