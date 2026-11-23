import { NextResponse } from 'next/server';
import { getBaileysStatus } from '@/lib/whatsapp/baileys-service';
import { getWhatsAppLogs } from '@/lib/whatsapp/settings';

export async function GET() {
  try {
    const status = getBaileysStatus();
    const logs = getWhatsAppLogs(30);
    return NextResponse.json({ success: true, status, logs });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to retrieve WhatsApp status', details: error.message },
      { status: 500 }
    );
  }
}
