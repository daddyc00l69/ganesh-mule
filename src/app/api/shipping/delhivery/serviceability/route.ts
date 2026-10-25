import { NextRequest, NextResponse } from 'next/server';
import { checkDelhiveryServiceability } from '@/lib/shipping/delhivery';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pincode = searchParams.get('pincode') || searchParams.get('pin');

    if (!pincode) {
      return NextResponse.json(
        { error: 'Query parameter "pincode" is required' },
        { status: 400 }
      );
    }

    const cleanPin = pincode.replace(/\D/g, '').slice(0, 6);
    if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
      return NextResponse.json(
        { error: 'Invalid 6-digit Indian PIN code' },
        { status: 400 }
      );
    }

    const result = await checkDelhiveryServiceability(cleanPin);
    return NextResponse.json({
      success: true,
      serviceability: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to verify Delhivery serviceability', details: error.message },
      { status: 500 }
    );
  }
}
