'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassBadge } from '@/components/ui/glass-badge';
import { SearchInput } from '@/components/ui/search-input';
import { MOCK_COUPONS } from '@/lib/mock-data';
import { DiscountCoupon } from '@/types';
import { formatCurrency } from '@/lib/utils';
import {
  TicketPercent,
  Copy,
  Check,
  Share2,
  MessageSquare,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Gift,
  ArrowRight,
} from 'lucide-react';

export default function ManagerCouponsPage() {
  const [coupons, setCoupons] = useState<DiscountCoupon[]>(MOCK_COUPONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/coupons')
      .then((res) => res.json())
      .then((data) => {
        if (data.coupons) {
          // If manager role returned, it's already filtered
          setCoupons(data.coupons);
        }
      })
      .catch(() => {});
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCopyLink = (code: string) => {
    const origin = typeof window !== 'undefined' && !window.location.origin.includes('localhost')
      ? window.location.origin
      : 'https://ganesh-mule.vercel.app';
    const link = `${origin}/checkout?coupon=${code}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(code);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleCopySnippet = (coupon: DiscountCoupon) => {
    const origin = typeof window !== 'undefined' && !window.location.origin.includes('localhost')
      ? window.location.origin
      : 'https://ganesh-mule.vercel.app';
    const offer =
      coupon.discountType === 'PERCENTAGE'
        ? `${coupon.value}% off`
        : `${formatCurrency(coupon.value)} off`;
    const snippet = `Hello! As a courtesy for your order inquiry, here is an exclusive promotional code: ${coupon.code} for ${offer}. You can apply it at checkout or via this link: ${origin}/checkout?coupon=${coupon.code}`;
    navigator.clipboard.writeText(snippet);
    setCopiedSnippet(coupon.code);
    setTimeout(() => setCopiedSnippet(null), 2500);
  };

  const filteredCoupons = coupons.filter(
    (c) =>
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout role="MANAGER" title="My Assigned Promo Codes">
      <div className="space-y-6">
        {/* Header Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <TicketPercent className="w-6 h-6 text-primary" />
              <span>Customer Promotional Codes</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              These discount codes are provisioned to you by Administration. Share them with your customers during support calls or direct orders.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Manager Attribution Active</span>
            </span>
          </div>
        </div>

        {/* Informative Guidance Banner */}
        <div className="glass-panel p-4 rounded-xl border border-border/40 bg-secondary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">How to distribute promo codes:</p>
              <p className="text-[11px] text-muted-foreground">
                Click <strong className="text-foreground">"Copy Support Snippet"</strong> to paste a polite message directly into your customer conversation or email. The link auto-applies the discount at checkout.
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="max-w-md">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            placeholder="Search promo codes..."
          />
        </div>

        {/* Grid of Manager Coupons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCoupons.map((coupon) => (
            <div
              key={coupon.id}
              className="glass-card rounded-2xl border border-white/10 p-5 flex flex-col justify-between space-y-4 hover:border-white/20 transition-all duration-300 relative overflow-hidden"
            >
              <div className="space-y-3">
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-semibold text-foreground tracking-wide bg-secondary/80 border border-border/40 px-2.5 py-0.5 rounded-lg">
                    {coupon.code}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <GlassBadge variant={coupon.isPublic ? 'success' : 'outline'}>
                      {coupon.isPublic ? '🌐 Public' : '🔒 Direct Code'}
                    </GlassBadge>
                    <GlassBadge variant={coupon.isActive ? 'success' : 'outline'}>
                      {coupon.isActive ? 'Active' : 'Paused'}
                    </GlassBadge>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground line-clamp-1">
                    {coupon.discountType === 'PERCENTAGE'
                      ? `${coupon.value}% OFF Order`
                      : `${formatCurrency(coupon.value)} OFF Order`}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                    {coupon.description}
                  </p>
                </div>

                {/* Criteria Pills */}
                <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-muted-foreground pt-1">
                  <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                    Min: {coupon.minOrderAmount > 0 ? formatCurrency(coupon.minOrderAmount) : 'No Min'}
                  </span>
                  {coupon.maxDiscountAmount && (
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                      Cap: {formatCurrency(coupon.maxDiscountAmount)}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                    Used: {coupon.usageCount} times
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-white/10 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <GlassButton
                    variant="secondary"
                    size="sm"
                    className="w-full justify-center"
                    onClick={() => handleCopyCode(coupon.code)}
                  >
                    {copiedCode === coupon.code ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 mr-1" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </GlassButton>

                  <GlassButton
                    variant="secondary"
                    size="sm"
                    className="w-full justify-center"
                    onClick={() => handleCopyLink(coupon.code)}
                  >
                    {copiedLink === coupon.code ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                        <span>Link Copied</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5 mr-1" />
                        <span>Share Link</span>
                      </>
                    )}
                  </GlassButton>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopySnippet(coupon)}
                  className="w-full py-2 px-3 rounded-lg border border-primary/20 bg-primary/10 hover:bg-primary/20 text-primary font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedSnippet === coupon.code ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Support Snippet Copied!</span>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Copy Support Chat Message</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
