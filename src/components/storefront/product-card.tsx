'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ProductItem } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { useCart } from '@/lib/cart/cart-context';
import { MOCK_PRODUCTS } from '@/lib/mock-data';
import { Check, Plus, Star } from 'lucide-react';

export interface ProductCardProps {
  product: ProductItem;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  // Clean variety title without "(500g)" or "(250g)"
  const cleanName = product.name.replace(/\s*\((250g|500g|1kg|300g|750g|1050g)\)/i, '').trim();

  // Find all 3 weight variants for this category/variety
  const variants = useMemo(() => {
    const list = [
      {
        weight: 250,
        label: '250g',
        sublabel: 'Sampler',
        price: 19900,
        compareAtPrice: 27500,
        product:
          MOCK_PRODUCTS.find((p) => p.categoryId === product.categoryId && p.weightGrams === 250) ||
          product,
      },
      {
        weight: 500,
        label: '500g',
        sublabel: 'Standard',
        price: 39900,
        compareAtPrice: 54900,
        product:
          MOCK_PRODUCTS.find((p) => p.categoryId === product.categoryId && p.weightGrams === 500) ||
          product,
      },
      {
        weight: 1000,
        label: '1kg',
        sublabel: 'Reserve',
        price: 74900,
        compareAtPrice: 99900,
        product:
          MOCK_PRODUCTS.find((p) => p.categoryId === product.categoryId && p.weightGrams === 1000) ||
          product,
      },
    ];
    return list;
  }, [product.categoryId, product]);

  const [selectedWeight, setSelectedWeight] = useState<number>(product.weightGrams || 500);

  useEffect(() => {
    if (product.weightGrams) {
      setSelectedWeight(product.weightGrams);
    }
  }, [product.weightGrams]);

  const activeVariant = variants.find((v) => v.weight === selectedWeight) || variants[1];
  const activeProduct = activeVariant.product;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Add authoritative variant to cart
    addToCart(
      {
        ...activeProduct,
        name: `${cleanName} (${activeVariant.label})`,
        price: activeVariant.price,
        compareAtPrice: activeVariant.compareAtPrice,
        weightGrams: activeVariant.weight,
      },
      1
    );
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const isOutOfStock = activeProduct.stockQuantity <= 0;
  const isLowStock =
    activeProduct.stockQuantity > 0 &&
    activeProduct.stockQuantity <= activeProduct.lowStockThreshold;
  const rating = activeProduct.rating || 4.9;

  const discountPercent =
    activeVariant.compareAtPrice && activeVariant.compareAtPrice > activeVariant.price
      ? Math.round(
          ((activeVariant.compareAtPrice - activeVariant.price) / activeVariant.compareAtPrice) * 100
        )
      : 0;

  return (
    <Link href={`/product/${activeProduct.slug}`} className="group block h-full select-none">
      <article className="bg-white border border-stone-200/80 hover:border-stone-300 rounded-2xl p-4 sm:p-5 flex flex-col h-full transition-all duration-300 hover:shadow-[0_12px_30px_rgba(28,25,23,0.06)]">
        
        {/* Full-Bleed Studio Glass Photo (Updates with selected weight) */}
        <div className="w-full aspect-square rounded-xl bg-[#F7F4EE] relative mb-4 overflow-hidden">
          {activeProduct.images[0] ? (
            <Image
              src={activeProduct.images[0].url}
              alt={`${cleanName} ${activeVariant.label}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
              className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-xs font-mono text-stone-400">{activeProduct.sku}</span>
            </div>
          )}

          {isOutOfStock ? (
            <span className="absolute top-3 left-3 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              Sold Out
            </span>
          ) : isLowStock ? (
            <span className="absolute top-3 left-3 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              Only {activeProduct.stockQuantity} left
            </span>
          ) : activeVariant.weight === 500 ? (
            <span className="absolute top-3 left-3 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white/95 text-stone-800 border border-stone-200 shadow-2xs">
              Most Popular
            </span>
          ) : activeVariant.weight === 1000 ? (
            <span className="absolute top-3 left-3 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
              Best Value
            </span>
          ) : null}

          {/* Quick Net Weight Badge */}
          <span className="absolute bottom-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-900/80 text-white backdrop-blur-xs">
            {activeVariant.label} Solid Glass
          </span>
        </div>

        {/* Product Details & iPhone-Style Storage/Size Options */}
        <div className="flex-1 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span>Single-Origin · Unheated</span>
              <span className="inline-flex items-center gap-1 text-stone-700 font-medium">
                <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                {rating}
              </span>
            </div>

            {/* Clean Product Name (No "(500g)" Baked In) */}
            <h3 className="text-lg font-serif font-bold text-stone-950 group-hover:text-amber-900 transition-colors tracking-tight line-clamp-1">
              {cleanName}
            </h3>

            <p className="text-xs text-stone-500 line-clamp-1">
              {(activeProduct as any).flavour || activeProduct.description}
            </p>

            {/* iPhone-Style Variant Choice Pills */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1.5">
                <span className="font-medium">Choose Jar Size:</span>
                <span className="font-semibold text-stone-900">{activeVariant.label}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {variants.map((v) => {
                  const isSelected = v.weight === selectedWeight;
                  return (
                    <button
                      key={v.weight}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedWeight(v.weight);
                      }}
                      className={`py-1.5 px-1 rounded-xl text-center border text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'border-amber-800 bg-amber-50 text-amber-950 font-bold ring-1 ring-amber-800/30 shadow-2xs'
                          : 'border-stone-200 bg-white hover:border-stone-300 text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <div className="leading-tight">{v.label}</div>
                      <div
                        className={`text-[10px] mt-0.5 ${
                          isSelected ? 'text-amber-900 font-semibold' : 'text-stone-400'
                        }`}
                      >
                        {formatCurrency(v.price)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Pricing & Add to Bag */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-lg font-bold text-stone-950 tracking-tight">
                  {formatCurrency(activeVariant.price)}
                </span>
                {activeVariant.compareAtPrice && (
                  <span className="text-xs text-stone-400 line-through">
                    {formatCurrency(activeVariant.compareAtPrice)}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 rounded">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>
              {activeVariant.compareAtPrice && activeVariant.compareAtPrice > activeVariant.price && (
                <span className="text-[11px] font-medium text-emerald-700">
                  Save {formatCurrency(activeVariant.compareAtPrice - activeVariant.price)}
                </span>
              )}
            </div>

            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleAdd}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0 ${
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
