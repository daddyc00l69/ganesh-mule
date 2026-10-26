import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { MOCK_COUPONS } from '@/lib/mock-data';
import { prisma, isDatabaseOnline } from '@/lib/db';

const ValidateCouponSchema = z.object({
  code: z.string().min(1, 'Please enter a coupon code').max(50),
  subtotal: z.coerce.number().nonnegative().default(0),
  customerEmail: z
    .string()
    .optional()
    .nullable()
    .transform((val) => {
      if (!val || typeof val !== 'string') return undefined;
      const clean = val.trim().toLowerCase();
      return clean.includes('@') ? clean : undefined;
    }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = ValidateCouponSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues?.[0]?.message || 'Please provide a valid coupon code.';
      return NextResponse.json({ valid: false, error: firstIssue }, { status: 400 });
    }

    const { code, subtotal } = parsed.data;
    const normalizedCode = code.trim().toUpperCase();

    // 1. Look up coupon from database or fallback to mock coupons
    let coupon: any = null;
    const dbOnline = await isDatabaseOnline();
    if (dbOnline) {
      try {
        coupon = await (prisma as any).discountCoupon?.findUnique({
          where: { code: normalizedCode },
          include: { assignedManagers: true },
        });
      } catch {
        // DB offline, fall back to in-memory MOCK_COUPONS
      }
    }

    if (!coupon) {
      coupon = MOCK_COUPONS.find((c) => c.code.toUpperCase() === normalizedCode);
    }

    if (!coupon) {
      return NextResponse.json(
        { valid: false, error: `Coupon code "${normalizedCode}" is not recognized or has expired.` },
        { status: 404 }
      );
    }

    // 2. Check active status
    if (!coupon.isActive) {
      return NextResponse.json(
        { valid: false, error: `Coupon "${coupon.code}" is currently deactivated.` },
        { status: 400 }
      );
    }

    // 3. Check expiration date
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json(
        { valid: false, error: `Coupon "${coupon.code}" expired on ${new Date(coupon.expiresAt).toLocaleDateString('en-IN')}.` },
        { status: 400 }
      );
    }

    // 4. Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json(
        { valid: false, error: `Coupon "${coupon.code}" has reached its maximum global usage limit.` },
        { status: 400 }
      );
    }

    // 5. Check minimum order subtotal requirement
    if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
      const minRequiredRupees = (coupon.minOrderAmount / 100).toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
      });
      return NextResponse.json(
        {
          valid: false,
          error: `Minimum order subtotal of ${minRequiredRupees} required to use coupon "${coupon.code}".`,
          minOrderAmount: coupon.minOrderAmount,
        },
        { status: 400 }
      );
    }

    // 6. Calculate discount amount in paise
    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      const calculated = Math.round((subtotal * coupon.value) / 100);
      if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0) {
        discountAmount = Math.min(calculated, coupon.maxDiscountAmount);
      } else {
        discountAmount = calculated;
      }
    } else {
      // FIXED_AMOUNT
      discountAmount = Math.min(coupon.value, subtotal);
    }

    const assignedToManagerName = coupon.assignedManagerNames?.[0] || 'Store Concierge';

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        value: coupon.value,
        discountAmount,
        minOrderAmount: coupon.minOrderAmount,
        maxDiscountAmount: coupon.maxDiscountAmount,
        assignedToManagerName,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ valid: false, error: 'Internal error validating coupon' }, { status: 500 });
  }
}
