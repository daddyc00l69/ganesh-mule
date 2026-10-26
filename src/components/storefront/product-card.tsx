'use client';

import React from 'react';
import Link from 'next/link';
import { ProductItem } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { useCart } from '@/lib/cart/cart-context';
import { Check, Plus, Star, ShieldCheck, Sparkles, MapPin } from 'lucide-react';

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
    setTimeout(() => setIsAdded(false), 1600);
  };

  const isOutOfStock = product.stockQuantity <= 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= product.lowStockThreshold;

  const discountPercent = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  const rating = product.rating || 4.9;
  const ratingCount = product.ratingCount || 1240;

  const getWeightLabel = () => {
    if (product.weightGrams) {
      if (product.weightGrams >= 1000) return `${(product.weightGrams / 1000).toFixed(1)}kg Solid Glass`;
      return `${product.weightGrams}g Solid Glass`;
    }
    return '500g Solid Glass';
  };

  const originText = (product as any).origin || 'Western Ghats, India';

  return (
    <Link href={`/product/${product.slug}`} className="group block h-full select-none">
      <div className="bg-white border border-[#e5e5e7] hover:border-amber-400/80 rounded-[24px] p-3.5 sm:p-5 flex flex-col h-full shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_36px_rgba(217,119,6,0.12)] transition-all duration-300 relative overflow-hidden">
        
        {/* Subtle Ambient Golden Nectar Glow on Hover */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl pointer-events-none group-hover:scale-150 transition-transform duration-700" />

        {/* Product Studio Showcase */}
        <div className="w-full aspect-square rounded-[20px] bg-gradient-to-b from-[#fbf9f6] to-[#f4efe8] relative mb-3.5 flex items-center justify-center p-4 sm:p-6 overflow-hidden border border-[#f0ede6]">
          {product.images[0] ? (
            <img
              src={product.images[0].url}
              alt={product.name}
              className="w-full h-full object-contain filter drop-shadow-[0_10px_16px_rgba(0,0,0,0.08)] group-hover:scale-108 group-hover:-translate-y-1 transition-all duration-500 ease-out"
            />
          ) : (
            <div className="text-xs font-mono text-[#86868b]">{product.sku}</div>
          )}

          {/* Floating Badges Left: Discount & Stock */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
            {discountPercent > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1c1917] text-amber-300 shadow-sm tracking-wide">
                SAVE {discountPercent}%
              </span>
            )}
            {isOutOfStock ? (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 shadow-2xs">
                Sold Out
              </span>
            ) : isLowStock ? (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs animate-pulse">
                Only {product.stockQuantity} Left
              </span>
            ) : null}
          </div>

          {/* Floating Badge Right: NMR Purity Seal */}
          <div className="absolute top-2.5 right-2.5 z-10">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-white/95 text-amber-950 border border-amber-300/80 shadow-xs backdrop-blur-md">
              <Sparkles className="w-2.5 h-2.5 text-amber-600 fill-amber-500" />
              <span>{product.badge || 'NMR Pure 400MHz'}</span>
            </span>
          </div>

          {/* Bottom Pill: Weight & Solid Glass */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[9px] font-medium text-[#78716c] px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-[#e7e5e4]">
            <span className="font-semibold text-stone-800 tracking-tight flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>{getWeightLabel()}</span>
            </span>
            <span className="truncate max-w-[120px] text-stone-500 flex items-center gap-0.5">
              <MapPin className="w-2.5 h-2.5 text-amber-700 shrink-0" />
              <span className="truncate">{originText.split(',')[0]}</span>
            </span>
          </div>
        </div>

        {/* Product Details & Content */}
        <div className="flex-1 flex flex-col justify-between space-y-3">
          <div>
            {/* Category & Rating Row */}
            <div className="flex items-center justify-between text-[11px] text-[#78716c]">
              <span className="truncate max-w-[140px] font-medium text-amber-900/90 tracking-wide uppercase text-[10px]">
                {product.category?.name || 'Raw Forest Honey'}
              </span>
              <div className="flex items-center gap-1 text-stone-900 font-semibold shrink-0 bg-stone-100/80 px-1.5 py-0.5 rounded-md">
                <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                <span>{rating}</span>
                <span className="text-[#a8a29e] text-[9px] font-normal">({ratingCount})</span>
              </div>
            </div>

            {/* Product Title */}
            <h3 className="text-sm sm:text-base font-bold text-stone-900 group-hover:text-amber-800 transition-colors line-clamp-1 mt-1 font-serif tracking-tight">
              {product.name}
            </h3>

            {/* Aromatic Floral Tasting Notes */}
            <p className="text-[11px] sm:text-xs text-[#78716c] line-clamp-2 mt-1 leading-relaxed">
              {(product as any).flavour || product.description}
            </p>
          </div>

          {/* Pricing & Add to Jar Action */}
          <div className="pt-3 border-t border-[#f5f5f4] flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-base sm:text-lg font-bold text-stone-950 font-sans tracking-tight">
                  {formatCurrency(product.price)}
                </span>
                {product.compareAtPrice && (
                  <span className="text-xs text-[#a8a29e] line-through font-normal">
                    {formatCurrency(product.compareAtPrice)}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-emerald-800 font-medium block truncate">
                5% GST Included • Insured Glass Safe
              </span>
            </div>

            {/* Luxury Amber Add Button */}
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleAdd}
              className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0 shadow-sm ${
                isAdded
                  ? 'bg-emerald-700 text-white shadow-emerald-700/20'
                  : isOutOfStock
                  ? 'bg-[#e7e5e4] text-[#a8a29e] cursor-not-allowed'
                  : 'bg-stone-900 hover:bg-amber-600 text-white hover:shadow-amber-600/30'
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
                  <span>Add to Jar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};
