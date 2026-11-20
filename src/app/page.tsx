'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { StoreProvider } from '@/components/storefront/store-provider';
import { ProductCard } from '@/components/storefront/product-card';
import { VarietyShowcaseCard } from '@/components/storefront/variety-showcase-card';
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
  const [selectedWeight, setSelectedWeight] = useState<'ALL' | '250' | '500' | '1000'>('ALL');

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

  // Filter products for homepage showcase
  const displayedProducts = useMemo(() => {
    let list = [...MOCK_PRODUCTS];

    if (selectedCategory !== 'ALL') {
      list = list.filter((p) => p.categoryId === selectedCategory);
    }

    if (selectedWeight !== 'ALL') {
      const targetWeight = parseInt(selectedWeight, 10);
      list = list.filter((p) => p.weightGrams === targetWeight);
    }

    return list;
  }, [selectedCategory, selectedWeight]);

  return (
    <StoreProvider>
      <div className="bg-[#FAF9F5] text-stone-900 selection:bg-amber-500/20 selection:text-amber-900 min-h-screen">
        
        {/* Top Announcement Bar */}
        <div className="bg-[#1C1917] text-amber-200/90 text-[11px] sm:text-xs py-2 px-4 text-center font-medium tracking-wide flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Free Express Air Delivery Across India on Orders Over ₹999 · 100% German NMR Tested Pure Honey</span>
        </div>

        {/* Hero Section: Clean, Artisanal & Direct */}
        <section className="relative overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-24 border-b border-stone-200/70">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              
              {/* Left Column: Value Proposition & Quick Shop */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/70 border border-amber-200 text-amber-900 text-xs font-medium">
                  <Droplets className="w-3.5 h-3.5 fill-amber-600 text-amber-700" />
                  <span>2026 Western Ghats & Organic Canopy Harvest</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-stone-950 tracking-tight leading-[1.12]">
                  Pure Raw Honey,{' '}
                  <span className="italic font-normal text-amber-900">Bottled in Solid Glass.</span>
                </h1>

                <p className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-xl">
                  Unheated, cold-extracted nectar gathered from wild forest canopies and single-origin blooms. Tested by 400MHz German NMR spectroscopy to guarantee 0% adulteration and 100% active living enzymes.
                </p>

                {/* Quick Shop Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  <a
                    href="#shop-catalog"
                    className="px-6 py-3.5 rounded-full bg-stone-900 hover:bg-amber-800 text-white text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
                  >
                    <span>Shop 6 Pure Harvests (From ₹199)</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>

                  <Link
                    href="/shop?weight=250"
                    className="px-6 py-3.5 rounded-full border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <span>Explore 250g Samplers</span>
                  </Link>
                </div>

                {/* 4 Trust Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-stone-200/80">
                  <div>
                    <div className="flex items-center gap-1 text-sm font-bold text-stone-950">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                      <span>4.9 / 5.0</span>
                    </div>
                    <span className="text-[11px] text-stone-500">1,400+ Verified Buyers</span>
                  </div>

                  <div>
                    <span className="block text-sm font-bold text-stone-950">6 Varieties</span>
                    <span className="text-[11px] text-stone-500">Single-Origin Blooms</span>
                  </div>

                  <div>
                    <span className="block text-sm font-bold text-stone-950">₹199 / ₹399 / ₹749</span>
                    <span className="text-[11px] text-stone-500">Flat Honest Pricing</span>
                  </div>

                  <div>
                    <span className="block text-sm font-bold text-emerald-700">0% Added Sugar</span>
                    <span className="text-[11px] text-stone-500">German NMR Certified</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Hero Visual Glass Jar Preview */}
              <div className="lg:col-span-5 relative">
                <div className="relative aspect-square rounded-[32px] overflow-hidden bg-white border border-stone-200/80 shadow-[0_20px_50px_rgba(28,25,23,0.08)] p-6 sm:p-8 flex items-center justify-center group">
                  <Image
                    src="/images/honey-brand/Forest Honey/500g/image_1_amazon_main.jpg"
                    alt="Ganesh Mule Pure Raw Forest Honey in Heavy Solid Glass Jar"
                    width={500}
                    height={500}
                    priority
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700 ease-out"
                  />

                  {/* Floating Badges */}
                  <div className="absolute top-4 left-4 bg-stone-950 text-white text-[11px] font-semibold px-3 py-1 rounded-full shadow-md">
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

        {/* 3-Size Package Comparison Guide (Easy Decision-Making) */}
        <section className="py-12 bg-white border-b border-stone-200/70">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-xl mx-auto space-y-2 mb-8">
              <span className="text-xs font-semibold text-amber-800 tracking-wider uppercase">Choose Your Perfect Jar</span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-950">Simple, Transparent Sizing</h2>
              <p className="text-xs sm:text-sm text-stone-600">All 6 varieties share the exact same price. Zero confusion.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* 250g Sampler */}
              <div
                onClick={() => setSelectedWeight('250')}
                className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  selectedWeight === '250'
                    ? 'border-amber-700 bg-amber-50/40 ring-2 ring-amber-700/20 shadow-sm'
                    : 'border-stone-200 hover:border-stone-300 bg-white hover:shadow-xs'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Trial / Gifting</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">28% OFF</span>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-stone-950">250g Glass Sampler</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-stone-950">₹199</span>
                    <span className="text-sm text-stone-400 line-through">MRP: ₹275</span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Ideal for first-time taste trials, tea sweeteners, or sharing distinct monofloral flavours with family.
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between text-xs font-medium text-amber-900">
                  <span>₹796 / kg</span>
                  <span className="flex items-center gap-1">Filter 250g <ChevronRight className="w-3.5 h-3.5" /></span>
                </div>
              </div>

              {/* 500g Most Popular */}
              <div
                onClick={() => setSelectedWeight('500')}
                className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative ${
                  selectedWeight === '500'
                    ? 'border-amber-700 bg-amber-50/40 ring-2 ring-amber-700/20 shadow-sm'
                    : 'border-amber-500/40 bg-[#FCFBF7] hover:border-amber-500 hover:shadow-xs'
                }`}
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-800 text-white text-[10px] font-bold tracking-wider uppercase px-3 py-0.5 rounded-full shadow-2xs">
                  Most Popular · Daily Wellness
                </div>
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-900">Bestseller</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">27% OFF</span>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-stone-950">500g Solid Glass Jar</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-stone-950">₹399</span>
                    <span className="text-sm text-stone-400 line-through">MRP: ₹549</span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Perfect 30-day supply for morning warm lemon water, Ayurvedic digestive therapy, and natural daily immunity.
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-amber-200/60 flex items-center justify-between text-xs font-medium text-amber-900">
                  <span>Save ₹150 · ₹798 / kg</span>
                  <span className="flex items-center gap-1">Filter 500g <ChevronRight className="w-3.5 h-3.5" /></span>
                </div>
              </div>

              {/* 1kg Grand Reserve */}
              <div
                onClick={() => setSelectedWeight('1000')}
                className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  selectedWeight === '1000'
                    ? 'border-amber-700 bg-amber-50/40 ring-2 ring-amber-700/20 shadow-sm'
                    : 'border-stone-200 hover:border-stone-300 bg-white hover:shadow-xs'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Best Value</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">25% OFF</span>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-stone-950">1kg Grand Reserve</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-stone-950">₹749</span>
                    <span className="text-sm text-stone-400 line-through">MRP: ₹999</span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Heavy solid glass reserve jar. Maximum economy for full family Ayurvedic use, natural baking, and daily nutrition.
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between text-xs font-medium text-emerald-800">
                  <span className="font-bold">Lowest Rate: ₹749 / kg</span>
                  <span className="flex items-center gap-1">Filter 1kg <ChevronRight className="w-3.5 h-3.5" /></span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 1-Tap Filterable Product Showcase — Exactly 6 Main Honey Products */}
        <section id="shop-catalog" className="py-14 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-stone-200">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">The 6 Pure Harvests</span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-stone-950 mt-1">
                Explore Artisanal Reserves
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 mt-1">
                Hand-harvested raw honey from distinct Indian floral canopies. Bottled exclusively in thick solid glass.
              </p>
            </div>

            {/* Quick Weight Filter Switcher */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
              {(
                [
                  { value: 'ALL', label: 'All Sizes' },
                  { value: '250', label: '250g (₹199)' },
                  { value: '500', label: '500g (₹399)' },
                  { value: '1000', label: '1kg (₹749)' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedWeight(opt.value)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    selectedWeight === opt.value
                      ? 'bg-stone-900 text-white'
                      : 'bg-white border border-stone-200 text-stone-700 hover:border-stone-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 6 Main Honey Product Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
            {MOCK_CATEGORIES.filter((c) => c.isVisible !== false && c.id !== 'cat-wild-forest' && c.id !== 'cat-saunf').map((cat) => (
              <VarietyShowcaseCard
                key={cat.id}
                category={cat}
                products={MOCK_PRODUCTS}
                activeWeightFilter={selectedWeight}
              />
            ))}
          </div>

          <div className="text-center pt-10">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-stone-300 bg-white hover:bg-stone-100 text-xs sm:text-sm font-semibold text-stone-900 transition-all cursor-pointer shadow-2xs"
            >
              <span>View Full Shop Catalogue</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Live Delhivery Pincode Checker Banner */}
        <section className="py-12 bg-amber-50/60 border-y border-amber-200/60">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-amber-200 text-amber-900 text-xs font-medium shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-amber-700" />
              <span>Pan-India Courier Network</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-stone-950">
              Check Express Delivery to Your Doorstep
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 max-w-lg mx-auto">
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
                className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-full border border-stone-300 bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-amber-700 shadow-2xs"
              />
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full bg-stone-900 hover:bg-amber-800 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer shrink-0"
              >
                Check
              </button>
            </form>

            {pincodeResult && (
              <div className="inline-flex items-center gap-2 p-3 rounded-2xl bg-white border border-emerald-300 text-xs text-emerald-900 shadow-sm mt-3 animate-fade-in">
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
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">Purity & Health Protection</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-stone-950">Why We Never Use Plastic Bottles</h2>
            <p className="text-xs sm:text-sm text-stone-600">
              Honey is mildly acidic (pH ~3.9). When packed in cheap plastic, volatile organic acids cause microplastic leaching.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* The Ganesh Mule Solid Glass Standard */}
            <div className="p-8 rounded-3xl bg-white border border-emerald-200 shadow-sm space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ganesh Mule Solid Glass</span>
              </div>
              <h3 className="text-xl font-serif font-bold text-stone-950">Heavy Food-Grade Solid Glass Jars</h3>
              <ul className="space-y-3 text-xs sm:text-sm text-stone-600">
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
            <div className="p-8 rounded-3xl bg-stone-100/70 border border-stone-200 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-200 text-stone-700 text-xs font-bold">
                <span>Ordinary Commercial Plastic</span>
              </div>
              <h3 className="text-xl font-serif font-bold text-stone-700">Commercial Squeeze Bottles</h3>
              <ul className="space-y-3 text-xs sm:text-sm text-stone-500">
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span><strong>Microplastic Contamination:</strong> PET and HDPE bottles leach microparticles under Indian summer temperatures.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span><strong>Boiled & Pasteurized:</strong> Heated to 70°C to stay liquid, destroying natural enzymes and honey aroma.</span>
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
        <section className="py-16 bg-[#F4F1EA] border-t border-stone-200/70">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-xl mx-auto space-y-2 mb-10">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">Real Customer Experiences</span>
              <h2 className="text-3xl font-serif font-bold text-stone-950">Loved Across India</h2>
              <div className="flex items-center justify-center gap-1 text-amber-500 pt-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-500" />
                ))}
                <span className="text-xs font-bold text-stone-900 ml-1.5">4.9 / 5.0 (1,400+ Reviews)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-white border border-stone-200/80 shadow-2xs space-y-3">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  ))}
                </div>
                <h4 className="text-sm font-semibold text-stone-950">Authentic aroma and pure glass jar</h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  "I was tired of supermarket brands that taste like caramelized glucose syrup. This Forest Honey has the real herbal throat warmth and floral finish. The thick glass jar arrived completely unbroken."
                </p>
                <div className="pt-2 text-[11px] text-stone-400">
                  <span className="font-semibold text-stone-800">Dr. Rajesh Deshmukh</span> · Pune, Maharashtra
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-stone-200/80 shadow-2xs space-y-3">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  ))}
                </div>
                <h4 className="text-sm font-semibold text-stone-950">Ajwain honey helped my digestion</h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  "Ordered the Ajwain Honey 500g. It has a natural carom seed warmth that is wonderful in warm water every morning. The NMR lab test report batch sticker on the jar gives complete confidence."
                </p>
                <div className="pt-2 text-[11px] text-stone-400">
                  <span className="font-semibold text-stone-800">Ananya Sharma</span> · Bengaluru, Karnataka
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-stone-200/80 shadow-2xs space-y-3">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  ))}
                </div>
                <h4 className="text-sm font-semibold text-stone-950">1kg jar is incredible value</h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  "At ₹749 for a full 1kg heavy solid glass reserve, this is unmatched quality. Natural micro-crystals started forming in cold weather, which proves it is unheated raw honey. Highly satisfied!"
                </p>
                <div className="pt-2 text-[11px] text-stone-400">
                  <span className="font-semibold text-stone-800">Vikramaditya Roy</span> · New Delhi
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </StoreProvider>
  );
}
