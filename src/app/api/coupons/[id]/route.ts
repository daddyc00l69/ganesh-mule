import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/server';
import { prisma, isDatabaseOnline } from '@/lib/db';
import { MOCK_MANAGERS } from '@/lib/mock-data';
import { getLiveCouponById, updateLiveCoupon, deleteLiveCoupon } from '@/lib/coupons/store';
import { DiscountCoupon } from '@/types';

const UpdateCouponSchema = z.object({
  description: z.string().optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).optional(),
  value: z.number().int().positive().optional(),
  minOrderAmount: z.number().int().nonnegative().optional(),
  maxDiscountAmount: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  usageLimit: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().optional(),
  assignedManagerIds: z.array(z.string()).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth('ADMIN');
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = UpdateCouponSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid data' }, { status: 400 });
    }

    const updates: Partial<DiscountCoupon> = {};
    if (parsed.data.description !== undefined) updates.description = parsed.data.description;
    if (parsed.data.discountType !== undefined) updates.discountType = parsed.data.discountType;
    if (parsed.data.value !== undefined) updates.value = parsed.data.value;
    if (parsed.data.minOrderAmount !== undefined) updates.minOrderAmount = parsed.data.minOrderAmount;
    if (parsed.data.maxDiscountAmount !== undefined) updates.maxDiscountAmount = parsed.data.maxDiscountAmount;
    if (parsed.data.expiresAt !== undefined) updates.expiresAt = parsed.data.expiresAt;
    if (parsed.data.usageLimit !== undefined) updates.usageLimit = parsed.data.usageLimit;
    if (parsed.data.isActive !== undefined) updates.isActive = parsed.data.isActive;

    if (parsed.data.assignedManagerIds !== undefined) {
      updates.assignedManagerIds = parsed.data.assignedManagerIds;
      updates.assignedManagerNames = parsed.data.assignedManagerIds
        .map((mId) => MOCK_MANAGERS.find((m) => m.userId === mId)?.name)
        .filter(Boolean) as string[];
    }

    const dbOnline = await isDatabaseOnline();
    if (dbOnline) {
      try {
        await prisma.discountCoupon.updateMany({
          where: { id },
          data: {
            ...(updates.description !== undefined ? { description: updates.description } : {}),
            ...(updates.discountType !== undefined ? { discountType: updates.discountType } : {}),
            ...(updates.value !== undefined ? { value: updates.value } : {}),
            ...(updates.minOrderAmount !== undefined ? { minOrderAmount: updates.minOrderAmount } : {}),
            ...(updates.maxDiscountAmount !== undefined ? { maxDiscountAmount: updates.maxDiscountAmount } : {}),
            ...(updates.expiresAt !== undefined ? { expiresAt: updates.expiresAt ? new Date(updates.expiresAt) : null } : {}),
            ...(updates.usageLimit !== undefined ? { usageLimit: updates.usageLimit } : {}),
            ...(updates.isActive !== undefined ? { isActive: updates.isActive } : {}),
            ...(updates.assignedManagerIds !== undefined ? { assignedManagerIds: updates.assignedManagerIds } : {}),
            ...(updates.assignedManagerNames !== undefined ? { assignedManagerNames: updates.assignedManagerNames } : {}),
          },
        });
      } catch {}
    }

    const coupon = updateLiveCoupon(id, updates);
    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, coupon });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update coupon', details: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth('ADMIN');
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  const dbOnline = await isDatabaseOnline();
  if (dbOnline) {
    try {
      await prisma.discountCoupon.deleteMany({
        where: { id },
      });
    } catch {}
  }

  deleteLiveCoupon(id);

  return NextResponse.json({ success: true, message: 'Coupon deleted' });
}
