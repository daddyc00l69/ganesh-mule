'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { StoreProvider } from '@/components/storefront/store-provider';
import { ProductCard } from '@/components/storefront/product-card';
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/utils';
import { useCart } from '@/lib/cart/cart-context';
import { guessCityStateFromPin } from '@/lib/constants/india';
import {
  Star,
  ShieldCheck,
  Truck,
  Plus,
  Check,
  Sparkles,
  ArrowRight,
  Droplets,
  Award,
  CheckCircle2,
  Clock,
  MapPin,
  ChevronRight,
  Heart,
  HelpCircle,
  Package,
} from 'lucide-react';

export default function HomePage() {
  const { addToCart, setIsCartOpen } = useCart();

  // Active Category / Variety Filter
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Pincode Quick Checker
  const [pincode, setPincode] = useState('');
  const [pincodeResult, setPincodeResult] = useState<{ city: string; state: string } | null>(null);

  const handlePincodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pincode.length === 6 && /^\d{6}$/.test(pincode)) {
      const info = guessCityStateFromPin(pincode);
      if (info?.city && info?.state) {
        setPincodeResult({ city: info.city, state: info.state });
      } else {
        setPincodeResult({ city: 'Metro Delivery Hub', state: 'India' });
      }
    }
  };

  // Filter products for homepage showcase: strictly the 6 main honey varieties
  const displayedProducts = useMemo(() => {
    const activeCategoryIds = [
      'cat-forest',
      'cat-sesame',
      'cat-ajwain',
      'cat-multiflora',
      'cat-ber',
      'cat-sheesham',
    ];

    if (selectedCategory !== 'ALL') {
      const prod = MOCK_PRODUCTS.find((p) => p.categoryId === selectedCategory && p.isPublished !== false);
      return prod ? [prod] : [];
    }

    const sixProducts: typeof MOCK_PRODUCTS = [];
    activeCategoryIds.forEach((catId) => {
      const prod = MOCK_PRODUCTS.find((p) => p.categoryId === catId && p.isPublished !== false);
      if (prod) {
        sixProducts.push(prod);
      }
    });

    return sixProducts;
  }, [selectedCategory]);

  return (
    <StoreProvider>
      <div className="bg-[#f5f5f7] text-[#1d1d1f] selection:bg-[#0071e3]/20 selection:text-[#0071e3] min-h-screen">
        
        {/* Top Announcement Bar */}
        <div className="bg-[#1d1d1f] text-white text-[11px] sm:text-xs py-2 px-4 text-center font-medium tracking-wide flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Free Express Air Delivery Across India on Orders Over ₹999 · 100% German NMR Tested Pure Honey</span>
        </div>

        {/* Hero Section: Clean, Apple-Inspired & Direct */}
        <section className="relative overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-24 border-b border-[#d2d2d7]/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              
              {/* Left Column: Value Proposition & Quick Shop */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#d2d2d7] text-[#1d1d1f] text-xs font-medium shadow-2xs">
                  <Droplets className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                  <span>2026 Western Ghats &amp; Organic Canopy Harvest</span>
                </div>

                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-[#1d1d1f] tracking-tight leading-[1.08]">
                  Pure Raw Honey,{' '}
                  <span className="font-normal text-[#86868b]">Bottled in Solid Glass.</span>
                </h1>

                <p className="text-base sm:text-lg text-[#6e6e73] leading-relaxed max-w-xl">
                  Unheated, cold-extracted nectar gathered from wild forest canopies and single-origin blooms. Tested by 400MHz German NMR spectroscopy to guarantee 0% adulteration and 100% active living enzymes.
                </p>

                {/* Quick Shop Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  <a
                    href="#shop-catalog"
                    className="px-6 py-3.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
                  >
                    <span>Shop 6 Pure Harvests (From ₹199)</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>

                  <Link
                    href="/shop"
                    className="px-6 py-3.5 rounded-full border border-[#d2d2d7] bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <span>Explore All 6 Harvests</span>
                  </Link>
                </div>

                {/* 4 Trust Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-[#d2d2d7]/60">
                  <div>
                    <div className="flex items-center gap-1 text-sm font-bold text-[#1d1d1f]">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                      <span>4.9 / 5.0</span>
                    </div>
                    <span className="text-[11px] text-[#86868b]">1,400+ Verified Buyers</span>
                  </div>

                  <div>
                    <span className="block text-sm font-bold text-[#1d1d1f]">6 Varieties</span>
                    <span className="text-[11px] text-[#86868b]">Single-Origin Blooms</span>
                  </div>

                  <div>
                    <span className="block text-sm font-bold text-[#1d1d1f]">₹199 / ₹399 / ₹749</span>
                    <span className="text-[11px] text-[#86868b]">Flat Honest Pricing</span>
                  </div>

                  <div>
                    <span className="block text-sm font-bold text-[#1b5e20]">0% Added Sugar</span>
                    <span className="text-[11px] text-[#86868b]">German NMR Certified</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Hero Visual Glass Jar Preview */}
              <div className="lg:col-span-5 relative">
                <div className="relative aspect-square rounded-[28px] overflow-hidden bg-white border border-[#d2d2d7]/70 shadow-[0_20px_50px_rgba(0,0,0,0.06)] p-6 sm:p-8 flex items-center justify-center group">
                  <Image
                    src="/images/honey-brand/Forest Honey/500g/image_1_amazon_main.jpg"
                    alt="Ganesh Mule Pure Raw Forest Honey in Heavy Solid Glass Jar"
                    width={500}
                    height={500}
                    priority
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700 ease-out"
                  />

                  {/* Floating Badges */}
                  <div className="absolute top-4 left-4 bg-[#1d1d1f] text-white text-[11px] font-semibold px-3 py-1 rounded-full shadow-md">
                    Flagship 500g · ₹399
                  </div>

                  <div className="absolute bottom-4 right-4 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Heavy Solid Flint Glass</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 3-Size Package Comparison Guide (Educational - Zero Confusion) */}
        <section className="py-14 bg-white border-b border-[#d2d2d7]/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-xl mx-auto space-y-2 mb-10">
              <span className="text-xs font-semibold text-[#86868b] tracking-wider uppercase">Unified Sizing Standard</span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#1d1d1f]">Simple, Transparent Sizing</h2>
              <p className="text-xs sm:text-sm text-[#6e6e73]">Every single honey variety shares the exact same price across India.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* 250g Sampler */}
              <div className="p-6 rounded-2xl border border-[#d2d2d7] bg-white flex flex-col justify-between shadow-2xs">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#86868b]">Trial / Gifting</span>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#f5f5f7] text-[#1d1d1f]">28% OFF</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#1d1d1f]">250g Glass Sampler</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-[#1d1d1f]">₹199</span>
                    <span className="text-sm text-[#86868b] line-through">MRP: ₹275</span>
                  </div>
                  <p className="text-xs text-[#6e6e73] leading-relaxed">
                    Ideal for first-time taste trials, tea sweeteners, or sharing distinct monofloral flavours with family.
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-zinc-100 flex items-center justify-between text-xs font-medium text-[#1d1d1f]">
                  <span>₹796 / kg</span>
                  <span className="text-[#86868b] text-[11px]">Choose on product page</span>
                </div>
              </div>

              {/* 500g Most Popular */}
              <div className="p-6 rounded-2xl border-2 border-[#0071e3] bg-white flex flex-col justify-between relative shadow-md ring-2 ring-[#0071e3]/20">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0071e3] text-white text-[10px] font-bold tracking-wider uppercase px-3 py-0.5 rounded-full shadow-2xs">
                  Most Popular · Daily Routine
                </div>
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0071e3]">Bestseller</span>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">27% OFF</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#1d1d1f]">500g Solid Glass Jar</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-[#1d1d1f]">₹399</span>
                    <span className="text-sm text-[#86868b] line-through">MRP: ₹549</span>
                  </div>
                  <p className="text-xs text-[#6e6e73] leading-relaxed">
                    Perfect 30-day supply for morning warm lemon water, Ayurvedic digestive therapy, and daily immunity.
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-zinc-100 flex items-center justify-between text-xs font-medium text-[#1d1d1f]">
                  <span>Save ₹150 · ₹798 / kg</span>
                  <span className="text-[#0071e3] font-semibold text-[11px]">Recommended Size</span>
                </div>
              </div>

              {/* 1kg Grand Reserve */}
              <div className="p-6 rounded-2xl border border-[#d2d2d7] bg-white flex flex-col justify-between shadow-2xs">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1b5e20]">Best Value</span>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">25% OFF</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#1d1d1f]">1kg Grand Reserve</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-[#1d1d1f]">₹749</span>
                    <span className="text-sm text-[#86868b] line-through">MRP: ₹999</span>
                  </div>
                  <p className="text-xs text-[#6e6e73] leading-relaxed">
                    Heavy solid glass reserve jar. Maximum family economy for full Ayurvedic therapies &amp; natural baking.
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-zinc-100 flex items-center justify-between text-xs font-medium text-[#1b5e20]">
                  <span className="font-bold">Lowest Rate: ₹749 / kg</span>
                  <span className="text-[#86868b] text-[11px]">Save ₹250</span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* The 6 Pure Harvests Showcase — Strictly 6 Main Products (Apple.com Inspired) */}
        <section id="shop-catalog" className="py-14 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#d2d2d7]/60">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#86868b]">The 6 Pure Harvests</span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#1d1d1f] mt-1">
                Explore Artisanal Reserves
              </h2>
              <p className="text-xs sm:text-sm text-[#6e6e73] mt-1">
                Cold-extracted raw honey gathered from wild Indian canopies. Bottled exclusively in thick solid glass.
              </p>
            </div>

            <div className="text-xs text-[#86868b] font-medium hidden md:block">
              Choose your jar size (250g / 500g / 1kg) on the product page
            </div>
          </div>

          {/* Variety Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto py-4 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                selectedCategory === 'ALL'
                  ? 'bg-[#1d1d1f] text-white shadow-xs'
                  : 'bg-white border border-[#d2d2d7] text-[#1d1d1f] hover:border-[#86868b]'
              }`}
            >
              All 6 Varieties
            </button>

            {MOCK_CATEGORIES.filter((c) => c.isVisible !== false && c.id !== 'cat-wild-forest' && c.id !== 'cat-saunf').map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-[#0071e3] text-white shadow-xs'
                    : 'bg-white border border-[#d2d2d7] text-[#1d1d1f] hover:border-[#86868b]'
                }`}
              >
                {cat.name.replace(' Raw Honey', '').replace(' Blossom Honey', '')}
              </button>
            ))}
          </div>

          {/* 6 Main Honey Product Cards Grid (Strictly 6 Varieties) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {displayedProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>

          <div className="text-center pt-10">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-[#d2d2d7] bg-white hover:bg-[#f5f5f7] text-xs sm:text-sm font-medium text-[#1d1d1f] transition-all cursor-pointer shadow-2xs"
            >
              <span>View Full Shop Catalogue (All 6 Harvests)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Live Delhivery Pincode Checker Banner */}
        <section className="py-14 bg-white border-y border-[#d2d2d7]/60">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5f5f7] border border-[#d2d2d7] text-[#1d1d1f] text-xs font-medium shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-[#0071e3]" />
              <span>Pan-India Courier Network</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1d1d1f]">
              Check Express Delivery to Your Doorstep
            </h3>
            <p className="text-xs sm:text-sm text-[#6e6e73] max-w-lg mx-auto">
              We ship nationwide via Delhivery Express Air with 5-ply shock-absorbing honeycomb padding for zero glass breakage.
            </p>

            <form onSubmit={handlePincodeSubmit} className="max-w-md mx-auto flex gap-2 pt-2">
              <input
                type="text"
                maxLength={6}
                value={pincode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setPincode(val);
                  if (val.length === 6) {
                    const info = guessCityStateFromPin(val);
                    if (info?.city && info?.state) {
                      setPincodeResult({ city: info.city, state: info.state });
                    } else {
                      setPincodeResult({ city: 'Metro Delivery Hub', state: 'India' });
                    }
                  } else {
                    setPincodeResult(null);
                  }
                }}
                placeholder="Enter 6-digit Pincode (e.g. 400001, 110001)"
                className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-full border border-[#d2d2d7] bg-[#f5f5f7] text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:border-[#0071e3] shadow-2xs"
              />
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer shrink-0"
              >
                Check
              </button>
            </form>

            {pincodeResult && (
              <div className="inline-flex items-center gap-2 p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 shadow-sm mt-3 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Express Delivery Available</strong> to {pincodeResult.city}, {pincodeResult.state}! Dispatched in 24 hours.
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Why Solid Glass vs Plastic Bottles */}
        <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#86868b]">Purity &amp; Health Protection</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1d1d1f]">Why We Never Use Plastic Bottles</h2>
            <p className="text-xs sm:text-sm text-[#6e6e73]">
              Honey is mildly acidic (pH ~3.9). When packed in cheap plastic, volatile organic acids cause microplastic leaching.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* The Ganesh Mule Solid Glass Standard */}
            <div className="p-8 rounded-[24px] bg-white border border-[#d2d2d7]/70 shadow-sm space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ganesh Mule Solid Glass</span>
              </div>
              <h3 className="text-xl font-bold text-[#1d1d1f]">Heavy Food-Grade Solid Glass Jars</h3>
              <ul className="space-y-3 text-xs sm:text-sm text-[#6e6e73]">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Zero Microplastics:</strong> 100% inert solid flint glass prevents any chemical migration.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Preserves Bio-Enzymes:</strong> Active invertase, diastase, and glucose oxidase remain viable forever.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Airtight Metal Lug Lid:</strong> Locks in delicate wildflower aromatics and prevents moisture absorption.</span>
                </li>
              </ul>
            </div>

            {/* Ordinary Commercial Plastic Bottles */}
            <div className="p-8 rounded-[24px] bg-white/60 border border-[#d2d2d7]/60 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5f5f7] text-[#86868b] text-xs font-bold">
                <span>Ordinary Commercial Plastic</span>
              </div>
              <h3 className="text-xl font-bold text-[#86868b]">Commercial Squeeze Bottles</h3>
              <ul className="space-y-3 text-xs sm:text-sm text-[#86868b]">
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span><strong>Microplastic Contamination:</strong> PET and HDPE bottles leach microparticles under Indian summer temperatures.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span><strong>Boiled &amp; Pasteurized:</strong> Heated to 70°C to stay liquid, destroying natural enzymes and honey aroma.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span><strong>Permeable to Humidity:</strong> Thin plastic walls allow moisture ingress, leading to fermentation over time.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Customer Testimonials & Verified Reviews */}
        <section className="py-16 bg-white border-t border-[#d2d2d7]/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-xl mx-auto space-y-2 mb-10">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#86868b]">Real Customer Experiences</span>
              <h2 className="text-3xl font-bold tracking-tight text-[#1d1d1f]">Loved Across India</h2>
              <div className="flex items-center justify-center gap-1 text-amber-500 pt-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-500" />
                ))}
                <span className="text-xs font-bold text-[#1d1d1f] ml-1.5">4.9 / 5.0 (1,400+ Reviews)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-[#f5f5f7] border border-[#d2d2d7]/60 shadow-2xs space-y-3">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  ))}
                </div>
                <h4 className="text-sm font-semibold text-[#1d1d1f]">Authentic aroma and pure glass jar</h4>
                <p className="text-xs text-[#6e6e73] leading-relaxed">
                  "I was tired of supermarket brands that taste like caramelized glucose syrup. This Forest Honey has the real herbal throat warmth and floral finish. The thick glass jar arrived completely unbroken."
                </p>
                <div className="pt-2 text-[11px] text-[#86868b]">
                  <span className="font-semibold text-[#1d1d1f]">Dr. Rajesh Deshmukh</span> · Pune, Maharashtra
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-[#f5f5f7] border border-[#d2d2d7]/60 shadow-2xs space-y-3">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  ))}
                </div>
                <h4 className="text-sm font-semibold text-[#1d1d1f]">Ajwain honey helped my digestion</h4>
                <p className="text-xs text-[#6e6e73] leading-relaxed">
                  "Ordered the Ajwain Honey 500g. It has a natural carom seed warmth that is wonderful in warm water every morning. The NMR lab test report batch sticker on the jar gives complete confidence."
                </p>
                <div className="pt-2 text-[11px] text-[#86868b]">
                  <span className="font-semibold text-[#1d1d1f]">Ananya Sharma</span> · Bengaluru, Karnataka
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-[#f5f5f7] border border-[#d2d2d7]/60 shadow-2xs space-y-3">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  ))}
                </div>
                <h4 className="text-sm font-semibold text-[#1d1d1f]">1kg jar is incredible value</h4>
                <p className="text-xs text-[#6e6e73] leading-relaxed">
                  "At ₹749 for a full 1kg heavy solid glass reserve, this is unmatched quality. Natural micro-crystals started forming in cold weather, which proves it is unheated raw honey. Highly satisfied!"
                </p>
                <div className="pt-2 text-[11px] text-[#86868b]">
                  <span className="font-semibold text-[#1d1d1f]">Vikramaditya Roy</span> · New Delhi
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </StoreProvider>
  );
}
