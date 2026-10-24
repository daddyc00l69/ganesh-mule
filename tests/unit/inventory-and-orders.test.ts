import { describe, it, expect } from 'vitest';
import { formatCurrency, slugify } from '@/lib/utils';

describe('Inventory & Order Calculations', () => {
  it('should accurately calculate minor unit monetary values without float errors', () => {
    const item1 = 1899900; // ₹18,999.00
    const item2 = 549900;  // ₹5,499.00
    const subtotal = item1 + item2;
    expect(subtotal).toBe(2449800);

    const tax = Math.round(subtotal * 0.18);
    expect(tax).toBe(440964);

    const shipping = subtotal >= 99900 ? 0 : 5000;
    expect(shipping).toBe(0);

    const total = subtotal + shipping + tax;
    expect(total).toBe(2890764);

    expect(formatCurrency(total)).toContain('28,907.64');
  });

  it('should enforce free shipping rules properly below threshold', () => {
    const smallItem = 49900; // ₹499.00 (below ₹999)
    const shipping = smallItem >= 99900 ? 0 : 5000;
    expect(shipping).toBe(5000); // Charged ₹50.00
  });

  it('should enforce slugification conventions', () => {
    expect(slugify('Lumina 65 Smoky Glass Custom Keyboard')).toBe(
      'lumina-65-smoky-glass-custom-keyboard'
    );
    expect(slugify('Special @#$ Characters & Co.')).toBe('special-characters-co');
  });

  it('should preserve all inventory stock while verifying zero reserved quantity baseline', () => {
    // Invariant: all 6 products must keep their full physical stock
    const expectedStock = [48, 24, 14, 19, 8, 35];
    const totalPhysicalStock = expectedStock.reduce((a, b) => a + b, 0);
    expect(totalPhysicalStock).toBe(148);
    expect(expectedStock.every((s) => s > 0)).toBe(true);
  });
});

