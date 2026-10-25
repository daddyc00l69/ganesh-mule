import { NextRequest, NextResponse } from 'next/server';
import { getLiveOrders, addLiveOrder } from '@/lib/orders/store';
import { prisma, isDatabaseOnline } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/server';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email')?.toLowerCase().trim();

    // Strict Security Guard: Only authenticated ADMIN/MANAGER or verified customer for their own email
    const isStaff = user && (user.role === 'ADMIN' || user.role === 'MANAGER');
    const isOwnerCustomer = user && email && user.email.toLowerCase() === email;

    if (!isStaff && !isOwnerCustomer) {
      return NextResponse.json(
        { error: 'Unauthorized: Staff credentials required to view orders' },
        { status: 401 }
      );
    }

    const status = searchParams.get('status');
    const search = searchParams.get('search')?.toLowerCase().trim();
    const manager = searchParams.get('manager')?.toLowerCase().trim();
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;

    let orders = getLiveOrders();

    // If database is online, we can optionally synchronize with DB
    try {
      const dbOnline = await isDatabaseOnline();
      if (dbOnline) {
        const dbOrders = await prisma.order.findMany({
          include: { items: true, payments: true },
          orderBy: { createdAt: 'desc' },
          take: limit || 100,
        });
        if (dbOrders.length > 0) {
          // Merge db orders into live orders store
          for (const dbo of dbOrders) {
            addLiveOrder({
              id: dbo.id,
              orderNumber: dbo.orderNumber,
              userId: dbo.userId || 'usr-guest',
              customerName: dbo.customerName,
              customerEmail: dbo.customerEmail,
              customerPhone: dbo.customerPhone,
              shippingAddress: dbo.shippingAddress as any,
              subtotal: dbo.subtotal,
              shippingCost: dbo.shippingCost,
              taxAmount: dbo.taxAmount,
              discountAmount: dbo.discountAmount,
              totalAmount: dbo.totalAmount,
              orderStatus: dbo.orderStatus as any,
              paymentStatus: dbo.paymentStatus as any,
              carrier: dbo.carrier || undefined,
              trackingNumber: dbo.trackingNumber || undefined,
              notes: dbo.notes || undefined,
              items: dbo.items.map((it) => ({
                id: it.id,
                orderId: dbo.id,
                productId: it.productId,
                productName: it.productName,
                sku: it.sku,
                price: it.price,
                quantity: it.quantity,
                total: it.total,
              })),
              payments: dbo.payments.map((p) => ({
                id: p.id,
                provider: p.provider as any,
                razorpayOrderId: p.razorpayOrderId || undefined,
                amount: p.amount,
                currency: p.currency,
                status: p.status as any,
                razorpayPaymentId: p.razorpayPaymentId || undefined,
              })),
              createdAt: dbo.createdAt.toISOString(),
              updatedAt: dbo.updatedAt.toISOString(),
            });
          }
          orders = getLiveOrders();
        }
      }
    } catch {
      // Use in-memory live orders
    }

    // Apply Filters
    if (status && status !== 'ALL') {
      orders = orders.filter((o) => o.orderStatus === status);
    }

    if (email) {
      orders = orders.filter((o) => o.customerEmail?.toLowerCase() === email);
    }

    if (manager) {
      orders = orders.filter((o) => o.assignedManagerName?.toLowerCase() === manager);
    }

    if (search) {
      orders = orders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(search) ||
          o.customerName.toLowerCase().includes(search) ||
          o.customerEmail.toLowerCase().includes(search) ||
          (o.customerPhone && o.customerPhone.includes(search)) ||
          (o.trackingNumber && o.trackingNumber.toLowerCase().includes(search))
      );
    }

    if (limit && limit > 0) {
      orders = orders.slice(0, limit);
    }

    return NextResponse.json({
      success: true,
      count: orders.length,
      orders,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch orders', details: error.message }, { status: 500 });
  }
}
