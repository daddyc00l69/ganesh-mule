'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { MessageSquare, X, ChevronRight, Droplets } from 'lucide-react';

export const ChatwootWidget: React.FC = () => {
  const pathname = usePathname();
  const [isOpenFallback, setIsOpenFallback] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL || 'https://app.chatwoot.com';
  const websiteToken = process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN;

  // Do not display on checkout to avoid overlapping sticky mobile action bar
  if (pathname === '/checkout') {
    return null;
  }

  useEffect(() => {
    if (websiteToken && !websiteToken.includes('placeholder')) {
      const script = document.createElement('script');
      script.src = `${baseUrl}/packs/js/sdk.js`;
      script.async = true;
      script.onload = () => {
        (window as any).chatwootSettings = {
          position: 'right',
          type: 'standard',
          launcherTitle: 'Ask a Honey Specialist',
        };
        if ((window as any).chatwootSDK) {
          (window as any).chatwootSDK.run({
            websiteToken,
            baseUrl,
          });
        }
      };
      document.body.appendChild(script);

      return () => {
        try {
          document.body.removeChild(script);
        } catch {}
      };
    }
  }, [baseUrl, websiteToken]);

  if (websiteToken && !websiteToken.includes('placeholder')) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-30">
      {isOpenFallback ? (
        <div className="w-[calc(100vw-2rem)] max-w-sm sm:w-80 p-5 rounded-[22px] bg-white/95 backdrop-blur-xl shadow-2xl border border-[#d2d2d7]/80 space-y-3.5 animate-in zoom-in-95">
          <div className="flex items-center justify-between pb-2 border-b border-[#e5e5e7]">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <h4 className="text-xs font-semibold text-[#1d1d1f]">Ask a Honey Specialist</h4>
                <span className="text-[10px] text-[#6e6e73]">Online now</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpenFallback(false)}
              className="p-1 text-[#86868b] hover:text-[#1d1d1f] rounded-lg cursor-pointer"
              aria-label="Close specialist chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-[#6e6e73] leading-relaxed">
            Need advice on single-origin floral notes, natural crystallization, or custom gifting hampers? Our specialists are here to guide you.
          </p>

          <div className="p-3 rounded-[16px] bg-[#f5f5f7] text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-[#1d1d1f]">
              <Droplets className="w-3.5 h-3.5 text-[#0071e3]" />
              <span>Priority Specialist Email:</span>
            </div>
            <a
              href="mailto:support@ganeshmule.com"
              className="text-xs font-semibold text-[#0066cc] hover:underline block"
            >
              support@ganeshmule.com
            </a>
          </div>

          <a
            href="mailto:support@ganeshmule.com"
            className="block w-full py-2.5 rounded-full text-center text-xs font-medium bg-[#0071e3] hover:bg-[#0077ed] text-white transition-all shadow-xs"
          >
            Send Message to Specialist
          </a>
        </div>
      ) : (
        <button
          onClick={() => setIsOpenFallback(true)}
          className="h-10 px-3.5 sm:px-4 rounded-full bg-[#1d1d1f]/90 hover:bg-[#1d1d1f] text-white shadow-xl hover:shadow-2xl active:scale-95 transition-all cursor-pointer flex items-center gap-2 text-xs font-normal border border-white/20 backdrop-blur-md"
          title="Ask a Honey Specialist"
        >
          <MessageSquare className="w-3.5 h-3.5 text-[#0071e3]" />
          <span className="hidden sm:inline">Ask a Honey Specialist</span>
          <span className="sm:hidden text-[11px]">Specialist</span>
        </button>
      )}
    </div>
  );
};
