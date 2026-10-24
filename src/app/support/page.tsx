'use client';

import React, { useState } from 'react';
import { StoreProvider } from '@/components/storefront/store-provider';
import { Droplets, MessageSquare, Mail, Truck, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Why does real raw honey crystallize, and how do I soften it?',
      a: 'Natural crystallization is the hallmark of real, unheated raw honey. Because we never pasteurize or micro-filter our honey, the natural glucose binds around live pollen grains to form a smooth crystalline texture. To return it to a liquid state, simply place your solid glass jar in a warm water bath (below 40°C) for 15 minutes. Never microwave raw honey, as intense heat destroys living enzymes.',
    },
    {
      q: 'What is NMR testing and how does it guarantee 100% purity?',
      a: 'Nuclear Magnetic Resonance (NMR) spectroscopy is the gold standard global laboratory test for honey purity. It creates a molecular fingerprint of the nectar, verifying that zero high-fructose corn syrup, rice syrup, or inverted sugar has been added, and confirming the exact botanical floral source.',
    },
    {
      q: 'How are heavy solid glass jars protected during shipping?',
      a: 'We pack every jar in custom molded biodegradable air-cushion protectors engineered to withstand long-distance courier transit. In the rare event a jar arrives damaged, we immediately dispatch a replacement with zero questions asked.',
    },
    {
      q: 'What makes wild forest honey different from regular farm honey?',
      a: 'Wild forest honey is gathered by wild indigenous bees foraging across hundreds of wild medicinal plants, trees, and blossoms in untouched forest reserves. It is vastly richer in bioactive antioxidants, polyphenols, and complex floral aromas compared to single-crop commercial farm honey.',
    },
  ];

  return (
    <StoreProvider>
      <div className="bg-[#f5f5f7] min-h-screen py-12 sm:py-16 text-[#1d1d1f]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#1d1d1f] border border-[#d2d2d7] text-xs font-medium shadow-2xs">
              <Droplets className="w-3.5 h-3.5 text-[#0071e3]" />
              <span>Customer Care &amp; Purity Knowledge</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1d1d1f]">
              Purity &amp; Harvest Support.
            </h1>
            <p className="text-sm text-[#6e6e73] leading-relaxed">
              Questions regarding our wild honey harvests, batch NMR reports, jar storage, or delivery tracking? Our specialists are here to assist.
            </p>
          </div>

          {/* Contact Channels */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-[20px] border border-[#d2d2d7]/50 p-6 sm:p-7 text-center space-y-3.5 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-[#f5f5f7] text-[#0071e3] flex items-center justify-center mx-auto border border-[#d2d2d7]/50">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-[#1d1d1f]">Live Specialist Desk</h3>
              <p className="text-xs text-[#6e6e73] leading-relaxed">
                Instant assistance with our Honey Specialists via chat.
              </p>
              <div className="pt-1">
                <span className="text-xs text-emerald-700 font-medium">
                  ● Specialists Available Now
                </span>
              </div>
            </div>

            <div className="bg-white rounded-[20px] border border-[#d2d2d7]/50 p-6 sm:p-7 text-center space-y-3.5 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-[#f5f5f7] text-[#0071e3] flex items-center justify-center mx-auto border border-[#d2d2d7]/50">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-[#1d1d1f]">Email Support</h3>
              <p className="text-xs text-[#6e6e73] leading-relaxed">
                Corporate gifting, wedding hampers, and NMR lab certificates.
              </p>
              <a href="mailto:support@ganeshmule.com" className="inline-block pt-1">
                <span className="text-xs font-medium text-[#0071e3] hover:underline">
                  support@ganeshmule.com →
                </span>
              </a>
            </div>

            <div className="bg-white rounded-[20px] border border-[#d2d2d7]/50 p-6 sm:p-7 text-center space-y-3.5 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-[#f5f5f7] text-[#0071e3] flex items-center justify-center mx-auto border border-[#d2d2d7]/50">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-[#1d1d1f]">Track Consignment</h3>
              <p className="text-xs text-[#6e6e73] leading-relaxed">
                Real-time express air freight tracking and delivery status.
              </p>
              <div className="pt-1">
                <a
                  href="/account"
                  className="inline-block px-4 py-1.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium text-xs transition-colors"
                >
                  View Order Status
                </a>
              </div>
            </div>
          </div>

          {/* FAQs */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">
              Frequently Asked Questions
            </h2>

            <div className="space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={index}
                    className="rounded-[18px] border border-[#d2d2d7]/50 bg-white overflow-hidden shadow-xs"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="w-full p-5 text-left flex items-center justify-between gap-4 font-medium text-[#1d1d1f] text-sm hover:bg-[#f5f5f7]/50 transition-colors cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-[#0071e3] shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#86868b] shrink-0" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-xs text-[#6e6e73] leading-relaxed border-t border-[#d2d2d7]/30 animate-in fade-in">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </StoreProvider>
  );
}
