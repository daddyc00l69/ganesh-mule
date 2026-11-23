import { NextResponse } from 'next/server';
import { initializeBaileys, getBaileysStatus } from '@/lib/whatsapp/baileys-service';

export async function POST() {
  try {
    const status = await initializeBaileys();
    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to initiate WhatsApp socket', details: error.message },
      { status: 500 }
    );
  }
}
