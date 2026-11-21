'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import {
  Search,
  X,
  Star,
  ShieldCheck,
  Droplets,
  CheckCircle2,
  SlidersHorizontal,
  Camera,
  Mic,
} from 'lucide-react';

interface HoneyCategoryCardData {
  id: string;
  slug: string;
  name: string;
  cleanTitle: string;
  floralOrigin: string;
  description: string;
  imageUrl: string;
  rating: number;
  ratingCount: number;
  startingPrice: number;
  compareAtPrice: number;
  unitPrice: string;
  discountPercent: number;
  boughtPastMonth: string;
  availableSizes: string[];
  flavourNotes: string;
  categoryTag?: 'WELLNESS' | 'SWEET' | 'HERBAL';
}

const SIX_ACTIVE_CATEGORIES: HoneyCategoryCardData[] = [
  {
    id: 'cat-forest',
    slug: 'forest-honey',
    name: 'Wild Forest Raw Honey',
    cleanTitle: 'Wild Forest Honey',
    floralOrigin: 'Western Ghats Deciduous Canopies',
    description:
      'Pure cold-extracted raw honey gathered from wild Apis dorsata cliff bees in deep deciduous forests. Rich caramel depth with living bio-enzymes.',
    imageUrl: '/images/honey-brand/Forest Honey/500g/image_1_amazon_main.jpg',
    rating: 4.9,
    ratingCount: 783,
    startingPrice: 19900,
    compareAtPrice: 27500,
    unitPrice: '₹79.60 / 100 g',
    discountPercent: 28,
    boughtPastMonth: '800+ bought in past month',
    availableSizes: ['250g', '500g', '1kg'],
    flavourNotes: 'Multifloral blossom with warm floral caramel finish',
    categoryTag: 'WELLNESS',
  },
  {
    id: 'cat-sesame',
    slug: 'sesame-honey',
    name: 'Pure Sesame Blossom Honey',
    cleanTitle: 'Sesame Blossom Honey',
    floralOrigin: 'Organic Sesame Plains, Maharashtra',
    description:
      'Single-origin unheated honey harvested during peak sesame flowering. Naturally rich in bio-available zinc, calcium, and antioxidant flavonoids.',
    imageUrl: '/images/honey-brand/Sesame Honey/500g/image_1_amazon_main.jpg',
    rating: 4.9,
    ratingCount: 312,
    startingPrice: 19900,
    compareAtPrice: 27500,
    unitPrice: '₹79.60 / 100 g',
    discountPercent: 28,
    boughtPastMonth: '400+ bought in past month',
    availableSizes: ['250g', '500g', '1kg'],
    flavourNotes: 'Warm nutty undertones with delicate amber sweetness',
    categoryTag: 'SWEET',
  },
  {
    id: 'cat-ajwain',
    slug: 'ajwain-honey',
    name: 'Organic Ajwain (Carom) Honey',
    cleanTitle: 'Ajwain (Carom) Honey',
    floralOrigin: 'Carom Flowering Fields, Rajasthan',
    description:
      'Distinctive raw monofloral honey harvested from white carom flowers. Celebrated in Ayurveda for respiratory ease and soothing gut digestion.',
    imageUrl: '/images/honey-brand/Ajwain Honey/500g/image_1_amazon_main.jpg',
    rating: 4.9,
    ratingCount: 420,
    startingPrice: 19900,
    compareAtPrice: 27500,
    unitPrice: '₹79.60 / 100 g',
    discountPercent: 28,
    boughtPastMonth: '550+ bought in past month',
    availableSizes: ['250g', '500g', '1kg'],
    flavourNotes: 'Herbal, spicy warmth with a clean soothing finish',
    categoryTag: 'HERBAL',
  },
  {
    id: 'cat-multiflora',
    slug: 'multiflora-honey',
    name: 'Wild Multiflora Raw Honey',
    cleanTitle: 'Wild Multiflora Honey',
    floralOrigin: 'Biodiverse Alpine Foothills',
    description:
      'Harmonious nectar gathered across dozens of seasonal wild blooms and medicinal herbs. Smooth, well-rounded flavour ideal for daily nutrition.',
    imageUrl: '/images/honey-brand/Multiflora Honey/500g/image_1_amazon_main.jpg',
    rating: 4.8,
    ratingCount: 389,
    startingPrice: 19900,
    compareAtPrice: 27500,
    unitPrice: '₹79.60 / 100 g',
    discountPercent: 28,
    boughtPastMonth: '600+ bought in past month',
    availableSizes: ['250g', '500g', '1kg'],
    flavourNotes: 'Rich botanical bouquet with golden nectar finish',
    categoryTag: 'SWEET',
  },
  {
    id: 'cat-ber',
    slug: 'ber-honey',
    name: 'Raw Ber (Sidr / Jujube) Honey',
    cleanTitle: 'Raw Ber (Sidr) Honey',
    floralOrigin: 'Arid Jujube Woodlands, Rajasthan',
    description:
      'Revered ancient Sidr honey harvested from thorny desert jujube trees. Uniquely dense in bio-active polyphenols and amber antioxidants.',
    imageUrl: '/images/honey-brand/Ber Honey/500g/image_1_amazon_main.jpg',
    rating: 4.9,
    ratingCount: 295,
    startingPrice: 19900,
    compareAtPrice: 27500,
    unitPrice: '₹79.60 / 100 g',
    discountPercent: 28,
    boughtPastMonth: '350+ bought in past month',
    availableSizes: ['250g', '500g', '1kg'],
    flavourNotes: 'Thick, butterscotch aroma with deep lingering sweetness',
    categoryTag: 'WELLNESS',
  },
  {
    id: 'cat-sheesham',
    slug: 'sheesham-honey',
    name: 'Raw Sheesham (Rosewood) Honey',
    cleanTitle: 'Sheesham (Rosewood) Honey',
    floralOrigin: 'Rosewood River Valleys, North India',
    description:
      'Rare single-origin raw honey harvested from blooming North Indian Rosewood canopies. Low glycemic index with a silky, smooth finish.',
    imageUrl: '/images/honey-brand/Sheesham Honey/500g/image_1_amazon_main.jpg',
    rating: 4.9,
    ratingCount: 254,
    startingPrice: 19900,
    compareAtPrice: 27500,
    unitPrice: '₹79.60 / 100 g',
    discountPercent: 28,
    boughtPastMonth: '300+ bought in past month',
    availableSizes: ['250g', '500g', '1kg'],
    flavourNotes: 'Mild floral notes with subtle woody sweetness',
    categoryTag: 'SWEET',
  },
];

// Indian Vegetarian Symbol (FSSAI Green Mark)
const IndianVegBadge: React.FC = () => (
  <div className="w-3.5 h-3.5 rounded-[3px] border border-emerald-700 flex items-center justify-center shrink-0 p-[2px] bg-white">
    <div className="w-1.5 h-1.5 rounded-full bg-emerald-700" />
  </div>
);

export function ShopClient() {
  const [categories] = useState<HoneyCategoryCardData[]>(SIX_ACTIVE_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'WELLNESS' | 'SWEET' | 'HERBAL'>('ALL');

  const filteredCategories = useMemo(() => {
    let list = [...categories];

    if (activeFilter !== 'ALL') {
      list = list.filter((c) => c.categoryTag === activeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.cleanTitle.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.floralOrigin.toLowerCase().includes(q) ||
          c.flavourNotes.toLowerCase().includes(q)
      );
    }

    return list;
  }, [categories, searchQuery, activeFilter]);

  return (
    <div className="bg-[#f5f5f7] min-h-screen text-[#1d1d1f] selection:bg-[#ffd814]/30">
      
      {/* ────────────────────────────────────────────────────────────
          1. AMAZON MOBILE HEADER & SEARCH BAR (Mobile View < 768px)
         ──────────────────────────────────────────────────────────── */}
      <section className="md:hidden bg-[#febd69] p-2.5 pb-2 shadow-xs">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-600 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search raw honey, ajwain, sidr 1kg..."
            className="w-full h-11 pl-9 pr-16 text-sm rounded-lg border border-stone-300 bg-white text-stone-900 placeholder:text-stone-500 shadow-inner focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-2 text-stone-500">
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 text-stone-600 hover:text-black cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <>
                <Camera className="w-4 h-4 text-stone-500" />
                <Mic className="w-4 h-4 text-stone-500" />
              </>
            )}
          </div>
        </div>

        {/* Quick Filter Horizontal Scrollbar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-1 no-scrollbar text-xs">
          <button
            type="button"
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition-colors cursor-pointer border ${
              activeFilter === 'ALL'
                ? 'bg-stone-900 text-white border-stone-900'
                : 'bg-white text-stone-800 border-stone-300 shadow-2xs'
            }`}
          >
            All 6 Harvests
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('WELLNESS')}
            className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition-colors cursor-pointer border ${
              activeFilter === 'WELLNESS'
                ? 'bg-stone-900 text-white border-stone-900'
                : 'bg-white text-stone-800 border-stone-300 shadow-2xs'
            }`}
          >
            Wellness &amp; Immunity
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('SWEET')}
            className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition-colors cursor-pointer border ${
              activeFilter === 'SWEET'
                ? 'bg-stone-900 text-white border-stone-900'
                : 'bg-white text-stone-800 border-stone-300 shadow-2xs'
            }`}
          >
            Sweet Blossom
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('HERBAL')}
            className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition-colors cursor-pointer border ${
              activeFilter === 'HERBAL'
                ? 'bg-stone-900 text-white border-stone-900'
                : 'bg-white text-stone-800 border-stone-300 shadow-2xs'
            }`}
          >
            Digestive Herbal
          </button>
        </div>
      </section>

      {/* Results Header on Mobile */}
      <div className="md:hidden bg-white px-3 py-2 border-b border-stone-200 flex items-center justify-between text-xs text-stone-600">
        <span>
          Showing <strong>{filteredCategories.length}</strong> of 6 pure harvests
        </span>
        <span className="flex items-center gap-1 text-[#0071e3] font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>NMR Pure</span>
        </span>
      </div>

      {/* ────────────────────────────────────────────────────────────
          2. DESKTOP EDITORIAL HEADER (>= 768px)
         ──────────────────────────────────────────────────────────── */}
      <section className="hidden md:block max-w-6xl mx-auto px-6 pt-16 pb-6 border-b border-[#d2d2d7]/60">
        <div className="flex items-end justify-between gap-6 pb-2">
          <div className="max-w-xl space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#d2d2d7] text-[#1d1d1f] text-xs font-semibold shadow-2xs">
              <Droplets className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
              <span>The 6 Pure Harvests · 2026 Season</span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-[#1d1d1f] leading-[1.08]">
              Artisanal Honey,{' '}
              <span className="font-normal text-[#86868b]">Pure &amp; Unheated.</span>
            </h1>

            <p className="text-sm text-[#6e6e73] leading-relaxed">
              Explore our six single-origin monofloral harvests. Cold-extracted below 38°C, tested by 400MHz German NMR spectroscopy, and bottled exclusively in solid glass jars.
            </p>
          </div>

          <div className="relative w-80 shrink-0">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868b]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by variety or origin..."
              className="w-full h-11 pl-10 pr-8 text-sm rounded-full border border-[#d2d2d7] bg-white text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:border-[#0071e3] transition-colors shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f] cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Unified Pricing Anchors Strip */}
        <div className="pt-6 border-t border-[#d2d2d7]/50 flex items-center justify-between text-xs text-[#86868b]">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-[#1d1d1f]">Unified Pricing:</span>
            <span className="px-3 py-1 rounded-full bg-white border border-[#d2d2d7] font-medium text-[#1d1d1f] shadow-2xs">
              <strong>250g:</strong> ₹199
            </span>
            <span className="px-3 py-1 rounded-full bg-white border border-[#0071e3]/40 font-medium text-[#0071e3] shadow-2xs">
              <strong>500g:</strong> ₹399
            </span>
            <span className="px-3 py-1 rounded-full bg-white border border-[#d2d2d7] font-medium text-[#1d1d1f] shadow-2xs">
              <strong>1kg:</strong> ₹749
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[#1b5e20] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>100% German NMR Certified Pure</span>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────
          3. AMAZON-STYLE MOBILE PRODUCT LIST (< 768px)
             Horizontal Row Cards identical to Amazon App Search Results
         ──────────────────────────────────────────────────────────── */}
      <section className="md:hidden bg-white divide-y divide-stone-200">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3 bg-white">
            <p className="text-base font-bold text-stone-900">No harvests match your search</p>
            <p className="text-xs text-stone-500">Try searching for wild forest, ajwain, sesame, or ber honey.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('ALL');
              }}
              className="mt-2 px-6 py-2 rounded-full bg-[#ffd814] text-stone-950 text-xs font-semibold border border-[#fcd200] shadow-xs cursor-pointer"
            >
              View All 6 Harvests
            </button>
          </div>
        ) : (
          filteredCategories.map((cat) => (
            <article
              key={cat.id}
              className="p-3.5 sm:p-4 flex gap-3.5 items-start bg-white hover:bg-stone-50/60 transition-colors"
            >
              {/* Left Column: Product Jar Image */}
              <Link
                href={`/product/${cat.slug}`}
                className="w-32 sm:w-36 shrink-0 block"
              >
                <div className="relative aspect-[3/4] w-full bg-[#f8f8f8] rounded-xl overflow-hidden flex items-center justify-center p-2 border border-stone-200/80">
                  <Image
                    src={cat.imageUrl}
                    alt={cat.name}
                    fill
                    sizes="140px"
                    className="object-contain p-1"
                  />
                  <div className="absolute top-1.5 left-1.5">
                    <IndianVegBadge />
                  </div>
                </div>
                <p className="text-[10px] text-center text-stone-500 font-medium mt-1">
                  Solid Flint Glass
                </p>
              </Link>

              {/* Right Column: Amazon-Style Details, Price & Single Buy Button */}
              <div className="flex-1 min-w-0 space-y-1">
                {/* Sponsored / Monofloral Tag */}
                <div className="flex items-center justify-between text-[10px] text-stone-500">
                  <span className="font-medium text-amber-900 truncate">
                    {cat.floralOrigin}
                  </span>
                </div>

                {/* Product Title */}
                <Link href={`/product/${cat.slug}`} className="block">
                  <h2 className="text-sm font-semibold text-stone-900 leading-snug line-clamp-2 hover:text-[#0071e3]">
                    {cat.cleanTitle} - 100% Pure Raw Honey
                  </h2>
                </Link>

                {/* Sizing & Packaging */}
                <div className="flex items-center gap-1.5 text-[11px] text-stone-600">
                  <span className="font-semibold text-stone-900">Options:</span>
                  <span>250g · 500g · 1kg</span>
                </div>

                {/* Star Rating & Reviews */}
                <div className="flex items-center gap-1 text-xs pt-0.5">
                  <span className="font-bold text-stone-900 text-xs">{cat.rating}</span>
                  <div className="flex items-center text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-500" />
                    ))}
                  </div>
                  <span className="text-stone-500 text-[11px]">({cat.ratingCount})</span>
                </div>

                {/* Social Proof */}
                <p className="text-[10px] text-stone-500">
                  {cat.boughtPastMonth} · NMR Pure
                </p>

                {/* Pricing Block */}
                <div className="pt-0.5">
                  <div className="flex items-baseline flex-wrap gap-1.5">
                    <span className="text-lg font-bold text-stone-950 font-mono tracking-tight">
                      {formatCurrency(cat.startingPrice)}
                    </span>
                    <span className="text-[11px] text-stone-500 font-normal">
                      ({cat.unitPrice})
                    </span>
                    <span className="text-xs text-stone-400 line-through">
                      M.R.P.: {formatCurrency(cat.compareAtPrice)}
                    </span>
                    <span className="text-xs font-semibold text-emerald-800">
                      ({cat.discountPercent}% off)
                    </span>
                  </div>
                </div>

                {/* Delivery Badge (Amazon Prime Style) */}
                <div className="pt-0.5 space-y-0.5">
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-[#0071e3] font-black italic text-xs tracking-tight">✓express</span>
                    <span className="text-stone-800 font-semibold text-[11px]">FREE delivery</span>
                  </div>
                  <p className="text-[10px] text-stone-500 leading-tight">
                    100% Zero-Breakage Insured Solid Glass Transit
                  </p>
                </div>

                {/* Single BUY Button (No Add to Cart on Card as ordered) */}
                <div className="pt-1.5">
                  <Link
                    href={`/product/${cat.slug}`}
                    className="w-full py-2 px-4 rounded-full bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f2c200] text-[#0f1111] text-xs font-bold transition-all flex items-center justify-center shadow-xs border border-[#fcd200] active:scale-98 cursor-pointer text-center"
                  >
                    <span>Buy</span>
                  </Link>
                </div>
              </div>
            </article>
          ))
        )}
      </section>

      {/* ────────────────────────────────────────────────────────────
          4. DESKTOP PRODUCT GRID (>= 768px)
         ──────────────────────────────────────────────────────────── */}
      <section className="hidden md:block max-w-6xl mx-auto px-6 py-12">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-[#d2d2d7]/70 p-8 space-y-3">
            <p className="text-lg font-bold text-[#1d1d1f]">No harvests match your search</p>
            <p className="text-xs text-[#86868b]">Try searching for forest, ajwain, sesame, or ber honey.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('ALL');
              }}
              className="mt-2 px-6 py-2.5 rounded-full bg-[#0071e3] text-white text-xs font-semibold hover:bg-[#0077ed] transition-colors cursor-pointer"
            >
              View All 6 Harvests
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCategories.map((cat) => (
              <article
                key={cat.id}
                className="bg-white border border-[#d2d2d7]/70 hover:border-[#86868b] rounded-[24px] p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_16px_36px_rgba(0,0,0,0.08)] hover:-translate-y-1 group"
              >
                <div>
                  <Link href={`/product/${cat.slug}`} className="block">
                    <div className="w-full aspect-square rounded-[20px] bg-white relative mb-5 overflow-hidden flex items-center justify-center p-4">
                      <Image
                        src={cat.imageUrl}
                        alt={cat.name}
                        fill
                        sizes="(max-width: 1024px) 50vw, 360px"
                        className="object-contain group-hover:scale-106 transition-transform duration-700 ease-out p-2"
                      />
                      <div className="absolute top-2 left-2">
                        <IndianVegBadge />
                      </div>
                    </div>
                  </Link>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-[#86868b]">
                      <span className="truncate max-w-[180px]">{cat.floralOrigin}</span>
                      <span className="inline-flex items-center gap-1 font-medium text-[#1d1d1f] shrink-0">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span>{cat.rating}</span>
                        <span className="text-[#86868b] font-normal text-[11px]">({cat.ratingCount})</span>
                      </span>
                    </div>

                    <Link href={`/product/${cat.slug}`} className="block">
                      <h2 className="text-xl font-bold tracking-tight text-[#1d1d1f] group-hover:text-[#0071e3] transition-colors">
                        {cat.cleanTitle}
                      </h2>
                    </Link>

                    <p className="text-xs text-[#6e6e73] line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>

                    <div className="pt-2 flex items-center gap-2 text-xs text-[#86868b]">
                      <span>Available:</span>
                      <div className="flex items-center gap-1.5">
                        {cat.availableSizes.map((size) => (
                          <span
                            key={size}
                            className="px-2 py-0.5 rounded-md bg-[#f5f5f7] text-[#1d1d1f] text-[11px] font-medium"
                          >
                            {size}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Pricing & Buy Button */}
                <div className="pt-4 mt-5 border-t border-[#d2d2d7]/50 flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-normal text-[#86868b]">From</span>
                      <span className="text-xl font-bold text-[#1d1d1f] tracking-tight">
                        {formatCurrency(cat.startingPrice)}
                      </span>
                      <span className="text-xs text-[#86868b] line-through">
                        {formatCurrency(cat.compareAtPrice)}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-[#1b5e20] block">
                      Save {cat.discountPercent}% · Solid Glass
                    </span>
                  </div>

                  <Link
                    href={`/product/${cat.slug}`}
                    className="px-6 py-2.5 rounded-full bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f2c200] text-[#0f1111] text-xs font-bold transition-all flex items-center justify-center cursor-pointer shadow-xs border border-[#fcd200] shrink-0"
                  >
                    <span>Buy</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Minimal Editorial Purity Banner */}
        <div className="mt-16 p-8 sm:p-12 rounded-[28px] bg-white border border-[#d2d2d7]/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-[#1d1d1f]">100% Unheated Raw Honey</h3>
            <p className="text-xs text-[#6e6e73] leading-relaxed">
              Extracted below hive temperature (38°C) without artificial boiling, keeping invertase and diastase enzymes viable.
            </p>
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-[#1d1d1f]">400MHz German NMR Verified</h3>
            <p className="text-xs text-[#6e6e73] leading-relaxed">
              Every single batch is molecularly fingerprinted to verify 0.0% inverted sugar syrup and zero synthetic syrups.
            </p>
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-[#1d1d1f]">Insured Solid Glass Freight</h3>
            <p className="text-xs text-[#6e6e73] leading-relaxed">
              Packed with 5-ply shock-absorbing honeycomb cushions. Full replacement guarantee against transit breakage.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
