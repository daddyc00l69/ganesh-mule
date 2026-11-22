import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/server';
import {
  getProductReviewsAndSummary,
  submitProductReview,
} from '@/lib/reviews/review-service';
import { prisma, isDatabaseOnline } from '@/lib/db';

const SubmitReviewSchema = z.object({
  orderItemId: z.string().optional(),
  productId: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  reviewText: z.string().max(2000).optional().default(''),
  customerName: z.string().min(2).max(100).optional(),
  customerEmail: z.string().email().optional(),
  directToken: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: 'productId query parameter is required' },
        { status: 400 }
      );
    }

    const data = await getProductReviewsAndSummary(productId);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Reviews API GET Error]', error);
    return NextResponse.json(
      { error: 'Failed to fetch product reviews', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SubmitReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid review payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const {
      orderItemId,
      productId,
      rating,
      reviewText,
      customerName: bodyName,
      customerEmail: bodyEmail,
      directToken,
    } = parsed.data;

    let targetOrderItemId = orderItemId;
    let resolvedCustomerEmail = bodyEmail;
    let resolvedCustomerName = bodyName;
    let resolvedCustomerId: string | undefined;

    // 1. Direct Token Resolution (e.g. from automated review email link)
    if (directToken) {
      const dbOnline = await isDatabaseOnline();
      if (dbOnline) {
        try {
          const invitation = await prisma.reviewInvitation.findUnique({
            where: { token: directToken },
            include: { order: { include: { items: true } } },
          });

          if (invitation) {
            if (invitation.status === 'COMPLETED') {
              return NextResponse.json(
                { error: 'A review for this invitation has already been submitted.' },
                { status: 400 }
              );
            }
            const isExpired =
              invitation.sentAt &&
              Date.now() - new Date(invitation.sentAt).getTime() > 30 * 24 * 60 * 60 * 1000;
            if (isExpired) {
              return NextResponse.json(
                { error: 'This review invitation link has expired.' },
                { status: 410 }
              );
            }
            resolvedCustomerEmail = invitation.customerEmail;
            resolvedCustomerName = invitation.customerName;
            resolvedCustomerId = invitation.order.userId || undefined;

            // Find matching order item if not explicitly supplied
            if (!targetOrderItemId && productId) {
              const matchingItem = invitation.order.items.find(
                (item) => item.productId === productId
              );
              if (matchingItem) {
                targetOrderItemId = matchingItem.id;
              }
            } else if (!targetOrderItemId && invitation.order.items.length === 1) {
              targetOrderItemId = invitation.order.items[0].id;
            }
          }
        } catch (tokenErr) {
          console.warn('[Review Token Resolution Error]', tokenErr);
        }
      }
    }

    // 2. Session Authentication Resolution
    if (!resolvedCustomerEmail) {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        resolvedCustomerId = currentUser.id;
        resolvedCustomerEmail = currentUser.email;
        resolvedCustomerName = currentUser.name || resolvedCustomerName;
      }
    }

    // If still no orderItemId, try to find an eligible delivered order item for this customer & product
    if (!targetOrderItemId) {
      if (!productId || !resolvedCustomerEmail) {
        return NextResponse.json(
          {
            error:
              'Missing verified purchase proof. Please provide orderItemId or log in with the email used for purchase.',
          },
          { status: 400 }
        );
      }

      const dbOnline = await isDatabaseOnline();
      if (dbOnline) {
        try {
          const eligibleOrderItem = await prisma.orderItem.findFirst({
            where: {
              productId,
              order: {
                orderStatus: 'DELIVERED',
                customerEmail: {
                  equals: resolvedCustomerEmail,
                  mode: 'insensitive',
                },
              },
              review: null,
            },
            select: { id: true, order: { select: { customerName: true, userId: true } } },
          });

          if (eligibleOrderItem) {
            targetOrderItemId = eligibleOrderItem.id;
            resolvedCustomerName = resolvedCustomerName || eligibleOrderItem.order.customerName;
            resolvedCustomerId = resolvedCustomerId || eligibleOrderItem.order.userId || undefined;
          }
        } catch (findErr) {
          console.warn('[Find Eligible Item Error]', findErr);
        }
      }
    }

    if (!targetOrderItemId) {
      return NextResponse.json(
        {
          error:
            'Only verified purchasers who have received this product can submit a review. We could not locate an unreviewed delivered purchase for this item.',
        },
        { status: 403 }
      );
    }

    if (!resolvedCustomerEmail) {
      return NextResponse.json(
        { error: 'Customer email address is required to register verified review and issue reward coupon.' },
        { status: 400 }
      );
    }

    try {
      const result = await submitProductReview({
        orderItemId: targetOrderItemId,
        rating,
        comment:
          reviewText && reviewText.trim().length >= 5
            ? reviewText.trim()
            : 'Honest customer feedback on pure honey.',
        userId: resolvedCustomerId,
        customerEmail: resolvedCustomerEmail,
        customerName: resolvedCustomerName || 'Verified Buyer',
        invitationToken: directToken,
      });

      return NextResponse.json({
        success: true,
        review: result.review,
        rewardCoupon: result.reward
          ? {
              code: result.reward.couponCode,
              discountPercentage: result.reward.discountPercent,
              expiresAt: result.reward.expiresAt,
            }
          : undefined,
        message: result.reward
          ? `Thank you for your honest feedback! Your personalized ${result.reward.discountPercent}% OFF reward coupon (${result.reward.couponCode}) is ready.`
          : 'Thank you for your valuable feedback!',
      });
    } catch (err: any) {
      return NextResponse.json(
        { error: err.message || 'Failed to submit review' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('[Reviews API POST Error]', error);
    return NextResponse.json(
      { error: 'Failed to process review submission', details: error.message },
      { status: 500 }
    );
  }
}
