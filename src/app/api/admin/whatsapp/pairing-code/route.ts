import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requestPairingCode } from '@/lib/whatsapp/baileys-service';

const PairingCodeSchema = z.object({
  phoneNumber: z.string().min(10, 'Valid mobile number with country code is required (e.g. 919876543210)'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = PairingCodeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid phone number parameter', details: parsed.error },
        { status: 400 }
      );
    }

    const result = await requestPairingCode(parsed.data.phoneNumber);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to generate pairing code' }, { status: 400 });
    }

    return NextResponse.json({ success: true, pairingCode: result.pairingCode });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to request pairing code', details: error.message },
      { status: 500 }
    );
  }
}
