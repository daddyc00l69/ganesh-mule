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
  const timeRange = searchParams.get('range') || 'all'; // '7d' | '30d' | '90d' | '1y' | 'all'

  const dbOnline = await isDatabaseOnline();

  let transactions: any[] = [];
  let invoicesCount = 0;
  let refundsList: any[] = [];

  if (dbOnline) {
    try {
      transactions = await prisma.platformTransaction.findMany({
        orderBy: { createdAt: 'desc' },
      });
      invoicesCount = await prisma.platformInvoice.count();
      refundsList = await prisma.platformRefundRecord.findMany();
    } catch (err) {
      console.warn('[FinanceStats] Database fetch warning:', err);
    }
  }

  // If database transactions table is empty yet orders exist, synthesize platform metrics from live orders
  if (transactions.length === 0) {
    const liveOrders = getLiveOrders();
    transactions = liveOrders.map((o: any) => {
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
        createdAt: o.createdAt ? new Date(o.createdAt) : new Date(),
      };
    });
  }

  // Filter by time range if requested
  const now = new Date();
  let filterCutoff: Date | null = null;
  if (timeRange === '7d') {
    filterCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (timeRange === '30d') {
    filterCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (timeRange === '90d') {
    filterCutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  } else if (timeRange === '1y') {
    filterCutoff = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  }

  const filteredTransactions = filterCutoff
    ? transactions.filter((t) => new Date(t.createdAt) >= filterCutoff)
    : transactions;

  // Overview metric calculations
  let totalPlatformFeeRevenuePaise = 0;
  let totalPlatformGstCollectedPaise = 0;
  let successfulTransactionsCount = 0;
  let pendingSettlementPaise = 0;
  let refundedPlatformFeesPaise = 0;

  for (const t of filteredTransactions) {
    if (t.paymentStatus === 'PAID') {
      successfulTransactionsCount++;
      totalPlatformFeeRevenuePaise += t.platformFeePaise || 0;
      totalPlatformGstCollectedPaise += t.platformGstPaise || 0;
      if (t.settlementStatus === 'PENDING') {
        pendingSettlementPaise += t.totalPlatformServicePaise || 0;
      }
    }
  }

  for (const r of refundsList) {
    refundedPlatformFeesPaise += r.platformFeeRefundPaise || 0;
  }

  const netPlatformRevenuePaise = Math.max(
    0,
    totalPlatformFeeRevenuePaise - refundedPlatformFeesPaise
  );

  // Time-series chart buckets (Last 7 days or grouped by date)
  const chartMap = new Map<string, { date: string; feeRevenue: number; gstCollected: number; transactions: number }>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateKey = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    chartMap.set(dateKey, { date: dateKey, feeRevenue: 0, gstCollected: 0, transactions: 0 });
  }

  for (const t of filteredTransactions) {
    if (t.paymentStatus === 'PAID') {
      const d = new Date(t.createdAt);
      const dateKey = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      if (chartMap.has(dateKey)) {
        const item = chartMap.get(dateKey)!;
        item.feeRevenue += Math.round((t.platformFeePaise || 0) / 100);
        item.gstCollected += Math.round((t.platformGstPaise || 0) / 100);
        item.transactions += 1;
      }
    }
  }

  const timeSeries = Array.from(chartMap.values());

  return NextResponse.json({
    success: true,
    metrics: {
      totalPlatformFeeRevenuePaise,
      totalPlatformFeeRevenueRupees: totalPlatformFeeRevenuePaise / 100,
      totalPlatformGstCollectedPaise,
      totalPlatformGstCollectedRupees: totalPlatformGstCollectedPaise / 100,
      successfulTransactionsCount,
      pendingSettlementPaise,
      pendingSettlementRupees: pendingSettlementPaise / 100,
      refundedPlatformFeesPaise,
      refundedPlatformFeesRupees: refundedPlatformFeesPaise / 100,
      netPlatformRevenuePaise,
      netPlatformRevenueRupees: netPlatformRevenuePaise / 100,
      totalPlatformInvoicesCount: invoicesCount,
    },
    timeSeries,
    recentTransactions: filteredTransactions.slice(0, 10),
  });
}
