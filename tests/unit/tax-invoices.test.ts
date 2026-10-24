import { describe, it, expect } from 'vitest';
import {
  numberToWordsINR,
  getHsnCodeForProduct,
  buildTaxInvoiceData,
} from '@/lib/invoice';

describe('Official Indian GST Tax Invoice Engine', () => {
  describe('numberToWordsINR formatting', () => {
    it('should format zero amount gracefully', () => {
      expect(numberToWordsINR(0)).toBe('Zero Rupees Only');
    });

    it('should convert standard INR amounts to words', () => {
      const words = numberToWordsINR(149900); // ₹1,499.00
      expect(words).toContain('One Thousand Four Hundred Ninety Nine Rupees Only');
    });

    it('should convert amounts with paise correctly', () => {
      const words = numberToWordsINR(235764); // ₹2,357.64
      expect(words).toContain('Two Thousand Three Hundred Fifty Seven Rupees');
      expect(words).toContain('Sixty Four Paise Only');
    });

    it('should handle large amounts across Lakhs and Crores', () => {
      const words = numberToWordsINR(125500000); // ₹12,55,000.00 = 12 Lakh 55 Thousand
      expect(words).toContain('Twelve Lakh Fifty Five Thousand Rupees Only');
    });
  });

  describe('HSN & SAC Code Classification', () => {
    it('should assign 0409 00 00 to raw honey products', () => {
      expect(getHsnCodeForProduct('Wild Forest Raw Honey (500g)', 'HNY-WLD-500')).toBe('0409 00 00');
      expect(getHsnCodeForProduct('Kashmiri Saffron Infused Raw Honey', 'HNY-SAF-350')).toBe('0409 00 00');
      expect(getHsnCodeForProduct('Fresh Raw Honeycomb Slab (400g)', 'HNY-CMB-400')).toBe('0409 00 00');
    });

    it('should assign 4419 90 90 to tableware and woodcraft accessories', () => {
      expect(getHsnCodeForProduct('Handcrafted Olivewood Honey Dipper', 'ACC-DIP-01')).toBe('4419 90 90');
    });
  });

  describe('buildTaxInvoiceData GST Calculations', () => {
    const mockOrderIntraState = {
      orderNumber: 'SG-2026-9901',
      customerName: 'Aarav Deshmukh',
      customerEmail: 'aarav.d@gmail.com',
      shippingAddress: {
        street: '402 Oberoi Sky Heights',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400053',
        country: 'India',
      },
      items: [
        {
          id: 'item-1',
          productName: 'Wild Forest Raw Honey (500g)',
          sku: 'HNY-WLD-500',
          price: 84900,
          quantity: 2,
          total: 169800,
        },
      ],
      discountAmount: 15000,
      couponCode: 'VIKRAM15',
      shippingCost: 0,
      totalAmount: 154800,
      paymentStatus: 'PAID',
      createdAt: '2026-10-23T10:00:00Z',
    };

    it('should split GST into 50% CGST and 50% SGST for Intra-State (Maharashtra) supply', () => {
      const invoice = buildTaxInvoiceData(mockOrderIntraState);

      expect(invoice.invoiceNumber).toMatch(/^INV-2026-\d+/);
      expect(invoice.seller.gstin).toBe('27AAACG9823Q1ZX');
      expect(invoice.seller.fssaiLicense).toBe('11524022000318');
      expect(invoice.customer.stateCode).toBe('27');
      expect(invoice.items.length).toBe(1);

      // Verify Intra-state tax split
      expect(invoice.cgstTotal).toBeGreaterThan(0);
      expect(invoice.sgstTotal).toBeGreaterThan(0);
      expect(invoice.igstTotal).toBe(0);
      expect(invoice.cgstTotal + invoice.sgstTotal).toBe(invoice.totalTax);

      // Coupon attribution
      expect(invoice.appliedCouponCode).toBe('VIKRAM15');
      expect(invoice.discountAmount).toBe(15000);

      // Grand total in words
      expect(invoice.grandTotalInWords).toContain('Rupees');
      expect(invoice.verificationHash).toMatch(/^SHA256-/);
    });

    it('should assign 100% to IGST and 0 to CGST/SGST for Inter-State supply (e.g. Karnataka)', () => {
      const mockOrderInterState = {
        ...mockOrderIntraState,
        orderNumber: 'SG-2026-9902',
        shippingAddress: {
          ...mockOrderIntraState.shippingAddress,
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560038',
        },
      };

      const invoice = buildTaxInvoiceData(mockOrderInterState);

      expect(invoice.customer.state).toBe('Karnataka');
      expect(invoice.igstTotal).toBeGreaterThan(0);
      expect(invoice.cgstTotal).toBe(0);
      expect(invoice.sgstTotal).toBe(0);
      expect(invoice.igstTotal).toBe(invoice.totalTax);
    });
  });
});
