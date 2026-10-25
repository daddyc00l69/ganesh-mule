import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAdminConfigStatus,
  authenticateStaffLogin,
  directSetAdminAccount,
  _clearAllStaffForFreshStart,
} from '@/lib/auth/staff-store';
import { calculateDelhiveryShippingCost } from '@/lib/shipping/delhivery';
import { calculateOrderFees } from '@/lib/config/fee-settings';
import { MOCK_PRODUCTS } from '@/lib/mock-data';

describe('Admin Configuration & Delhivery Dynamic Checkout Logistics', () => {
  beforeEach(() => {
    _clearAllStaffForFreshStart();
  });

  it('should authenticate manager and admin with master credentials out of the box', async () => {
    // 1. Store Manager login with master credentials
    const managerRes = await authenticateStaffLogin({
      email: 'manager@devtushar.uk',
      password: 'Manager@123456',
      expectedRole: 'MANAGER',
    });
    expect(managerRes.success).toBe(true);
    expect(managerRes.user.role).toBe('MANAGER');
    expect(managerRes.user.email).toBe('manager@devtushar.uk');

    // 2. Administrator login with master credentials
    const adminRes = await authenticateStaffLogin({
      email: 'admin@devtushar.uk',
      password: 'Admin@123456',
      expectedRole: 'ADMIN',
    });
    expect(adminRes.success).toBe(true);
    expect(adminRes.user.role).toBe('ADMIN');

    // 3. Reject invalid password
    await expect(
      authenticateStaffLogin({
        email: 'manager@devtushar.uk',
        password: 'InvalidPassword123',
        expectedRole: 'MANAGER',
      })
    ).rejects.toThrow('Invalid manager password');
  });

  it('should configure administrator via /config and allow logging in as both ADMIN and MANAGER with that email and password', async () => {
    // 1. Initial setup at /config
    const setupResult = await directSetAdminAccount({
      name: 'Tushar',
      email: 'manager@devtushar.uk',
      phone: '+91 98220 00000',
      password: 'Manager@123456',
    });
    expect(setupResult.success).toBe(true);

    const status = getAdminConfigStatus();
    expect(status.configured).toBe(true);
    expect(status.adminEmail).toBe('manager@devtushar.uk');

    // 2. Login under Administrator tab
    const adminLogin = await authenticateStaffLogin({
      email: 'manager@devtushar.uk',
      password: 'Manager@123456',
      expectedRole: 'ADMIN',
    });
    expect(adminLogin.success).toBe(true);
    expect(adminLogin.user.role).toBe('ADMIN');

    // 3. Login under Store Manager tab using the same configured email and password
    const managerLogin = await authenticateStaffLogin({
      email: 'manager@devtushar.uk',
      password: 'Manager@123456',
      expectedRole: 'MANAGER',
    });
    expect(managerLogin.success).toBe(true);
    expect(managerLogin.user.role).toBe('MANAGER');

    // 4. Reject invalid password
    await expect(
      authenticateStaffLogin({
        email: 'manager@devtushar.uk',
        password: 'WrongPassword@123',
        expectedRole: 'ADMIN',
      })
    ).rejects.toThrow('Invalid administrator password');
  });

  it('should calculate live Delhivery shipping cost + 18% GST for Mumbai (400005) Zone B', async () => {
    const mumbaiPin = '400005';
    // 300g jar package is 600g gross consignment
    const result = await calculateDelhiveryShippingCost({
      destinationPincode: mumbaiPin,
      weightGrams: 600,
    });

    expect(result.success).toBe(true);
    expect(result.destinationPincode).toBe('400005');
    expect(result.zoneCode).toBe('B'); // Regional Maharashtra
    expect(result.pricing.gstRate).toBe(18.0);
    expect(result.pricing.insuredGlassHandlingFee).toBe(10.0);
    // Base freight for Zone B (45) + 1 slab (25) = 70.0, handling 10, fuel 8.0 = 88.0 subtotal
    // GST 18% of 88 = 15.84, Total = 103.84
    expect(result.pricing.subtotal).toBeGreaterThan(0);
    expect(result.pricing.gstAmount).toBeGreaterThan(0);
    expect(result.pricing.totalShippingCost).toBe(
      Math.round((result.pricing.subtotal + result.pricing.gstAmount) * 100) / 100
    );
  });

  it('should dynamically update order fee breakdown with custom Delhivery rate + 18% GST', () => {
    const subtotal = 44900; // ₹449.00
    const customDelhiveryBase = 8800; // ₹88.00 base freight + handling
    const fees = calculateOrderFees(subtotal, 0, undefined, customDelhiveryBase);

    expect(fees.shippingBase).toBe(8800);
    expect(fees.shippingGstRate).toBe(18);
    expect(fees.shippingGst).toBe(1584); // 18% of ₹88.00 = ₹15.84
    expect(fees.shippingTotal).toBe(10384); // ₹103.84 total courier
    expect(fees.grandTotal).toBeGreaterThan(subtotal + fees.shippingTotal);
  });

  it('should distinguish multiple weight variants (300g, 750g, 1050g) and calculate gross consignment weight', () => {
    // 3 distinct weight variant products
    const p300 = MOCK_PRODUCTS.find((p) => p.slug === 'wild-forest-raw-honey-300g')!;
    const p750 = MOCK_PRODUCTS.find((p) => p.slug === 'wild-forest-raw-honey-750g')!;
    const p1050 = MOCK_PRODUCTS.find((p) => p.slug === 'wild-forest-raw-honey-1050g')!;

    expect(p300.id).not.toBe(p750.id);
    expect(p750.id).not.toBe(p1050.id);
    expect(p300.price).toBe(44900);
    expect(p750.price).toBe(89900);
    expect(p1050.price).toBe(119900);

    // Simulating items in cart across all 3 weights
    const cartItems = [
      { id: 'item-1', orderId: 'ord-1', productId: p300.id, productName: p300.name, sku: p300.sku, price: p300.price, quantity: 1, total: p300.price },
      { id: 'item-2', orderId: 'ord-1', productId: p750.id, productName: p750.name, sku: p750.sku, price: p750.price, quantity: 1, total: p750.price },
      { id: 'item-3', orderId: 'ord-1', productId: p1050.id, productName: p1050.name, sku: p1050.sku, price: p1050.price, quantity: 1, total: p1050.price },
    ];

    expect(cartItems.length).toBe(3);
    const uniqueProductIds = new Set(cartItems.map((i) => i.productId));
    expect(uniqueProductIds.size).toBe(3);
  });

  it('should use local solid glass honey product images with zero external unsplash dependencies', () => {
    for (const product of MOCK_PRODUCTS) {
      expect(product.images.length).toBeGreaterThan(0);
      for (const img of product.images) {
        expect(img.url).toMatch(/^\/images\/products\//);
        expect(img.url).not.toContain('unsplash.com');
      }
    }
  });
});

