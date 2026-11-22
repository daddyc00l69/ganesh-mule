import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { prisma, isDatabaseOnline } from '@/lib/db';
import { getLiveOrders } from '@/lib/orders/store';

export async function GET(req: NextRequest) {
  const auth = await requireAuth('DEVELOPER');
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim().toLowerCase() || '';
  const status = searchParams.get('status') || ''; // 'PAID' | 'PENDING' | 'REFUNDED'
  const settlement = searchParams.get('settlement') || ''; // 'SETTLED' | 'PENDING'
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(5, parseInt(searchParams.get('limit') || '25', 10)));

  const dbOnline = await isDatabaseOnline();
  let transactionsList: any[] = [];
  let totalCount = 0;

  if (dbOnline) {
    try {
      const where: any = {};
      if (q) {
        where.OR = [
          { orderNumber: { contains: q, mode: 'insensitive' } },
          { customerRef: { contains: q, mode: 'insensitive' } },
          { paymentRef: { contains: q, mode: 'insensitive' } },
        ];
      }
      if (status) {
        where.paymentStatus = status;
      }
      if (settlement) {
        where.settlementStatus = settlement;
      }

      totalCount = await prisma.platformTransaction.count({ where });
      transactionsList = await prisma.platformTransaction.findMany({
        where,
        include: {
          invoice: true,
          order: {
            select: {
              customerName: true,
              customerEmail: true,
              totalAmount: true,
              orderStatus: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });
    } catch (err) {
      console.warn('[TransactionsAPI] Database query error:', err);
    }
  }

  // Fallback to in-memory live orders if DB empty
  if (transactionsList.length === 0 && page === 1) {
    const liveOrders = getLiveOrders();
    let filtered = liveOrders.map((o: any) => {
      const snap = o.financialSnapshot || {};
      const platformFee = snap.platformFeeBasePaise || o.platformFee || 3000;
      const platformGst = snap.platformGstPaise || o.platformFeeGst || 540;
      return {
        id: `tx-${o.id}`,
        orderId: o.id,
        orderNumber: o.orderNumber,
        customerRef: (o.customerEmail || 'customer@gmail.com').replace(/(.{2})(.*)(?=@)/, '$1***'),
        paymentRef: o.payments?.[0]?.razorpayPaymentId || 'pay_online',
        grossOrderAmountPaise: o.totalAmount || 89900,
        platformFeePaise: platformFee,
        platformGstRate: 18.0,
        platformGstPaise: platformGst,
        totalPlatformServicePaise: platformFee + platformGst,
        paymentStatus: o.paymentStatus || 'PAID',
        settlementStatus: o.paymentStatus === 'PAID' ? 'SETTLED' : 'PENDING',
        createdAt: o.createdAt || new Date().toISOString(),
        order: {
          customerName: o.customerName,
          customerEmail: o.customerEmail,
          totalAmount: o.totalAmount,
          orderStatus: o.orderStatus,
        },
      };
    });

    if (q) {
      filtered = filtered.filter(
        (t) =>
          t.orderNumber.toLowerCase().includes(q) ||
          t.customerRef.toLowerCase().includes(q) ||
          (t.paymentRef && t.paymentRef.toLowerCase().includes(q))
      );
    }
    if (status) {
      filtered = filtered.filter((t) => t.paymentStatus === status);
    }
    if (settlement) {
      filtered = filtered.filter((t) => t.settlementStatus === settlement);
    }

    totalCount = filtered.length;
    transactionsList = filtered.slice((page - 1) * limit, page * limit);
  }

  return NextResponse.json({
    success: true,
    transactions: transactionsList,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
    },
  });
}
