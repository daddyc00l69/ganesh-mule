'use client';

import React, { useState, useEffect } from 'react';
import {
  Star,
  ShieldCheck,
  RefreshCw,
  Search,
  MessageSquare,
  Package,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassBadge } from '@/components/ui/glass-badge';

export default function ManagerReviewsPage() {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    totalReviews: 0,
    averageRating: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');

  const loadReviewsData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/reviews/admin');
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews || []);
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviewsData();
  }, []);

  const filteredReviews = reviews.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.customerName?.toLowerCase().includes(q) ||
      r.product?.name?.toLowerCase().includes(q) ||
      r.reviewText?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#1d1d1f]">
              Customer Reviews &amp; Quality Monitor
            </h1>
            <GlassBadge variant="default" className="bg-amber-500/10 text-amber-700 border-amber-200">
              Operations Desk
            </GlassBadge>
          </div>
          <p className="text-xs text-[#86868b] mt-1">
            Monitor real verified-buyer honey feedback, jar ratings, and customer satisfaction across all harvest batches.
          </p>
        </div>

        <GlassButton variant="secondary" size="sm" onClick={loadReviewsData} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </GlassButton>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <GlassCard className="p-4 bg-white/70">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Average Rating</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-stone-900">
            {metrics.averageRating > 0 ? metrics.averageRating : '—'}
            <span className="text-xs text-stone-400 font-normal ml-1">/ 5.0</span>
          </div>
          <p className="text-[10px] text-stone-500 mt-1">Overall quality index</p>
        </GlassCard>

        <GlassCard className="p-4 bg-white/70">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Verified Reviews</span>
            <MessageSquare className="w-4 h-4 text-[#0071e3]" />
          </div>
          <div className="text-2xl font-bold font-mono text-stone-900">{metrics.totalReviews}</div>
          <p className="text-[10px] text-stone-500 mt-1">Confirmed delivered jars</p>
        </GlassCard>
      </div>

      {/* Search Bar */}
      <GlassCard className="p-3 bg-white/80">
        <div className="relative max-w-sm">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by product, customer, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-[#0071e3]"
          />
        </div>
      </GlassCard>

      {/* Reviews List */}
      {loading ? (
        <div className="p-12 text-center text-stone-400 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0071e3]" />
          Loading customer feedback...
        </div>
      ) : filteredReviews.length === 0 ? (
        <GlassCard className="p-12 text-center text-stone-500">
          <MessageSquare className="w-8 h-8 text-stone-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-stone-900">No reviews found</h3>
          <p className="text-xs text-stone-500 mt-1">Verified customer reviews will appear here.</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {filteredReviews.map((rev) => (
            <GlassCard key={rev.id} className="p-4 bg-white/90 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/60 flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4 text-amber-700" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-900">
                      {rev.product?.name || rev.orderItem?.productName}
                    </h4>
                    <span className="text-[10px] text-stone-500">
                      {rev.customerName || 'Verified Customer'} • {new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-amber-500">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${s <= rev.rating ? 'fill-amber-500' : 'text-stone-300'}`}
                    />
                  ))}
                  <span className="text-xs font-bold font-mono text-stone-800 ml-1">
                    {rev.rating}.0
                  </span>
                </div>
              </div>

              <p className="text-xs text-stone-700 bg-stone-50/70 p-2.5 rounded-xl border border-stone-100">
                {rev.reviewText || <span className="italic text-stone-400">No written comment.</span>}
              </p>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
