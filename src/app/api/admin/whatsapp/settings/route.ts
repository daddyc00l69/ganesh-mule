import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getWhatsAppSettings, saveWhatsAppSettings } from '@/lib/whatsapp/settings';

const UpdateSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  adminPhoneNumbers: z.array(z.string()).optional(),
  notifyNewOrders: z.boolean().optional(),
  notifyDispatches: z.boolean().optional(),
  notifyLowStock: z.boolean().optional(),
  notifyWarehouseReconcile: z.boolean().optional(),
  notifyWalletLowBalance: z.boolean().optional(),
  autoReconnect: z.boolean().optional(),
});

export async function GET() {
  try {
    const settings = getWhatsAppSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to retrieve WhatsApp settings', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = UpdateSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid settings payload', details: parsed.error },
        { status: 400 }
      );
    }

    const updated = saveWhatsAppSettings(parsed.data, 'Operations Manager');
    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to save WhatsApp settings', details: error.message },
      { status: 500 }
    );
  }
}
