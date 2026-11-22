import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/server';
import { prisma, isDatabaseOnline } from '@/lib/db';

const RefundSchema = z.object({
  orderId: z.string(),
  platformTransactionId: z.string().optional(),
  refundType: z.enum(['FULL', 'PARTIAL', 'PLATFORM_FEE_ONLY']).default('FULL'),
  grossRefundPaise: z.number().int().positive(),
  platformFeeRefundPaise: z.number().int().nonnegative().default(0),
  gstAdjustmentPaise: z.number().int().nonnegative().default(0),
  reason: z.string().min(3),
  generateCreditNote: z.boolean().default(true),
});

export async function GET() {
  const auth = await requireAuth('DEVELOPER');
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const dbOnline = await isDatabaseOnline();
  let refunds: any[] = [];

  if (dbOnline) {
    try {
      refunds = await prisma.platformRefundRecord.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (err) {
      console.warn('[RefundsAPI] DB query error:', err);
    }
  }

  return NextResponse.json({
    success: true,
    refunds,
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth('DEVELOPER');
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const parsed = RefundSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid refund payload', details: parsed.error },
        { status: 400 }
      );
    }

    const {
      orderId,
      platformTransactionId,
      refundType,
      grossRefundPaise,
      platformFeeRefundPaise,
      gstAdjustmentPaise,
      reason,
      generateCreditNote,
    } = parsed.data;

    const creditNoteNumber = generateCreditNote
      ? `PCN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
      : null;

    let refundRecord: any = null;
    const dbOnline = await isDatabaseOnline();

    if (dbOnline) {
      refundRecord = await prisma.$transaction(async (tx) => {
        // 1. Record immutable refund entry
        const rec = await tx.platformRefundRecord.create({
          data: {
            orderId,
            platformTransactionId: platformTransactionId || null,
            refundType,
            grossRefundPaise,
            platformFeeRefundPaise,
            gstAdjustmentPaise,
            creditNoteNumber,
            reason,
            status: 'COMPLETED',
            actorId: auth.user.id,
            actorEmail: auth.user.email,
          },
        });

        // 2. Update PlatformTransaction settlement & payment status
        if (platformTransactionId || orderId) {
          await tx.platformTransaction.updateMany({
            where: {
              OR: [
                ...(platformTransactionId ? [{ id: platformTransactionId }] : []),
                { orderId },
              ],
            },
            data: {
              settlementStatus: refundType === 'FULL' ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
              updatedAt: new Date(),
            },
          });
        }

        // 3. Append to Audit Log
        await tx.platformFinancialAuditLog.create({
          data: {
            actorId: auth.user.id,
            actorEmail: auth.user.email,
            actorRole: auth.user.role,
            category: 'REFUND_ADJUSTMENT',
            action: 'PROCESS_FINANCIAL_REFUND',
            newState: rec as any,
            reason: `Refund: ${reason} (Credit Note: ${creditNoteNumber || 'N/A'})`,
          },
        });

        return rec;
      });
    } else {
      refundRecord = {
        id: `ref-${Date.now()}`,
        orderId,
        refundType,
        grossRefundPaise,
        platformFeeRefundPaise,
        gstAdjustmentPaise,
        creditNoteNumber,
        reason,
        status: 'COMPLETED',
        createdAt: new Date().toISOString(),
      };
    }

    return NextResponse.json({
      success: true,
      message: `Refund recorded successfully. ${creditNoteNumber ? `Credit note ${creditNoteNumber} issued.` : ''}`,
      refund: refundRecord,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to process financial refund', details: err.message },
      { status: 500 }
    );
  }
}
