import { NextRequest, NextResponse } from 'next/server';
import { prisma, isDatabaseOnline } from '@/lib/db';
import { MOCK_ORDERS } from '@/lib/mock-data';
import { buildTaxInvoiceData } from '@/lib/invoice';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;
    if (!orderNumber) {
      return NextResponse.json({ error: 'Order number is required' }, { status: 400 });
    }

    let order: any = null;
    const dbOnline = await isDatabaseOnline();

    // 1. Try fetching from Prisma DB if online
    if (dbOnline) {
      try {
        order = await prisma.order.findUnique({
          where: { orderNumber },
          include: {
            items: true,
            payments: true,
          },
        });
      } catch {
        // Prisma offline / mock fallback
      }
    }

    // 2. Fallback to in-memory order registry
    if (!order) {
      order = MOCK_ORDERS.find(
        (o) =>
          o.orderNumber.toLowerCase() === orderNumber.toLowerCase() ||
          o.id.toLowerCase() === orderNumber.toLowerCase()
      );
    }

    if (!order) {
      return NextResponse.json(
        { error: `Order "${orderNumber}" not found` },
        { status: 404 }
      );
    }

    const invoiceData = buildTaxInvoiceData(order);

    return NextResponse.json({
      success: true,
      invoice: invoiceData,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to generate tax invoice', details: err.message },
      { status: 500 }
    );
  }
}
