import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/server';
import { MOCK_COUPONS, MOCK_MANAGERS } from '@/lib/mock-data';

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

    const coupon = MOCK_COUPONS.find((c) => c.id === id);
    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    // Apply updates
    if (parsed.data.description !== undefined) coupon.description = parsed.data.description;
    if (parsed.data.discountType !== undefined) coupon.discountType = parsed.data.discountType;
    if (parsed.data.value !== undefined) coupon.value = parsed.data.value;
    if (parsed.data.minOrderAmount !== undefined) coupon.minOrderAmount = parsed.data.minOrderAmount;
    if (parsed.data.maxDiscountAmount !== undefined) coupon.maxDiscountAmount = parsed.data.maxDiscountAmount;
    if (parsed.data.expiresAt !== undefined) coupon.expiresAt = parsed.data.expiresAt;
    if (parsed.data.usageLimit !== undefined) coupon.usageLimit = parsed.data.usageLimit;
    if (parsed.data.isActive !== undefined) coupon.isActive = parsed.data.isActive;

    if (parsed.data.assignedManagerIds !== undefined) {
      coupon.assignedManagerIds = parsed.data.assignedManagerIds;
      coupon.assignedManagerNames = parsed.data.assignedManagerIds
        .map((mId) => MOCK_MANAGERS.find((m) => m.userId === mId)?.name)
        .filter(Boolean) as string[];
    }

    coupon.updatedAt = new Date().toISOString();

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

  const index = MOCK_COUPONS.findIndex((c) => c.id === id);
  if (index !== -1) {
    MOCK_COUPONS.splice(index, 1);
  }

  return NextResponse.json({ success: true, message: 'Coupon deleted' });
}
