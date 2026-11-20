import { NextRequest, NextResponse } from 'next/server';
import { requireAuthInProduction } from '@/lib/auth/server';
import { PERMISSIONS } from '@/lib/permissions';
import { prisma, isDatabaseOnline } from '@/lib/db';
import { reloadOrdersFromDisk, getLiveOrders } from '@/lib/orders/store';
import { getLiveProducts } from '@/lib/inventory/store';
import { MOCK_MANAGERS } from '@/lib/mock-data';

function escapeCsvField(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET(req: NextRequest) {
  const auth = await requireAuthInProduction('ADMIN', PERMISSIONS.REPORTS_READ);
  if ('response' in auth) return auth.response;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'orders'; // 'orders' | 'customers' | 'products' | 'revenue' | 'managers'

  const dbOnline = await isDatabaseOnline();
  const bom = '\uFEFF'; // Excel UTF-8 BOM

  if (type === 'orders') {
    let ordersList: any[] = [];
    if (dbOnline) {
      try {
        const dbOrders = await prisma.order.findMany({
          include: { items: true, payments: true },
          orderBy: { createdAt: 'desc' },
        });
        if (dbOrders.length > 0) {
          ordersList = dbOrders;
        }
      } catch {}
    }
    if (ordersList.length === 0) {
      ordersList = reloadOrdersFromDisk();
    }

    const headers = [
      'Order Number',
      'Date (UTC)',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Shipping City',
      'Shipping State',
      'Postal Code',
      'Items Summary',
      'Subtotal (INR)',
      'Shipping (INR)',
      'Tax (INR)',
      'Discount (INR)',
      'Total Amount (INR)',
      'Order Status',
      'Payment Status',
      'Tracking Number',
    ];

    const rows = ordersList.map((o) => {
      const addr = typeof o.shippingAddress === 'object' ? o.shippingAddress : {};
      const itemsStr = Array.isArray(o.items)
        ? o.items.map((it: any) => `${it.productName || it.name} (${it.weight || '500g'}) x${it.quantity}`).join('; ')
        : '';
      return [
        escapeCsvField(o.orderNumber),
        escapeCsvField(o.createdAt ? new Date(o.createdAt).toISOString() : ''),
        escapeCsvField(o.customerName),
        escapeCsvField(o.customerEmail),
        escapeCsvField(o.customerPhone || ''),
        escapeCsvField(addr.city || ''),
        escapeCsvField(addr.state || ''),
        escapeCsvField(addr.postalCode || ''),
        escapeCsvField(itemsStr),
        escapeCsvField((o.subtotal / 100).toFixed(2)),
        escapeCsvField((o.shippingCost / 100).toFixed(2)),
        escapeCsvField((o.taxAmount / 100).toFixed(2)),
        escapeCsvField((o.discountAmount / 100).toFixed(2)),
        escapeCsvField((o.totalAmount / 100).toFixed(2)),
        escapeCsvField(o.orderStatus),
        escapeCsvField(o.paymentStatus),
        escapeCsvField(o.trackingNumber || ''),
      ].join(',');
    });

    const csvData = bom + [headers.join(','), ...rows].join('\r\n');
    return new NextResponse(csvData, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="ganesh_honey_orders_${Date.now()}.csv"`,
      },
    });
  }

  if (type === 'customers') {
    let ordersList = reloadOrdersFromDisk();
    let dbUsers: any[] = [];
    if (dbOnline) {
      try {
        const dbOrders = await prisma.order.findMany({ select: { customerName: true, customerEmail: true, customerPhone: true, totalAmount: true, createdAt: true } });
        if (dbOrders.length > 0) ordersList = dbOrders as any;
        dbUsers = await prisma.user.findMany({
          where: { role: 'CUSTOMER' },
          select: { id: true, name: true, email: true, createdAt: true, customerProfile: true },
        });
      } catch {}
    }

    const customerMap = new Map<string, { name: string; email: string; phone: string; count: number; totalSpent: number; lastOrder: string; registeredAt?: string }>();

    ordersList.forEach((o) => {
      const email = o.customerEmail?.toLowerCase().trim();
      if (!email) return;
      const existing = customerMap.get(email);
      if (existing) {
        existing.count += 1;
        existing.totalSpent += o.totalAmount || 0;
        if (new Date(o.createdAt) > new Date(existing.lastOrder)) {
          existing.lastOrder = o.createdAt;
        }
      } else {
        customerMap.set(email, {
          name: o.customerName || 'Customer',
          email,
          phone: o.customerPhone || '',
          count: 1,
          totalSpent: o.totalAmount || 0,
          lastOrder: o.createdAt || new Date().toISOString(),
        });
      }
    });

    dbUsers.forEach((u) => {
      const email = u.email?.toLowerCase().trim();
      const existing = customerMap.get(email);
      if (existing) {
        existing.registeredAt = u.createdAt.toISOString();
        if (u.customerProfile?.phone && !existing.phone) existing.phone = u.customerProfile.phone;
      } else {
        customerMap.set(email, {
          name: u.name,
          email,
          phone: u.customerProfile?.phone || '',
          count: 0,
          totalSpent: 0,
          lastOrder: 'N/A',
          registeredAt: u.createdAt.toISOString(),
        });
      }
    });

    const headers = [
      'Customer Name',
      'Email Address',
      'Phone Number',
      'Total Orders',
      'Lifetime Value (INR)',
      'Last Purchase Date',
      'Registration Date',
    ];

    const rows = Array.from(customerMap.values()).map((c) => [
      escapeCsvField(c.name),
      escapeCsvField(c.email),
      escapeCsvField(c.phone),
      escapeCsvField(c.count),
      escapeCsvField((c.totalSpent / 100).toFixed(2)),
      escapeCsvField(c.lastOrder),
      escapeCsvField(c.registeredAt || 'Guest Checkout'),
    ].join(','));

    const csvData = bom + [headers.join(','), ...rows].join('\r\n');
    return new NextResponse(csvData, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="ganesh_honey_customers_${Date.now()}.csv"`,
      },
    });
  }

  if (type === 'products') {
    let prods: any[] = [];
    if (dbOnline) {
      try {
        const dbProds = await prisma.product.findMany({
          include: { category: true },
          orderBy: { name: 'asc' },
        });
        if (dbProds.length > 0) prods = dbProds;
      } catch {}
    }
    if (prods.length === 0) {
      prods = getLiveProducts();
    }

    const headers = [
      'SKU',
      'Product Name',
      'Category',
      'Weight',
      'Selling Price (INR)',
      'MRP / Compare Price (INR)',
      'Stock Quantity',
      'Low Stock Threshold',
      'Availability Status',
    ];

    const rows = prods.map((p) => [
      escapeCsvField(p.sku),
      escapeCsvField(p.name),
      escapeCsvField(p.category?.name || 'Raw Wild Honey'),
      escapeCsvField(p.weight || (p.weightGrams ? `${p.weightGrams}g` : '500g')),
      escapeCsvField((p.price / 100).toFixed(2)),
      escapeCsvField(p.compareAtPrice ? (p.compareAtPrice / 100).toFixed(2) : ''),
      escapeCsvField(p.stockQuantity),
      escapeCsvField(p.lowStockThreshold),
      escapeCsvField(p.isPublished ? 'Active / In Stock' : 'Discontinued / Unlisted'),
    ].join(','));

    const csvData = bom + [headers.join(','), ...rows].join('\r\n');
    return new NextResponse(csvData, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="ganesh_honey_inventory_${Date.now()}.csv"`,
      },
    });
  }

  if (type === 'revenue') {
    const ordersList = reloadOrdersFromDisk();
    const dayMap = new Map<string, { revenue: number; orders: number; taxes: number; shipping: number; discounts: number }>();

    ordersList.forEach((o) => {
      const dateKey = o.createdAt ? o.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10);
      const existing = dayMap.get(dateKey) || { revenue: 0, orders: 0, taxes: 0, shipping: 0, discounts: 0 };
      existing.revenue += o.totalAmount || 0;
      existing.orders += 1;
      existing.taxes += o.taxAmount || 0;
      existing.shipping += o.shippingCost || 0;
      existing.discounts += o.discountAmount || 0;
      dayMap.set(dateKey, existing);
    });

    const headers = [
      'Date (YYYY-MM-DD)',
      'Total Orders',
      'Gross Sales (INR)',
      'Tax Collected (INR)',
      'Shipping Collected (INR)',
      'Discounts Given (INR)',
      'Average Order Value (INR)',
    ];

    const rows = Array.from(dayMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([dateKey, stats]) => {
        const aov = stats.orders > 0 ? (stats.revenue / stats.orders / 100).toFixed(2) : '0.00';
        return [
          escapeCsvField(dateKey),
          escapeCsvField(stats.orders),
          escapeCsvField((stats.revenue / 100).toFixed(2)),
          escapeCsvField((stats.taxes / 100).toFixed(2)),
          escapeCsvField((stats.shipping / 100).toFixed(2)),
          escapeCsvField((stats.discounts / 100).toFixed(2)),
          escapeCsvField(aov),
        ].join(',');
      });

    const csvData = bom + [headers.join(','), ...rows].join('\r\n');
    return new NextResponse(csvData, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="ganesh_honey_revenue_${Date.now()}.csv"`,
      },
    });
  }

  return NextResponse.json({ error: 'Invalid export type requested' }, { status: 400 });
}
