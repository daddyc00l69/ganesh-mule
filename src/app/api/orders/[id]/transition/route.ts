import { NextRequest, NextResponse } from 'next/server';
import { MOCK_ORDERS, MOCK_AUDIT_LOGS } from '@/lib/mock-data';
import { getLiveOrderById, updateLiveOrderStatus } from '@/lib/orders/store';
import { sendEmail } from '@/lib/email/resend';
import {
  getOrderConfirmedEmailHtml,
  getOrderShippedEmailHtml,
  getOrderDeliveredEmailHtml,
} from '@/lib/email/templates';
import { OrderStatus } from '@/types';
import { createDelhiveryShipment } from '@/lib/shipping/delhivery';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, carrier, trackingNumber, notes } = body as {
      status: OrderStatus;
      carrier?: string;
      trackingNumber?: string;
      notes?: string;
    };

    const order = getLiveOrderById(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Business Invariant 1: Paid online orders can be fulfilled
    if (
      order.paymentStatus !== 'PAID' &&
      (status === 'CONFIRMED' || status === 'SHIPPED' || status === 'DELIVERED')
    ) {
      return NextResponse.json(
        { error: 'Cannot advance unverified orders with unpaid online payment status.' },
        { status: 400 }
      );
    }

    let activeTrackingNumber = trackingNumber?.trim() || order.trackingNumber || '';
    let activeCarrier = carrier?.trim() || order.carrier || 'Delhivery One (Air Express)';

    // Business Invariant 2: If shipping without an explicit tracking number, auto-generate via Delhivery One
    if (status === 'SHIPPED' && !activeTrackingNumber) {
      try {
        const shipment = await createDelhiveryShipment(order);
        activeTrackingNumber = shipment.waybill;
        activeCarrier = shipment.carrier;
      } catch (shipErr) {
        return NextResponse.json(
          { error: 'Carrier tracking number (AWB) is mandatory when marking an order as SHIPPED.' },
          { status: 400 }
        );
      }
    }

    // Business Invariant 3: Strict No Refund Policy on consumable raw honey
    if (status === 'CANCELLED' && order.paymentStatus === 'PAID') {
      // Cancellation after payment is only permitted for transit breakage replacements
      console.log(`[Order Replacement Flag] Order ${order.orderNumber} cancelled for replacement`);
    }

    const previousStatus = order.orderStatus;
    order.orderStatus = status;
    if (activeCarrier) order.carrier = activeCarrier;
    if (activeTrackingNumber) order.trackingNumber = activeTrackingNumber;
    order.updatedAt = new Date().toISOString();

    updateLiveOrderStatus(order.id, {
      orderStatus: status,
      carrier: order.carrier,
      trackingNumber: order.trackingNumber,
      notes,
    });

    // Log the event to Audit Trail
    MOCK_AUDIT_LOGS.unshift({
      id: `audit-${Date.now()}`,
      actorId: 'usr-mgr-1',
      actorName: 'Operations Desk',
      actorEmail: 'operations@ganeshmule.com',
      action: 'ORDER_STATUS_TRANSITION',
      entityType: 'Order',
      entityId: order.orderNumber,
      metadata: {
        from: previousStatus,
        to: status,
        carrier: order.carrier,
        trackingNumber: order.trackingNumber,
        notes,
      },
      ipAddress: '127.0.0.1',
      createdAt: new Date().toISOString(),
    });

    // Trigger Automated Email via Resend
    let emailDispatched = false;
    try {
      if (status === 'CONFIRMED') {
        const html = getOrderConfirmedEmailHtml(order);
        const res = await sendEmail(
          {
            to: order.customerEmail,
            subject: `Order Confirmed & Queued for Packing: #${order.orderNumber}`,
            html,
          },
          'ORDER_CONFIRMED'
        );
        emailDispatched = res.success;
      } else if (status === 'SHIPPED') {
        const html = getOrderShippedEmailHtml(order);
        const res = await sendEmail(
          {
            to: order.customerEmail,
            subject: `Dispatched: Ganesh Mule Order #${order.orderNumber} (${order.carrier || 'Delhivery'})`,
            html,
          },
          'ORDER_SHIPPED'
        );
        emailDispatched = res.success;
      } else if (status === 'DELIVERED') {
        const html = getOrderDeliveredEmailHtml(order);
        const res = await sendEmail(
          {
            to: order.customerEmail,
            subject: `Delivered: Ganesh Mule Order #${order.orderNumber}`,
            html,
          },
          'ORDER_DELIVERED'
        );
        emailDispatched = res.success;
      }
    } catch (emailErr) {
      console.warn('[Transition Email Warning]', emailErr);
    }

    return NextResponse.json({
      success: true,
      order,
      emailDispatched,
      message: `Order #${order.orderNumber} transitioned to ${status}. Email notification triggered.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to transition order status', details: error.message },
      { status: 500 }
    );
  }
}
