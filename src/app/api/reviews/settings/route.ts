import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthInProduction, getCurrentUser } from '@/lib/auth/server';
import { PERMISSIONS } from '@/lib/permissions';
import {
  getReviewRewardSettings,
  updateReviewRewardSettings,
} from '@/lib/reviews/settings-store';

const UpdateSettingsSchema = z.object({
  isEnabled: z.boolean().optional(),
  defaultDiscountPercent: z.number().int().min(1).max(50).optional(),
  availablePercentages: z.array(z.number().int().min(1).max(50)).optional(),
  maxDiscountPercent: z.number().int().min(1).max(50).optional(),
  requireAdminApproval: z.boolean().optional(),
  autoGenerateCoupon: z.boolean().optional(),
  expiryDays: z.number().int().min(1).max(365).optional(),
  minOrderValuePaise: z.number().int().min(0).optional(),
  maxDiscountPaise: z.number().int().min(0).optional().nullable(),
  delayDaysAfterDelivery: z.number().int().min(0).max(30).optional(),
  sendInvitationEmails: z.boolean().optional(),
  sendRewardEmails: z.boolean().optional(),
  allowMultipleRedemptions: z.boolean().optional(),
  applicableCategoryIds: z.array(z.string()).optional(),
});

export async function GET() {
  try {
    const settings = await getReviewRewardSettings();
    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error: any) {
    console.error('[Review Settings GET Error]', error);
    return NextResponse.json(
      { error: 'Failed to load review reward settings', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuthInProduction('ADMIN', PERMISSIONS.SETTINGS_MANAGE);
    if ('response' in auth) return auth.response;

    const user = await getCurrentUser();
    const body = await req.json();
    const parsed = UpdateSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid settings payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const updated = await updateReviewRewardSettings(parsed.data, user?.email || 'admin');

    return NextResponse.json({
      success: true,
      settings: updated,
      message: 'Review reward settings successfully updated.',
    });
  } catch (error: any) {
    console.error('[Review Settings POST Error]', error);
    return NextResponse.json(
      { error: 'Failed to update review reward settings', details: error.message },
      { status: 500 }
    );
  }
}

export const PATCH = POST;
