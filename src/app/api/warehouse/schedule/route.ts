import { NextResponse } from 'next/server';
import { getWarehouseOperationalStatus, WAREHOUSE_DAILY_SCHEDULE } from '@/lib/warehouse/schedule';
import { MOCK_ORDERS } from '@/lib/mock-data';

export async function GET() {
  const status = getWarehouseOperationalStatus();

  const processingCount = MOCK_ORDERS.filter(
    (o) => o.paymentStatus === 'PAID' && o.orderStatus === 'PROCESSING'
  ).length;

  const confirmedCount = MOCK_ORDERS.filter(
    (o) => o.orderStatus === 'CONFIRMED'
  ).length;

  const shippedCount = MOCK_ORDERS.filter(
    (o) => o.orderStatus === 'SHIPPED'
  ).length;

  return NextResponse.json({
    success: true,
    status,
    schedule: WAREHOUSE_DAILY_SCHEDULE,
    queue: {
      awaiting1230Reconcile: processingCount,
      confirmedForPicking: confirmedCount,
      inTransit: shippedCount,
      totalOrders: MOCK_ORDERS.length,
    },
  });
}
