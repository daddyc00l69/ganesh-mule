import { NextRequest, NextResponse } from 'next/server';
import { requireAuthInProduction } from '@/lib/auth/server';
import { PERMISSIONS } from '@/lib/permissions';
import { prisma, isDatabaseOnline } from '@/lib/db';
import { reloadOrdersFromDisk } from '@/lib/orders/store';

export async function GET(req: NextRequest) {
  const auth = await requireAuthInProduction('ADMIN', PERMISSIONS.CUSTOMERS_READ);
  if ('response' in auth) return auth.response;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('q')?.toLowerCase().trim();

  const dbOnline = await isDatabaseOnline();
  let ordersList = reloadOrdersFromDisk();
  let dbUsers: any[] = [];

  if (dbOnline) {
    try {
      const [allDbOrders, allDbUsers] = await Promise.all([
        prisma.order.findMany({
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
            customerEmail: true,
            customerPhone: true,
            totalAmount: true,
            orderStatus: true,
            paymentStatus: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.findMany({
          where: { role: 'CUSTOMER' },
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            createdAt: true,
            customerProfile: { select: { phone: true, notes: true } },
          },
        }),
      ]);

      if (allDbOrders.length > 0) ordersList = allDbOrders as any;
      dbUsers = allDbUsers;
    } catch (err) {
      console.warn('[Admin Customers DB Error]', err);
    }
  }

  // Aggregate customer profile by email address
  const customerMap = new Map<
    string,
    {
      id: string;
      name: string;
      email: string;
      phone: string;
      avatarUrl?: string;
      ordersCount: number;
      totalSpent: number; // in minor units (paise)
      lastOrderDate: string;
      isRegistered: boolean;
      recentOrders: Array<{
        id: string;
        orderNumber: string;
        totalAmount: number;
        orderStatus: string;
        paymentStatus: string;
        createdAt: string;
      }>;
    }
  >();

  ordersList.forEach((o) => {
    const email = o.customerEmail?.toLowerCase().trim();
    if (!email) return;

    const existing = customerMap.get(email);
    if (existing) {
      existing.ordersCount += 1;
      existing.totalSpent += o.totalAmount || 0;
      if (new Date(o.createdAt) > new Date(existing.lastOrderDate)) {
        existing.lastOrderDate = o.createdAt;
      }
      if (existing.recentOrders.length < 5) {
        existing.recentOrders.push({
          id: o.id,
          orderNumber: o.orderNumber,
          totalAmount: o.totalAmount,
          orderStatus: o.orderStatus,
          paymentStatus: o.paymentStatus,
          createdAt: o.createdAt,
        });
      }
    } else {
      customerMap.set(email, {
        id: o.userId || `cust-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: o.customerName || 'Customer',
        email,
        phone: o.customerPhone || '',
        ordersCount: 1,
        totalSpent: o.totalAmount || 0,
        lastOrderDate: o.createdAt || new Date().toISOString(),
        isRegistered: false,
        recentOrders: [
          {
            id: o.id,
            orderNumber: o.orderNumber,
            totalAmount: o.totalAmount,
            orderStatus: o.orderStatus,
            paymentStatus: o.paymentStatus,
            createdAt: o.createdAt,
          },
        ],
      });
    }
  });

  // Merge registered DB users
  dbUsers.forEach((u) => {
    const email = u.email?.toLowerCase().trim();
    const existing = customerMap.get(email);
    if (existing) {
      existing.id = u.id;
      existing.name = u.name;
      existing.isRegistered = true;
      existing.avatarUrl = u.avatarUrl || undefined;
      if (u.customerProfile?.phone && !existing.phone) {
        existing.phone = u.customerProfile.phone;
      }
    } else {
      customerMap.set(email, {
        id: u.id,
        name: u.name,
        email,
        phone: u.customerProfile?.phone || '',
        avatarUrl: u.avatarUrl || undefined,
        ordersCount: 0,
        totalSpent: 0,
        lastOrderDate: 'N/A',
        isRegistered: true,
        recentOrders: [],
      });
    }
  });

  let customers = Array.from(customerMap.values());

  if (search) {
    customers = customers.filter(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        c.email.toLowerCase().includes(search) ||
        c.phone.includes(search)
    );
  }

  // Sort by highest LTV or recency
  customers.sort((a, b) => b.totalSpent - a.totalSpent);

  return NextResponse.json({
    customers,
    totalCount: customers.length,
    registeredCount: customers.filter((c) => c.isRegistered).length,
  });
}
