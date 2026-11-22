import { describe, it, expect } from 'vitest';
import { FinanceDecimal } from '@/lib/finance/decimal';
import {
  calculateAuthoritativeQuote,
  AuthoritativeQuoteItemInput,
} from '@/lib/finance/engine';
import { generateInvoiceNumber } from '@/lib/finance/invoice-service';
import ExcelJS from 'exceljs';

describe('Developer Finance & Control Centre - Precision Engine', () => {
  it('enforces exact micro-unit integer scaling with zero IEEE-754 floating point drift', () => {
    // 0.1 + 0.2 in standard JS floating point is 0.30000000000000004
    expect(0.1 + 0.2).not.toBe(0.3);

    // With FinanceDecimal, addition is strictly exact
    const d1 = FinanceDecimal.fromRupees(0.1);
    const d2 = FinanceDecimal.fromRupees(0.2);
    const sum = d1.add(d2);
    expect(sum.toRupees()).toBe(0.3);
    expect(sum.toPaise()).toBe(30);
  });

  it('correctly calculates 5% GST tax-inclusive extraction for natural honey jars', () => {
    // ₹899.00 inclusive of 5% GST
    // Base = 899 / 1.05 = 856.190476... -> 856.19
    // GST = 899 - 856.19 = 42.81
    const jarPrice = FinanceDecimal.fromPaise(89900);
    const { taxable, tax } = jarPrice.extractTaxFromInclusive(5.0);

    expect(taxable.toPaise()).toBe(85619);
    expect(tax.toPaise()).toBe(4281);
    expect(taxable.toPaise() + tax.toPaise()).toBe(89900);
    expect(taxable.toFormattedINR()).toBe('₹856.19');
    expect(tax.toFormattedINR()).toBe('₹42.81');
  });

  it('correctly calculates 18% GST tax-exclusive addition for platform tech fee', () => {
    // ₹30.00 base fee + 18% GST
    // GST = 30 * 0.18 = 5.40
    // Total = 35.40
    const feeBase = FinanceDecimal.fromRupees(30.0);
    const gst = feeBase.mulRate(18.0);
    const total = feeBase.add(gst);

    expect(feeBase.toPaise()).toBe(3000);
    expect(gst.toPaise()).toBe(540);
    expect(total.toPaise()).toBe(3540);
    expect(total.toFormattedINR()).toBe('₹35.40');
  });

  it('executes authoritative checkout quote with fixed ₹30 fee, 5% honey, and delivery', async () => {
    const items: AuthoritativeQuoteItemInput[] = [
      {
        productId: 'honey-1kg',
        name: 'Raw Honey Comb (1kg)',
        sku: 'SKU-HONEY-1KG',
        unitPricePaise: 89900, // ₹899.00
        quantity: 1,
        weight: '1000g',
        weightGrams: 1000,
        hsnCode: '0409',
      },
    ];

    const quote = await calculateAuthoritativeQuote({
      items,
      destinationPin: '411001', // Pune, Maharashtra (Intra-state)
      destinationState: 'Maharashtra',
      shippingMode: 'Surface',
      customDeliveryBasePaise: 5000, // ₹50.00 base
      customDeliveryTotalPaise: 5900, // ₹50 + 18% GST = ₹59.00
    });

    expect(quote.success).toBe(true);
    const { snapshot } = quote;

    // Product Subtotal
    expect(snapshot.productSubtotalPaise).toBe(89900);
    expect(snapshot.productTaxablePaise).toBe(85619);
    expect(snapshot.productGstPaise).toBe(4281);

    // Delivery
    expect(snapshot.deliveryBasePaise).toBe(5000);
    expect(snapshot.deliveryGstPaise).toBe(900);
    expect(snapshot.deliveryTotalPaise).toBe(5900);

    // Platform Fee (Fixed ₹30 + 18% GST = ₹35.40)
    expect(snapshot.platformFeeBasePaise).toBe(3000);
    expect(snapshot.platformGstPaise).toBe(540);
    expect(snapshot.platformTotalPaise).toBe(3540);

    // Intra-state tax distribution (CGST + SGST)
    expect(snapshot.isInterStateDelivery).toBe(false);
    expect(snapshot.deliveryCgstPaise + snapshot.deliverySgstPaise).toBe(900);
    expect(snapshot.platformCgstPaise + snapshot.platformSgstPaise).toBe(540);

    // Grand Total Payable: 89900 + 5900 + 3540 = 99340 (₹993.40)
    expect(snapshot.grandTotalPaise).toBe(99340);
    expect(quote.formatted.grandTotal).toBe('₹993.40');
  });

  it('correctly handles inter-state delivery tax (IGST)', async () => {
    const items: AuthoritativeQuoteItemInput[] = [
      {
        productId: 'honey-500g',
        name: 'Wild Forest Honey (500g)',
        sku: 'SKU-HONEY-500G',
        unitPricePaise: 49900,
        quantity: 2,
        weight: '500g',
        weightGrams: 500,
        hsnCode: '0409',
      },
    ];

    const quote = await calculateAuthoritativeQuote({
      items,
      destinationPin: '110001', // New Delhi (Inter-state from Maharashtra 27)
      destinationState: 'Delhi',
      shippingMode: 'Express',
      customDeliveryBasePaise: 8000,
      customDeliveryTotalPaise: 9440, // ₹80.00 + 18% = ₹94.40
    });

    const { snapshot } = quote;
    expect(snapshot.isInterStateDelivery).toBe(true);
    expect(snapshot.deliveryIgstPaise).toBe(1440); // 18% on ₹80
    expect(snapshot.deliveryCgstPaise).toBe(0);
    expect(snapshot.deliverySgstPaise).toBe(0);
    expect(snapshot.platformIgstPaise).toBe(540);
    expect(snapshot.platformCgstPaise).toBe(0);
    expect(snapshot.platformSgstPaise).toBe(0);
  });

  it('correctly suppresses product GST, delivery GST, and platform fee when disabled in developer settings', async () => {
    const items: AuthoritativeQuoteItemInput[] = [
      {
        productId: 'honey-raw-comb-1000',
        name: 'Raw Honey Comb (1kg)',
        sku: 'SKU-HONEY-COMB-1KG',
        unitPricePaise: 89900,
        quantity: 1,
        weight: '1000g',
        weightGrams: 1000,
      },
    ];

    const quote = await calculateAuthoritativeQuote({
      items,
      destinationPin: '411001',
      destinationState: 'Maharashtra',
      overrideSettings: {
        productGstEnabled: false,
        deliveryGstEnabled: false,
        platformFeeEnabled: false,
        showProductGstBreakdown: false,
        customerGstBreakdownVisible: false,
      },
    });

    const { snapshot, disclosures } = quote;

    // Zero taxes across the entire order
    expect(snapshot.productGstPaise).toBe(0);
    expect(snapshot.productTaxablePaise).toBe(89900); // 100% of price is taxable/base
    expect(snapshot.deliveryGstPaise).toBe(0);
    expect(snapshot.platformFeeBasePaise).toBe(0);
    expect(snapshot.platformGstPaise).toBe(0);
    expect(snapshot.totalTaxPaise).toBe(0);

    // Disclosures correctly report suppression for customer UI
    expect(disclosures.productGstEnabled).toBe(false);
    expect(disclosures.deliveryGstEnabled).toBe(false);
    expect(disclosures.showPlatformFee).toBe(false);
    expect(disclosures.customerGstBreakdownVisible).toBe(false);
  });

  it('generates sequential B2B tax invoice numbers matching PINV-YYYY-XXXX', () => {
    const invNumber = generateInvoiceNumber(42);
    const currentYear = new Date().getFullYear();
    expect(invNumber).toBe(`PINV-${currentYear}-0042`);
  });

  it('successfully constructs formatted Excel workbook using ExcelJS', async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Test Sheet');
    ws.addRow(['Order ID', 'Platform Fee', 'GST 18%']);
    ws.addRow(['GH-101', 30.0, 5.4]);
    ws.addRow(['GH-102', 30.0, 5.4]);

    const buffer = await wb.xlsx.writeBuffer();
    expect(buffer).toBeDefined();
    expect(buffer.byteLength).toBeGreaterThan(100);
  });
});
