import { describe, it, expect } from 'vitest';
import {
  determineDelhiveryZone,
  calculateDelhiveryShippingCost,
  DELHIVERY_URLS,
} from '@/lib/shipping/delhivery';

describe('Delhivery One Local & National Shipping Cost Calculation API', () => {
  it('should identify local intra-city Pune destination (Zone A) with isLocal = true', () => {
    // Pune Apiary (411004) to Pune Camp (411001)
    const local1 = determineDelhiveryZone('411004', '411001');
    expect(local1.zoneCode).toBe('A');
    expect(local1.isLocal).toBe(true);
    expect(local1.estimatedDays).toBe(1);
    expect(local1.city).toBe('Pune');
    expect(local1.state).toBe('Maharashtra');

    // Pune Apiary (411004) to Pune Kothrud (411038)
    const local2 = determineDelhiveryZone('411004', '411038');
    expect(local2.zoneCode).toBe('A');
    expect(local2.isLocal).toBe(true);
  });

  it('should calculate local intra-city shipping cost for 300g solid glass jar (600g gross)', async () => {
    const cost = await calculateDelhiveryShippingCost({
      destinationPincode: '411001',
      weightGrams: 600, // 300g honey + 250g glass + 50g padding
      mode: 'Express',
      originPincode: '411004',
    });

    expect(cost.success).toBe(true);
    expect(cost.isLocal).toBe(true);
    expect(cost.zoneCode).toBe('A');
    expect(cost.destinationCity).toBe('Pune');
    expect(cost.billableWeightGrams).toBe(1000); // 600g rounded up to 1000g slab
    expect(cost.provider).toContain('Delhivery One');
    expect(cost.portalUrl).toBe('https://one.delhivery.com');

    // Pricing breakdown check:
    // Base 500g: 35.00
    // Additional 500g: 18.00
    // Insured glass handling: 10.00
    // Fuel (10% of 53): 5.30
    // Subtotal: 35 + 18 + 10 + 5.30 = 68.30
    // GST (18%): 12.29
    // Total: 80.59
    expect(cost.pricing.baseFreight).toBe(35);
    expect(cost.pricing.additionalWeightCharge).toBe(18);
    expect(cost.pricing.insuredGlassHandlingFee).toBe(10);
    expect(cost.pricing.fuelSurcharge).toBe(5.3);
    expect(cost.pricing.subtotal).toBe(68.3);
    expect(cost.pricing.gstAmount).toBe(12.29);
    expect(cost.pricing.totalShippingCost).toBe(80.59);
    expect(cost.pricing.totalShippingCostPaise).toBe(8059);
  });

  it('should calculate local intra-city shipping cost for Surface mode', async () => {
    const cost = await calculateDelhiveryShippingCost({
      destinationPincode: '411001',
      weightGrams: 600,
      mode: 'Surface',
      originPincode: '411004',
    });

    expect(cost.shippingMode).toBe('Surface');
    expect(cost.isLocal).toBe(true);
    expect(cost.pricing.baseFreight).toBe(28); // Surface local base
    expect(cost.pricing.additionalWeightCharge).toBe(14); // Surface local additional
    expect(cost.pricing.totalShippingCost).toBeLessThan(80.59);
  });

  it('should calculate regional Maharashtra shipping (Zone B) for Mumbai destination', async () => {
    const cost = await calculateDelhiveryShippingCost({
      destinationPincode: '400001', // Mumbai
      weightGrams: 1280, // 750g jar gross
      mode: 'Express',
      originPincode: '411004',
    });

    expect(cost.isLocal).toBe(false);
    expect(cost.zoneCode).toBe('B');
    expect(cost.destinationCity).toBe('Mumbai');
    expect(cost.billableWeightGrams).toBe(1500); // 1280g -> 1500g
    expect(cost.pricing.baseFreight).toBe(48);
    expect(cost.pricing.additionalWeightCharge).toBe(50); // 2 slabs * 25
    expect(cost.pricing.totalShippingCost).toBeGreaterThan(80.59);
  });

  it('should calculate Metro to Metro shipping (Zone C) for Bengaluru destination', async () => {
    const cost = await calculateDelhiveryShippingCost({
      destinationPincode: '560001', // Bengaluru
      weightGrams: 1800, // 1050g family jar gross
      mode: 'Express',
      originPincode: '411004',
    });

    expect(cost.zoneCode).toBe('C');
    expect(cost.destinationCity).toBe('Bengaluru');
    expect(cost.billableWeightGrams).toBe(2000); // 1800g -> 2000g
    expect(cost.pricing.baseFreight).toBe(62);
  });

  it('should calculate Rest of India shipping (Zone D) for Jaipur destination', async () => {
    const cost = await calculateDelhiveryShippingCost({
      destinationPincode: '302001', // Jaipur
      weightGrams: 600,
      mode: 'Express',
      originPincode: '411004',
    });

    expect(cost.zoneCode).toBe('D');
    expect(cost.pricing.baseFreight).toBe(75);
  });

  it('should calculate Special Territory shipping (Zone E) for Guwahati destination', async () => {
    const cost = await calculateDelhiveryShippingCost({
      destinationPincode: '781001', // Guwahati
      weightGrams: 600,
      mode: 'Express',
      originPincode: '411004',
    });

    expect(cost.zoneCode).toBe('E');
    expect(cost.pricing.baseFreight).toBe(95);
    expect(cost.estimatedDays).toBe(4);
  });
});
