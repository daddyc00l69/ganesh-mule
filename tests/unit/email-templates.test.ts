import { describe, it, expect } from 'vitest';
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
import { OrderRecord } from '@/types';

const mockOrder: OrderRecord = {
  id: 'ord-test-email',
  orderNumber: 'SG-HNY-9901',
  userId: 'usr-test-1',
  customerName: 'Aarav Deshmukh',
  customerEmail: 'aarav.d@gmail.com',
  customerPhone: '+91 98201 12345',
  shippingAddress: {
    fullName: 'Aarav Deshmukh',
    phone: '+91 98201 12345',
    street: '402 Oberoi Sky Heights, Lokhandwala',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400053',
    country: 'India',
  },
  subtotal: 139800,
  shippingCost: 0,
  taxAmount: 18174,
  discountAmount: 20970,
  totalAmount: 137004,
  orderStatus: 'PROCESSING',
  paymentStatus: 'PAID',
  trackingNumber: 'DELHIVERY-AIR-4455',
  carrier: 'Delhivery Insured Air',
  items: [
    {
      id: 'item-1',
      orderId: 'ord-test-email',
      productId: 'prod-wild-forest-500g',
      productName: 'Wild Forest Raw Honey (500g)',
      sku: 'HNY-WLD-500',
      price: 69900,
      quantity: 2,
      total: 139800,
    },
  ],
  createdAt: '2026-10-24T10:00:00Z',
  updatedAt: '2026-10-24T10:05:00Z',
};

describe('Resend Email Templates & Telemetry Engine', () => {
  it('should generate customer order confirmation email with raw honey care guide and invoice links', () => {
    const html = getOrderConfirmationEmailHtml(mockOrder);
    expect(html).toContain('SG-HNY-9901');
    expect(html).toContain('Aarav Deshmukh');
    expect(html).toContain('Wild Forest Raw Honey (500g)');
    expect(html).toContain('100% PREPAID PAYMENT VERIFIED');
    expect(html).toContain('Essential Raw Honey Handling &amp; Storage Instructions');
    expect(html).toContain('Never heat this honey above 40°C');
    expect(html).toContain('12:30 AM IST');
    expect(html).toContain('/invoice/SG-HNY-9901');
  });

  it('should generate payment failed notification email with resume checkout link', () => {
    const html = getPaymentFailedEmailHtml(mockOrder, 'Bank 3D secure authentication timeout');
    expect(html).toContain('SG-HNY-9901');
    expect(html).toContain('PAYMENT INCOMPLETE');
    expect(html).toContain('Bank 3D secure authentication timeout');
    expect(html).toContain('Resume Checkout &amp; Complete Order');
    expect(html).toContain('/checkout');
  });

  it('should generate order confirmed warehouse queue email', () => {
    const html = getOrderConfirmedEmailHtml(mockOrder);
    expect(html).toContain('SG-HNY-9901');
    expect(html).toContain('WAREHOUSE QUEUED');
    expect(html).toContain('12:30 AM IST automated reconciliation');
  });

  it('should generate order shipped email with live courier tracking and zero-breakage guarantee', () => {
    const html = getOrderShippedEmailHtml(mockOrder);
    expect(html).toContain('SG-HNY-9901');
    expect(html).toContain('DELHIVERY-AIR-4455');
    expect(html).toContain('Delhivery Insured Air');
    expect(html).toContain('100% Zero-Breakage Solid Glass Guarantee');
    expect(html).toContain('delhivery.com/track/package/DELHIVERY-AIR-4455');
  });

  it('should generate order delivered email with sommelier tasting notes and NMR certificate link', () => {
    const html = getOrderDeliveredEmailHtml(mockOrder);
    expect(html).toContain('SG-HNY-9901');
    expect(html).toContain('DELIVERED');
    expect(html).toContain('Sommelier Tasting &amp; Pairing Notes');
    expect(html).toContain('Verify Your Batch NMR Certificate');
  });

  it('should generate admin new order alert email with financial margins and packing SLA', () => {
    const html = getNewOrderAdminAlertEmailHtml(mockOrder);
    expect(html).toContain('SG-HNY-9901');
    expect(html).toContain('NEW PAID ORDER');
    expect(html).toContain('12:30 AM IST batch reconciliation');
  });

  it('should generate daily per-manager executive report email', () => {
    const html = getDailyManagerReportEmailHtml({
      date: '24 Oct 2026',
      totalOrders: 18,
      totalRevenue: 3450000,
      managers: [
        {
          name: 'Vikram Mehta',
          email: 'operations@solidglass.com',
          department: 'Apiary & Warehouse Dispatch',
          assignedCoupons: ['VIKRAM15', 'ROYAL20'],
          ordersCount: 12,
          revenue: 2400000,
          discountGiven: 360000,
          supportTickets: 5,
        },
      ],
    });
    expect(html).toContain('24 Oct 2026');
    expect(html).toContain('Vikram Mehta');
    expect(html).toContain('VIKRAM15');
    expect(html).toContain('EXECUTIVE AUDIT REPORT');
  });

  it('should generate warehouse 12:30 AM IST batch queue email with SKU aggregates', () => {
    const html = getWarehouseBatchEmailHtml({
      batchId: 'WH-IST-20261024-8841',
      reconciledAt: '12:30:00 AM IST',
      ordersCount: 6,
      totalUnits: 14,
      skuSummary: [
        { sku: 'HNY-WLD-500', name: 'Wild Forest Raw Honey (500g)', quantity: 8 },
        { sku: 'HNY-ACA-500', name: 'Himalayan White Acacia Honey (500g)', quantity: 6 },
      ],
    });
    expect(html).toContain('WH-IST-20261024-8841');
    expect(html).toContain('12:30 AM IST BATCH GENERATED');
    expect(html).toContain('HNY-WLD-500');
    expect(html).toContain('8 units');
  });
});
