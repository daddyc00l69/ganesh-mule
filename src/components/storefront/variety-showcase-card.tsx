'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CategoryItem, ProductItem } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { useCart } from '@/lib/cart/cart-context';
import { Check, Plus, Star, ArrowRight, ShieldCheck } from 'lucide-react';

export interface VarietyShowcaseCardProps {
  category: CategoryItem;
  products: ProductItem[];
  activeWeightFilter?: 'ALL' | '250' | '500' | '1000';
}

export const VarietyShowcaseCard: React.FC<VarietyShowcaseCardProps> = ({
  category,
  products,
  activeWeightFilter = 'ALL',
}) => {
  const { addToCart } = useCart();
  const [selectedWeight, setSelectedWeight] = useState<'250' | '500' | '1000'>(
    activeWeightFilter !== 'ALL' ? activeWeightFilter : '500'
  );
  const [isAdded, setIsAdded] = useState(false);

  // Sync when parent filter changes
  useEffect(() => {
    if (activeWeightFilter !== 'ALL') {
      setSelectedWeight(activeWeightFilter);
    }
  }, [activeWeightFilter]);

  // Find the product corresponding to the category and chosen weight
  const targetGrams = selectedWeight === '1000' ? 1000 : parseInt(selectedWeight, 10);
  const activeProduct =
    products.find(
      (p) =>
        (p.categoryId === category.id || p.category?.slug === category.slug) &&
        (p.weightGrams === targetGrams || (selectedWeight === '1000' && p.weightGrams === 1000))
    ) ||
    products.find((p) => p.categoryId === category.id) ||
    products[0];

  const rating = activeProduct?.rating || 4.9;
  const ratingCount = activeProduct?.ratingCount || 600;

  const discountPercent =
    activeProduct?.compareAtPrice && activeProduct.compareAtPrice > activeProduct.price
      ? Math.round(((activeProduct.compareAtPrice - activeProduct.price) / activeProduct.compareAtPrice) * 100)
      : 0;

  const pricePerKg =
    selectedWeight === '250'
      ? '₹796 / kg'
      : selectedWeight === '500'
      ? '₹798 / kg'
      : '₹749 / kg (Lowest Rate)';

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!activeProduct) return;
    addToCart(activeProduct, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const isOutOfStock = activeProduct ? activeProduct.stockQuantity <= 0 : false;
  const isLowStock =
    activeProduct && activeProduct.stockQuantity > 0 && activeProduct.stockQuantity <= activeProduct.lowStockThreshold;

  return (
    <article className="group bg-white border border-stone-200/80 hover:border-amber-700/40 rounded-3xl p-5 flex flex-col justify-between h-full transition-all duration-300 hover:shadow-[0_16px_40px_rgba(28,25,23,0.08)] select-none">
      <div>
        {/* Full-Bleed Product Image with Clean Lighting */}
        <Link
          href={`/product/${activeProduct?.slug || category.slug}`}
          className="block w-full aspect-square rounded-2xl bg-[#F7F4EE] relative mb-5 overflow-hidden group-hover:bg-[#F3EFE6] transition-colors"
        >
          {activeProduct?.images?.[0] ? (
            <Image
              src={activeProduct.images[0].url}
              alt={activeProduct.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
              className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out p-2"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-xs font-mono text-stone-400">{category.name}</span>
            </div>
          )}

          {/* Floating Pill Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {activeProduct?.badge && (
              <span className="text-[10px] sm:text-[11px] font-bold tracking-wide px-2.5 py-0.5 rounded-full bg-stone-950/90 text-white shadow-2xs backdrop-blur-xs">
                {activeProduct.badge}
              </span>
            )}
            {isOutOfStock ? (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                Out of Stock
              </span>
            ) : isLowStock ? (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                Only {activeProduct.stockQuantity} left
              </span>
            ) : null}
          </div>

          <div className="absolute bottom-3 right-3 bg-white/95 text-stone-800 text-[10px] font-medium px-2 py-0.5 rounded-full border border-stone-200 shadow-2xs flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Solid Glass</span>
          </div>
        </Link>

        {/* Variety Metadata */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span className="font-medium text-amber-900 tracking-wide uppercase text-[11px]">
              Single-Origin Harvest
            </span>
            <span className="inline-flex items-center gap-1 text-stone-700 font-semibold text-xs">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              {rating} <span className="font-normal text-stone-400">({ratingCount})</span>
            </span>
          </div>

          <Link href={`/product/${activeProduct?.slug || category.slug}`} className="block">
            <h3 className="text-lg sm:text-xl font-bold font-serif text-stone-950 group-hover:text-amber-900 transition-colors tracking-tight line-clamp-1">
              {category.name}
            </h3>
          </Link>

          <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
            {(activeProduct as any)?.flavour || category.description}
          </p>
        </div>

        {/* Interactive 3-Weight Selector Buttons */}
        <div className="pt-4 pb-2 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
            Select Volume & Sizing:
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { weight: '250' as const, label: '250g', price: '₹199' },
              { weight: '500' as const, label: '500g', price: '₹399' },
              { weight: '1000' as const, label: '1kg', price: '₹749' },
            ].map((sizeOpt) => {
              const isSelected = selectedWeight === sizeOpt.weight;
              return (
                <button
                  key={sizeOpt.weight}
                  type="button"
                  onClick={() => setSelectedWeight(sizeOpt.weight)}
                  className={`py-1.5 px-2 rounded-xl text-center transition-all cursor-pointer border ${
                    isSelected
                      ? 'border-amber-800 bg-amber-50 text-amber-950 font-bold shadow-2xs'
                      : 'border-stone-200 bg-stone-50/60 text-stone-600 hover:border-stone-300 hover:bg-white text-xs'
                  }`}
                >
                  <span className="block text-[11px] leading-tight font-semibold">{sizeOpt.label}</span>
                  <span className={`block text-[10px] leading-tight ${isSelected ? 'text-amber-900 font-bold' : 'text-stone-500'}`}>
                    {sizeOpt.price}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pricing & Cart Action Footer */}
      <div className="pt-4 mt-2 border-t border-stone-100 flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xl font-bold text-stone-950 tracking-tight">
              {activeProduct ? formatCurrency(activeProduct.price) : '₹399'}
            </span>
            {activeProduct?.compareAtPrice && (
              <span className="text-xs text-stone-400 line-through">
                {formatCurrency(activeProduct.compareAtPrice)}
              </span>
            )}
            {discountPercent > 0 && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 rounded">
                {discountPercent}% OFF
              </span>
            )}
          </div>
          <span className="text-[10px] text-stone-500">
            {pricePerKg} · {activeProduct && activeProduct.compareAtPrice ? `Save ${formatCurrency(activeProduct.compareAtPrice - activeProduct.price)}` : ''}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleAdd}
            className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer active:scale-95 shrink-0 shadow-2xs ${
              isAdded
                ? 'bg-emerald-700 text-white'
                : isOutOfStock
                ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                : 'bg-stone-900 hover:bg-amber-800 text-white'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Added</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </>
            )}
          </button>

          <Link
            href={`/product/${activeProduct?.slug || category.slug}`}
            className="p-2 rounded-full border border-stone-200 bg-stone-50 hover:bg-white text-stone-700 hover:text-stone-900 transition-colors"
            title="View Details"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
};
