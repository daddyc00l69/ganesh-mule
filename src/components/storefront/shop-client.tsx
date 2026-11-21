'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/utils';
import {
  Search,
  X,
  ArrowRight,
  Star,
  ShieldCheck,
  Sparkles,
  Droplets,
  CheckCircle2,
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
    availableSizes: ['250g', '500g', '1kg'],
    flavourNotes: 'Mild floral notes with subtle woody sweetness',
    categoryTag: 'SWEET',
  },
];

export function ShopClient() {
  const [categories, setCategories] = useState<HoneyCategoryCardData[]>(SIX_ACTIVE_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'WELLNESS' | 'SWEET' | 'HERBAL'>('ALL');

  const filteredCategories = useMemo(() => {
    let list = [...categories];

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
  }, [categories, searchQuery]);

  return (
    <div className="bg-[#f5f5f7] min-h-screen text-[#1d1d1f] selection:bg-[#0071e3]/20 selection:text-[#0071e3]">
      
      {/* Apple-Style Minimalist Editorial Header (Mobile-First Optimized) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-16 pb-6 border-b border-[#d2d2d7]/60">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
          <div className="max-w-xl space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#d2d2d7] text-[#1d1d1f] text-xs font-semibold shadow-2xs">
              <Droplets className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
              <span>The 6 Pure Harvests · 2026 Season</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#1d1d1f] leading-[1.08]">
              Artisanal Honey,{' '}
              <span className="font-normal text-[#86868b]">Pure &amp; Unheated.</span>
            </h1>

            <p className="text-xs sm:text-base text-[#6e6e73] leading-relaxed">
              Explore our six single-origin monofloral harvests. Cold-extracted below 38°C, tested by 400MHz German NMR spectroscopy, and bottled exclusively in solid glass jars.
            </p>
          </div>

          {/* Quick Search — Prevents mobile iOS zoom with text-base */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868b]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by variety or origin..."
              className="w-full h-12 sm:h-11 pl-10 pr-8 text-base sm:text-sm rounded-full border border-[#d2d2d7] bg-white text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:border-[#0071e3] transition-colors shadow-2xs"
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

        {/* 3 Honest Pricing Anchors — Single Clean Strip (Horizontal Scrollable on Mobile) */}
        <div className="pt-4 sm:pt-6 border-t border-[#d2d2d7]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#86868b]">
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            <span className="font-semibold text-[#1d1d1f] shrink-0 text-[11px] sm:text-xs">Unified Pricing:</span>
            <span className="px-3 py-1 rounded-full bg-white border border-[#d2d2d7] font-medium text-[#1d1d1f] text-[11px] sm:text-xs shrink-0 shadow-2xs">
              <strong>250g:</strong> ₹199
            </span>
            <span className="px-3 py-1 rounded-full bg-white border border-[#0071e3]/40 font-medium text-[#0071e3] text-[11px] sm:text-xs shrink-0 shadow-2xs">
              <strong>500g:</strong> ₹399
            </span>
            <span className="px-3 py-1 rounded-full bg-white border border-[#d2d2d7] font-medium text-[#1d1d1f] text-[11px] sm:text-xs shrink-0 shadow-2xs">
              <strong>1kg:</strong> ₹749
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[#1b5e20] font-semibold text-[11px] sm:text-xs shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>100% German NMR Certified Pure</span>
          </div>
        </div>
      </section>

      {/* 6 Category Showcase Grid (Strictly 6 Cards, Never Individual Sizes as Cards) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-16">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-[#d2d2d7]/70 p-8 space-y-3">
            <p className="text-lg font-bold text-[#1d1d1f]">No harvests match your search</p>
            <p className="text-xs text-[#86868b]">Try searching for forest, ajwain, sesame, or ber honey.</p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mt-2 px-6 py-2.5 rounded-full bg-[#0071e3] text-white text-xs font-semibold hover:bg-[#0077ed] transition-colors cursor-pointer"
            >
              View All 6 Harvests
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCategories.map((cat) => (
              <article
                key={cat.id}
                className="bg-white border border-[#d2d2d7]/70 hover:border-[#86868b] rounded-[24px] p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_16px_36px_rgba(0,0,0,0.08)] hover:-translate-y-1 group"
              >
                {/* Top Image Showcase — Apple Pure White Seamless Blend */}
                <div>
                  <Link href={`/product/${cat.slug}`} className="block">
                    <div className="w-full aspect-square rounded-[20px] bg-white relative mb-5 overflow-hidden flex items-center justify-center p-4">
                      <Image
                        src={cat.imageUrl}
                        alt={cat.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
                        className="object-contain group-hover:scale-106 transition-transform duration-700 ease-out p-2"
                      />
                    </div>
                  </Link>

                  {/* Category Details */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-[#86868b]">
                      <span className="truncate max-w-[200px]">{cat.floralOrigin}</span>
                      <span className="inline-flex items-center gap-1 font-medium text-[#1d1d1f] shrink-0">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span>{cat.rating}</span>
                        <span className="text-[#86868b] font-normal text-[11px]">({cat.ratingCount})</span>
                      </span>
                    </div>

                    <Link href={`/product/${cat.slug}`} className="block">
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1d1d1f] group-hover:text-[#0071e3] transition-colors">
                        {cat.cleanTitle}
                      </h2>
                    </Link>

                    <p className="text-xs text-[#6e6e73] line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>

                    {/* Available Sizes Indicator */}
                    <div className="pt-2 flex items-center gap-2 text-xs text-[#86868b]">
                      <span>Available in:</span>
                      <div className="flex items-center gap-1.5">
                        {cat.availableSizes.map((size) => (
                          <span
                            key={size}
                            className="px-2.5 py-0.5 rounded-md bg-[#f5f5f7] text-[#1d1d1f] text-[11px] font-medium"
                          >
                            {size}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Pricing & Apple Blue Buy Pill Button */}
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
                      Save up to 28% · Solid Glass
                    </span>
                  </div>

                  <Link
                    href={`/product/${cat.slug}`}
                    className="px-5 py-2 rounded-full bg-[#0071e3] hover:bg-[#0077ed] active:bg-[#0062c4] text-white text-xs sm:text-sm font-medium transition-all flex items-center justify-center cursor-pointer shadow-sm group-hover:shadow-md shrink-0"
                  >
                    <span>Buy</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Minimal Editorial Purity Banner */}
        <div className="mt-20 p-8 sm:p-12 rounded-[28px] bg-white border border-[#d2d2d7]/70 shadow-[0_4px_20px_rgba(0,0,0,0.03)] grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
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
