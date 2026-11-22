import { prisma, isDatabaseOnline } from '@/lib/db';
import { getReviewRewardSettings } from './settings-store';
import {
  issuePersonalizedRewardCoupon,
  IssuedRewardCouponResult,
} from './reward-coupon-engine';
import { sendEmail } from '@/lib/email/resend';
import {
  ProductReviewDto,
  ReviewItemDto,
  CustomerRewardDto,
  ProductRatingSummary,
} from './types';

export interface SubmitReviewParams {
  orderItemId: string;
  rating: number; // 1-5
  title?: string;
  comment: string;
  customerName: string;
  customerEmail: string;
  userId?: string;
  invitationToken?: string;
}

export interface SubmitReviewResult {
  review: ProductReviewDto;
  reward?: {
    couponCode: string;
    discountPercent: number;
    expiresAt: string;
  };
}

/**
 * Validates whether an order item is eligible to be reviewed.
 * Requirements:
 * 1. Order status must be DELIVERED.
 * 2. Order customer email or user ID must match.
 * 3. Item must not have been reviewed already.
 */
export async function getEligibleUnreviewedItems(
  customerEmail: string,
  customerId?: string
): Promise<ReviewItemDto[]> {
  const normalizedEmail = customerEmail.trim().toLowerCase();

  const dbOnline = await isDatabaseOnline();
  if (!dbOnline) return [];

  try {
    const deliveredItems = await prisma.orderItem.findMany({
      where: {
        order: {
          orderStatus: 'DELIVERED',
          OR: [
            { customerEmail: { equals: normalizedEmail, mode: 'insensitive' } },
            ...(customerId ? [{ userId: customerId }] : []),
          ],
        },
        review: null, // Strictly items not yet reviewed
      },
      include: {
        order: true,
        product: {
          include: {
            images: {
              take: 1,
              orderBy: { position: 'asc' },
            },
          },
        },
      },
      orderBy: { order: { createdAt: 'desc' } },
    });

    return deliveredItems.map((item) => ({
      orderItemId: item.id,
      orderId: item.orderId,
      orderNumber: item.order.orderNumber,
      productId: item.productId,
      productName: item.productName || item.product.name,
      productSlug: item.product.slug,
      productImage: item.product.images[0]?.url,
      weight: item.weight || undefined,
      pricePaise: item.price,
      deliveredAt: item.order.updatedAt.toISOString(),
    }));
  } catch (err) {
    console.warn('Failed to query unreviewed items:', err);
    return [];
  }
}

/**
 * Submits a verified-purchase product review.
 * Enforces:
 * - 1-5 star bounds
 * - Non-empty review text
 * - Purchase verification
 * - Duplicate review prevention on orderItemId
 * - Review reward generation according to configured policy
 */
export async function submitProductReview(
  params: SubmitReviewParams
): Promise<SubmitReviewResult> {
  const {
    orderItemId,
    rating,
    title,
    comment,
    customerName,
    customerEmail,
    userId,
    invitationToken,
  } = params;

  const normalizedEmail = customerEmail.trim().toLowerCase();
  const cleanRating = Math.max(1, Math.min(5, Math.round(rating)));

  if (!comment || comment.trim().length < 5) {
    throw new Error('Please share at least a few words (minimum 5 characters) about your experience.');
  }

  const dbOnline = await isDatabaseOnline();
  if (!dbOnline) {
    throw new Error('Database is offline. Unable to record review.');
  }

  // 1. Check order item and verification
  const orderItem = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    include: {
      order: true,
      product: true,
      review: true,
    },
  });

  if (!orderItem) {
    throw new Error('Order item not found.');
  }

  // 2. Prevent duplicate reviews
  if (orderItem.review) {
    throw new Error('You have already submitted a review for this purchased product item.');
  }

  // 3. Verify delivered status and customer identity
  const isDelivered = orderItem.order.orderStatus === 'DELIVERED';
  const emailMatches = orderItem.order.customerEmail.trim().toLowerCase() === normalizedEmail;
  const userMatches = userId && orderItem.order.userId === userId;

  if (!isDelivered) {
    throw new Error('Reviews can only be submitted after your order is confirmed delivered.');
  }

  if (!emailMatches && !userMatches) {
    throw new Error('Verification failed: Only the customer who purchased this item can review it.');
  }

  // 4. Load Review Reward Settings
  const settings = await getReviewRewardSettings();
  const initialStatus = settings.requireAdminApproval ? 'PENDING' : 'APPROVED';

  // 5. Database transaction for atomic consistency
  const result = await prisma.$transaction(async (tx) => {
    // A. Create review
    const createdReview = await tx.productReview.create({
      data: {
        productId: orderItem.productId,
        orderId: orderItem.orderId,
        orderItemId: orderItem.id,
        userId: userId || orderItem.order.userId || null,
        customerName: customerName.trim() || orderItem.order.customerName,
        customerEmail: normalizedEmail,
        rating: cleanRating,
        title: title?.trim() || null,
        comment: comment.trim(),
        isVerifiedPurchase: true,
        status: initialStatus,
      },
    });

    // B. Recalculate product rating aggregates
    const aggregate = await tx.productReview.aggregate({
      where: {
        productId: orderItem.productId,
        status: 'APPROVED',
      },
      _avg: { rating: true },
      _count: { id: true },
    });

    const newAvg = aggregate._avg.rating || cleanRating;
    const newCount = aggregate._count.id || 1;

    await tx.product.update({
      where: { id: orderItem.productId },
      data: {
        averageRating: Math.round(newAvg * 10) / 10,
        reviewCount: newCount,
      },
    });

    // C. Generate Personalized Review Reward Coupon if enabled
    let issuedReward: IssuedRewardCouponResult | null = null;
    if (settings.isEnabled && settings.autoGenerateCoupon) {
      issuedReward = await issuePersonalizedRewardCoupon({
        customerEmail: normalizedEmail,
        customerId: userId || orderItem.order.userId,
        customerName: customerName.trim() || orderItem.order.customerName,
        discountPercent: settings.defaultDiscountPercent,
        expiryDays: settings.expiryDays,
        minOrderValuePaise: settings.minOrderValuePaise,
        maxDiscountPaise: settings.maxDiscountPaise,
        productName: orderItem.product.name,
      });

      await tx.reviewReward.create({
        data: {
          reviewId: createdReview.id,
          couponId: issuedReward.couponId,
          customerId: userId || orderItem.order.userId || null,
          customerEmail: normalizedEmail,
          discountPercent: settings.defaultDiscountPercent,
          status: 'ACTIVE',
        },
      });
    }

    // D. Complete invitation if token was provided
    if (invitationToken) {
      try {
        await tx.reviewInvitation.updateMany({
          where: { token: invitationToken },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });
      } catch {}
    }

    return { createdReview, issuedReward, orderItem };
  });

  // 6. Send Reward Email asynchronously
  if (result.issuedReward && settings.sendRewardEmails) {
    sendRewardCouponEmail({
      to: normalizedEmail,
      customerName: customerName.trim() || result.orderItem.order.customerName,
      couponCode: result.issuedReward.couponCode,
      discountPercent: result.issuedReward.discountPercent,
      expiresAt: result.issuedReward.expiresAt,
      productName: result.orderItem.product.name,
    }).catch((err) => console.warn('Failed to dispatch reward coupon email:', err));
  }

  return {
    review: {
      id: result.createdReview.id,
      productId: result.createdReview.productId,
      orderId: result.createdReview.orderId,
      orderItemId: result.createdReview.orderItemId,
      rating: result.createdReview.rating,
      title: result.createdReview.title,
      comment: result.createdReview.comment,
      customerName: result.createdReview.customerName,
      customerEmail: result.createdReview.customerEmail,
      isVerifiedPurchase: result.createdReview.isVerifiedPurchase,
      status: result.createdReview.status as any,
      createdAt: result.createdReview.createdAt.toISOString(),
      updatedAt: result.createdReview.updatedAt.toISOString(),
    },
    reward: result.issuedReward
      ? {
          couponCode: result.issuedReward.couponCode,
          discountPercent: result.issuedReward.discountPercent,
          expiresAt: result.issuedReward.expiresAt.toISOString(),
        }
      : undefined,
  };
}

/**
 * Sends the personalized review reward coupon email.
 */
export async function sendRewardCouponEmail(params: {
  to: string;
  customerName: string;
  couponCode: string;
  discountPercent: number;
  expiresAt: Date;
  productName: string;
}) {
  const { to, customerName, couponCode, discountPercent, expiresAt, productName } = params;

  const expiryFormatted = expiresAt.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Ganesh Honey Reward Coupon</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f7; margin: 0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); border: 1px solid #d2d2d7;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1d1d1f 0%, #2c2c2e 100%); padding: 32px 32px; text-align: center; color: #ffffff;">
      <span style="display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #ffb340; margin-bottom: 8px;">
        ★ Verified Review Reward
      </span>
      <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.02em;">
        Thank You for Your Feedback!
      </h1>
      <p style="margin: 8px 0 0; color: #a1a1a6; font-size: 13px;">
        Ganesh Mule 100% Pure Raw Honey
      </p>
    </div>

    <!-- Body -->
    <div style="padding: 32px 32px;">
      <p style="margin: 0 0 16px; font-size: 15px; color: #1d1d1f; line-height: 1.5;">
        Hello <strong>${customerName}</strong>,
      </p>
      <p style="margin: 0 0 24px; font-size: 14px; color: #515154; line-height: 1.6;">
        Thank you for sharing your experience reviewing <strong>${productName}</strong>. Your honest thoughts help fellow honey lovers find pure, artisanal harvests.
      </p>
      
      <!-- Coupon Certificate Box -->
      <div style="background: #fafafc; border: 2px dashed #0071e3; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em; color: #0071e3;">
          Exclusive Discount Voucher
        </span>
        <div style="font-family: monospace; font-size: 28px; font-weight: 800; color: #1d1d1f; margin: 12px 0; letter-spacing: 0.05em;">
          ${couponCode}
        </div>
        <div style="font-size: 18px; font-weight: 700; color: #0071e3; margin-bottom: 8px;">
          ${discountPercent}% OFF Entire Order
        </div>
        <p style="margin: 0; font-size: 12px; color: #86868b;">
          Valid until <strong>${expiryFormatted}</strong> • Single-use
        </p>
      </div>

      <div style="background: #f5f5f7; border-radius: 12px; padding: 14px 18px; margin-bottom: 28px;">
        <p style="margin: 0; font-size: 12px; color: #6e6e73; line-height: 1.5;">
          🔒 <strong>Personalized Security:</strong> This coupon is cryptographically bound to your email (<code>${to}</code>). It will also be automatically discovered and waiting for you when you reach checkout.
        </p>
      </div>

      <!-- CTA -->
      <div style="text-align: center;">
        <a href="https://shop-kandalovers.devtushar.uk/shop" style="display: inline-block; background-color: #0071e3; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 980px; font-weight: 600; font-size: 14px; box-shadow: 0 2px 8px rgba(0,113,227,0.25);">
          Shop Honey Harvests
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f5f5f7; padding: 20px 32px; text-align: center; border-top: 1px solid #d2d2d7; font-size: 11px; color: #86868b;">
      <p style="margin: 0;">© 2026 Ganesh Mule Pure Honey. Single-Origin Cold-Extracted in Heavy Solid Glass.</p>
      <p style="margin: 4px 0 0;">Need assistance? Contact us at care@devtushar.uk</p>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail(
    {
      to,
      subject: `Thank you for reviewing Ganesh Honey! Here is your ${discountPercent}% discount reward.`,
      html,
    },
    'REVIEW_REWARD'
  );
}

/**
 * Returns approved reviews and rating breakdown for a product.
 */
export async function getProductReviewsAndSummary(productId: string): Promise<{
  reviews: ProductReviewDto[];
  summary: ProductRatingSummary;
}> {
  const dbOnline = await isDatabaseOnline();
  if (!dbOnline) {
    return {
      reviews: [],
      summary: {
        averageRating: 5.0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        ratingPercentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      },
    };
  }

  try {
    const reviews = await prisma.productReview.findMany({
      where: {
        productId,
        status: 'APPROVED',
      },
      include: {
        product: true,
        order: true,
        reward: {
          include: { coupon: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;

    for (const r of reviews) {
      const clamped = Math.max(1, Math.min(5, r.rating)) as 1 | 2 | 3 | 4 | 5;
      dist[clamped] += 1;
      sum += clamped;
    }

    const total = reviews.length;
    const avg = total > 0 ? Math.round((sum / total) * 10) / 10 : 5.0;

    const percentages = {
      5: total > 0 ? Math.round((dist[5] / total) * 100) : 0,
      4: total > 0 ? Math.round((dist[4] / total) * 100) : 0,
      3: total > 0 ? Math.round((dist[3] / total) * 100) : 0,
      2: total > 0 ? Math.round((dist[2] / total) * 100) : 0,
      1: total > 0 ? Math.round((dist[1] / total) * 100) : 0,
    };

    return {
      reviews: reviews.map((r) => ({
        id: r.id,
        productId: r.productId,
        productName: r.product.name,
        productSlug: r.product.slug,
        orderId: r.orderId,
        orderNumber: r.order.orderNumber,
        orderItemId: r.orderItemId,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        customerName: r.customerName,
        customerEmail: r.customerEmail,
        isVerifiedPurchase: r.isVerifiedPurchase,
        status: r.status as any,
        reward: r.reward
          ? {
              couponCode: r.reward.coupon.code,
              discountPercent: r.reward.discountPercent,
              status: r.reward.status as any,
            }
          : undefined,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      summary: {
        averageRating: avg,
        totalReviews: total,
        ratingDistribution: dist,
        ratingPercentages: percentages,
      },
    };
  } catch (err) {
    console.warn('Failed to load product reviews:', err);
    return {
      reviews: [],
      summary: {
        averageRating: 5.0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        ratingPercentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      },
    };
  }
}

/**
 * Returns customer reviews, eligible unreviewed items, and earned rewards.
 */
export async function getCustomerReviewsAndRewards(
  customerEmail: string,
  customerId?: string
): Promise<{
  unreviewedItems: ReviewItemDto[];
  submittedReviews: ProductReviewDto[];
  earnedRewards: CustomerRewardDto[];
}> {
  const normalizedEmail = customerEmail.trim().toLowerCase();

  const [unreviewedItems, reviews, rewards] = await Promise.all([
    getEligibleUnreviewedItems(normalizedEmail, customerId),
    prisma.productReview.findMany({
      where: {
        OR: [
          { customerEmail: { equals: normalizedEmail, mode: 'insensitive' } },
          ...(customerId ? [{ userId: customerId }] : []),
        ],
      },
      include: {
        product: true,
        order: true,
        reward: {
          include: { coupon: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.reviewReward.findMany({
      where: {
        OR: [
          { customerEmail: { equals: normalizedEmail, mode: 'insensitive' } },
          ...(customerId ? [{ customerId }] : []),
        ],
      },
      include: {
        coupon: true,
        review: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return {
    unreviewedItems,
    submittedReviews: reviews.map((r) => ({
      id: r.id,
      productId: r.productId,
      productName: r.product.name,
      productSlug: r.product.slug,
      orderId: r.orderId,
      orderNumber: r.order.orderNumber,
      orderItemId: r.orderItemId,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      customerName: r.customerName,
      customerEmail: r.customerEmail,
      isVerifiedPurchase: r.isVerifiedPurchase,
      status: r.status as any,
      reward: r.reward
        ? {
            couponCode: r.reward.coupon.code,
            discountPercent: r.reward.discountPercent,
            status: r.reward.status as any,
          }
        : undefined,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
    earnedRewards: rewards.map((rw) => ({
      id: rw.id,
      couponId: rw.couponId,
      couponCode: rw.coupon.code,
      discountPercent: rw.discountPercent,
      reviewId: rw.reviewId,
      productName: rw.review?.product?.name || 'Ganesh Honey Harvest',
      productSlug: rw.review?.product?.slug || 'honey',
      customerEmail: rw.customerEmail,
      status: (rw.status as any) || 'ACTIVE',
      expiresAt: rw.coupon.expiresAt ? rw.coupon.expiresAt.toISOString() : null,
      minOrderAmountPaise: rw.coupon.minOrderAmount,
      maxDiscountPaise: rw.coupon.maxDiscountAmount,
      usedCount: rw.coupon.usedCount,
      createdAt: rw.createdAt.toISOString(),
    })),
  };
}
