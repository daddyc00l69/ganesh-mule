'use client';

import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductCard } from '@/components/storefront/product-card';
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from '@/lib/mock-data';
import {
  ArrowUpDown,
  Search,
  X,
  LayoutGrid,
  Rows3,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Truck,
  Droplets,
  PackageCheck,
  Award,
} from 'lucide-react';

export function ShopClient() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'ALL';

  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
  const [weightFilter, setWeightFilter] = useState<'ALL' | '300' | '750' | '1050'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'FEATURED' | 'PRICE_ASC' | 'PRICE_DESC' | 'RATING'>('FEATURED');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [mobileColumns, setMobileColumns] = useState<'2' | '1'>('2');

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
          ((p as any).origin && (p as any).origin.toLowerCase().includes(q)) ||
          (p.badge && p.badge.toLowerCase().includes(q))
      );
    }

    if (onlyInStock) {
      result = result.filter((p) => p.stockQuantity > 0);
    }

    if (sortBy === 'PRICE_ASC') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'PRICE_DESC') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'RATING') {
      result.sort((a, b) => (b.rating || 4.9) - (a.rating || 4.9));
    }

    return result;
  }, [categoryFilter, weightFilter, searchQuery, sortBy, onlyInStock]);

  const activeFiltersCount =
    (categoryFilter !== 'ALL' ? 1 : 0) +
    (weightFilter !== 'ALL' ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0) +
    (onlyInStock ? 1 : 0);

  const resetAllFilters = () => {
    setCategoryFilter('ALL');
    setWeightFilter('ALL');
    setSearchQuery('');
    setOnlyInStock(false);
    setSortBy('FEATURED');
  };

  return (
    <div className="bg-[#FAF8F5] min-h-screen pb-24 text-stone-900 selection:bg-amber-200">
      
      {/* 1. Artisanal Luxury Hero Section */}
      <section className="border-b border-stone-200/80 bg-gradient-to-b from-amber-50/50 via-[#FAF8F5] to-[#FAF8F5] pt-10 sm:pt-16 pb-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 border border-amber-300 text-amber-950 text-xs font-semibold tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-amber-700 fill-amber-500" />
                <span>Single-Origin Forest Reserves • 2026 Raw Harvest</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight font-serif text-stone-950 leading-[1.15]">
                Raw Forest Honey. <br />
                <span className="italic font-normal text-amber-900">Bottled in Solid Glass.</span>
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-xl">
                Unpasteurized, unheated nectar gathered from wild Apis dorsata forest cliffs.
                Preserved exclusively in heavy solid glass jars to safeguard delicate floral polyphenols and active living enzymes.
              </p>
            </div>

            {/* Luxury Search Bar */}
            <div className="relative w-full md:w-72 shrink-0">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by flora, origin, jar size..."
                className="w-full h-11 pl-10 pr-9 text-xs rounded-full border border-stone-300 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 transition-all shadow-sm font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Key Purity Assurance Pillars Ribbon */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-8 pt-6 border-t border-stone-200">
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-stone-200/80 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <Droplets className="w-4 h-4 fill-amber-600 text-amber-700" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-stone-900 block leading-tight">100% Cold-Extracted</span>
                <span className="text-[10px] text-stone-500 truncate block">Never heated above 35°C</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-stone-200/80 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Award className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-stone-900 block leading-tight">German Bruker NMR</span>
                <span className="text-[10px] text-stone-500 truncate block">400MHz Purity Verified</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-stone-200/80 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-800 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-stone-700" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-stone-900 block leading-tight">Heavy Solid Glass</span>
                <span className="text-[10px] text-stone-500 truncate block">Zero microplastics</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-stone-200/80 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4 text-blue-700" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-stone-900 block leading-tight">Delhivery One Express</span>
                <span className="text-[10px] text-stone-500 truncate block">Insured glass delivery</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Category & Weight Filter Strip */}
      <section className="sticky top-11 sm:top-12 z-20 bg-white/95 backdrop-blur-md border-b border-stone-200/90 py-3 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-2.5">
          {/* Category Tabs & Quick Toolbar Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            {/* Horizontal Category Pill Bar */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
              <button
                type="button"
                onClick={() => setCategoryFilter('ALL')}
                className={`px-4 py-1.5 text-xs rounded-full whitespace-nowrap transition-all cursor-pointer shrink-0 active:scale-95 ${
                  categoryFilter === 'ALL'
                    ? 'bg-stone-900 text-white font-semibold shadow-xs'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200 font-medium'
                }`}
              >
                All Harvests ({MOCK_PRODUCTS.length})
              </button>
              {MOCK_CATEGORIES.map((cat) => {
                const count = MOCK_PRODUCTS.filter((p) => p.categoryId === cat.id).length;
                const isSelected = categoryFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`px-4 py-1.5 text-xs rounded-full whitespace-nowrap transition-all cursor-pointer shrink-0 active:scale-95 ${
                      isSelected
                        ? 'bg-stone-900 text-white font-semibold shadow-xs'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200 font-medium'
                    }`}
                  >
                    {cat.name} ({count})
                  </button>
                );
              })}
            </div>

            {/* Secondary Controls: In-Stock, Sort & Grid toggle */}
            <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
              {/* In-Stock Toggle */}
              <button
                type="button"
                onClick={() => setOnlyInStock(!onlyInStock)}
                className={`h-8 px-3 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                  onlyInStock
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                    : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    onlyInStock ? 'bg-emerald-600 animate-pulse' : 'bg-stone-400'
                  }`}
                />
                <span>In Stock Only</span>
              </button>

              {/* Reset Filters Pill */}
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="h-8 px-2.5 rounded-full text-xs font-medium bg-stone-200 hover:bg-stone-300 text-stone-800 flex items-center gap-1 transition-all cursor-pointer"
                  title="Reset all active filters"
                >
                  <RotateCcw className="w-3 h-3 text-stone-600" />
                  <span>Reset ({activeFiltersCount})</span>
                </button>
              )}

              {/* Mobile 2-Col vs 1-Col Toggle */}
              <div className="sm:hidden flex items-center bg-stone-100 p-0.5 rounded-full border border-stone-200">
                <button
                  type="button"
                  title="2-Column Grid"
                  onClick={() => setMobileColumns('2')}
                  className={`p-1.5 rounded-full transition-all cursor-pointer ${
                    mobileColumns === '2' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-400'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Single Column View"
                  onClick={() => setMobileColumns('1')}
                  className={`p-1.5 rounded-full transition-all cursor-pointer ${
                    mobileColumns === '1' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-400'
                  }`}
                >
                  <Rows3 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Sort Selector */}
              <div className="relative flex items-center shrink-0">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="h-8 pl-3 pr-7 text-xs rounded-full border border-stone-200 bg-white text-stone-800 font-medium outline-none cursor-pointer appearance-none shadow-2xs hover:border-stone-300"
                >
                  <option value="FEATURED">Sort: Curated Reserves</option>
                  <option value="RATING">Highest Rating</option>
                  <option value="PRICE_ASC">Price: Low to High</option>
                  <option value="PRICE_DESC">Price: High to Low</option>
                </select>
                <ArrowUpDown className="w-3 h-3 text-stone-400 absolute right-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Sub-Filter: Jar Weight Size Filter Pills */}
          <div className="flex items-center gap-1.5 text-xs text-stone-500 overflow-x-auto no-scrollbar pt-1 border-t border-stone-100">
            <span className="font-semibold text-stone-700 text-[11px] uppercase tracking-wider shrink-0 mr-1">
              Jar Size:
            </span>
            <button
              type="button"
              onClick={() => setWeightFilter('ALL')}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer shrink-0 ${
                weightFilter === 'ALL'
                  ? 'bg-amber-100 text-amber-950 font-semibold border border-amber-300'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              All Weights
            </button>
            <button
              type="button"
              onClick={() => setWeightFilter('300')}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer shrink-0 ${
                weightFilter === '300'
                  ? 'bg-amber-100 text-amber-950 font-semibold border border-amber-300'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              300g Petite Jar
            </button>
            <button
              type="button"
              onClick={() => setWeightFilter('750')}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer shrink-0 ${
                weightFilter === '750'
                  ? 'bg-amber-100 text-amber-950 font-semibold border border-amber-300'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              750g Collector Jar (Most Popular)
            </button>
            <button
              type="button"
              onClick={() => setWeightFilter('1050')}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer shrink-0 ${
                weightFilter === '1050'
                  ? 'bg-amber-100 text-amber-950 font-semibold border border-amber-300'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              1050g Family Reservoir Jar
            </button>
          </div>
        </div>
      </section>

      {/* 3. Products Grid Canvas */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        
        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-stone-500 mb-4 px-1">
          <span>
            Showing <strong className="text-stone-900 font-semibold">{filteredProducts.length}</strong> artisanal harvest{filteredProducts.length === 1 ? '' : 's'}
          </span>
          <span className="text-[11px] text-amber-900/80 font-medium">
            Solid glass jars • Dispatched with shock-proof transit tags
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[28px] border border-stone-200 p-8 space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
              <Droplets className="w-7 h-7" />
            </div>
            <p className="text-lg font-bold text-stone-900 font-serif">No honey varieties found</p>
            <p className="text-xs text-stone-600 max-w-sm mx-auto leading-relaxed">
              We couldn&apos;t find any wild harvests matching your search keywords or active filters.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={resetAllFilters}
                className="px-6 py-2.5 rounded-full bg-stone-900 text-white text-xs font-semibold hover:bg-amber-700 transition-colors cursor-pointer shadow-sm"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`grid gap-4 sm:gap-6 ${
              mobileColumns === '2'
                ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            }`}
          >
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* 4. Bottom Educational Trust Section: The Ganesh Mule Standard */}
        <section className="mt-16 p-6 sm:p-10 rounded-[28px] bg-stone-900 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold border border-amber-400/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Our Artisanal Commitment</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-white tracking-tight">
              Why We Refuse to Bottle Honey in Plastic
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              Pure raw honey is naturally acidic (pH 3.4 - 4.5) and rich in live bio-active enzymes.
              Commercial plastic squeeze bottles leach microplastics and phthalates over time while allowing volatile floral aromas to escape.
              Every jar from Ganesh Mule is poured exclusively into food-grade, heavy solid flint glass with an airtight gold lug cap.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-stone-800">
            <div className="space-y-1">
              <span className="text-amber-400 font-bold text-sm block">1. Raw &amp; Hive-Temperature</span>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                Never pasteurized or micro-filtered. Diastase and invertase enzyme counts remain at peak potency.
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-amber-400 font-bold text-sm block">2. German 400MHz NMR Testing</span>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                Nuclear Magnetic Resonance spectral fingerprinting certifies zero added sugar syrup or adulteration.
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-amber-400 font-bold text-sm block">3. 100% Breakage Guarantee</span>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                Shipped via Delhivery One with shock-absorbing honeycomb layers. Zero-hassle replacement if damaged.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
