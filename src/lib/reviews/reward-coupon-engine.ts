import crypto from 'crypto';
import { prisma, isDatabaseOnline } from '@/lib/db';
import { addLiveCoupon, getLiveCouponByCode } from '@/lib/coupons/store';
import { DiscountCoupon as TypesDiscountCoupon } from '@/types';
import { CustomerRewardDto } from './types';

/**
 * Generates an exclusive, personalized review reward coupon code.
 * Format: GANESH<PERCENT>-<RANDOM4> e.g. GANESH5-E8B2
 */
export function generateRewardCouponCode(discountPercent: number, prefix: string = 'GANESH'): string {
  const cleanPercent = Math.max(1, Math.min(50, Math.round(discountPercent)));
  const randomSuffix = crypto.randomBytes(3).toString('hex').slice(0, 4).toUpperCase();
  return `${prefix.toUpperCase().trim()}${cleanPercent}-${randomSuffix}`;
}

export interface IssueRewardCouponParams {
  customerEmail: string;
  customerId?: string;
  customerName?: string;
  discountPercent: number;
  expiryDays?: number;
  minOrderValuePaise?: number;
  maxDiscountPaise?: number | null;
  productName?: string;
}

export interface IssuedRewardCouponResult {
  couponId: string;
  couponCode: string;
  discountPercent: number;
  expiresAt: Date;
  minOrderAmountPaise: number;
  maxDiscountPaise: number | null;
}

/**
 * Creates and registers a customer-bound review reward coupon.
 * Idempotently registered in Prisma DB and in-memory fallback.
 */
export async function issuePersonalizedRewardCoupon(
  params: IssueRewardCouponParams
): Promise<IssuedRewardCouponResult> {
  const {
    customerEmail,
    customerId,
    customerName,
    discountPercent,
    expiryDays = 30,
    minOrderValuePaise = 0,
    maxDiscountPaise = null,
    productName,
  } = params;

  const normalizedEmail = customerEmail.trim().toLowerCase();
  const code = generateRewardCouponCode(discountPercent);
  const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
  const description = `Verified Review Reward: ${discountPercent}% OFF for ${customerName || normalizedEmail}${
    productName ? ` (${productName})` : ''
  }`;

  let couponId = `coupon-reward-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const dbOnline = await isDatabaseOnline();
  if (dbOnline) {
    try {
      const dbCoupon = await prisma.discountCoupon.create({
        data: {
          code,
          description,
          discountType: 'PERCENTAGE',
          value: discountPercent,
          minOrderAmount: minOrderValuePaise,
          maxDiscountAmount: maxDiscountPaise,
          expiresAt,
          usageLimit: 1, // Single-use personalized coupon
          usedCount: 0,
          isPublic: false,
          isActive: true,
          customerEmail: normalizedEmail,
          customerId: customerId || null,
          isReviewReward: true,
          assignedManagerIds: [],
        },
      });
      couponId = dbCoupon.id;
    } catch (err) {
      console.warn('Failed to insert reward coupon into DB, using memory fallback:', err);
    }
  }

  // Also register in memory store for instant zero-latency checkout lookup
  const memoryCoupon: TypesDiscountCoupon = {
    id: couponId,
    code,
    description,
    discountType: 'PERCENTAGE',
    value: discountPercent,
    minOrderAmount: minOrderValuePaise,
    maxDiscountAmount: maxDiscountPaise || undefined,
    expiresAt: expiresAt.toISOString(),
    usageLimit: 1,
    usageCount: 0,
    isPublic: false,
    isActive: true,
    assignedManagerIds: [],
    assignedManagerNames: ['Review Rewards Engine'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // Custom properties
    customerEmail: normalizedEmail,
    customerId,
    isReviewReward: true,
  } as any;

  addLiveCoupon(memoryCoupon);

  return {
    couponId,
    couponCode: code,
    discountPercent,
    expiresAt,
    minOrderAmountPaise: minOrderValuePaise,
    maxDiscountPaise,
  };
}

/**
 * Validates whether a coupon code is a review reward coupon, and if so,
 * strictly enforces that the calling customer's email matches the coupon owner.
 */
export async function validateReviewRewardCouponOwnership(
  code: string,
  callerEmail?: string | null,
  callerId?: string | null
): Promise<{ allowed: boolean; valid: boolean; reason?: string; error?: string; coupon?: any }> {
  const normalizedCode = code.trim().toUpperCase();
  const normalizedEmail = callerEmail ? callerEmail.trim().toLowerCase() : null;

  let coupon: any = null;
  const dbOnline = await isDatabaseOnline();
  if (dbOnline) {
    try {
      coupon = await prisma.discountCoupon.findUnique({
        where: { code: normalizedCode },
      });
    } catch {}
  }

  if (!coupon) {
    coupon = getLiveCouponByCode(normalizedCode);
  }

  if (!coupon) {
    return { allowed: false, valid: false, reason: 'Coupon code not found.', error: 'Coupon code not found.' };
  }

  // If this is a personalized review reward coupon, customer email MUST match
  if (coupon.isReviewReward || coupon.customerEmail) {
    const ownerEmail = coupon.customerEmail?.trim().toLowerCase();

    if (!normalizedEmail) {
      const msg = 'This exclusive review reward requires you to enter the verified email used when submitting your review.';
      return {
        allowed: false,
        valid: false,
        reason: msg,
        error: msg,
        coupon,
      };
    }

    if (ownerEmail && ownerEmail !== normalizedEmail) {
      const msg = `This exclusive reward coupon is registered exclusively to ${ownerEmail}.`;
      return {
        allowed: false,
        valid: false,
        reason: msg,
        error: msg,
        coupon,
      };
    }

    if (coupon.customerId && callerId && coupon.customerId !== callerId) {
      const msg = 'This reward coupon is exclusively linked to another customer account.';
      return {
        allowed: false,
        valid: false,
        reason: msg,
        error: msg,
        coupon,
      };
    }
  }

  // Check usage limit
  if (coupon.usageLimit && (coupon.usedCount || coupon.usageCount || 0) >= coupon.usageLimit) {
    const msg = `Reward coupon "${coupon.code}" has already been redeemed.`;
    return {
      allowed: false,
      valid: false,
      reason: msg,
      error: msg,
      coupon,
    };
  }

  // Check expiration
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    const msg = `Reward coupon "${coupon.code}" expired on ${new Date(coupon.expiresAt).toLocaleDateString('en-IN')}.`;
    return {
      allowed: false,
      valid: false,
      reason: msg,
      error: msg,
      coupon,
    };
  }

  return { allowed: true, valid: true, coupon };
}

/**
 * Fetches all available, unexpired review reward coupons for Checkout Auto-Discovery.
 */
export async function getCustomerAvailableReviewRewards(
  customerEmail: string,
  customerId?: string
): Promise<CustomerRewardDto[]> {
  const normalizedEmail = customerEmail.trim().toLowerCase();
  const now = new Date();

  const dbOnline = await isDatabaseOnline();
  if (dbOnline) {
    try {
      const rewards = await prisma.reviewReward.findMany({
        where: {
          customerEmail: { equals: normalizedEmail, mode: 'insensitive' },
          status: 'ACTIVE',
          coupon: {
            isActive: true,
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: now } },
            ],
            usedCount: 0,
          },
        },
        include: {
          coupon: true,
          review: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return rewards.map((r) => ({
        id: r.id,
        couponId: r.couponId,
        couponCode: r.coupon.code,
        discountPercent: r.discountPercent,
        reviewId: r.reviewId,
        productName: r.review?.product?.name || 'Ganesh Honey Harvest',
        productSlug: r.review?.product?.slug || 'honey',
        customerEmail: r.customerEmail,
        status: (r.status as any) || 'ACTIVE',
        expiresAt: r.coupon.expiresAt ? r.coupon.expiresAt.toISOString() : null,
        minOrderAmountPaise: r.coupon.minOrderAmount,
        maxDiscountPaise: r.coupon.maxDiscountAmount,
        usedCount: r.coupon.usedCount,
        createdAt: r.createdAt.toISOString(),
      }));
    } catch (err) {
      console.warn('Failed to query review rewards from DB:', err);
    }
  }

  return [];
}

export async function revokeReviewRewardCoupon(
  couponCode: string,
  reason: string,
  actor: string
): Promise<{ success: boolean; message: string }> {
  const normalized = couponCode.trim().toUpperCase();
  const dbOnline = await isDatabaseOnline();
  if (dbOnline) {
    try {
      await prisma.discountCoupon.updateMany({
        where: { code: normalized },
        data: { isActive: false },
      });
      await prisma.reviewReward.updateMany({
        where: { coupon: { code: normalized } },
        data: { status: 'REVOKED', revokedReason: reason },
      });
    } catch (err) {
      console.warn('[Revoke DB Error]', err);
    }
  }

  // Also update live memory store
  const all = (await import('@/lib/coupons/store')).getLiveCoupons();
  const match = all.find((c) => c.code === normalized);
  if (match) {
    match.isActive = false;
  }

  return { success: true, message: `Coupon ${normalized} has been revoked.` };
}
