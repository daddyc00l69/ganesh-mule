import { NextRequest, NextResponse } from 'next/server';
import { prisma, isDatabaseOnline } from '@/lib/db';
import { MOCK_ORDERS } from '@/lib/mock-data';
import { getLiveOrders, getLiveOrderById } from '@/lib/orders/store';
import { buildTaxInvoiceData } from '@/lib/invoice';
import { calculateDelhiveryShippingCost, calculateConsignmentWeightGrams } from '@/lib/shipping/delhivery';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber: rawOrderNumber } = await params;
    if (!rawOrderNumber) {
      return NextResponse.json({ error: 'Order number is required' }, { status: 400 });
    }

    const orderNumber = decodeURIComponent(rawOrderNumber).trim();
    const cleanNumber = orderNumber.replace(/^#/, '').trim();

    let order: any = null;

    // 1. Check live in-memory store (covers newly placed checkout orders & transitions)
    order =
      getLiveOrderById(cleanNumber) ||
      getLiveOrderById(orderNumber) ||
      getLiveOrders().find(
        (o) =>
          o.orderNumber.toLowerCase() === cleanNumber.toLowerCase() ||
          o.orderNumber.toLowerCase() === orderNumber.toLowerCase() ||
          o.id.toLowerCase() === cleanNumber.toLowerCase() ||
          o.id.toLowerCase() === orderNumber.toLowerCase()
      );

    // 2. Try fetching from Prisma DB if online
    if (!order) {
      const dbOnline = await isDatabaseOnline();
      if (dbOnline) {
        try {
          order = await prisma.order.findFirst({
            where: {
              OR: [
                { orderNumber: cleanNumber },
                { orderNumber: orderNumber },
                { id: cleanNumber },
                { id: orderNumber },
              ],
            },
            include: {
              items: true,
              payments: true,
            },
          });
        } catch {
          // Prisma offline
        }
      }
    }

    // 3. Fallback to MOCK_ORDERS array
    if (!order) {
      order = MOCK_ORDERS.find(
        (o) =>
          o.orderNumber.toLowerCase() === cleanNumber.toLowerCase() ||
          o.orderNumber.toLowerCase() === orderNumber.toLowerCase() ||
          o.id.toLowerCase() === cleanNumber.toLowerCase() ||
          o.id.toLowerCase() === orderNumber.toLowerCase() ||
          o.orderNumber.toLowerCase().includes(cleanNumber.toLowerCase())
      );
    }

    if (!order) {
      return NextResponse.json(
        { error: `Order "${orderNumber}" not found. Please verify the order number.` },
        { status: 404 }
      );
    }

    // Ensure real Delhivery courier pricing is calculated if missing
    if (!order.delhiveryPricing && order.shippingAddress?.postalCode) {
      try {
        const weightGrams = calculateConsignmentWeightGrams(order.items);
        const mode = order.carrier?.toLowerCase().includes('surface') ? 'Surface' : 'Express';
        const costRes = await calculateDelhiveryShippingCost({
          destinationPincode: order.shippingAddress.postalCode,
          weightGrams,
          mode,
        });
        if (costRes?.pricing) {
          order.delhiveryPricing = costRes;
        }
      } catch (err) {
        console.warn('[Invoice Delhivery Calculation]', err);
      }
    }

    const invoiceData = buildTaxInvoiceData(order);

    return NextResponse.json({
      success: true,
      invoice: invoiceData,
      order,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to generate tax invoice', details: err.message },
      { status: 500 }
    );
  }
}
