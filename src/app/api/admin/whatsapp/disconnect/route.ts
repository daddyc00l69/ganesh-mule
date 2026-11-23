import { NextRequest, NextResponse } from 'next/server';
import { disconnectBaileys } from '@/lib/whatsapp/baileys-service';

export async function POST(req: NextRequest) {
  try {
    let logout = false;
    try {
      const body = await req.json();
      logout = Boolean(body?.logout);
    } catch {}

    const status = await disconnectBaileys(logout);
    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to disconnect WhatsApp socket', details: error.message },
      { status: 500 }
    );
  }
}
