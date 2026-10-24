import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getFeeSettings, updateFeeSettings } from '@/lib/config/fee-settings';
import { getCurrentUser } from '@/lib/auth/server';

const UpdateFeeSettingsSchema = z.object({
  shippingBaseFee: z.number().int().nonnegative().optional(), // in paise
  shippingGstRate: z.number().min(0).max(28).optional(),
  freeShippingThreshold: z.number().int().nonnegative().optional(), // in paise
  freeShippingEnabled: z.boolean().optional(),
  platformBaseFee: z.number().int().nonnegative().optional(), // in paise
  platformGstRate: z.number().min(0).max(28).optional(),
  platformFeeEnabled: z.boolean().optional(),
  paymentGatewayPercent: z.number().min(0).max(10).optional(),
  paymentGatewayGstRate: z.number().min(0).max(28).optional(),
  paymentGatewayFeeEnabled: z.boolean().optional(),
  feeMode: z.enum(['FLAT_20', 'PERCENT_2', 'BOTH']).optional(),
});

export async function GET() {
  try {
    const settings = getFeeSettings();
    return NextResponse.json({ success: true, settings });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to retrieve fee settings', details: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = UpdateFeeSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid fee settings data', details: parsed.error }, { status: 400 });
    }

    const currentUser = await getCurrentUser();
    const updaterName = currentUser ? `${currentUser.role} (${currentUser.name})` : 'Manager (Operations Desk)';

    const updated = updateFeeSettings(parsed.data, updaterName);

    return NextResponse.json({
      success: true,
      message: 'Fee and shipping parameters successfully updated.',
      settings: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update fee settings', details: err.message }, { status: 500 });
  }
}
