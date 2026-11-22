import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthInProduction, getCurrentUser } from '@/lib/auth/server';
import { PERMISSIONS } from '@/lib/permissions';
import { prisma, isDatabaseOnline } from '@/lib/db';
import { ReviewStatus } from '@/lib/reviews/types';
import { revokeReviewRewardCoupon } from '@/lib/reviews/reward-coupon-engine';

const ModerationActionSchema = z.object({
  reviewId: z.string(),
  status: z.enum(['APPROVED', 'REJECTED', 'HIDDEN', 'PENDING']),
  moderationNotes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuthInProduction('MANAGER', PERMISSIONS.ORDERS_READ);
    if ('response' in auth) return auth.response;

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId') || undefined;
    const status = searchParams.get('status') || undefined;
    const rating = searchParams.get('rating') ? parseInt(searchParams.get('rating')!, 10) : undefined;
    const search = searchParams.get('search') || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)));
    const skip = (page - 1) * limit;

    const dbOnline = await isDatabaseOnline();
    if (!dbOnline) {
      return NextResponse.json({
        reviews: [],
        total: 0,
        page,
        limit,
        metrics: {
          totalReviews: 0,
          pendingModeration: 0,
          averageRating: 0,
          rewardsIssued: 0,
          rewardsRedeemed: 0,
        },
      });
    }

    const where: any = {};
    if (productId) where.productId = productId;
    if (status) where.status = status;
    if (rating) where.rating = rating;
    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { reviewText: { contains: search, mode: 'insensitive' } },
        { product: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [reviews, total, totalAll, pendingCount, rewardsStats, ratingAgg] = await Promise.all([
      prisma.productReview.findMany({
        where,
        include: {
          product: {
            select: { id: true, name: true, slug: true, images: true, price: true },
          },
          orderItem: {
            select: {
              id: true,
              productName: true,
              weight: true,
              price: true,
              order: { select: { id: true, orderNumber: true, orderStatus: true, createdAt: true } },
            },
          },
          reward: {
            include: {
              coupon: { select: { code: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.productReview.count({ where }),
      prisma.productReview.count(),
      prisma.productReview.count({ where: { status: 'PENDING' } }),
      prisma.reviewReward.aggregate({
        _count: { id: true },
      }),
      prisma.productReview.aggregate({
        where: { status: 'APPROVED' },
        _avg: { rating: true },
      }),
    ]);

    const redeemedRewardsCount = await prisma.reviewReward.count({
      where: { status: 'REDEEMED' },
    });

    return NextResponse.json({
      success: true,
      reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      metrics: {
        totalReviews: totalAll,
        pendingModeration: pendingCount,
        averageRating: Number((ratingAgg._avg.rating || 0).toFixed(1)),
        rewardsIssued: rewardsStats._count.id || 0,
        rewardsRedeemed: redeemedRewardsCount,
      },
    });
  } catch (error: any) {
    console.error('[Admin Reviews GET Error]', error);
    return NextResponse.json(
      { error: 'Failed to retrieve admin review desk data', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAuthInProduction('MANAGER', PERMISSIONS.ORDERS_UPDATE);
    if ('response' in auth) return auth.response;

    const user = await getCurrentUser();
    const body = await req.json();
    const parsed = ModerationActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid moderation payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { reviewId, status, moderationNotes } = parsed.data;
    const dbOnline = await isDatabaseOnline();
    if (!dbOnline) {
      return NextResponse.json({ error: 'Database is currently offline' }, { status: 503 });
    }

    const existing = await prisma.productReview.findUnique({
      where: { id: reviewId },
      include: { product: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const updated = await prisma.productReview.update({
      where: { id: reviewId },
      data: {
        status: status as any,
      },
    });

    // Recompute product ratings aggregate
    try {
      const agg = await prisma.productReview.aggregate({
        where: { productId: existing.productId, status: 'APPROVED' },
        _avg: { rating: true },
        _count: { id: true },
      });

      await prisma.product.update({
        where: { id: existing.productId },
        data: {
          averageRating: agg._avg.rating ? Number(agg._avg.rating.toFixed(2)) : 0,
          reviewCount: agg._count.id || 0,
        },
      });
    } catch (aggErr) {
      console.warn('[Review Agg Recompute Error]', aggErr);
    }

    return NextResponse.json({
      success: true,
      review: updated,
      message: `Review #${reviewId} marked as ${status}.`,
    });
  } catch (error: any) {
    console.error('[Admin Reviews PATCH Error]', error);
    return NextResponse.json(
      { error: 'Failed to update review moderation status', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAuthInProduction('ADMIN', PERMISSIONS.SETTINGS_MANAGE);
    if ('response' in auth) return auth.response;

    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const reviewId = searchParams.get('reviewId');
    const revokeReward = searchParams.get('revokeReward') === 'true';

    if (!reviewId) {
      return NextResponse.json({ error: 'reviewId is required' }, { status: 400 });
    }

    const dbOnline = await isDatabaseOnline();
    if (!dbOnline) {
      return NextResponse.json({ error: 'Database is offline' }, { status: 503 });
    }

    const review = await prisma.productReview.findUnique({
      where: { id: reviewId },
      include: {
        reward: {
          include: {
            coupon: { select: { code: true } },
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (revokeReward && review.reward?.coupon?.code) {
      await revokeReviewRewardCoupon(
        review.reward.coupon.code,
        'Admin revoked review and associated reward coupon',
        user?.email || 'admin'
      );
    }

    // Set status to HIDDEN
    await prisma.productReview.update({
      where: { id: reviewId },
      data: {
        status: 'HIDDEN',
      },
    });

    // Recompute product ratings
    try {
      const agg = await prisma.productReview.aggregate({
        where: { productId: review.productId, status: 'APPROVED' },
        _avg: { rating: true },
        _count: { id: true },
      });

      await prisma.product.update({
        where: { id: review.productId },
        data: {
          averageRating: agg._avg.rating ? Number(agg._avg.rating.toFixed(2)) : 0,
          reviewCount: agg._count.id || 0,
        },
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Review removed and reward coupon revoked if applicable.',
    });
  } catch (error: any) {
    console.error('[Admin Reviews DELETE Error]', error);
    return NextResponse.json(
      { error: 'Failed to revoke review', details: error.message },
      { status: 500 }
    );
  }
}
