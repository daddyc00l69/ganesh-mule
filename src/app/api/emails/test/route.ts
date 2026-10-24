import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, EMAIL_AUDIT_LOGS, ADMIN_NOTIFICATION_EMAIL } from '@/lib/email/resend';
import {
  getOrderConfirmationEmailHtml,
  getPaymentFailedEmailHtml,
  getOrderConfirmedEmailHtml,
  getOrderShippedEmailHtml,
  getOrderDeliveredEmailHtml,
  getNewOrderAdminAlertEmailHtml,
  getDailyManagerReportEmailHtml,
  getWarehouseBatchEmailHtml,
} from '@/lib/email/templates';
import { MOCK_ORDERS, MOCK_MANAGERS, MOCK_COUPONS } from '@/lib/mock-data';
import { OrderRecord } from '@/types';

// Sample demonstration order for test emails if store is fresh
const SAMPLE_TEST_ORDER: OrderRecord = {
  id: 'ord-sample-test',
  orderNumber: 'SG-HNY-TEST-001',
  userId: 'usr-cust-test',
  customerName: 'Aarav Deshmukh',
  customerEmail: 'aarav.d@gmail.com',
  customerPhone: '+91 98201 12345',
  shippingAddress: {
    fullName: 'Aarav Deshmukh',
    phone: '+91 98201 12345',
    street: '402 Oberoi Sky Heights, Lokhandwala Complex',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400053',
    country: 'India',
  },
  subtotal: 184800,
  shippingCost: 0,
  taxAmount: 21960,
  discountAmount: 27720,
  totalAmount: 179040,
  orderStatus: 'PROCESSING',
  paymentStatus: 'PAID',
  trackingNumber: 'DELHIVERY-AIR-992288',
  carrier: 'Delhivery Insured Air',
  items: [
    {
      id: 'item-1',
      orderId: 'ord-sample-test',
      productId: 'prod-wild-forest-500g',
      productName: 'Wild Forest Raw Honey (500g)',
      sku: 'HNY-WLD-500',
      price: 69900,
      quantity: 2,
      total: 139800,
    },
    {
      id: 'item-2',
      orderId: 'ord-sample-test',
      productId: 'prod-olivewood-dipper',
      productName: 'Handcrafted Olive Wood Honey Dipper',
      sku: 'ACC-DIP-01',
      price: 45000,
      quantity: 1,
      total: 45000,
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      type = 'ORDER_CONFIRMATION',
      to = 'aradhyetushar@gmail.com', // Resend authenticated account address
      orderNumber,
    } = body as {
      type?: string;
      to?: string;
      orderNumber?: string;
    };

    const targetOrder =
      MOCK_ORDERS.find((o) => o.orderNumber === orderNumber) || SAMPLE_TEST_ORDER;

    let html = '';
    let subject = '';

    switch (type) {
      case 'ORDER_CONFIRMATION':
        html = getOrderConfirmationEmailHtml(targetOrder);
        subject = `[Test] Confirmed: Ganesh Mule Order #${targetOrder.orderNumber}`;
        break;
      case 'PAYMENT_FAILED':
        html = getPaymentFailedEmailHtml(
          targetOrder,
          'Card authorization declined by issuing bank (3D Secure timeout)'
        );
        subject = `[Test] Payment Incomplete for Order #${targetOrder.orderNumber} - Resume Checkout`;
        break;
      case 'ORDER_CONFIRMED':
        html = getOrderConfirmedEmailHtml(targetOrder);
        subject = `[Test] Order In Packing Queue: #${targetOrder.orderNumber}`;
        break;
      case 'ORDER_SHIPPED':
        html = getOrderShippedEmailHtml(targetOrder);
        subject = `[Test] Dispatched: Ganesh Mule Order #${targetOrder.orderNumber}`;
        break;
      case 'ORDER_DELIVERED':
        html = getOrderDeliveredEmailHtml(targetOrder);
        subject = `[Test] Delivered: Ganesh Mule Order #${targetOrder.orderNumber}`;
        break;
      case 'ADMIN_ALERT':
        html = getNewOrderAdminAlertEmailHtml(targetOrder);
        subject = `[Test] [New Order Alert] ₹${(targetOrder.totalAmount / 100).toFixed(2)} - #${targetOrder.orderNumber}`;
        break;
      case 'MANAGER_REPORT':
        html = getDailyManagerReportEmailHtml({
          date: new Date().toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
          totalOrders: 14,
          totalRevenue: 2845000,
          managers: MOCK_MANAGERS.map((m) => {
            const assigned = MOCK_COUPONS.filter((c) =>
              c.assignedManagerIds?.includes(m.userId)
            ).map((c) => c.code);
            return {
              name: m.name,
              email: m.email,
              department: m.department || 'Operations',
              assignedCoupons: assigned,
              ordersCount: assigned.length * 4,
              revenue: assigned.length * 68000,
              discountGiven: assigned.length * 8500,
              supportTickets: 3,
            };
          }),
        });
        subject = `[Test] Daily Operations & Manager Performance Report`;
        break;
      case 'WAREHOUSE_BATCH':
        html = getWarehouseBatchEmailHtml({
          batchId: `WH-TEST-${Date.now().toString().slice(-4)}`,
          reconciledAt: '12:30:00 AM IST',
          ordersCount: 8,
          totalUnits: 16,
          skuSummary: [
            { sku: 'HNY-WLD-500', name: 'Wild Forest Raw Honey (500g)', quantity: 10 },
            { sku: 'HNY-ACA-500', name: 'Himalayan White Acacia Honey (500g)', quantity: 4 },
            { sku: 'ACC-DIP-01', name: 'Handcrafted Olive Wood Honey Dipper', quantity: 2 },
          ],
        });
        subject = `[Test] [Warehouse Batch] 12:30 AM IST Reconciled Fulfillment Queue`;
        break;
      default:
        return NextResponse.json({ error: `Unknown email type: ${type}` }, { status: 400 });
    }

    const result = await sendEmail(
      {
        to,
        subject,
        html,
      },
      type
    );

    return NextResponse.json({
      success: result.success,
      type,
      recipient: to,
      subject,
      messageId: result.messageId,
      error: result.error,
      auditLogs: EMAIL_AUDIT_LOGS.slice(0, 5),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to send test email', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    availableTypes: [
      { id: 'ORDER_CONFIRMATION', name: 'Customer Order Confirmation & Raw Honey Care Guide' },
      { id: 'PAYMENT_FAILED', name: 'Customer Payment Incomplete Recovery' },
      { id: 'ORDER_CONFIRMED', name: 'Customer Order Confirmed & Warehouse Queued' },
      { id: 'ORDER_SHIPPED', name: 'Customer Dispatched & Live Courier Tracking' },
      { id: 'ORDER_DELIVERED', name: 'Customer Delivered & Honey Sommelier Tasting Guide' },
      { id: 'ADMIN_ALERT', name: 'Admin & Manager High-Priority New Order Alert' },
      { id: 'MANAGER_REPORT', name: 'Executive Per-Manager Daily Performance Report' },
      { id: 'WAREHOUSE_BATCH', name: 'Warehouse 12:30 AM IST Reconciled Queue Alert' },
    ],
    defaultSender: 'Ganesh Mule Pure Honey <onboarding@resend.dev>',
    recentLogs: EMAIL_AUDIT_LOGS.slice(0, 10),
  });
}
