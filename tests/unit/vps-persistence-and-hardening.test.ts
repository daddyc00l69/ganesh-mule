import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  getDataDir,
  readJsonFile,
  writeJsonAtomic,
} from '@/lib/storage/json-store';
import {
  getLiveCoupons,
  getLiveCouponByCode,
  addLiveCoupon,
  updateLiveCoupon,
  deleteLiveCoupon,
} from '@/lib/coupons/store';
import * as serverAuth from '@/lib/auth/server';
import { MOCK_AUDIT_LOGS } from '@/lib/mock-data';

describe('VPS Optimization: Atomic Storage, Health Check & Endpoint Hardening', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  describe('Atomic JSON Persistence Utility', () => {
    it('writes and reads JSON atomically and honors DATA_DIR override', () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gm-vps-test-'));
      try {
        process.env.DATA_DIR = tempDir;
        expect(getDataDir()).toBe(tempDir);

        const targetFile = path.join(tempDir, 'test-state.json');
        const payload = { version: 2, rates: { shipping: 7000 } };

        expect(writeJsonAtomic(targetFile, payload)).toBe(true);
        expect(readJsonFile<typeof payload>(targetFile)).toEqual(payload);
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });
  });

  describe('Unified Coupon Store Consistency', () => {
    it('supports add, lookup by code, update, and delete cleanly', () => {
      const testCode = `VPS_${Date.now()}`;
      const testId = `coup-vps-${Date.now()}`;

      addLiveCoupon({
        id: testId,
        code: testCode,
        description: 'VPS unified store test coupon',
        discountType: 'FIXED_AMOUNT',
        value: 10000,
        minOrderAmount: 50000,
        maxDiscountAmount: null,
        expiresAt: null,
        usageLimit: 10,
        usageCount: 0,
        isActive: true,
        isPublic: false,
        assignedManagerIds: [],
        assignedManagerNames: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const found = getLiveCouponByCode(testCode.toLowerCase());
      expect(found?.id).toBe(testId);

      const updated = updateLiveCoupon(testId, { isPublic: true });
      expect(updated?.isPublic).toBe(true);

      expect(deleteLiveCoupon(testId)).toBe(true);
      expect(getLiveCoupons().some((c) => c.id === testId)).toBe(false);
    });
  });

  describe('GET /api/health', () => {
    it('returns HTTP 200 with uptime, database, and storage status', async () => {
      const { GET } = await import('@/app/api/health/route');
      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.status).toBe('ok');
      expect(typeof body.uptimeSeconds).toBe('number');
      expect(['online', 'fallback']).toContain(body.database);
      expect(['writable', 'readonly']).toContain(body.storage);
    });
  });

  describe('Production Route Hardening (Reconcile & Fee Settings)', () => {
    beforeEach(() => {
      (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
      process.env.CRON_SECRET = 'vps-super-secret-cron-token-1234';
    });

    it('rejects unauthenticated POST /api/warehouse/reconcile in production', async () => {
      vi.spyOn(serverAuth, 'getCurrentUser').mockResolvedValue(null);
      const { POST } = await import('@/app/api/warehouse/reconcile/route');

      const req = new NextRequest('http://127.0.0.1:3000/api/warehouse/reconcile', {
        method: 'POST',
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it('authorizes POST /api/warehouse/reconcile with valid x-cron-secret header', async () => {
      vi.spyOn(serverAuth, 'getCurrentUser').mockResolvedValue(null);
      const { POST } = await import('@/app/api/warehouse/reconcile/route');

      const req = new NextRequest('http://127.0.0.1:3000/api/warehouse/reconcile', {
        method: 'POST',
        headers: {
          'x-cron-secret': 'vps-super-secret-cron-token-1234',
        },
      });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.batch?.batchId).toMatch(/^WH-IST-/);
      expect(MOCK_AUDIT_LOGS[0]?.actorName).toContain('Cron');
    });

    it('rejects unauthenticated POST /api/settings/fees in production', async () => {
      vi.spyOn(serverAuth, 'requireAuth').mockResolvedValue({
        error: 'Authentication required',
        status: 401,
      });
      const { POST } = await import('@/app/api/settings/fees/route');

      const req = new NextRequest('http://127.0.0.1:3000/api/settings/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shippingBaseFee: 5000 }),
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });
  });
});
