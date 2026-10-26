import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/coupons/validate/route';

describe('Coupon Validation Robustness', () => {
  it('should validate successfully when email is empty string or undefined', async () => {
    const req = new NextRequest('http://localhost:3000/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'AMBER10',
        subtotal: 100000,
        customerEmail: '',
      }),
    });

    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.valid).toBe(true);
    expect(json.coupon.code).toBe('AMBER10');
  });

  it('should return friendly error when coupon code does not exist', async () => {
    const req = new NextRequest('http://localhost:3000/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'DOESNOTEXIST99',
        subtotal: 100000,
      }),
    });

    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(404);
    expect(json.valid).toBe(false);
    expect(json.error).toContain('is not recognized or has expired');
  });
});
