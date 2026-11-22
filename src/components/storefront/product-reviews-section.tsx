'use client';

import React, { useState, useEffect } from 'react';
import {
  Star,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  TicketPercent,
  Sparkles,
  Copy,
  Check,
  MessageSquare,
  Lock,
  ArrowRight,
  RefreshCw,
  X,
} from 'lucide-react';
import { ProductReviewDto, ProductRatingSummary } from '@/lib/reviews/types';
import { formatCurrency } from '@/lib/utils';

interface ProductReviewsSectionProps {
  productId: string;
  productName: string;
  productSlug?: string;
  directToken?: string;
}

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
  productId,
  productName,
  productSlug,
  directToken,
}) => {
  const [reviews, setReviews] = useState<ProductReviewDto[]>([]);
  const [summary, setSummary] = useState<ProductRatingSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Review Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rewardCoupon, setRewardCoupon] = useState<{
    code: string;
    discountPercentage: number;
    validityDays: number;
  } | null>(null);
  const [copiedCoupon, setCopiedCoupon] = useState(false);

  // Load Reviews & Summary
  const loadReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/reviews?productId=${productId}`);
      const data = await res.json();
      if (data.reviews) setReviews(data.reviews);
      if (data.summary) setSummary(data.summary);
    } catch (err) {
      console.error('Failed to load product reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      loadReviews();
    }
    // Auto open modal if direct review token is present in URL
    if (directToken) {
      setIsModalOpen(true);
    }
  }, [productId, directToken]);

  // Pre-fill user profile if logged in
  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data?.authenticated && data?.user) {
          if (data.user.email) setCustomerEmail(data.user.email);
          if (data.user.name) setCustomerName(data.user.name);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (rating < 1 || rating > 5) {
      setErrorMsg('Please select a star rating from 1 to 5.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          rating,
          reviewText,
          customerEmail: customerEmail.trim() || undefined,
          customerName: customerName.trim() || undefined,
          directToken: directToken || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(
          data.error ||
            'Only verified purchasers who have received this product can review. Please ensure you enter the email address used when placing your order.'
        );
        return;
      }

      if (data.rewardCoupon) {
        setRewardCoupon({
          code: data.rewardCoupon.code,
          discountPercentage: data.rewardCoupon.discountPercentage,
          validityDays: data.rewardCoupon.validityDays || 30,
        });
      }
      await loadReviews();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCoupon = () => {
    if (rewardCoupon?.code) {
      navigator.clipboard.writeText(rewardCoupon.code);
      setCopiedCoupon(true);
      setTimeout(() => setCopiedCoupon(false), 2000);
    }
  };

  const starLabels: { [key: number]: string } = {
    1: 'Poor — Dissatisfied',
    2: 'Fair — Below expectations',
    3: 'Good — Average quality',
    4: 'Very Good — Highly enjoyable',
    5: 'Excellent — Superior raw honey',
  };

  return (
    <div className="bg-[#f5f5f7] rounded-3xl border border-[#d2d2d7]/70 p-6 sm:p-8 space-y-8 animate-in fade-in">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#d2d2d7]/60">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-[#1d1d1f]">Verified Customer Reviews</h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              100% Verified Deliveries
            </span>
          </div>
          <p className="text-xs text-[#86868b] mt-1">
            Real feedback from confirmed buyers who ordered and tasted this artisanal harvest.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setRewardCoupon(null);
            setErrorMsg(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#1d1d1f] hover:bg-black text-white text-xs font-semibold shadow-sm transition-all active:scale-98 cursor-pointer shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Write a Review &amp; Get 5% OFF</span>
        </button>
      </div>

      {/* Ratings Summary Histogram */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center p-6 bg-white rounded-2xl border border-[#d2d2d7]/60">
          {/* Big Score */}
          <div className="md:col-span-4 text-center md:border-r md:border-[#d2d2d7]/60 pr-0 md:pr-6 space-y-1">
            <div className="text-4xl font-extrabold text-[#1d1d1f] font-mono">
              {summary.totalReviews > 0 ? summary.averageRating.toFixed(1) : '5.0'}
            </div>
            <div className="flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${
                    s <= Math.round(summary.averageRating || 5)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-stone-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-[#86868b] block font-medium">
              Based on {summary.totalReviews} verified {summary.totalReviews === 1 ? 'buyer' : 'buyers'}
            </span>
          </div>

          {/* Star Distribution Bars */}
          <div className="md:col-span-8 space-y-2 pl-0 md:pl-2">
            {[5, 4, 3, 2, 1].map((s) => {
              const count = summary.ratingDistribution[s as keyof typeof summary.ratingDistribution] || 0;
              const pct = summary.totalReviews > 0 ? Math.round((count / summary.totalReviews) * 100) : 0;
              return (
                <div key={s} className="flex items-center gap-3 text-xs">
                  <span className="w-12 text-[#1d1d1f] font-semibold font-mono flex items-center gap-1">
                    {s} <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-stone-100 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-[11px] text-[#86868b] font-mono">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reward Guarantee Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300/60 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <TicketPercent className="w-5 h-5 text-amber-700 shrink-0" />
          <div className="text-stone-800">
            <span className="font-bold text-[#1d1d1f] block">
              Honest Feedback Reward Policy
            </span>
            <span className="text-[11px] text-[#6e6e73]">
              Every verified customer receives an instant 5% discount coupon for sharing honest feedback. Positive or critical, we value authentic experiences!
            </span>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-stone-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0071e3]" />
          Loading reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div className="p-8 text-center text-[#86868b] bg-white rounded-2xl border border-[#d2d2d7]/60 space-y-2">
          <MessageSquare className="w-8 h-8 text-stone-300 mx-auto" />
          <h4 className="text-sm font-semibold text-[#1d1d1f]">No customer reviews yet</h4>
          <p className="text-xs text-[#86868b] max-w-sm mx-auto">
            Be the first verified customer to share your thoughts and unlock a 5% OFF reward on your next jar!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-5 bg-white rounded-2xl border border-[#d2d2d7]/60 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-amber-100/70 border border-amber-300 text-amber-900 font-bold text-xs flex items-center justify-center">
                    {(rev.customerName || 'V')[0].toUpperCase()}
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-[#1d1d1f] block">
                      {rev.customerName || 'Verified Honey Enthusiast'}
                    </span>
                    <span className="text-[10px] text-[#86868b]">
                      {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {rev.isVerifiedPurchase && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Verified Purchase
                    </span>
                  )}
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-xs text-[#1d1d1f] leading-relaxed pt-1">
                {rev.comment || rev.reviewText}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative border border-stone-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>

            {rewardCoupon ? (
              // Success State: Display Reward Coupon
              <div className="text-center space-y-4 py-2 animate-in zoom-in-95">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                  <Sparkles className="w-7 h-7" />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-stone-900">
                    Thank You for Your Review!
                  </h3>
                  <p className="text-xs text-stone-600 mt-1">
                    Your honest feedback helps our apiary community. Here is your personalized reward coupon:
                  </p>
                </div>

                {/* Coupon Code Card */}
                <div className="p-4 rounded-2xl bg-amber-50 border-2 border-dashed border-amber-300 space-y-2">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest block">
                    {rewardCoupon.discountPercentage}% OFF Personalized Coupon
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-mono text-xl font-black text-stone-950 tracking-wider">
                      {rewardCoupon.code}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCoupon}
                      className="p-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-50 transition-colors cursor-pointer"
                      title="Copy Coupon"
                    >
                      {copiedCoupon ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-stone-600" />
                      )}
                    </button>
                  </div>
                  <span className="text-[10px] text-stone-500 block">
                    Valid for {rewardCoupon.validityDays} days on any future solid glass honey order.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full py-3 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold cursor-pointer shadow-sm transition-all"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              // Form State
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-stone-900">
                    Review {productName}
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Share your honest taste experience. Verified reviews receive an instant 5% OFF coupon!
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Star Rating Selector */}
                <div className="space-y-1.5 text-center py-2 bg-stone-50 rounded-2xl border border-stone-200/80">
                  <span className="text-[11px] font-semibold text-stone-600 block">
                    Rate Your Experience
                  </span>
                  <div className="flex items-center justify-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onMouseEnter={() => setHoverRating(s)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(s)}
                        className="p-1 transition-transform hover:scale-115 cursor-pointer"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            s <= (hoverRating || rating)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-stone-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-stone-800 block">
                    {starLabels[hoverRating || rating]}
                  </span>
                </div>

                {/* Review Comment */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-800">
                    Your Review Comment
                  </label>
                  <textarea
                    rows={4}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Tell us about the aroma, texture, crystallization, and flavour of this honey..."
                    className="w-full p-3 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-[#0071e3] resize-none"
                    required
                  />
                </div>

                {/* Customer Verification Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-stone-800">Your Name</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-[#0071e3]"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-stone-800">
                      Order Email Address
                    </label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="email used during checkout"
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-[#0071e3]"
                      required
                    />
                  </div>
                </div>

                <div className="text-[10px] text-stone-500 flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-stone-400 shrink-0" />
                  <span>
                    Purchase verification checks delivered orders for this email. Reward coupons are cryptographically bound to this email.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold cursor-pointer shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying Purchase &amp; Generating Reward...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Review &amp; Unlock 5% Reward</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
