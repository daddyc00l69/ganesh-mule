import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, getCurrentUser } from '@/lib/auth/server';
import { MOCK_COUPONS, MOCK_MANAGERS } from '@/lib/mock-data';
import { prisma } from '@/lib/db';
import { DiscountCoupon } from '@/types';

// In-memory store for active session mutations when DB is offline
let IN_MEMORY_COUPONS: DiscountCoupon[] = [...MOCK_COUPONS];

const CreateCouponSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(25)
    .regex(/^[A-Z0-9_\-]+$/i, 'Coupon code must contain only letters, numbers, and hyphens'),
  description: z.string().min(5),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  value: z.number().int().positive(),
  minOrderAmount: z.number().int().nonnegative().default(0),
  maxDiscountAmount: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  usageLimit: z.number().int().positive().nullable().optional(),
  assignedManagerIds: z.array(z.string()).default([]),
});

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();

  // If testing or unauthenticated in dev, allow reading default coupons
  const isDev = process.env.NODE_ENV !== 'production';

  if (!user && !isDev) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const role = user?.role || 'ADMIN';
  const userId = user?.id || 'usr-admin-1';

  try {
    let coupons = IN_MEMORY_COUPONS;

    // Filter by role: Managers only see coupons assigned to them
    if (role === 'MANAGER') {
      coupons = coupons.filter(
        (c) =>
          c.assignedManagerIds?.includes(userId) ||
          c.assignedManagerIds?.includes('usr-mgr-1') // Fallback dev manager match
      );
    }

    return NextResponse.json({
      coupons,
      managers: MOCK_MANAGERS.map((m) => ({
        id: m.userId,
        name: m.name,
        email: m.email,
        department: m.department,
      })),
      role,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to retrieve coupons', details: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Only Admin can manage & create discount coupons
  const auth = await requireAuth('ADMIN');
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const actor = auth.user;

  try {
    const body = await req.json();
    const parsed = CreateCouponSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid parameters' }, { status: 400 });
    }

    const {
      code,
      description,
      discountType,
      value,
      minOrderAmount,
      maxDiscountAmount,
      expiresAt,
      usageLimit,
      assignedManagerIds,
    } = parsed.data;

    const normalizedCode = code.trim().toUpperCase();

    // Check code uniqueness
    const exists = IN_MEMORY_COUPONS.some((c) => c.code.toUpperCase() === normalizedCode);
    if (exists) {
      return NextResponse.json({ error: `Coupon code "${normalizedCode}" already exists.` }, { status: 409 });
    }

    // Resolve assigned manager names
    const assignedManagerNames = assignedManagerIds
      .map((mId) => MOCK_MANAGERS.find((m) => m.userId === mId)?.name)
      .filter(Boolean) as string[];

    const newCoupon: DiscountCoupon = {
      id: `coup-${Date.now()}`,
      code: normalizedCode,
      description,
      discountType,
      value,
      minOrderAmount,
      maxDiscountAmount: maxDiscountAmount || null,
      expiresAt: expiresAt || null,
      usageLimit: usageLimit || null,
      usageCount: 0,
      isActive: true,
      assignedManagerIds,
      assignedManagerNames,
      createdById: actor.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    IN_MEMORY_COUPONS.unshift(newCoupon);

    return NextResponse.json({ success: true, coupon: newCoupon });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to create discount coupon', details: err.message }, { status: 500 });
  }
}
