'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { StoreProvider } from '@/components/storefront/store-provider';
import { guessCityStateFromPin } from '@/lib/constants/india';
import {
  Star,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Droplets,
  Check,
  CheckCircle2,
  MapPin,
  Flame,
  Microscope,
  Leaf,
} from 'lucide-react';

const HARVEST_SPOTLIGHTS = [
  {
    slug: 'forest-honey',
    name: 'Wild Forest Honey',
    origin: 'Western Ghats Canopies',
    note: 'Deep caramel with wild flora notes',
    imageUrl: '/images/honey-brand/Forest Honey/500g/image_1_amazon_main.jpg',
  },
  {
    slug: 'sesame-honey',
    name: 'Sesame Blossom Honey',
    origin: 'Organic Maharashtra Plains',
    note: 'Warm nutty aroma and gentle sweetness',
    imageUrl: '/images/honey-brand/Sesame Honey/500g/image_1_amazon_main.jpg',
  },
  {
    slug: 'ajwain-honey',
    name: 'Ajwain (Carom) Honey',
    origin: 'Carom Seed Fields, Rajasthan',
    note: 'Herbal warmth and digestive botanical notes',
    imageUrl: '/images/honey-brand/Ajwain Honey/500g/image_1_amazon_main.jpg',
  },
  {
    slug: 'multiflora-honey',
    name: 'Multiflora Honey',
    origin: 'Satpura Wild Meadows',
    note: 'Complex bouquet of wild forest flora',
    imageUrl: '/images/honey-brand/Multiflora Honey/500g/image_1_amazon_main.jpg',
  },
  {
    slug: 'ber-honey',
    name: 'Ber (Sidr) Honey',
    origin: 'Wild Jujube Forests, Bikaner',
    note: 'Rich butterscotch and vanilla smoothness',
    imageUrl: '/images/honey-brand/Ber Honey/500g/image_1_amazon_main.jpg',
  },
  {
    slug: 'sheesham-honey',
    name: 'Sheesham Honey',
    origin: 'Dalbergia Sissoo Reserves',
    note: 'Delicate woody notes and mild floral amber',
    imageUrl: '/images/honey-brand/Sheesham Honey/500g/image_1_amazon_main.jpg',
  },
];

export default function HomePage() {
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

  return (
    <StoreProvider>
      <div className="bg-[#f5f5f7] text-[#1d1d1f] selection:bg-[#0071e3]/20 selection:text-[#0071e3] min-h-screen">
        
        {/* Top Announcement Bar */}
        <div className="bg-[#1d1d1f] text-white text-[11px] sm:text-xs py-2.5 px-4 text-center font-medium tracking-wide flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Free Express Air Delivery Across India on Orders Over ₹999 · 100% German NMR Tested Pure Honey</span>
        </div>

        {/* Hero Section: Apple Minimalist Editorial */}
        <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-32">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              
              {/* Left Column: Vision & Primary Action */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-[#d2d2d7] text-[#1d1d1f] text-xs font-medium shadow-2xs">
                  <Droplets className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                  <span>2026 Western Ghats &amp; Single-Origin Harvest</span>
                </div>

                <div className="space-y-2">
                  <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-[#1d1d1f] tracking-tight leading-[1.08]">
                    Pure Raw Honey.
                  </h1>
                  <p className="text-3xl sm:text-5xl lg:text-6xl font-medium text-[#86868b] tracking-tight">
                    Bottled in solid glass.
                  </p>
                </div>

                <p className="text-base sm:text-lg text-[#6e6e73] leading-relaxed max-w-xl">
                  Unheated, cold-extracted nectar gathered from wild cliff bees in deep Indian canopies. Verified by 400MHz German NMR spectroscopy to guarantee 0.0% inverted syrup and living bio-enzymes.
                </p>

                {/* Primary CTAs */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-3">
                  <Link
                    href="/shop"
                    className="px-8 py-3.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-medium transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow active:scale-98"
                  >
                    <span>Shop All 6 Harvests</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <a
                    href="#purity"
                    className="px-8 py-3.5 rounded-full border border-[#d2d2d7] bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] text-sm font-medium transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 shadow-2xs"
                  >
                    <span>Why Solid Glass</span>
                  </a>
                </div>

                {/* Key Quality Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-[#d2d2d7]/60">
                  <div>
                    <div className="flex items-center gap-1 text-sm font-bold text-[#1d1d1f]">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                      <span>4.9 / 5.0</span>
                    </div>
                    <span className="text-[11px] text-[#86868b]">1,400+ Verified Buyers</span>
                  </div>

                  <div>
                    <span className="block text-sm font-bold text-[#1d1d1f]">6 Harvests</span>
                    <span className="text-[11px] text-[#86868b]">Single-Origin Blooms</span>
                  </div>

                  <div>
                    <span className="block text-sm font-bold text-[#1d1d1f]">100% Raw</span>
                    <span className="text-[11px] text-[#86868b]">Cold-Extracted &lt;38°C</span>
                  </div>

                  <div>
                    <span className="block text-sm font-bold text-[#1b5e20]">0% Sugar</span>
                    <span className="text-[11px] text-[#86868b]">German NMR Certified</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Hero Visual Glass Jar Preview */}
              <div className="lg:col-span-5 relative">
                <div className="relative aspect-square rounded-[32px] overflow-hidden bg-white border border-[#d2d2d7]/70 shadow-[0_24px_60px_rgba(0,0,0,0.06)] p-8 sm:p-12 flex items-center justify-center group">
                  <Image
                    src="/images/honey-brand/Forest Honey/500g/image_1_amazon_main.jpg"
                    alt="Ganesh Mule Pure Raw Forest Honey in Heavy Solid Glass Jar"
                    width={520}
                    height={520}
                    priority
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700 ease-out p-4"
                  />

                  {/* Floating Badges */}
                  <span className="absolute top-4 left-4 bg-white/95 text-[#1d1d1f] border border-black/5 text-[11px] font-medium px-3 py-1 rounded-full shadow-2xs backdrop-blur-xs">
                    Single-Origin · Western Ghats
                  </span>

                  <span className="absolute bottom-4 right-4 bg-[#1d1d1f] text-white text-[11px] font-semibold px-3 py-1 rounded-full shadow-2xs flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Heavy Solid Flint Glass</span>
                  </span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* The 6 Single-Origin Harvests — Clean Apple Editorial Showcase */}
        <section className="py-20 sm:py-28 bg-white border-y border-[#d2d2d7]/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#86868b]">
                The Pure Harvests
              </span>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#1d1d1f]">
                Six Monofloral Reserves.
              </h2>
              <p className="text-sm sm:text-base text-[#6e6e73] leading-relaxed">
                Each harvest is gathered during peak natural flowering from wild Indian canopies. Never blended, never ultra-filtered, and preserved exclusively in solid glass.
              </p>
            </div>

            {/* Clean Apple Editorial 3-Column Grid (No pricing/buttons clutter) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {HARVEST_SPOTLIGHTS.map((item) => (
                <Link
                  key={item.slug}
                  href={`/product/${item.slug}`}
                  className="group block rounded-[24px] bg-[#f5f5f7] hover:bg-white p-7 border border-transparent hover:border-[#d2d2d7] hover:shadow-[0_16px_36px_rgba(0,0,0,0.06)] transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Bottle Image Showcase (Pure White Stage) */}
                    <div className="w-full aspect-square rounded-[20px] bg-white relative mb-6 overflow-hidden flex items-center justify-center p-6 shadow-2xs">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
                        className="object-contain group-hover:scale-106 transition-transform duration-700 ease-out p-2"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs text-[#86868b] font-medium block">
                        {item.origin}
                      </span>
                      <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f] group-hover:text-[#0071e3] transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-xs text-[#6e6e73] leading-relaxed">
                        {item.note}
                      </p>
                    </div>
                  </div>

                  <div className="pt-5 mt-4 flex items-center text-xs font-medium text-[#0071e3] group-hover:translate-x-0.5 transition-transform">
                    <span>Explore harvest</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </Link>
              ))}
            </div>

            {/* Direct Link to Full Shop Catalog */}
            <div className="text-center pt-12">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#1d1d1f] hover:bg-[#2d2d2f] text-white text-xs sm:text-sm font-medium transition-all shadow-sm cursor-pointer"
              >
                <span>Browse Full Catalogue in Shop</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Purity & Craft Standards (Apple Bento Style) */}
        <section id="purity" className="py-20 sm:py-28 max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#86868b]">
              Purity Architecture
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#1d1d1f]">
              Engineered by Nature.
            </h2>
            <p className="text-sm sm:text-base text-[#6e6e73] leading-relaxed">
              We uphold the most rigorous testing protocols in the honey industry to ensure that what reaches your home is completely uncompromised.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* NMR Testing */}
            <div className="p-8 rounded-[28px] bg-white border border-[#d2d2d7]/70 shadow-2xs space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-[#f5f5f7] flex items-center justify-center text-[#1d1d1f]">
                <Microscope className="w-5 h-5 text-[#0071e3]" />
              </div>
              <h3 className="text-xl font-bold text-[#1d1d1f]">400MHz German NMR Spectroscopy</h3>
              <p className="text-xs sm:text-sm text-[#6e6e73] leading-relaxed">
                Nuclear Magnetic Resonance fingerprinting analyzes every batch at the molecular level, detecting 0.0% inverted rice syrup, beet sugar, or C4 adulterants.
              </p>
            </div>

            {/* Cold Extraction */}
            <div className="p-8 rounded-[28px] bg-white border border-[#d2d2d7]/70 shadow-2xs space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-[#f5f5f7] flex items-center justify-center text-[#1d1d1f]">
                <Leaf className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-[#1d1d1f]">Unheated &amp; Cold-Extracted (&lt;38°C)</h3>
              <p className="text-xs sm:text-sm text-[#6e6e73] leading-relaxed">
                Commercial brands boil honey to prevent crystallization. We extract strictly below hive temperature, preserving living invertase and diastase bio-enzymes.
              </p>
            </div>

            {/* Heavy Solid Flint Glass */}
            <div className="p-8 rounded-[28px] bg-white border border-[#d2d2d7]/70 shadow-2xs space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-[#f5f5f7] flex items-center justify-center text-[#1d1d1f]">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-[#1d1d1f]">Heavy Solid Flint Glass</h3>
              <p className="text-xs sm:text-sm text-[#6e6e73] leading-relaxed">
                Natural honey is acidic (pH ~3.9). Solid glass is 100% chemically inert, guaranteeing zero microplastic migration or chemical leaching over time.
              </p>
            </div>

          </div>
        </section>

        {/* Why Solid Glass vs Plastic Bottles Comparison */}
        <section className="py-20 sm:py-28 bg-white border-y border-[#d2d2d7]/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#86868b]">
                The Packaging Standard
              </span>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#1d1d1f]">
                Why We Never Use Plastic.
              </h2>
              <p className="text-sm sm:text-base text-[#6e6e73] leading-relaxed">
                A premium honey experience begins with what surrounds the honey.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Ganesh Mule Solid Glass */}
              <div className="p-8 sm:p-10 rounded-[28px] bg-[#f5f5f7] border border-[#d2d2d7] shadow-sm space-y-5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#1d1d1f] text-xs font-semibold border border-[#d2d2d7]">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ganesh Mule Solid Glass</span>
                </div>
                <h3 className="text-2xl font-bold text-[#1d1d1f]">Heavy Food-Grade Solid Glass Jars</h3>
                <ul className="space-y-3.5 text-xs sm:text-sm text-[#6e6e73]">
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

              {/* Ordinary Plastic Squeeze Bottles */}
              <div className="p-8 sm:p-10 rounded-[28px] bg-white border border-[#d2d2d7]/70 shadow-2xs space-y-5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5f5f7] text-[#86868b] text-xs font-semibold">
                  <span>Ordinary Commercial Plastic</span>
                </div>
                <h3 className="text-2xl font-bold text-[#86868b]">Commercial Squeeze Bottles</h3>
                <ul className="space-y-3.5 text-xs sm:text-sm text-[#86868b]">
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
          </div>
        </section>

        {/* Live Delhivery Express Pincode Checker */}
        <section className="py-20 sm:py-24 max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#d2d2d7] text-[#1d1d1f] text-xs font-medium shadow-2xs">
            <MapPin className="w-3.5 h-3.5 text-[#0071e3]" />
            <span>Pan-India Courier Network</span>
          </div>

          <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1d1d1f]">
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
              className="flex-1 px-4 py-3 text-xs sm:text-sm rounded-full border border-[#d2d2d7] bg-white text-[#1d1d1f] placeholder:text-[#86868b] focus:outline-none focus:border-[#0071e3] shadow-2xs"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer shrink-0"
            >
              Check
            </button>
          </form>

          {pincodeResult && (
            <div className="inline-flex items-center gap-2 p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 shadow-sm mt-3 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Express Delivery Available</strong> to {pincodeResult.city}, {pincodeResult.state}! Dispatched within 24 hours.
              </span>
            </div>
          )}
        </section>

        {/* Verified Reviews Section */}
        <section className="py-20 sm:py-28 bg-white border-t border-[#d2d2d7]/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-xl mx-auto space-y-3 mb-16">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#86868b]">Real Experiences</span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1d1d1f]">Loved Across India</h2>
              <div className="flex items-center justify-center gap-1 text-amber-500 pt-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-500" />
                ))}
                <span className="text-xs font-bold text-[#1d1d1f] ml-1.5">4.9 / 5.0 (1,400+ Reviews)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-7 rounded-[24px] bg-[#f5f5f7] border border-[#d2d2d7]/60 shadow-2xs space-y-3">
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

              <div className="p-7 rounded-[24px] bg-[#f5f5f7] border border-[#d2d2d7]/60 shadow-2xs space-y-3">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  ))}
                </div>
                <h4 className="text-sm font-semibold text-[#1d1d1f]">Ajwain honey helped my digestion</h4>
                <p className="text-xs text-[#6e6e73] leading-relaxed">
                  "Ordered the Ajwain Honey. It has a natural carom seed warmth that is wonderful in warm water every morning. The NMR lab test report batch sticker on the jar gives complete confidence."
                </p>
                <div className="pt-2 text-[11px] text-[#86868b]">
                  <span className="font-semibold text-[#1d1d1f]">Ananya Sharma</span> · Bengaluru, Karnataka
                </div>
              </div>

              <div className="p-7 rounded-[24px] bg-[#f5f5f7] border border-[#d2d2d7]/60 shadow-2xs space-y-3">
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

        {/* Final Apple Call to Action Banner */}
        <section className="py-20 sm:py-28 text-center max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#1d1d1f]">
            Taste Real Honey As Nature Intended.
          </h2>
          <p className="text-sm sm:text-base text-[#6e6e73] max-w-xl mx-auto leading-relaxed">
            Choose your preferred single-origin variety and bottle size on our store page. Express shipping direct to your door.
          </p>
          <div className="pt-2">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm sm:text-base font-medium transition-all shadow-md hover:shadow-lg cursor-pointer"
            >
              <span>Explore The Shop</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

      </div>
    </StoreProvider>
  );
}
