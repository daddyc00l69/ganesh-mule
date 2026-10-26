import { NextRequest, NextResponse } from 'next/server';
import { syncAllActiveDelhiveryOrders } from '@/lib/shipping/delhivery';
import { reloadOrdersFromDisk } from '@/lib/orders/store';

export async function POST(req: NextRequest) {
  try {
    const result = await syncAllActiveDelhiveryOrders();
    const updatedOrders = reloadOrdersFromDisk();

    return NextResponse.json({
      ...result,
      message: `Delhivery live sync complete: ${result.totalChecked} checked, ${result.cancelledCount} cancelled, ${result.updatedCount} status updates.`,
      ordersCount: updatedOrders.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to sync Delhivery orders', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const result = await syncAllActiveDelhiveryOrders();
    const updatedOrders = reloadOrdersFromDisk();

    return NextResponse.json({
      ...result,
      message: `Delhivery live sync complete: ${result.totalChecked} checked, ${result.cancelledCount} cancelled, ${result.updatedCount} status updates.`,
      ordersCount: updatedOrders.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to sync Delhivery orders', details: error.message },
      { status: 500 }
    );
  }
}
