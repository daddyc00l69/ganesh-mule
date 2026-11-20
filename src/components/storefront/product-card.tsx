'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ProductItem } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { useCart } from '@/lib/cart/cart-context';
import { Check, Plus, Star } from 'lucide-react';

export interface ProductCardProps {
  product: ProductItem;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = React.useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const isOutOfStock = product.stockQuantity <= 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= product.lowStockThreshold;
  const rating = product.rating || 4.9;

  const weightLabel = product.weightGrams
    ? product.weightGrams >= 1000
      ? `${(product.weightGrams / 1000).toFixed(2).replace(/\.?0+$/, '')} kg`
      : `${product.weightGrams}g`
    : '500g';

  return (
    <Link href={`/product/${product.slug}`} className="group block h-full select-none">
      <article className="bg-white border border-stone-200/80 hover:border-stone-300 rounded-2xl p-4 sm:p-5 flex flex-col h-full transition-all duration-300 hover:shadow-[0_12px_30px_rgba(28,25,23,0.06)]">
        {/* Clean Full-Bleed Studio Photo */}
        <div className="w-full aspect-square rounded-xl bg-[#F7F4EE] relative mb-4 overflow-hidden">
          {product.images[0] ? (
            <Image
              src={product.images[0].url}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
              className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-xs font-mono text-stone-400">{product.sku}</span>
            </div>
          )}

          {isOutOfStock ? (
            <span className="absolute top-3 left-3 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              Sold Out
            </span>
          ) : isLowStock ? (
            <span className="absolute top-3 left-3 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              Only {product.stockQuantity} left
            </span>
          ) : product.badge === 'Most Popular' ? (
            <span className="absolute top-3 left-3 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-white/95 text-stone-800 border border-stone-200 shadow-2xs">
              Most Popular
            </span>
          ) : null}
        </div>

        {/* Clean Product Copy */}
        <div className="flex-1 flex flex-col justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span>{weightLabel} · Solid Glass</span>
              <span className="inline-flex items-center gap-1 text-stone-700 font-medium">
                <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                {rating}
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-semibold text-stone-950 group-hover:text-amber-900 transition-colors font-serif tracking-tight line-clamp-1">
              {product.name}
            </h3>

            <p className="text-xs text-stone-500 line-clamp-1">
              {(product as any).flavour || product.description}
            </p>
          </div>

          <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-semibold text-stone-950 tracking-tight">
                {formatCurrency(product.price)}
              </span>
              {product.compareAtPrice && (
                <span className="text-xs text-stone-400 line-through">
                  {formatCurrency(product.compareAtPrice)}
                </span>
              )}
            </div>

            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleAdd}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0 ${
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
          </div>
        </div>
      </article>
    </Link>
  );
};
