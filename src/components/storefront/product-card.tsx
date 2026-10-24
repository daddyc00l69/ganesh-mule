'use client';

import React from 'react';
import Link from 'next/link';
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

  const discountPercent = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  const rating = product.rating || 4.9;
  const ratingCount = product.ratingCount || 1240;

  const getBadgeClass = (color?: string) => {
    switch (color) {
      case 'amber':
        return 'bg-amber-500/15 text-amber-900 border-amber-500/30';
      case 'cyan':
        return 'bg-cyan-500/15 text-cyan-900 border-cyan-500/30';
      case 'purple':
        return 'bg-purple-500/15 text-purple-900 border-purple-500/30';
      case 'emerald':
        return 'bg-emerald-500/15 text-emerald-900 border-emerald-500/30';
      case 'rose':
        return 'bg-rose-500/15 text-rose-900 border-rose-500/30';
      case 'blue':
        return 'bg-blue-500/15 text-blue-900 border-blue-500/30';
      default:
        return 'bg-white/95 text-[#1d1d1f] border-slate-200/80';
    }
  };

  return (
    <Link href={`/product/${product.slug}`} className="group block h-full">
      <div className="apple-card bg-white border border-[#e5e5e7]/80 rounded-[22px] p-4 sm:p-5 flex flex-col h-full hover:border-[#0071e3]/40 transition-all duration-300">
        
        {/* Apple Product Studio Display */}
        <div className="w-full aspect-square rounded-[18px] bg-[#f5f5f7] relative mb-3 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          {product.images[0] ? (
            <img
              src={product.images[0].url}
              alt={product.name}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 ease-out"
            />
          ) : (
            <div className="text-xs font-mono text-[#86868b]">{product.sku}</div>
          )}

          {/* Apple Style Floating Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
            {discountPercent > 0 && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#1d1d1f] text-white shadow-2xs">
                {discountPercent}% OFF
              </span>
            )}
            {isOutOfStock ? (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                Sold Out
              </span>
            ) : isLowStock ? (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                Only {product.stockQuantity} Left
              </span>
            ) : null}
          </div>

          <div className="absolute top-2.5 right-2.5">
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border shadow-2xs backdrop-blur-xs ${getBadgeClass(product.badgeColor)}`}>
              <span>{product.badge || 'NMR Pure'}</span>
            </span>
          </div>
        </div>

        {/* Content Hierarchy */}
        <div className="flex-1 flex flex-col justify-between space-y-2.5">
          <div>
            <div className="flex items-center justify-between text-[11px] text-[#6e6e73]">
              <span className="truncate max-w-[120px] font-medium">
                {product.category?.name || 'Raw Forest Honey'}
              </span>
              <div className="flex items-center gap-1 text-[#1d1d1f] font-medium shrink-0">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{rating}</span>
                <span className="text-[#86868b] text-[10px] hidden xs:inline">({ratingCount})</span>
              </div>
            </div>

            <h3 className="text-sm sm:text-base font-semibold text-[#1d1d1f] group-hover:text-[#0071e3] transition-colors line-clamp-1 mt-0.5">
              {product.name}
            </h3>

            <p className="text-[11px] sm:text-xs text-[#6e6e73] line-clamp-2 mt-0.5 leading-snug">
              {product.description}
            </p>
          </div>

          {/* Apple Store Pricing & Buy Pill Button */}
          <div className="pt-2.5 border-t border-[#f5f5f7] flex items-center justify-between gap-1.5">
            <div className="min-w-0">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-sm sm:text-base font-semibold text-[#1d1d1f]">
                  {formatCurrency(product.price)}
                </span>
                {product.compareAtPrice && (
                  <span className="text-[11px] text-[#86868b] line-through">
                    {formatCurrency(product.compareAtPrice)}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-[#86868b] block truncate font-normal">
                {product.weightGrams ? `${product.weightGrams}g solid glass jar` : '500g solid glass jar'}
              </span>
            </div>

            {/* Apple Blue Pill Button */}
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleAdd}
              className={`px-3 py-1.5 sm:px-4 sm:py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 cursor-pointer active:scale-95 shrink-0 ${
                isAdded
                  ? 'bg-emerald-600 text-white'
                  : isOutOfStock
                  ? 'bg-[#e5e5e7] text-[#86868b] cursor-not-allowed'
                  : 'bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-xs'
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
                  <span>Buy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};
