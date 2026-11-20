import { DiscountCoupon } from '@/types';
import { MOCK_COUPONS } from '@/lib/mock-data';
import {
  isTestStorageBypassed,
  readPersistedJson,
  writePersistedJson,
} from '@/lib/storage/json-store';

const COUPONS_FILENAME = 'coupons.json';

const globalCouponsStore = globalThis as unknown as {
  __LIVE_COUPONS__?: DiscountCoupon[];
};

function loadInitialCoupons(): DiscountCoupon[] {
  if (!isTestStorageBypassed()) {
    const persisted = readPersistedJson<DiscountCoupon[]>(COUPONS_FILENAME);
    if (Array.isArray(persisted) && persisted.length > 0) {
      return persisted;
    }
  }
  return JSON.parse(JSON.stringify(MOCK_COUPONS)) as DiscountCoupon[];
}

function persistCoupons(coupons: DiscountCoupon[]): void {
  writePersistedJson(COUPONS_FILENAME, coupons);
}

export function getLiveCoupons(): DiscountCoupon[] {
  if (!globalCouponsStore.__LIVE_COUPONS__) {
    globalCouponsStore.__LIVE_COUPONS__ = loadInitialCoupons();
  }
  return globalCouponsStore.__LIVE_COUPONS__;
}

export function getLiveCouponByCode(code: string): DiscountCoupon | undefined {
  const normalized = code.trim().toUpperCase();
  return getLiveCoupons().find((c) => c.code.toUpperCase() === normalized);
}

export function getLiveCouponById(id: string): DiscountCoupon | undefined {
  return getLiveCoupons().find((c) => c.id === id);
}

export function addLiveCoupon(coupon: DiscountCoupon): DiscountCoupon {
  const coupons = getLiveCoupons();
  coupons.unshift(coupon);
  persistCoupons(coupons);
  return coupon;
}

export function updateLiveCoupon(
  id: string,
  updates: Partial<DiscountCoupon>
): DiscountCoupon | null {
  const coupons = getLiveCoupons();
  const coupon = coupons.find((c) => c.id === id);
  if (!coupon) return null;

  Object.assign(coupon, updates, {
    updatedAt: new Date().toISOString(),
  });
  persistCoupons(coupons);
  return coupon;
}

export function deleteLiveCoupon(id: string): boolean {
  const coupons = getLiveCoupons();
  const index = coupons.findIndex((c) => c.id === id);
  if (index === -1) return false;

  coupons.splice(index, 1);
  persistCoupons(coupons);
  return true;
}

export function incrementCouponUsage(code: string): void {
  const coupon = getLiveCouponByCode(code);
  if (!coupon) return;

  coupon.usageCount += 1;
  coupon.updatedAt = new Date().toISOString();
  persistCoupons(getLiveCoupons());
}

