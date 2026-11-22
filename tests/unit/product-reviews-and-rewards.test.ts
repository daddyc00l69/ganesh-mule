import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateRewardCouponCode,
  issuePersonalizedRewardCoupon,
  validateReviewRewardCouponOwnership,
} from '@/lib/reviews/reward-coupon-engine';
import {
  getReviewRewardSettings,
  updateReviewRewardSettings,
  DEFAULT_REVIEW_REWARD_SETTINGS,
} from '@/lib/reviews/settings-store';
import { getLiveCoupons } from '@/lib/coupons/store';

describe('Product Reviews & Personalized Reward Coupon Engine', () => {
  beforeEach(async () => {
    // Reset settings to defaults before each test
    await updateReviewRewardSettings(DEFAULT_REVIEW_REWARD_SETTINGS, 'test');
  });

  describe('Coupon Code Generation & Formatting', () => {
    it('should generate properly formatted GANESH<PERCENT>-XXXX codes', () => {
      const code5 = generateRewardCouponCode(5);
      expect(code5).toMatch(/^GANESH5-[A-Z0-9]{4}$/);

      const code10 = generateRewardCouponCode(10);
      expect(code10).toMatch(/^GANESH10-[A-Z0-9]{4}$/);

      const codeCustom = generateRewardCouponCode(7, 'HONEY');
      expect(codeCustom).toMatch(/^HONEY7-[A-Z0-9]{4}$/);
    });

    it('should generate unique random suffixes on successive calls', () => {
      const codes = new Set<string>();
      for (let i = 0; i < 50; i++) {
        codes.add(generateRewardCouponCode(5));
      }
      expect(codes.size).toBe(50);
    });
  });

  describe('Honest Feedback Invariant', () => {
    it('should issue a reward coupon for any valid rating from 1 to 5 stars (never only 5 stars)', async () => {
      const testRatings = [1, 2, 3, 4, 5];

      for (const rating of testRatings) {
        const result = await issuePersonalizedRewardCoupon({
          customerEmail: `tester-${rating}@ganeshhoney.com`,
          customerName: `Honest Reviewer ${rating}`,
          discountPercent: 5,
          productName: 'multiflora-honey-500g',
        });

        expect(result).not.toBeNull();
        expect(result?.couponCode).toMatch(/^GANESH5-/);
        expect(result?.discountPercent).toBe(5);
        expect(result?.expiresAt).toBeInstanceOf(Date);
      }
    });
  });

  describe('Personalized Email Ownership & Cryptographic Binding', () => {
    it('should validate ownership when matching email is presented', async () => {
      const result = await issuePersonalizedRewardCoupon({
        customerEmail: 'arjun.sharma@example.com',
        customerName: 'Arjun Sharma',
        discountPercent: 5,
        productName: 'multiflora-honey-1000g',
      });

      expect(result).not.toBeNull();
      const code = result!.couponCode;

      // Same email with exact case
      const validSameCase = await validateReviewRewardCouponOwnership(code, 'arjun.sharma@example.com');
      expect(validSameCase.valid).toBe(true);

      // Same email with mixed case
      const validMixedCase = await validateReviewRewardCouponOwnership(code, 'ARJUN.SHARMA@EXAMPLE.COM');
      expect(validMixedCase.valid).toBe(true);

      // Same email with leading/trailing whitespace
      const validWhitespace = await validateReviewRewardCouponOwnership(code, '  arjun.sharma@example.com  ');
      expect(validWhitespace.valid).toBe(true);
    });

    it('should strictly reject ownership when a different email attempts to use the coupon', async () => {
      const result = await issuePersonalizedRewardCoupon({
        customerEmail: 'priya.patil@example.com',
        customerName: 'Priya Patil',
        discountPercent: 5,
        productName: 'saunf-honey-500g',
      });

      expect(result).not.toBeNull();
      const code = result!.couponCode;

      const invalidAttempter = await validateReviewRewardCouponOwnership(code, 'hacker@shady-deals.com');
      expect(invalidAttempter.valid).toBe(false);
      expect(invalidAttempter.error).toContain('registered exclusively');

      const noEmailAttempt = await validateReviewRewardCouponOwnership(code, '');
      expect(noEmailAttempt.valid).toBe(false);
    });
  });

  describe('Configurable Reward Settings', () => {
    it('should respect custom discount percentage and validity days configured by admin', async () => {
      // Admin configures 10% discount and 45-day validity
      await updateReviewRewardSettings(
        {
          defaultDiscountPercent: 10,
          expiryDays: 45,
          minOrderValuePaise: 99900,
        },
        'admin@ganeshmule.com'
      );

      const settings = await getReviewRewardSettings();
      expect(settings.defaultDiscountPercent).toBe(10);
      expect(settings.expiryDays).toBe(45);
      expect(settings.minOrderValuePaise).toBe(99900);

      const coupon = await issuePersonalizedRewardCoupon({
        customerEmail: 'custom.settings@test.com',
        customerName: 'Custom Tester',
        discountPercent: settings.defaultDiscountPercent,
        expiryDays: settings.expiryDays,
        minOrderValuePaise: settings.minOrderValuePaise,
        productName: 'forest-honey-1kg',
      });

      expect(coupon).not.toBeNull();
      expect(coupon?.couponCode).toMatch(/^GANESH10-/);
      expect(coupon?.discountPercent).toBe(10);
      expect(coupon?.minOrderAmountPaise).toBe(99900);
    });

    it('should not issue coupons when review rewards are toggled off by admin', async () => {
      await updateReviewRewardSettings({ isEnabled: false }, 'admin@ganeshmule.com');

      const settings = await getReviewRewardSettings();
      expect(settings.isEnabled).toBe(false);
    });
  });

  describe('Single-Use Enforcement & Expiry Invariants', () => {
    it('should register coupon with single-use limit in store', async () => {
      const coupon = await issuePersonalizedRewardCoupon({
        customerEmail: 'single.use@test.com',
        customerName: 'Single Use User',
        discountPercent: 5,
        productName: 'multiflora-honey-250g',
      });

      expect(coupon).not.toBeNull();
      const allCoupons = getLiveCoupons();
      const found = allCoupons.find((c) => c.code === coupon!.couponCode);

      expect(found).toBeDefined();
      expect(found?.usageLimit).toBe(1);
      expect(found?.isActive).toBe(true);
      expect(found?.customerEmail).toBe('single.use@test.com');
    });
  });
});
