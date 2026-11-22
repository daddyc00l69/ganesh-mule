import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthInProduction } from '@/lib/auth/server';
import { PERMISSIONS } from '@/lib/permissions';
import { prisma, isDatabaseOnline } from '@/lib/db';
import {
  dispatchDueReviewInvitations,
  resendReviewInvitation,
} from '@/lib/reviews/invitation-service';

const InvitationActionSchema = z.object({
  action: z.enum(['dispatch_due', 'resend']),
  invitationId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuthInProduction('MANAGER', PERMISSIONS.ORDERS_READ);
    if ('response' in auth) return auth.response;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const dbOnline = await isDatabaseOnline();
    if (!dbOnline) {
      return NextResponse.json({ invitations: [], total: 0, page, limit });
    }

    const where: any = {};
    if (status) where.status = status;

    const [invitations, total] = await Promise.all([
      prisma.reviewInvitation.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              orderStatus: true,
              customerName: true,
              customerEmail: true,
              items: { select: { id: true, productName: true, weight: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.reviewInvitation.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      invitations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('[Admin Invitations GET Error]', error);
    return NextResponse.json(
      { error: 'Failed to retrieve review invitations', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuthInProduction('MANAGER', PERMISSIONS.ORDERS_UPDATE);
    if ('response' in auth) return auth.response;

    const body = await req.json();
    const parsed = InvitationActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid action parameters', details: parsed.error.format() },
        { status: 400 }
      );
    }

    if (parsed.data.action === 'dispatch_due') {
      const result = await dispatchDueReviewInvitations();
      return NextResponse.json({
        success: true,
        dispatched: result.dispatched,
        failed: result.failed,
        message: `Dispatched ${result.dispatched} due review invitations (${result.failed} failures).`,
      });
    }

    if (parsed.data.action === 'resend') {
      if (!parsed.data.invitationId) {
        return NextResponse.json(
          { error: 'invitationId is required for resend action' },
          { status: 400 }
        );
      }
      try {
        await resendReviewInvitation(parsed.data.invitationId);
        return NextResponse.json({
          success: true,
          message: 'Review invitation resent successfully.',
        });
      } catch (resendErr: any) {
        return NextResponse.json(
          { error: resendErr.message || 'Failed to resend review invitation' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('[Admin Invitations POST Error]', error);
    return NextResponse.json(
      { error: 'Failed to process invitation action', details: error.message },
      { status: 500 }
    );
  }
}
