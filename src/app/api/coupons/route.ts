import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, getCurrentUser } from '@/lib/auth/server';
import { prisma, isDatabaseOnline } from '@/lib/db';
import { MOCK_MANAGERS } from '@/lib/mock-data';
import { DiscountCoupon } from '@/types';
import {
  getLiveCoupons,
  getLiveCouponByCode,
  addLiveCoupon,
  updateLiveCoupon,
} from '@/lib/coupons/store';

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
  isPublic: z.boolean().default(false),
  assignedManagerIds: z.array(z.string()).default([]),
});

const ToggleCouponSchema = z.object({
  id: z.string(),
  isPublic: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dbOnline = await isDatabaseOnline();

  // 1. Public Offers Endpoint (for shoppers refreshing offers on checkout)
  if (searchParams.get('publicOnly') === 'true') {
    if (dbOnline) {
      try {
        const dbCoupons = await prisma.discountCoupon.findMany({
          where: { isActive: true, isPublic: true },
          orderBy: { createdAt: 'desc' },
        });
        if (dbCoupons.length > 0) {
          const publicCoupons = dbCoupons.map((c) => ({
            code: c.code,
            description: c.description,
            discountType: c.discountType,
            value: c.value,
            minOrderAmount: c.minOrderAmount,
            maxDiscountAmount: c.maxDiscountAmount,
          }));
          return NextResponse.json({ success: true, coupons: publicCoupons });
        }
      } catch {}
    }

    const publicCoupons = getLiveCoupons()
      .filter((c) => c.isActive && c.isPublic)
      .map((c) => ({
        code: c.code,
        description: c.description,
        discountType: c.discountType,
        value: c.value,
        minOrderAmount: c.minOrderAmount,
        maxDiscountAmount: c.maxDiscountAmount,
      }));
    return NextResponse.json({ success: true, coupons: publicCoupons });
  }

  // 2. Staff Management Endpoint
  const user = await getCurrentUser();
  const isDev = process.env.NODE_ENV !== 'production';

  if (!user && !isDev) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const role = user?.role || 'ADMIN';
  const userId = user?.id || 'usr-admin-1';

  try {
    let coupons: DiscountCoupon[] = [];

    if (dbOnline) {
      try {
        const dbCoupons = await prisma.discountCoupon.findMany({
          orderBy: { createdAt: 'desc' },
        });
        if (dbCoupons.length > 0) {
          coupons = dbCoupons.map((c) => ({
            id: c.id,
            code: c.code,
            description: c.description,
            discountType: c.discountType as any,
            value: c.value,
            minOrderAmount: c.minOrderAmount,
            maxDiscountAmount: c.maxDiscountAmount,
            expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
            usageLimit: c.usageLimit,
            usageCount: c.usedCount,
            isActive: c.isActive,
            isPublic: c.isPublic,
            assignedManagerIds: c.assignedManagerIds,
            assignedManagerNames: c.assignedManagerIds
              .map((mId) => MOCK_MANAGERS.find((m) => m.userId === mId)?.name)
              .filter(Boolean) as string[],
            createdAt: c.createdAt.toISOString(),
            updatedAt: c.updatedAt.toISOString(),
          }));
        }
      } catch {}
    }

    if (coupons.length === 0) {
      coupons = getLiveCoupons();
    }

    // Filter by role: Managers only see coupons assigned to them
    if (role === 'MANAGER') {
      coupons = coupons.filter(
        (c) =>
          c.assignedManagerIds?.includes(userId) ||
          c.assignedManagerIds?.includes('usr-mgr-1')
      );
    }

    // Retrieve staff managers from DB if online
    let managersList: any[] = MOCK_MANAGERS.map((m) => ({
      id: m.userId,
      name: m.name,
      email: m.email,
      department: m.department,
    }));

    if (dbOnline) {
      try {
        const dbManagers = await prisma.user.findMany({
          where: { role: 'MANAGER' },
          select: { id: true, name: true, email: true },
        });
        if (dbManagers.length > 0) {
          managersList = dbManagers.map((m) => ({
            id: m.id,
            name: m.name,
            email: m.email,
            department: 'Operations',
          }));
        }
      } catch {}
    }

    return NextResponse.json({
      coupons,
      managers: managersList,
      role,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to retrieve coupons', details: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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
      isPublic,
      assignedManagerIds,
    } = parsed.data;

    const normalizedCode = code.trim().toUpperCase();
    const dbOnline = await isDatabaseOnline();

    // Check code uniqueness
    if (dbOnline) {
      const existingDb = await prisma.discountCoupon.findUnique({
        where: { code: normalizedCode },
      });
      if (existingDb) {
        return NextResponse.json({ error: `Coupon code "${normalizedCode}" already exists.` }, { status: 409 });
      }
    }

    const exists = Boolean(getLiveCouponByCode(normalizedCode));
    if (exists) {
      return NextResponse.json({ error: `Coupon code "${normalizedCode}" already exists.` }, { status: 409 });
    }

    // Resolve assigned manager names
    const assignedManagerNames = assignedManagerIds
      .map((mId) => MOCK_MANAGERS.find((m) => m.userId === mId)?.name)
      .filter(Boolean) as string[];

    let newCoupon: DiscountCoupon;

    if (dbOnline) {
      try {
        const created = await prisma.discountCoupon.create({
          data: {
            code: normalizedCode,
            description,
            discountType,
            value,
            minOrderAmount,
            maxDiscountAmount: maxDiscountAmount || null,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            usageLimit: usageLimit || null,
            usedCount: 0,
            isActive: true,
            isPublic: !!isPublic,
            assignedManagerIds,
          },
        });
        newCoupon = {
          id: created.id,
          code: created.code,
          description: created.description,
          discountType: created.discountType as any,
          value: created.value,
          minOrderAmount: created.minOrderAmount,
          maxDiscountAmount: created.maxDiscountAmount,
          expiresAt: created.expiresAt ? created.expiresAt.toISOString() : null,
          usageLimit: created.usageLimit,
          usageCount: created.usedCount,
          isActive: created.isActive,
          isPublic: created.isPublic,
          assignedManagerIds: created.assignedManagerIds,
          assignedManagerNames,
          createdById: actor.id,
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        };
      } catch (err: any) {
        // Fallback to in-memory store if DB error occurs
        newCoupon = {
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
          isPublic: !!isPublic,
          assignedManagerIds,
          assignedManagerNames,
          createdById: actor.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
    } else {
      newCoupon = {
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
        isPublic: !!isPublic,
        assignedManagerIds,
        assignedManagerNames,
        createdById: actor.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    addLiveCoupon(newCoupon);

    return NextResponse.json({ success: true, coupon: newCoupon });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to create discount coupon', details: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth('ADMIN');
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const parsed = ToggleCouponSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid coupon toggle payload' }, { status: 400 });
    }

    const { id, isPublic, isActive } = parsed.data;
    const dbOnline = await isDatabaseOnline();

    if (dbOnline) {
      try {
        await prisma.discountCoupon.updateMany({
          where: { id },
          data: {
            ...(isPublic !== undefined ? { isPublic } : {}),
            ...(isActive !== undefined ? { isActive } : {}),
          },
        });
      } catch {}
    }

    const updates: Partial<DiscountCoupon> = {};
    if (isPublic !== undefined) updates.isPublic = isPublic;
    if (isActive !== undefined) updates.isActive = isActive;

    const coupon = updateLiveCoupon(id, updates);
    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, coupon });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update coupon', details: err.message }, { status: 500 });
  }
}
