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
    <div className="bg-[#FAF9F5] min-h-screen text-stone-900 selection:bg-amber-500/20 selection:text-amber-900">
      
      {/* Apple-Style Minimalist Editorial Header */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-8 border-b border-stone-200/70">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4">
          <div className="max-w-xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/70 border border-amber-200 text-amber-900 text-xs font-semibold">
              <Droplets className="w-3.5 h-3.5 fill-amber-700 text-amber-800" />
              <span>The 6 Pure Harvests · 2026 Season</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-stone-950 leading-[1.08]">
              Artisanal Honey,{' '}
              <span className="italic font-normal text-amber-900">Pure &amp; Unheated.</span>
            </h1>

            <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
              Explore our six single-origin monofloral harvests. Cold-extracted below 38°C, tested by 400MHz German NMR spectroscopy, and bottled exclusively in solid glass jars.
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by variety or floral origin..."
              className="w-full h-11 pl-10 pr-8 text-xs sm:text-sm rounded-full border border-stone-300 bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-amber-800 transition-colors shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 3 Honest Pricing Anchors Summary Strip */}
        <div className="pt-6 border-t border-stone-200/60 flex flex-wrap items-center justify-between gap-4 text-xs text-stone-500">
          <div className="flex items-center gap-6 flex-wrap">
            <span className="font-semibold text-stone-800">Unified Pricing Across All 6 Varieties:</span>
            <span className="inline-flex items-center gap-1.5 font-medium text-stone-700">
              <strong className="text-stone-950">250g Sampler:</strong> ₹199 (MRP ₹275)
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-stone-700">
              <strong className="text-stone-950">500g Standard:</strong> ₹399 (MRP ₹549)
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-stone-700">
              <strong className="text-stone-950">1kg Reserve:</strong> ₹749 (MRP ₹999)
            </span>
          </div>
          <div className="flex items-center gap-2 text-emerald-800 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>100% German NMR Certified Pure</span>
          </div>
        </div>
      </section>

      {/* 6 Category Showcase Grid (Strictly 6 Cards, Never Individual Sizes as Cards) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-stone-200 p-8 space-y-3">
            <p className="text-lg font-serif font-bold text-stone-950">No harvests match your search</p>
            <p className="text-xs text-stone-500">Try searching for forest, ajwain, sesame, or ber honey.</p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mt-2 px-6 py-2.5 rounded-full bg-stone-900 text-white text-xs font-semibold hover:bg-amber-800 transition-colors cursor-pointer"
            >
              View All 6 Harvests
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCategories.map((cat) => (
              <article
                key={cat.id}
                className="bg-white border border-stone-200/90 hover:border-stone-400 rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_20px_45px_rgba(28,25,23,0.07)] group"
              >
                {/* Top Image Showcase */}
                <div>
                  <div className="w-full aspect-square rounded-2xl bg-[#F7F4EE] relative mb-6 overflow-hidden flex items-center justify-center p-6">
                    <Image
                      src={cat.imageUrl}
                      alt={cat.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
                      className="object-contain group-hover:scale-105 transition-transform duration-700 ease-out p-4"
                    />

                    {/* Quality Badges */}
                    <span className="absolute top-3.5 left-3.5 bg-white/95 text-stone-900 border border-stone-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-full shadow-2xs">
                      Single-Origin
                    </span>

                    <span className="absolute bottom-3.5 right-3.5 bg-stone-950 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-2xs">
                      Solid Flint Glass
                    </span>
                  </div>

                  {/* Category Details */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-stone-500">
                      <span className="truncate max-w-[200px]">{cat.floralOrigin}</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-stone-800 shrink-0">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        {cat.rating} ({cat.ratingCount})
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-950 group-hover:text-amber-900 transition-colors tracking-tight">
                      {cat.cleanTitle}
                    </h2>

                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>

                    {/* Flavour Profile Tag */}
                    <div className="pt-2">
                      <p className="text-[11px] text-amber-900/90 font-medium bg-amber-50/70 border border-amber-200/60 rounded-xl px-3 py-1.5 leading-normal">
                        <strong>Nectar Note:</strong> {cat.flavourNotes}
                      </p>
                    </div>

                    {/* Sizing Indicator */}
                    <div className="pt-2 flex items-center gap-2 text-xs text-stone-500">
                      <span>Available Sizes:</span>
                      <div className="flex items-center gap-1.5">
                        {cat.availableSizes.map((size) => (
                          <span
                            key={size}
                            className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[11px] font-medium"
                          >
                            {size}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Pricing & Explore Configuration Button */}
                <div className="pt-5 mt-6 border-t border-stone-100 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-medium text-stone-500">From</span>
                      <span className="text-xl font-bold text-stone-950">
                        {formatCurrency(cat.startingPrice)}
                      </span>
                      <span className="text-xs text-stone-400 line-through">
                        {formatCurrency(cat.compareAtPrice)}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700 block">
                      Save up to 28%
                    </span>
                  </div>

                  <Link
                    href={`/product/${cat.slug}`}
                    className="px-5 py-2.5 rounded-full bg-stone-900 hover:bg-amber-800 text-white text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 group-hover:shadow-md shrink-0"
                  >
                    <span>Configure &amp; Buy</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Minimal Editorial Purity Banner */}
        <div className="mt-20 p-8 sm:p-12 rounded-3xl bg-white border border-stone-200/90 shadow-2xs grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div className="space-y-1.5">
            <h3 className="text-base font-serif font-bold text-stone-950">100% Unheated Raw Honey</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Extracted below hive temperature (38°C) without artificial boiling, keeping invertase and diastase enzymes viable.
            </p>
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-serif font-bold text-stone-950">400MHz German NMR Verified</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Every single batch is molecularly fingerprinted to verify 0.0% inverted sugar syrup and zero synthetic syrups.
            </p>
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-serif font-bold text-stone-950">Insured Solid Glass Freight</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Packed with 5-ply shock-absorbing honeycomb cushions. Full replacement guarantee against transit breakage.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
