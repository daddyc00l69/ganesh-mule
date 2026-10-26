import { NextRequest, NextResponse } from 'next/server';
import { getLiveOrderById } from '@/lib/orders/store';
import { createDelhiveryShipment } from '@/lib/shipping/delhivery';
import { getCurrentUser } from '@/lib/auth/server';
import { MOCK_AUDIT_LOGS } from '@/lib/mock-data';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    // Allow server-side internal calls or authenticated staff
    const body = await req.json();
    const { orderNumber, mode, forceRegenerate } = body as {
      orderNumber?: string;
      mode?: 'Express' | 'Surface';
      forceRegenerate?: boolean;
    };

    if (!orderNumber) {
      return NextResponse.json(
        { error: 'Missing required field: orderNumber' },
        { status: 400 }
      );
    }

    const order = getLiveOrderById(orderNumber);
    if (!order) {
      return NextResponse.json(
        { error: `Order #${orderNumber} not found` },
        { status: 404 }
      );
    }

    // Only verified PAID orders can be dispatched on Delhivery One
    if (order.paymentStatus !== 'PAID') {
      return NextResponse.json(
        { error: 'Cannot book courier dispatch for unconfirmed order.' },
        { status: 400 }
      );
    }

    const result = await createDelhiveryShipment(order, { mode, forceRegenerate });

    // Record audit event
    MOCK_AUDIT_LOGS.unshift({
      id: `audit-delhivery-${Date.now()}`,
      actorId: user?.id || 'sys-auto',
      actorName: user?.name || 'Delhivery One Automation',
      actorEmail: user?.email || 'automation@one.delhivery.com',
      action: 'DELHIVERY_SHIPMENT_BOOKED',
      entityType: 'Order',
      entityId: order.orderNumber,
      metadata: {
        waybill: result.waybill,
        carrier: result.carrier,
        trackingUrl: result.trackingUrl,
        labelUrl: result.labelUrl,
      },
      ipAddress: '127.0.0.1',
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      shipment: result,
      message: `Delhivery One shipment successfully created with AWB: ${result.waybill}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create Delhivery shipment', details: error.message },
      { status: 500 }
    );
  }
}
