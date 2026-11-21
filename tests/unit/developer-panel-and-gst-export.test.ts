import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as developerHealthGet } from '@/app/api/developer/health/route';
import { GET as developerAccountsGet } from '@/app/api/developer/accounts/route';
import { GET as exportReportsGet } from '@/app/api/admin/reports/export/route';
import * as serverAuth from '@/lib/auth/server';
import * as dbModule from '@/lib/db';
import { addLiveOrder } from '@/lib/orders/store';

describe('Developer Panel & GST Export Integrity', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should block non-developer accounts from accessing /api/developer/health', async () => {
    vi.spyOn(serverAuth, 'requireAuth').mockResolvedValue({
      error: 'Insufficient role privileges (Developer access required)',
      status: 403,
    });

    const req = new NextRequest('http://localhost:3000/api/developer/health');
    const res = await developerHealthGet(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain('Developer access required');
  });

  it('should allow DEVELOPER role to access /api/developer/health and return telemetry', async () => {
    vi.spyOn(serverAuth, 'requireAuth').mockResolvedValue({
      user: {
        id: 'usr-dev-master',
        email: 'tushar0p.test@gmail.com',
        name: 'Tushar Developer',
        role: 'DEVELOPER',
        isActive: true,
        createdAt: new Date().toISOString(),
        permissions: [],
      },
    });

    vi.spyOn(dbModule, 'isDatabaseOnline').mockResolvedValue(false);
    vi.spyOn(dbModule.prisma.user, 'count').mockResolvedValue(1);
    vi.spyOn(dbModule.prisma.auditLog, 'findMany').mockResolvedValue([]);

    const req = new NextRequest('http://localhost:3000/api/developer/health');
    const res = await developerHealthGet(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.system).toBeDefined();
    expect(data.system.nodeVersion).toBeDefined();
    expect(data.system.memory).toBeDefined();
    expect(data.integrations).toBeDefined();
    expect(data.system.database).toBeDefined();
    expect(data.integrations.delhivery).toBeDefined();
    expect(data.integrations.razorpay).toBeDefined();
  });

  it('should allow DEVELOPER role to query staff accounts from /api/developer/accounts', async () => {
    vi.spyOn(serverAuth, 'requireAuth').mockResolvedValue({
      user: {
        id: 'usr-dev-master',
        email: 'tushar0p.test@gmail.com',
        name: 'Tushar Developer',
        role: 'DEVELOPER',
        isActive: true,
        createdAt: new Date().toISOString(),
        permissions: [],
      },
    });

    vi.spyOn(dbModule.prisma.user, 'findMany').mockResolvedValue([
      {
        id: 'usr-dev-1',
        name: 'Tushar Developer',
        email: 'tushar0p.test@gmail.com',
        role: 'DEVELOPER',
        isActive: true,
        createdAt: new Date(),
        managerProfile: null,
      } as any,
    ]);

    const req = new NextRequest('http://localhost:3000/api/developer/accounts');
    const res = await developerAccountsGet(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.staff)).toBe(true);
    expect(data.staff.length).toBeGreaterThan(0);
    expect(data.staff[0].email).toBe('tushar0p.test@gmail.com');
  });

  it('should correctly generate GST Report CSV with HSN 0409 and zero tax-on-tax extraction', async () => {
    vi.spyOn(serverAuth, 'requireAuthInProduction').mockResolvedValue({
      user: {
        id: 'usr-admin-test',
        email: 'admin@ganeshmule.com',
        name: 'Super Admin',
        role: 'ADMIN',
        isActive: true,
        createdAt: new Date().toISOString(),
        permissions: [],
      },
    } as any);

    // Ensure at least one paid order exists in memory
    addLiveOrder({
      id: 'ord-gst-test-1',
      orderNumber: 'GM-GST-TEST-101',
      userId: 'usr-cust-1',
      customerName: 'Aarav Sharma',
      customerEmail: 'aarav@example.com',
      customerPhone: '9876543210',
      shippingAddress: {
        fullName: 'Aarav Sharma',
        phone: '9876543210',
        street: 'Main Road',
        city: 'Pune',
        state: 'Maharashtra',
        postalCode: '411001',
        country: 'India',
      },
      subtotal: 79800, // ₹798
      shippingCost: 0,
      taxAmount: 3800,
      discountAmount: 0,
      totalAmount: 79800,
      orderStatus: 'DELIVERED',
      paymentStatus: 'PAID',
      items: [
        {
          id: 'item-1',
          orderId: 'ord-gst-test-1',
          productId: 'prod-1',
          productName: 'Wild Forest Honey (500g)',
          sku: 'GM-FOR-500G',
          price: 39900,
          quantity: 2,
          total: 79800,
        },
      ],
      payments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const req = new NextRequest('http://localhost:3000/api/admin/reports/export?type=gst');
    const res = await exportReportsGet(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/csv');
    const csv = await res.text();
    expect(csv).toContain('HSN Code');
    expect(csv).toContain('0409 00 00');
    expect(csv).toContain('CGST (2.5%)');
    expect(csv).toContain('SGST (2.5%)');
    expect(csv).toContain('IGST (5.0%)');
    expect(csv).toContain('Aarav Sharma');
  });
});
