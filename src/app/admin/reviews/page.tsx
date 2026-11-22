'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Star,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  EyeOff,
  RefreshCw,
  Search,
  Filter,
  Send,
  TicketPercent,
  Settings,
  MessageSquare,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Trash2,
  Check,
  Package,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassBadge } from '@/components/ui/glass-badge';
import { formatCurrency } from '@/lib/utils';
import { ReviewStatus, ReviewRewardSettingsConfig } from '@/lib/reviews/types';

export default function AdminReviewsPage() {
  const [activeTab, setActiveTab] = useState<'reviews' | 'invitations' | 'settings'>('reviews');
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [settings, setSettings] = useState<ReviewRewardSettingsConfig | null>(null);
  const [metrics, setMetrics] = useState({
    totalReviews: 0,
    pendingModeration: 0,
    averageRating: 0,
    rewardsIssued: 0,
    rewardsRedeemed: 0,
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [ratingFilter, setRatingFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load reviews & metrics
  const loadReviewsData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (ratingFilter !== 'ALL') params.set('rating', ratingFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/reviews/admin?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews || []);
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch (err: any) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load invitations
  const loadInvitations = async () => {
    try {
      const res = await fetch('/api/reviews/invitations');
      const data = await res.json();
      if (data.success) {
        setInvitations(data.invitations || []);
      }
    } catch (err) {
      console.error('Failed to load invitations:', err);
    }
  };

  // Load settings
  const loadSettings = async () => {
    try {
      const res = await fetch('/api/reviews/settings');
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  useEffect(() => {
    loadReviewsData();
    loadInvitations();
    loadSettings();
  }, [statusFilter, ratingFilter]);

  const handleModeration = async (reviewId: string, status: ReviewStatus) => {
    try {
      setActionLoading(reviewId);
      const res = await fetch('/api/reviews/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, status }),
      });
      const data = await res.json();
      if (data.success) {
        setNotice({ type: 'success', message: data.message });
        await loadReviewsData();
      } else {
        setNotice({ type: 'error', message: data.error || 'Failed to update review' });
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokeReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to hide this review and revoke its reward coupon?')) return;
    try {
      setActionLoading(reviewId);
      const res = await fetch(`/api/reviews/admin?reviewId=${reviewId}&revokeReward=true`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setNotice({ type: 'success', message: data.message });
        await loadReviewsData();
      } else {
        setNotice({ type: 'error', message: data.error || 'Failed to revoke review' });
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDispatchInvitations = async () => {
    try {
      setActionLoading('dispatch');
      const res = await fetch('/api/reviews/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dispatch_due' }),
      });
      const data = await res.json();
      if (data.success) {
        setNotice({ type: 'success', message: data.message });
        await loadInvitations();
      } else {
        setNotice({ type: 'error', message: data.error || 'Failed to dispatch invitations' });
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      setActionLoading(invitationId);
      const res = await fetch('/api/reviews/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resend', invitationId }),
      });
      const data = await res.json();
      if (data.success) {
        setNotice({ type: 'success', message: data.message });
        await loadInvitations();
      } else {
        setNotice({ type: 'error', message: data.error || 'Failed to resend invitation' });
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      setActionLoading('save_settings');
      const res = await fetch('/api/reviews/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setNotice({ type: 'success', message: data.message });
        setSettings(data.settings);
      } else {
        setNotice({ type: 'error', message: data.error || 'Failed to save settings' });
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#1d1d1f]">
              Product Reviews &amp; Rewards Desk
            </h1>
            <GlassBadge variant="default" className="bg-amber-500/10 text-amber-700 border-amber-200">
              Verified Purchases
            </GlassBadge>
          </div>
          <p className="text-xs text-[#86868b] mt-1">
            Moderate customer feedback, automate delivery follow-up invitations, and oversee personalized reward coupons.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <GlassButton
            variant="secondary"
            size="sm"
            onClick={() => {
              loadReviewsData();
              loadInvitations();
              loadSettings();
            }}
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </GlassButton>
          <GlassButton
            variant="primary"
            size="sm"
            onClick={handleDispatchInvitations}
            disabled={actionLoading === 'dispatch'}
          >
            <Send className="w-3.5 h-3.5 mr-1.5" />
            Dispatch Due Invites
          </GlassButton>
        </div>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div
          className={`p-3 rounded-2xl flex items-center justify-between text-xs animate-in fade-in ${
            notice.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{notice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-stone-400 hover:text-stone-600 ml-4"
          >
            ×
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <GlassCard className="p-4 bg-white/70">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Avg Store Rating</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-stone-900">
            {metrics.averageRating > 0 ? metrics.averageRating : '—'}
            <span className="text-xs text-stone-400 font-normal ml-1">/ 5.0</span>
          </div>
          <p className="text-[10px] text-stone-500 mt-1">Across verified buyers</p>
        </GlassCard>

        <GlassCard className="p-4 bg-white/70">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Reviews</span>
            <MessageSquare className="w-4 h-4 text-[#0071e3]" />
          </div>
          <div className="text-2xl font-bold font-mono text-stone-900">{metrics.totalReviews}</div>
          <p className="text-[10px] text-stone-500 mt-1">100% verified deliveries</p>
        </GlassCard>

        <GlassCard className="p-4 bg-white/70">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Pending Moderation</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600">{metrics.pendingModeration}</div>
          <p className="text-[10px] text-stone-500 mt-1">Awaiting approval</p>
        </GlassCard>

        <GlassCard className="p-4 bg-white/70">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Reward Coupons</span>
            <TicketPercent className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-600">{metrics.rewardsIssued}</div>
          <p className="text-[10px] text-stone-500 mt-1">Personalized codes generated</p>
        </GlassCard>

        <GlassCard className="p-4 bg-white/70">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Coupons Claimed</span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600">{metrics.rewardsRedeemed}</div>
          <p className="text-[10px] text-stone-500 mt-1">Redeemed on repeat orders</p>
        </GlassCard>
      </div>

      {/* Main Tab Navigation */}
      <div className="border-b border-stone-200 flex items-center gap-6 text-xs font-semibold text-[#86868b]">
        <button
          type="button"
          onClick={() => setActiveTab('reviews')}
          className={`pb-3 transition-colors relative cursor-pointer ${
            activeTab === 'reviews' ? 'text-[#0071e3] font-bold' : 'hover:text-[#1d1d1f]'
          }`}
        >
          Customer Reviews ({metrics.totalReviews})
          {activeTab === 'reviews' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0071e3] rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('invitations')}
          className={`pb-3 transition-colors relative cursor-pointer ${
            activeTab === 'invitations' ? 'text-[#0071e3] font-bold' : 'hover:text-[#1d1d1f]'
          }`}
        >
          Review Invitations ({invitations.length})
          {activeTab === 'invitations' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0071e3] rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`pb-3 transition-colors relative cursor-pointer ${
            activeTab === 'settings' ? 'text-[#0071e3] font-bold' : 'hover:text-[#1d1d1f]'
          }`}
        >
          Reward &amp; Policy Settings
          {activeTab === 'settings' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0071e3] rounded-full" />
          )}
        </button>
      </div>

      {/* Tab 1: Reviews Moderation */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <GlassCard className="p-3.5 bg-white/80">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search buyer, email, review text..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadReviewsData()}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-[#0071e3]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                {/* Status Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-stone-500 font-medium">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-xs border border-stone-200 rounded-lg px-2.5 py-1 bg-white focus:outline-none"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="APPROVED">Approved</option>
                    <option value="PENDING_MODERATION">Pending</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="HIDDEN">Hidden</option>
                  </select>
                </div>

                {/* Rating Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-stone-500 font-medium">Rating:</span>
                  <select
                    value={ratingFilter}
                    onChange={(e) => setRatingFilter(e.target.value)}
                    className="text-xs border border-stone-200 rounded-lg px-2.5 py-1 bg-white focus:outline-none"
                  >
                    <option value="ALL">All Stars</option>
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                  </select>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Reviews List */}
          {loading ? (
            <div className="p-12 text-center text-stone-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0071e3]" />
              Loading verified reviews...
            </div>
          ) : reviews.length === 0 ? (
            <GlassCard className="p-12 text-center text-stone-500">
              <MessageSquare className="w-8 h-8 text-stone-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-stone-900">No reviews found</h3>
              <p className="text-xs text-stone-500 mt-1">
                {statusFilter !== 'ALL' || ratingFilter !== 'ALL' || searchQuery
                  ? 'Try clearing your filters to see more reviews.'
                  : 'Customer reviews will appear here once delivered buyers review their solid glass jars.'}
              </p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {reviews.map((rev) => (
                <GlassCard key={rev.id} className="p-5 bg-white/90 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 text-amber-700" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-stone-900">
                          {rev.product?.name || rev.orderItem?.productName || 'Pure Forest Honey'}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-stone-500 mt-0.5">
                          <span>By <strong className="text-stone-800">{rev.customerName || 'Verified Buyer'}</strong> ({rev.customerEmail})</span>
                          <span>•</span>
                          <span>Order #{rev.orderItem?.order?.orderNumber || 'N/A'}</span>
                          <span>•</span>
                          <span>{new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                          rev.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : rev.status === 'PENDING_MODERATION'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : rev.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-stone-100 text-stone-600 border-stone-200'
                        }`}
                      >
                        {rev.status}
                      </span>

                      {rev.isVerifiedPurchase && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          Verified Purchase
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rating & Review Text */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= rev.rating
                              ? 'text-amber-500 fill-amber-500'
                              : 'text-stone-300'
                          }`}
                        />
                      ))}
                      <span className="text-xs font-bold text-stone-800 ml-1 font-mono">
                        {rev.rating}.0
                      </span>
                    </div>

                    <p className="text-xs text-stone-700 leading-relaxed bg-stone-50/80 p-3 rounded-xl border border-stone-100">
                      {rev.reviewText || <span className="italic text-stone-400">No written comment provided.</span>}
                    </p>
                  </div>

                  {/* Reward Coupon Info */}
                  {rev.reward && (
                    <div className="p-2.5 rounded-xl bg-purple-50/80 border border-purple-200/60 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <TicketPercent className="w-4 h-4 text-purple-700 shrink-0" />
                        <div>
                          <span className="font-bold text-purple-900 font-mono tracking-wider mr-2">
                            {rev.reward.couponCode}
                          </span>
                          <span className="text-[11px] text-purple-700">
                            ({rev.reward.discountPercentage}% OFF Personalized Reward)
                          </span>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          rev.reward.status === 'ACTIVE'
                            ? 'bg-purple-100 text-purple-800'
                            : rev.reward.status === 'REDEEMED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {rev.reward.status}
                      </span>
                    </div>
                  )}

                  {/* Moderation Controls */}
                  <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                    <span className="text-[10px] text-stone-400">
                      ID: {rev.id}
                      {rev.moderatedBy && ` • Moderated by ${rev.moderatedBy}`}
                    </span>

                    <div className="flex items-center gap-2">
                      {rev.status !== 'APPROVED' && (
                        <button
                          type="button"
                          onClick={() => handleModeration(rev.id, 'APPROVED')}
                          disabled={actionLoading === rev.id}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                          Approve
                        </button>
                      )}

                      {rev.status !== 'REJECTED' && (
                        <button
                          type="button"
                          onClick={() => handleModeration(rev.id, 'REJECTED')}
                          disabled={actionLoading === rev.id}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <XCircle className="w-3 h-3" />
                          Reject
                        </button>
                      )}

                      {rev.status !== 'HIDDEN' && (
                        <button
                          type="button"
                          onClick={() => handleModeration(rev.id, 'HIDDEN')}
                          disabled={actionLoading === rev.id}
                          className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <EyeOff className="w-3 h-3" />
                          Hide
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRevokeReview(rev.id)}
                        disabled={actionLoading === rev.id}
                        className="px-2.5 py-1 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Hide review & revoke reward coupon"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Review Invitations */}
      {activeTab === 'invitations' && (
        <div className="space-y-4">
          <GlassCard className="p-4 bg-white/90">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Automated Delivery Follow-Up Invitations
                </h3>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Invitations are automatically queued upon Delhivery order delivery (default delay: 2 days).
                </p>
              </div>

              <GlassButton
                variant="primary"
                size="sm"
                onClick={handleDispatchInvitations}
                disabled={actionLoading === 'dispatch'}
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Trigger Dispatch Cron Now
              </GlassButton>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-400 font-semibold text-[10px] uppercase tracking-wider">
                    <th className="pb-2">Order #</th>
                    <th className="pb-2">Customer</th>
                    <th className="pb-2">Delivery Date</th>
                    <th className="pb-2">Scheduled Send</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {invitations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-stone-400">
                        No invitations recorded yet.
                      </td>
                    </tr>
                  ) : (
                    invitations.map((inv) => (
                      <tr key={inv.id} className="hover:bg-stone-50/50">
                        <td className="py-3 font-mono font-bold text-stone-900">
                          #{inv.order?.orderNumber || 'N/A'}
                        </td>
                        <td className="py-3">
                          <span className="font-semibold text-stone-900 block">{inv.customerName}</span>
                          <span className="text-[10px] text-stone-500">{inv.customerEmail}</span>
                        </td>
                        <td className="py-3 text-stone-600">
                          {inv.createdAt
                            ? new Date(inv.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                              })
                            : '—'}
                        </td>
                        <td className="py-3 text-stone-600">
                          {inv.scheduledFor
                            ? new Date(inv.scheduledFor).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                              })
                            : '—'}
                        </td>
                        <td className="py-3">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                              inv.status === 'SENT'
                                ? 'bg-sky-50 text-sky-800 border-sky-200'
                                : inv.status === 'SUBMITTED'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : inv.status === 'SCHEDULED'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-stone-100 text-stone-600 border-stone-200'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleResendInvitation(inv.id)}
                            disabled={actionLoading === inv.id}
                            className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors cursor-pointer"
                          >
                            Resend Email
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Tab 3: Reward & Policy Settings */}
      {activeTab === 'settings' && settings && (
        <form onSubmit={handleSaveSettings} className="space-y-4 max-w-3xl">
          <GlassCard className="p-6 bg-white/95 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                Personalized Review Reward Engine Configuration
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Configure discount rates, coupon lifespans, and automated email follow-up schedules.
              </p>
            </div>

            {/* Enable Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
              <div>
                <span className="font-bold text-xs text-stone-900 block">
                  Enable Review Reward Coupons
                </span>
                <span className="text-[11px] text-stone-500">
                  When enabled, customers receive an automated personalized discount code upon review submission.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.isEnabled}
                onChange={(e) => setSettings({ ...settings, isEnabled: e.target.checked })}
                className="w-4 h-4 text-[#0071e3] rounded cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Default Discount Percentage */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-900">
                  Default Discount Percentage (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={settings.defaultDiscountPercent}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      defaultDiscountPercent: parseInt(e.target.value, 10) || 5,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-mono font-bold focus:outline-none focus:border-[#0071e3]"
                />
                <span className="text-[10px] text-stone-500">
                  Standard reward granted on any honest feedback (default: 5%).
                </span>
              </div>

              {/* Coupon Expiry Days */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-900">
                  Coupon Validity Period (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={settings.expiryDays}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      expiryDays: parseInt(e.target.value, 10) || 30,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-mono font-bold focus:outline-none focus:border-[#0071e3]"
                />
                <span className="text-[10px] text-stone-500">
                  Number of days before the customer's personalized code expires.
                </span>
              </div>

              {/* Min Order Value */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-900">
                  Minimum Order Value (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={Math.round(settings.minOrderValuePaise / 100)}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      minOrderValuePaise: (parseInt(e.target.value, 10) || 0) * 100,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-mono font-bold focus:outline-none focus:border-[#0071e3]"
                />
                <span className="text-[10px] text-stone-500">
                  Minimum basket size required to redeem the discount.
                </span>
              </div>

              {/* Invitation Delay Days */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-900">
                  Follow-up Invitation Delay (Days)
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={settings.delayDaysAfterDelivery}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      delayDaysAfterDelivery: parseInt(e.target.value, 10) || 2,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-mono font-bold focus:outline-none focus:border-[#0071e3]"
                />
                <span className="text-[10px] text-stone-500">
                  Days to wait after order is delivered before sending review invitation.
                </span>
              </div>
            </div>

            {/* Advanced Checkboxes */}
            <div className="space-y-3 pt-4 border-t border-stone-100 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoGenerateCoupon}
                  onChange={(e) =>
                    setSettings({ ...settings, autoGenerateCoupon: e.target.checked })
                  }
                  className="w-4 h-4 text-[#0071e3] rounded"
                />
                <span className="font-semibold text-stone-800">
                  Auto-generate and email reward coupon instantly upon review submission
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.requireAdminApproval}
                  onChange={(e) =>
                    setSettings({ ...settings, requireAdminApproval: e.target.checked })
                  }
                  className="w-4 h-4 text-[#0071e3] rounded"
                />
                <span className="font-semibold text-stone-800">
                  Require manual admin approval before public storefront display
                </span>
              </label>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-stone-100 flex justify-end">
              <GlassButton
                variant="primary"
                type="submit"
                disabled={actionLoading === 'save_settings'}
              >
                {actionLoading === 'save_settings' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Saving Settings...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                    Save Financial &amp; Policy Settings
                  </>
                )}
              </GlassButton>
            </div>
          </GlassCard>
        </form>
      )}
    </div>
  );
}
