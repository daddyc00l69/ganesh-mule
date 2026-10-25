import { NextRequest, NextResponse } from 'next/server';
import { getDelhiveryTracking } from '@/lib/shipping/delhivery';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const awb = searchParams.get('awb') || searchParams.get('trackingNumber') || searchParams.get('waybill');
    const orderNumber = searchParams.get('orderNumber') || undefined;

    if (!awb) {
      return NextResponse.json(
        { error: 'Query parameter "awb" or "trackingNumber" is required' },
        { status: 400 }
      );
    }

    const tracking = await getDelhiveryTracking(awb, orderNumber);
    return NextResponse.json({
      success: true,
      tracking,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to retrieve Delhivery tracking data', details: error.message },
      { status: 500 }
    );
  }
}
