import { NextRequest, NextResponse } from 'next/server';
import { getWhatsAppLogs } from '@/lib/whatsapp/settings';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const logs = getWhatsAppLogs(limit);
    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to retrieve WhatsApp logs', details: error.message },
      { status: 500 }
    );
  }
}
