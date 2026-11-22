import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/server';
import {
  getPlatformFinanceSettings,
  updatePlatformFinanceSettings,
  getPlatformBusinessProfile,
  updatePlatformBusinessProfile,
} from '@/lib/finance/settings-store';
import { prisma, isDatabaseOnline } from '@/lib/db';

const UpdateSettingsSchema = z.object({
  settings: z
    .object({
      platformFeeEnabled: z.boolean().optional(),
      feeType: z.enum(['FIXED', 'PERCENTAGE']).optional(),
      fixedFeePaise: z.number().int().nonnegative().optional(),
      feePercent: z.number().min(0).max(50).optional(),
      minFeePaise: z.number().int().nonnegative().optional(),
      maxFeePaise: z.number().int().nonnegative().optional(),
      platformGstEnabled: z.boolean().optional(),
      platformGstRate: z.number().min(0).max(28).optional(),
      platformGstInclusive: z.boolean().optional(),
      customerDisclosed: z.boolean().optional(),
      clientVisible: z.boolean().optional(),

      deliveryEnabled: z.boolean().optional(),
      deliveryFeePaise: z.number().int().nonnegative().optional(),
      deliveryGstRate: z.number().min(0).max(28).optional(),
      deliveryGstEnabled: z.boolean().optional(),
      deliveryGstInclusive: z.boolean().optional(),
      deliveryClientVisible: z.boolean().optional(),
      deliveryCustomerDisclosed: z.boolean().optional(),

      productGstEnabled: z.boolean().optional(),
      defaultProductGstRate: z.number().min(0).max(28).optional(),
      productPricesGstInclusive: z.boolean().optional(),
      customerGstBreakdownVisible: z.boolean().optional(),

      showPlatformFeeToClient: z.boolean().optional(),
      showPlatformGstToClient: z.boolean().optional(),
      showDeliveryToClient: z.boolean().optional(),
      showDeliveryGstToClient: z.boolean().optional(),
      showProductGstBreakdown: z.boolean().optional(),
      showPlatformRevenueAnalytics: z.boolean().optional(),
      showPlatformTransactions: z.boolean().optional(),
      effectiveFrom: z.string().optional(),
    })
    .optional(),
  businessProfile: z
    .object({
      legalName: z.string().min(2).optional(),
      tradeName: z.string().optional(),
      gstin: z.string().optional().nullable(),
      pan: z.string().optional().nullable(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      stateCode: z.string().optional(),
      pincode: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      invoicePrefix: z.string().optional(),
    })
    .optional(),
  reason: z.string().optional(),
});

export async function GET() {
  const auth = await requireAuth('DEVELOPER');
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const settings = await getPlatformFinanceSettings();
    const businessProfile = await getPlatformBusinessProfile();

    let history: any[] = [];
    const dbOnline = await isDatabaseOnline();
    if (dbOnline) {
      try {
        history = await prisma.platformFinanceSettingsHistory.findMany({
          orderBy: { createdAt: 'desc' },
          take: 20,
        });
      } catch {}
    }

    return NextResponse.json({
      success: true,
      settings,
      businessProfile,
      history,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to retrieve developer financial settings', details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth('DEVELOPER');
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const parsed = UpdateSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid financial configuration parameters', details: parsed.error },
        { status: 400 }
      );
    }

    const { settings: settingsUpdates, businessProfile: profileUpdates, reason } = parsed.data;
    const actor = {
      id: auth.user.id,
      email: auth.user.email,
      role: auth.user.role,
      reason: reason || 'Updated via Developer Financial Control Centre',
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1',
    };

    let updatedSettings = null;
    let updatedProfile = null;

    if (settingsUpdates) {
      updatedSettings = await updatePlatformFinanceSettings(settingsUpdates, actor);
    }
    if (profileUpdates) {
      updatedProfile = await updatePlatformBusinessProfile(profileUpdates, actor);
    }

    return NextResponse.json({
      success: true,
      message: 'Financial settings and parameters successfully updated and versioned.',
      settings: updatedSettings || (await getPlatformFinanceSettings()),
      businessProfile: updatedProfile || (await getPlatformBusinessProfile()),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to update developer financial settings', details: err.message },
      { status: 500 }
    );
  }
}
