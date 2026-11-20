'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ProductItem } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { ArrowRight, Star, ShieldCheck } from 'lucide-react';

export interface ProductCardProps {
  product: ProductItem;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  // Clean variety title without "(500g)" or "(250g)"
  const cleanName = product.name.replace(/\s*\((250g|500g|1kg|300g|750g|1050g)\)/i, '').trim();

  // Determine category slug for the configuration page link
  const categorySlug =
    product.category?.slug ||
    product.slug.replace(/-(250g|500g|1kg|300g|750g|1050g)$/, '') ||
    'forest-honey';

  const rating = product.rating || 4.9;
  const ratingCount = product.ratingCount || 500;

  // Starting price across the 3 sizes is ₹199 (250g), MRP ₹275
  const startingPrice = 19900;
  const compareAtPrice = 27500;
  const discountPercent = 28;

  // Preferred flagship display image
  const displayImage =
    product.images?.[0]?.url ||
    `/images/honey-brand/Forest Honey/500g/image_1_amazon_main.jpg`;

  return (
    <Link
      href={`/product/${categorySlug}`}
      className="group block h-full select-none"
    >
      <article className="bg-white rounded-[24px] p-6 sm:p-7 border border-[#d2d2d7]/70 hover:border-[#86868b] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col h-full justify-between">
        
        {/* Apple Seamless Product Photography (Pure White Blend) */}
        <div className="w-full aspect-square rounded-[20px] bg-white relative mb-5 overflow-hidden flex items-center justify-center p-4">
          <Image
            src={displayImage}
            alt={cleanName}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
            className="object-contain group-hover:scale-106 transition-transform duration-700 ease-out p-2"
          />

          {/* Floating Minimal Badges */}
          <span className="absolute top-3.5 left-3.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-white/95 text-[#1d1d1f] border border-black/5 shadow-2xs backdrop-blur-xs">
            Single-Origin
          </span>

          <span className="absolute bottom-3.5 right-3.5 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#1d1d1f] text-white shadow-2xs flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Solid Flint Glass</span>
          </span>
        </div>

        {/* Product Details & Starting Price */}
        <div className="flex-1 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#86868b]">
              <span className="truncate max-w-[200px]">
                {(product as any).origin || 'Western Ghats Canopies'}
              </span>
              <span className="inline-flex items-center gap-1 text-[#1d1d1f] font-medium shrink-0">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                <span>{rating}</span>
                <span className="text-[#86868b] font-normal text-[11px]">({ratingCount})</span>
              </span>
            </div>

            {/* Variety Title — Modern Crisp Sans-Serif */}
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1d1d1f] group-hover:text-[#0071e3] transition-colors">
              {cleanName}
            </h3>

            {/* Short Description with Natural Flavour Note */}
            <p className="text-xs text-[#6e6e73] line-clamp-2 leading-relaxed">
              {(product as any).flavour || (product as any).flavourNotes || product.description}
            </p>

            {/* Available Sizes Pill */}
            <div className="pt-2 flex items-center gap-2 text-xs text-[#86868b]">
              <span>Available in:</span>
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-0.5 rounded-md bg-[#f5f5f7] text-[#1d1d1f] text-[11px] font-medium">
                  250g
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-[#f5f5f7] text-[#1d1d1f] text-[11px] font-medium">
                  500g
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-[#f5f5f7] text-[#1d1d1f] text-[11px] font-medium">
                  1kg
                </span>
              </div>
            </div>
          </div>

          {/* Pricing & Apple Buy Pill Button */}
          <div className="pt-4 border-t border-[#d2d2d7]/50 flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs font-normal text-[#86868b]">From</span>
                <span className="text-xl font-bold text-[#1d1d1f] tracking-tight">
                  {formatCurrency(startingPrice)}
                </span>
                <span className="text-xs text-[#86868b] line-through">
                  {formatCurrency(compareAtPrice)}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-[#1b5e20]">
                Save up to {discountPercent}% · Solid Glass
              </span>
            </div>

            <div className="px-5 py-2 rounded-full bg-[#0071e3] hover:bg-[#0077ed] active:bg-[#0062c4] text-white text-xs sm:text-sm font-medium transition-all flex items-center justify-center shadow-sm group-hover:shadow-md shrink-0 cursor-pointer">
              <span>Buy</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};
