import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { cancelDelhiveryShipment } from '@/lib/shipping/delhivery';
import { getCurrentUser } from '@/lib/auth/server';

const CancelSchema = z.object({
  waybill: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized staff access' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CancelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Valid waybill number required' }, { status: 400 });
    }

    const result = await cancelDelhiveryShipment(parsed.data.waybill);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to cancel shipment on Delhivery' },
      { status: 500 }
    );
  }
}
