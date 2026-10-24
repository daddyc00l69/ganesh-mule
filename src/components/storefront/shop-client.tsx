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
} from 'lucide-react';

export function ShopClient() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'ALL';

  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'FEATURED' | 'PRICE_ASC' | 'PRICE_DESC'>('FEATURED');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [mobileColumns, setMobileColumns] = useState<'2' | '1'>('2');

  const filteredProducts = useMemo(() => {
    let result = [...MOCK_PRODUCTS];

    if (categoryFilter !== 'ALL') {
      result = result.filter((p) => p.categoryId === categoryFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
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
    }

    return result;
  }, [categoryFilter, searchQuery, sortBy, onlyInStock]);

  const activeFiltersCount =
    (categoryFilter !== 'ALL' ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0) +
    (onlyInStock ? 1 : 0);

  const resetAllFilters = () => {
    setCategoryFilter('ALL');
    setSearchQuery('');
    setOnlyInStock(false);
    setSortBy('FEATURED');
  };

  return (
    <div className="bg-[#f5f5f7] min-h-screen pb-16">
      {/* 1. Apple Store Shop Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-[#1d1d1f]">
              <span className="text-[#6e6e73]">All Harvests.</span> Take your pick.
            </h1>
            <p className="text-xs sm:text-sm text-[#6e6e73] mt-1">
              Pure raw forest nectars, alpine acacia, royal saffron infusions, and virgin comb slabs.
            </p>
          </div>

          {/* Apple Search Input */}
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search honey, origin..."
              className="w-full h-9 pl-8 pr-7 text-xs rounded-full border border-[#d2d2d7]/80 bg-white text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 focus:border-[#0071e3] transition-all shadow-2xs font-normal"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f] p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Apple Filter Pills & Controls Strip */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-y border-[#d2d2d7]/60 py-3">
          
          {/* Horizontal Category Pill Bar */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            <button
              type="button"
              onClick={() => setCategoryFilter('ALL')}
              className={`px-3.5 py-1.5 text-xs rounded-full whitespace-nowrap transition-all cursor-pointer shrink-0 active:scale-95 ${
                categoryFilter === 'ALL'
                  ? 'bg-[#1d1d1f] text-white font-medium shadow-xs'
                  : 'bg-white border border-[#d2d2d7]/80 text-[#1d1d1f] hover:bg-[#f5f5f7] font-normal'
              }`}
            >
              All ({MOCK_PRODUCTS.length})
            </button>
            {MOCK_CATEGORIES.map((cat) => {
              const count = MOCK_PRODUCTS.filter((p) => p.categoryId === cat.id).length;
              const isSelected = categoryFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-3.5 py-1.5 text-xs rounded-full whitespace-nowrap transition-all cursor-pointer shrink-0 active:scale-95 ${
                    isSelected
                      ? 'bg-[#1d1d1f] text-white font-medium shadow-xs'
                      : 'bg-white border border-[#d2d2d7]/80 text-[#1d1d1f] hover:bg-[#f5f5f7] font-normal'
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>

          {/* Quick Toolbar */}
          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-0.5 sm:pt-0">
            <div className="flex items-center gap-1.5">
              {/* In-Stock Toggle */}
              <button
                type="button"
                onClick={() => setOnlyInStock(!onlyInStock)}
                className={`h-7.5 px-3 rounded-full text-xs font-normal border flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                  onlyInStock
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-medium'
                    : 'bg-white border-[#d2d2d7]/80 text-[#1d1d1f] hover:bg-[#f5f5f7]'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    onlyInStock ? 'bg-emerald-600' : 'bg-[#86868b]'
                  }`}
                />
                <span>In Stock Only</span>
              </button>

              {/* Clear Pill */}
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="h-7.5 px-2.5 rounded-full text-xs font-normal bg-[#e5e5e7] hover:bg-[#d2d2d7] text-[#1d1d1f] flex items-center gap-1 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3 text-[#6e6e73]" />
                  <span>Clear ({activeFiltersCount})</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {/* Mobile 2-Col vs 1-Col Toggle */}
              <div className="sm:hidden flex items-center bg-[#e5e5e7] p-0.5 rounded-full">
                <button
                  type="button"
                  title="2-Column Grid"
                  onClick={() => setMobileColumns('2')}
                  className={`p-1 rounded-full transition-all cursor-pointer ${
                    mobileColumns === '2' ? 'bg-white text-[#1d1d1f] shadow-2xs' : 'text-[#86868b]'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Single Column View"
                  onClick={() => setMobileColumns('1')}
                  className={`p-1 rounded-full transition-all cursor-pointer ${
                    mobileColumns === '1' ? 'bg-white text-[#1d1d1f] shadow-2xs' : 'text-[#86868b]'
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
                  className="h-7.5 pl-2.5 pr-6 text-xs rounded-full border border-[#d2d2d7]/80 bg-white text-[#1d1d1f] outline-none font-normal cursor-pointer appearance-none"
                >
                  <option value="FEATURED">Sort: Featured</option>
                  <option value="PRICE_ASC">Price: Low to High</option>
                  <option value="PRICE_DESC">Price: High to Low</option>
                </select>
                <ArrowUpDown className="w-3 h-3 text-[#86868b] absolute right-2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Products Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[24px] border border-[#e5e5e7] p-8 space-y-3">
            <p className="text-base font-semibold text-[#1d1d1f]">No honey varieties found</p>
            <p className="text-xs text-[#6e6e73] max-w-sm mx-auto">
              Try adjusting your search keywords or switching category filters.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={resetAllFilters}
                className="px-5 py-2 rounded-full bg-[#1d1d1f] text-white text-xs font-medium cursor-pointer"
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
      </div>
    </div>
  );
}
