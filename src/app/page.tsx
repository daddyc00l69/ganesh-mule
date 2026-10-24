'use client';

import React from 'react';
import Link from 'next/link';
import { StoreProvider } from '@/components/storefront/store-provider';
import {
  Droplets,
  ArrowRight,
  ShieldCheck,
  Truck,
  MessageSquare,
  Award,
  Sparkles,
  ChevronRight,
  Check,
  Flame,
  Layers,
  Leaf,
  Compass,
} from 'lucide-react';

export default function HomePage() {
  return (
    <StoreProvider>
      <div className="bg-[#f5f5f7] min-h-screen text-[#1d1d1f] selection:bg-[#0071e3]/20 overflow-x-hidden">
        
        {/* =========================================================================
            1. CINEMATIC APPLE HERO SECTION (NO PRODUCT LIST)
           ========================================================================= */}
        <section className="pt-12 sm:pt-20 pb-16 sm:pb-24 max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-[#d2d2d7] text-xs font-medium text-[#1d1d1f] shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#0071e3]" />
              <span>Western Ghats Canopy Harvest • Season 2026</span>
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-[#1d1d1f] leading-[1.05]">
              Pure Raw Honey.<br />
              <span className="text-[#6e6e73]">Bottled in solid glass.</span>
            </h1>

            <p className="text-base sm:text-xl text-[#6e6e73] font-normal leading-relaxed max-w-2xl mx-auto pt-2">
              Cold-extracted at hive temperature from wild cliff colonies. Verified 100% molecularly pure by Nuclear Magnetic Resonance spectroscopy.
            </p>

            {/* Apple Action Pills */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/shop"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full text-xs sm:text-sm font-medium bg-[#0071e3] hover:bg-[#0077ed] text-white transition-all shadow-sm active:scale-95 text-center cursor-pointer"
              >
                Explore The Shop
              </Link>
              <Link
                href="/support"
                className="w-full sm:w-auto px-7 py-3.5 rounded-full text-xs sm:text-sm font-medium bg-white hover:bg-[#e8e8ed] text-[#1d1d1f] border border-[#d2d2d7] transition-all text-center cursor-pointer"
              >
                Purity &amp; NMR Standards
              </Link>
            </div>
          </div>

          {/* Hero Visual: Majestic Solid Glass Jar Studio View */}
          <div className="mt-12 sm:mt-16 max-w-4xl mx-auto rounded-[32px] sm:rounded-[40px] bg-white border border-[#d2d2d7]/50 p-8 sm:p-14 shadow-sm relative overflow-hidden">
            <div className="w-64 h-64 sm:w-96 sm:h-96 mx-auto flex items-center justify-center">
              <img
                src="/images/products/wild-forest-honey.jpg"
                alt="Ganesh Mule 100% Raw Wild Honey in Heavy Solid Glass"
                className="w-full h-full object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-700"
              />
            </div>

            {/* Subtle Apple Feature Badges */}
            <div className="mt-6 pt-6 border-t border-[#d2d2d7]/40 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-xs">
              <div>
                <span className="block font-semibold text-[#1d1d1f]">0.0% Added Sugar</span>
                <span className="text-[#86868b]">Zero syrup adulteration</span>
              </div>
              <div>
                <span className="block font-semibold text-[#1d1d1f]">Below 38°C</span>
                <span className="text-[#86868b]">Never boiled or heated</span>
              </div>
              <div>
                <span className="block font-semibold text-[#1d1d1f]">4mm Solid Glass</span>
                <span className="text-[#86868b]">Zero plastic leaching</span>
              </div>
              <div>
                <span className="block font-semibold text-[#1d1d1f]">NMR Verified</span>
                <span className="text-[#86868b]">Batch tested in Germany</span>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            2. THE THREE PILLARS OF PURITY (APPLE NARRATIVE STORY)
           ========================================================================= */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-semibold text-[#0071e3] uppercase tracking-wider">
              The Amber &amp; Glass Philosophy
            </span>
            <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-[#1d1d1f]">
              Nature made it perfect.<br />We leave it that way.
            </h2>
            <p className="text-sm sm:text-base text-[#6e6e73] leading-relaxed">
              Every drop of commercial supermarket honey is flash-boiled, micro-filtered, and packed in plastic squeeze bottles. Here is why our harvest stands apart.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            
            {/* Pillar 1 */}
            <div className="rounded-[28px] bg-white border border-[#d2d2d7]/50 p-8 sm:p-10 space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#f5f5f7] text-[#0071e3] flex items-center justify-center border border-[#d2d2d7]/40">
                  <Flame className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-semibold text-[#1d1d1f] tracking-tight">
                  Cold-Extracted.<br />Never heated.
                </h3>
                <p className="text-xs sm:text-sm text-[#6e6e73] leading-relaxed">
                  Commercial producers flash-heat honey to 70°C to destroy natural crystallization, completely killing live diastase and invertase enzymes. We extract at native hive warmth (&lt;38°C) so beneficial bioactive nutrients remain living.
                </p>
              </div>
              <div className="pt-4 border-t border-[#d2d2d7]/30 text-xs font-medium text-[#1d1d1f]">
                Preserves live bee pollen &amp; propolis
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="rounded-[28px] bg-white border border-[#d2d2d7]/50 p-8 sm:p-10 space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#f5f5f7] text-[#0071e3] flex items-center justify-center border border-[#d2d2d7]/40">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-semibold text-[#1d1d1f] tracking-tight">
                  Heavy Solid Glass.<br />Never plastic.
                </h3>
                <p className="text-xs sm:text-sm text-[#6e6e73] leading-relaxed">
                  Raw honey is naturally acidic with a pH of 3.9. Standard plastic squeeze bottles slowly leach phthalates, microplastics, and BPA into the honey. Our custom 4mm flint glass is food-inert, odor-free, and protects honey for years.
                </p>
              </div>
              <div className="pt-4 border-t border-[#d2d2d7]/30 text-xs font-medium text-[#1d1d1f]">
                100% recyclable, reusable, and inert
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="rounded-[28px] bg-white border border-[#d2d2d7]/50 p-8 sm:p-10 space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#f5f5f7] text-[#0071e3] flex items-center justify-center border border-[#d2d2d7]/40">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-semibold text-[#1d1d1f] tracking-tight">
                  NMR Certified.<br />Zero adulteration.
                </h3>
                <p className="text-xs sm:text-sm text-[#6e6e73] leading-relaxed">
                  Nuclear Magnetic Resonance spectroscopy creates a molecular fingerprint of every batch. It confirms 0.0% added high-fructose corn syrup, rice syrup, or inverted sugars, and authenticates botanical origin down to the nectar source.
                </p>
              </div>
              <div className="pt-4 border-t border-[#d2d2d7]/30 text-xs font-medium text-[#1d1d1f]">
                Codex Alimentarius &amp; German NMR verified
              </div>
            </div>

          </div>
        </section>

        {/* =========================================================================
            3. SUSTAINABLE CLIFF FORAGING (FOREST CANOPY GUARDIANSHIP)
           ========================================================================= */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="rounded-[32px] bg-white border border-[#d2d2d7]/50 p-8 sm:p-14 lg:p-16 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <span className="text-xs font-semibold text-[#0071e3] uppercase tracking-wider">
                  Western Ghats Rainforest Reserves
                </span>
                <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1d1d1f]">
                  Harvested with reverence for wild cliff bees.
                </h2>
                <p className="text-xs sm:text-sm text-[#6e6e73] leading-relaxed">
                  Our wild forest honey is gathered from indigenous <em>Apis dorsata</em> colonies nesting high on cliff canopies across the Western Ghats. We partner with traditional tribal foragers who harvest with non-destructive smoke techniques, leaving 30% of each comb intact so colonies flourish for future seasons.
                </p>
                <div className="pt-2 flex items-center gap-6 text-xs text-[#1d1d1f] font-medium">
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-[#0071e3]" />
                    Fair tribal wages
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-[#0071e3]" />
                    Zero antibiotics
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-[#0071e3]" />
                    Forest canopy protection
                  </span>
                </div>
              </div>

              <div className="lg:col-span-5 bg-[#f5f5f7] rounded-[24px] p-6 sm:p-8 border border-[#d2d2d7]/40 space-y-3">
                <div className="w-10 h-10 rounded-full bg-white text-[#0071e3] flex items-center justify-center border border-[#d2d2d7]/40">
                  <Compass className="w-5 h-5" />
                </div>
                <h4 className="text-base font-semibold text-[#1d1d1f]">Traceable Apiary Batches</h4>
                <p className="text-xs text-[#6e6e73] leading-relaxed">
                  Every jar is stamped with its apiary identifier, harvest date, and geographical coordinates. You can review the complete laboratory certificate online at any time.
                </p>
                <div className="pt-1">
                  <Link
                    href="/support"
                    className="text-xs font-medium text-[#0071e3] hover:underline inline-flex items-center gap-0.5"
                  >
                    <span>Read our Purity &amp; Harvest FAQ</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            4. THE GANESH MULE SERVICE PROMISE
           ========================================================================= */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="rounded-[24px] bg-white border border-[#d2d2d7]/50 p-6 space-y-2.5 shadow-sm">
              <Truck className="w-7 h-7 text-[#0071e3]" />
              <h4 className="font-semibold text-sm text-[#1d1d1f]">Insured Air Express</h4>
              <p className="text-xs text-[#6e6e73] leading-relaxed">
                Flat ₹70 + 18% GST across India with real-time Delhivery tracking.
              </p>
            </div>

            <div className="rounded-[24px] bg-white border border-[#d2d2d7]/50 p-6 space-y-2.5 shadow-sm">
              <ShieldCheck className="w-7 h-7 text-[#0071e3]" />
              <h4 className="font-semibold text-sm text-[#1d1d1f]">Zero-breakage guarantee</h4>
              <p className="text-xs text-[#6e6e73] leading-relaxed">
                Engineered shock-absorbing kraft packaging. Immediate courier replacement if damaged.
              </p>
            </div>

            <div className="rounded-[24px] bg-white border border-[#d2d2d7]/50 p-6 space-y-2.5 shadow-sm">
              <Award className="w-7 h-7 text-[#0071e3]" />
              <h4 className="font-semibold text-sm text-[#1d1d1f]">100% NMR certified</h4>
              <p className="text-xs text-[#6e6e73] leading-relaxed">
                Every batch certified by Nuclear Magnetic Resonance spectroscopy.
              </p>
            </div>

            <div className="rounded-[24px] bg-white border border-[#d2d2d7]/50 p-6 space-y-2.5 shadow-sm">
              <MessageSquare className="w-7 h-7 text-[#0071e3]" />
              <h4 className="font-semibold text-sm text-[#1d1d1f]">Honey Specialist care</h4>
              <p className="text-xs text-[#6e6e73] leading-relaxed">
                Personalized advice on tasting profiles, crystallization care, and daily wellness.
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================================
            5. FINAL CALL TO ACTION: GATEWAY TO THE SHOP
           ========================================================================= */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-20">
          <div className="rounded-[32px] bg-[#1d1d1f] text-white p-8 sm:p-14 text-center space-y-6 shadow-xl relative overflow-hidden">
            <div className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center mx-auto border border-white/20">
              <Droplets className="w-6 h-6 text-[#0071e3]" />
            </div>

            <div className="max-w-xl mx-auto space-y-2">
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
                Experience real, unheated honey.
              </h2>
              <p className="text-xs sm:text-sm text-[#a1a1a6] leading-relaxed">
                Explore our full collection of wild forest harvests, monofloral alpine reserves, and live honeycombs in The Shop.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/shop"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full text-xs sm:text-sm font-medium bg-[#0071e3] hover:bg-[#0077ed] text-white transition-all shadow-sm active:scale-95 text-center cursor-pointer"
              >
                Go to The Honey Shop
              </Link>
              <Link
                href="/support"
                className="w-full sm:w-auto px-6 py-3.5 rounded-full text-xs sm:text-sm font-medium bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all text-center cursor-pointer"
              >
                Ask a Honey Specialist
              </Link>
            </div>
          </div>
        </section>

      </div>
    </StoreProvider>
  );
}
