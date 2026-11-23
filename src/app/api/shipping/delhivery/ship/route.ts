import { NextRequest, NextResponse } from 'next/server';
import { getLiveOrderById } from '@/lib/orders/store';
import { createDelhiveryShipment } from '@/lib/shipping/delhivery';
import { sendDelhiveryDispatchWhatsAppAlert } from '@/lib/whatsapp/baileys-service';
import { getCurrentUser } from '@/lib/auth/server';
import { MOCK_AUDIT_LOGS } from '@/lib/mock-data';
import { prisma, isDatabaseOnline } from '@/lib/db';

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

    const effectiveMode: 'Express' | 'Surface' =
      mode || (order as any).shippingMode || (order.carrier?.toLowerCase().includes('air') ? 'Express' : 'Surface');
    const result = await createDelhiveryShipment(order, { mode: effectiveMode, forceRegenerate });

    // Dispatch Baileys WhatsApp dispatch alert to backend operations
    sendDelhiveryDispatchWhatsAppAlert({
      orderNumber: order.orderNumber,
      awbNumber: result.waybill,
      carrier: result.carrier,
      originPin: '411004',
      destinationPin: (order as any).shippingAddress?.postalCode || (order as any).shippingPostalCode || (order as any).postalCode || '',
      destinationCity: (order as any).shippingAddress?.city || (order as any).shippingCity || (order as any).city || 'India',
    }).catch((e) => console.warn('[Delhivery WhatsApp Dispatch Alert Warning]', e));

    // Update PostgreSQL database if online so changes persist across all serverless instances
    try {
      const dbOnline = await isDatabaseOnline();
      if (dbOnline) {
        await prisma.order.updateMany({
          where: { orderNumber: order.orderNumber },
          data: {
            trackingNumber: result.waybill,
            carrier: result.carrier,
            orderStatus: 'SHIPPED',
          },
        });
      }
    } catch (dbErr) {
      console.warn('[Delhivery Ship Route] DB sync warning:', dbErr);
    }

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
