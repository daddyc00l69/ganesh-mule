'use client';

import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductCard } from '@/components/storefront/product-card';
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from '@/lib/mock-data';
import { Search, X } from 'lucide-react';

export function ShopClient() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'ALL';

  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
  const [weightFilter, setWeightFilter] = useState<'ALL' | '250' | '500' | '1000'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'FEATURED' | 'PRICE_ASC' | 'PRICE_DESC' | 'RATING'>('FEATURED');

  const filteredProducts = useMemo(() => {
    let result = [...MOCK_PRODUCTS];

    if (categoryFilter !== 'ALL') {
      result = result.filter((p) => p.categoryId === categoryFilter);
    }

    if (weightFilter !== 'ALL') {
      const targetWeight = parseInt(weightFilter, 10);
      result = result.filter((p) => (p.weightGrams || 500) === targetWeight);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          ((p as any).flavour && (p as any).flavour.toLowerCase().includes(q)) ||
          ((p as any).origin && (p as any).origin.toLowerCase().includes(q))
      );
    }

    if (sortBy === 'PRICE_ASC') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'PRICE_DESC') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'RATING') {
      result.sort((a, b) => (b.rating || 4.9) - (a.rating || 4.9));
    }

    return result;
  }, [categoryFilter, weightFilter, searchQuery, sortBy]);

  const resetFilters = () => {
    setCategoryFilter('ALL');
    setWeightFilter('ALL');
    setSearchQuery('');
    setSortBy('FEATURED');
  };

  return (
    <div className="bg-[#FCFBF7] min-h-screen text-stone-900">
      {/* Compact Editorial Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-8 border-b border-stone-200/70">
          <div className="flex-1 min-w-0 max-w-xl space-y-2.5">
            <p className="text-xs font-medium tracking-wide uppercase text-amber-800">
              Western Ghats · 2026 Raw Harvest
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight font-serif text-stone-950 leading-[1.14]">
              Raw Forest Honey,{' '}
              <span className="italic font-normal text-amber-900">Bottled in Solid Glass.</span>
            </h1>
            <p className="text-sm text-stone-600 leading-relaxed max-w-lg">
              Cold-extracted, unheated nectar tested by 400MHz NMR spectroscopy and packed in heavy food-grade glass.
            </p>
          </div>

          <div className="relative w-full md:w-72 shrink-0">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search honey or jar size..."
              className="w-full h-10 pl-10 pr-8 text-xs rounded-full border border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Single Clean Filter & Sort Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-5">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {MOCK_CATEGORIES.length > 1 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-8 px-3 text-xs rounded-full border border-stone-200 bg-white text-stone-700 outline-none cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                {MOCK_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}

            {(
              [
                { value: 'ALL', label: 'All Sizes' },
                { value: '250', label: '250g' },
                { value: '500', label: '500g' },
                { value: '1000', label: '1kg' },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setWeightFilter(option.value)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  weightFilter === option.value
                    ? 'bg-stone-900 text-white'
                    : 'bg-white border border-stone-200 text-stone-600 hover:border-stone-300 hover:text-stone-900'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            aria-label="Sort products"
            className="h-8 px-3 text-xs rounded-full border border-stone-200 bg-white text-stone-700 outline-none cursor-pointer"
          >
            <option value="FEATURED">Sort: Featured</option>
            <option value="RATING">Sort: Top Rated</option>
            <option value="PRICE_ASC">Price: Low to High</option>
            <option value="PRICE_DESC">Price: High to Low</option>
          </select>
        </div>
      </section>

      {/* Product Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-stone-200/80 p-8 space-y-3">
            <p className="text-base font-semibold text-stone-900 font-serif">No harvests match your filter</p>
            <p className="text-xs text-stone-500">Try clearing your search or selecting All Sizes.</p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-2 px-5 py-2 rounded-full bg-stone-900 text-white text-xs font-medium hover:bg-amber-800 transition-colors cursor-pointer"
            >
              Show All Jars
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Calm Minimal Purity Strip */}
        <div className="mt-16 pt-10 border-t border-stone-200/70 grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-stone-900">Raw &amp; Cold-Extracted</h2>
            <p className="text-xs text-stone-500 leading-relaxed">
              Never heated or micro-filtered, keeping natural pollen and live enzymes intact.
            </p>
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-stone-900">NMR Purity Certified</h2>
            <p className="text-xs text-stone-500 leading-relaxed">
              Every batch is tested via 400MHz NMR spectroscopy to verify zero added syrups.
            </p>
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-stone-900">Insured Glass Delivery</h2>
            <p className="text-xs text-stone-500 leading-relaxed">
              Cushioned in 5-ply shock-proof packaging with a 100% breakage replacement guarantee.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
