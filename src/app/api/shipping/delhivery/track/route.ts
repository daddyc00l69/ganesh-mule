import { NextRequest, NextResponse } from 'next/server';
import { getDelhiveryTracking } from '@/lib/shipping/delhivery';
import { getLiveOrderById, getLiveOrders } from '@/lib/orders/store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let awb = searchParams.get('awb') || searchParams.get('trackingNumber') || searchParams.get('waybill');
    const orderNumber = searchParams.get('orderNumber') || undefined;

    // If AWB is not directly provided, resolve from orderNumber
    if (!awb && orderNumber) {
      const order =
        getLiveOrderById(orderNumber) ||
        getLiveOrders().find((o) => o.orderNumber.toLowerCase() === orderNumber.toLowerCase());
      if (order?.trackingNumber || order?.delhiveryWaybill) {
        awb = (order.delhiveryWaybill || order.trackingNumber) ?? null;
      }
    }

    if (!awb) {
      return NextResponse.json(
        { error: 'Query parameter "awb", "trackingNumber", or valid "orderNumber" is required' },
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
