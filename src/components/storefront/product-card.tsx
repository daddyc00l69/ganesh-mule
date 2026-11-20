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
      <article className="bg-white border border-stone-200/90 hover:border-amber-700/60 rounded-3xl p-5 sm:p-6 flex flex-col h-full transition-all duration-300 hover:shadow-[0_16px_36px_rgba(28,25,23,0.08)] group-hover:-translate-y-1">
        
        {/* Full-Bleed Studio Glass Photo */}
        <div className="w-full aspect-square rounded-2xl bg-[#FCFBF7] relative mb-5 overflow-hidden border border-stone-100 flex items-center justify-center p-6">
          <Image
            src={displayImage}
            alt={cleanName}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
            className="object-contain group-hover:scale-106 transition-transform duration-700 ease-out p-4"
          />

          {/* Floating Origin Tag */}
          <span className="absolute top-3.5 left-3.5 text-[10px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-stone-900 text-white shadow-2xs">
            Single-Origin
          </span>

          <span className="absolute bottom-3.5 right-3.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/95 text-stone-700 border border-stone-200/80 shadow-2xs backdrop-blur-xs flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Solid Glass</span>
          </span>
        </div>

        {/* Product Details & Starting Price */}
        <div className="flex-1 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span className="truncate max-w-[200px]">
                {(product as any).origin || 'Western Ghats Canopies'}
              </span>
              <span className="inline-flex items-center gap-1 text-stone-800 font-medium shrink-0">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                <span>{rating}</span>
                <span className="text-stone-400 font-normal text-[11px]">({ratingCount})</span>
              </span>
            </div>

            {/* Variety Title */}
            <h3 className="text-xl font-serif font-bold text-stone-950 group-hover:text-amber-900 transition-colors tracking-tight">
              {cleanName}
            </h3>

            {/* Short Description */}
            <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
              {(product as any).flavour || product.description}
            </p>

            {/* Available Sizes Pill (Educational, not separate products) */}
            <div className="pt-2">
              <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                <span className="font-medium text-stone-700">Available in:</span>
                <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-800 font-mono text-[10px] font-semibold">
                  250g
                </span>
                <span>•</span>
                <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-800 font-mono text-[10px] font-semibold">
                  500g
                </span>
                <span>•</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-100/70 text-amber-900 font-mono text-[10px] font-semibold">
                  1kg
                </span>
              </div>
            </div>
          </div>

          {/* Pricing & Apple-Style Explore / Configure Button */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs font-normal text-stone-500">From</span>
                <span className="text-lg font-bold text-stone-950 tracking-tight">
                  {formatCurrency(startingPrice)}
                </span>
                <span className="text-xs text-stone-400 line-through">
                  {formatCurrency(compareAtPrice)}
                </span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700">
                {discountPercent}% OFF · Bottled in Glass
              </span>
            </div>

            <div className="px-4 py-2 rounded-full bg-stone-900 group-hover:bg-amber-800 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs group-hover:shadow-sm shrink-0">
              <span>Configure &amp; Buy</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};
