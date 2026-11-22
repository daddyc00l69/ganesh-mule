import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { requireAuth } from '@/lib/auth/server';
import { prisma, isDatabaseOnline } from '@/lib/db';
import { getPlatformBusinessProfile } from '@/lib/finance/settings-store';
import { getLiveOrders } from '@/lib/orders/store';

export async function GET(req: NextRequest) {
  const auth = await requireAuth('DEVELOPER');
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'complete';
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const userEmail = auth.user.email;

  const profile = await getPlatformBusinessProfile();
  const dbOnline = await isDatabaseOnline();

  // Load orders and platform transactions
  let ordersList: any[] = [];
  let transactionsList: any[] = [];
  let invoicesList: any[] = [];
  let refundsList: any[] = [];

  if (dbOnline) {
    try {
      const whereOrder: any = {};
      if (startDate || endDate) {
        whereOrder.createdAt = {};
        if (startDate) whereOrder.createdAt.gte = new Date(startDate);
        if (endDate) whereOrder.createdAt.lte = new Date(endDate);
      }

      ordersList = await prisma.order.findMany({
        where: whereOrder,
        include: { items: true, payments: true, platformTransaction: true },
        orderBy: { createdAt: 'desc' },
      });

      transactionsList = await prisma.platformTransaction.findMany({
        include: { order: true, invoice: true },
        orderBy: { createdAt: 'desc' },
      });

      invoicesList = await prisma.platformInvoice.findMany({
        orderBy: { createdAt: 'desc' },
      });

      refundsList = await prisma.platformRefundRecord.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (err) {
      console.warn('[ExportsAPI] DB load error:', err);
    }
  }

  if (ordersList.length === 0) {
    ordersList = getLiveOrders();
  }

  // Create ExcelJS Workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = `${profile.legalName} Finance Platform`;
  workbook.lastModifiedBy = auth.user.email;
  workbook.created = new Date();
  workbook.modified = new Date();

  const primaryHeaderFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1D1D1F' }, // Apple sleek dark
  };

  const headerFont: Partial<ExcelJS.Font> = {
    name: 'Segoe UI',
    size: 11,
    bold: true,
    color: { argb: 'FFFFFFFF' },
  };

  const currencyFormat = '"₹"#,##0.00';
  const dateFormat = 'YYYY-MM-DD HH:mm';

  // Helper to add standard header banner
  function addReportHeader(sheet: ExcelJS.Worksheet, title: string) {
    sheet.mergeCells('A1:G1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `${profile.legalName} — ${title}`;
    titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FF0071E3' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'left' };

    sheet.mergeCells('A2:G2');
    const subCell = sheet.getCell('A2');
    subCell.value = `Generated on: ${new Date().toLocaleString('en-IN')} | User: ${userEmail} | Scope: Production Financial Ledger`;
    subCell.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: 'FF86868B' } };
    sheet.addRow([]); // Blank row
  }

  // 1. Complete Financial Report
  if (type === 'complete' || type === 'order-breakdown') {
    const sheet = workbook.addWorksheet('Order Financial Breakdown');
    addReportHeader(sheet, 'Complete Order-Wise Financial Report');

    sheet.columns = [
      { header: 'Order Number', key: 'orderNumber', width: 18 },
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Customer', key: 'customer', width: 24 },
      { header: 'Items Total (₹)', key: 'subtotal', width: 16 },
      { header: 'Product GST 5% (₹)', key: 'productGst', width: 18 },
      { header: 'Courier Delivery (₹)', key: 'delivery', width: 18 },
      { header: 'Delivery GST 18% (₹)', key: 'deliveryGst', width: 18 },
      { header: 'Platform Fee (₹)', key: 'platformFee', width: 16 },
      { header: 'Platform GST 18% (₹)', key: 'platformGst', width: 18 },
      { header: 'Grand Total (₹)', key: 'grandTotal', width: 18 },
      { header: 'Payment Status', key: 'status', width: 15 },
    ];

    sheet.getRow(4).values = sheet.columns.map((c) => String(c.header || '')) as any;
    sheet.getRow(4).fill = primaryHeaderFill;
    sheet.getRow(4).font = headerFont;
    sheet.getRow(4).height = 26;

    let rowIndex = 5;
    for (const o of ordersList) {
      const snap = o.financialSnapshot || {};
      const row = sheet.addRow({
        orderNumber: o.orderNumber,
        date: new Date(o.createdAt || Date.now()),
        customer: o.customerName || 'Customer',
        subtotal: (o.subtotal || 0) / 100,
        productGst: (snap.productGstPaise || (o.subtotal ? Math.round(o.subtotal * 0.05 / 1.05) : 0)) / 100,
        delivery: (snap.deliveryBasePaise || snap.shippingBase || (o.shippingCost ? Math.round(o.shippingCost / 1.18) : 0)) / 100,
        deliveryGst: (snap.deliveryGstPaise || snap.shippingGst || (o.shippingCost ? o.shippingCost - Math.round(o.shippingCost / 1.18) : 0)) / 100,
        platformFee: (snap.platformFeeBasePaise || o.platformFee || 3000) / 100,
        platformGst: (snap.platformGstPaise || o.platformFeeGst || 540) / 100,
        grandTotal: (o.totalAmount || 0) / 100,
        status: o.paymentStatus || 'PAID',
      });

      row.getCell('date').numFmt = dateFormat;
      row.getCell('subtotal').numFmt = currencyFormat;
      row.getCell('productGst').numFmt = currencyFormat;
      row.getCell('delivery').numFmt = currencyFormat;
      row.getCell('deliveryGst').numFmt = currencyFormat;
      row.getCell('platformFee').numFmt = currencyFormat;
      row.getCell('platformGst').numFmt = currencyFormat;
      row.getCell('grandTotal').numFmt = currencyFormat;
      rowIndex++;
    }

    // Summary Total Row
    if (ordersList.length > 0) {
      const summaryRow = sheet.addRow({
        orderNumber: 'TOTAL',
        subtotal: { formula: `SUM(D5:D${rowIndex - 1})` },
        productGst: { formula: `SUM(E5:E${rowIndex - 1})` },
        delivery: { formula: `SUM(F5:F${rowIndex - 1})` },
        deliveryGst: { formula: `SUM(G5:G${rowIndex - 1})` },
        platformFee: { formula: `SUM(H5:H${rowIndex - 1})` },
        platformGst: { formula: `SUM(I5:I${rowIndex - 1})` },
        grandTotal: { formula: `SUM(J5:J${rowIndex - 1})` },
      });
      summaryRow.font = { bold: true };
      summaryRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF5F5F7' },
      };
      summaryRow.getCell('subtotal').numFmt = currencyFormat;
      summaryRow.getCell('productGst').numFmt = currencyFormat;
      summaryRow.getCell('delivery').numFmt = currencyFormat;
      summaryRow.getCell('deliveryGst').numFmt = currencyFormat;
      summaryRow.getCell('platformFee').numFmt = currencyFormat;
      summaryRow.getCell('platformGst').numFmt = currencyFormat;
      summaryRow.getCell('grandTotal').numFmt = currencyFormat;
    }
  }

  // 2. Platform Earnings & Transactions Report
  if (type === 'earnings' || type === 'transactions' || type === 'complete') {
    const sheet = workbook.addWorksheet('Platform Service Earnings');
    addReportHeader(sheet, 'Platform Service Fees & Retained Revenue');

    sheet.columns = [
      { header: 'Tx ID', key: 'txId', width: 16 },
      { header: 'Order Number', key: 'orderNumber', width: 18 },
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Gross Order (₹)', key: 'grossOrder', width: 18 },
      { header: 'Platform Fee (₹)', key: 'fee', width: 18 },
      { header: 'GST Rate', key: 'rate', width: 12 },
      { header: 'Platform GST 18% (₹)', key: 'gst', width: 18 },
      { header: 'Total Platform Net (₹)', key: 'total', width: 20 },
      { header: 'Payment Status', key: 'paymentStatus', width: 15 },
      { header: 'Settlement Status', key: 'settlement', width: 16 },
    ];

    sheet.getRow(4).values = sheet.columns.map((c) => String(c.header || '')) as any;
    sheet.getRow(4).fill = primaryHeaderFill;
    sheet.getRow(4).font = headerFont;
    sheet.getRow(4).height = 26;

    let rIdx = 5;
    for (const o of ordersList) {
      const snap = o.financialSnapshot || {};
      const fee = (snap.platformFeeBasePaise || o.platformFee || 3000) / 100;
      const gst = (snap.platformGstPaise || o.platformFeeGst || 540) / 100;
      const row = sheet.addRow({
        txId: `TX-${o.orderNumber || o.id}`,
        orderNumber: o.orderNumber,
        date: new Date(o.createdAt || Date.now()),
        grossOrder: (o.totalAmount || 0) / 100,
        fee,
        rate: '18%',
        gst,
        total: fee + gst,
        paymentStatus: o.paymentStatus || 'PAID',
        settlement: o.paymentStatus === 'PAID' ? 'SETTLED' : 'PENDING',
      });
      row.getCell('date').numFmt = dateFormat;
      row.getCell('grossOrder').numFmt = currencyFormat;
      row.getCell('fee').numFmt = currencyFormat;
      row.getCell('gst').numFmt = currencyFormat;
      row.getCell('total').numFmt = currencyFormat;
      rIdx++;
    }

    if (ordersList.length > 0) {
      const sum = sheet.addRow({
        txId: 'TOTAL',
        grossOrder: { formula: `SUM(D5:D${rIdx - 1})` },
        fee: { formula: `SUM(E5:E${rIdx - 1})` },
        gst: { formula: `SUM(G5:G${rIdx - 1})` },
        total: { formula: `SUM(H5:H${rIdx - 1})` },
      });
      sum.font = { bold: true };
      sum.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F7' } };
      sum.getCell('grossOrder').numFmt = currencyFormat;
      sum.getCell('fee').numFmt = currencyFormat;
      sum.getCell('gst').numFmt = currencyFormat;
      sum.getCell('total').numFmt = currencyFormat;
    }
  }

  // 3. GST Collected Statutory Report
  if (type === 'gst' || type === 'complete') {
    const sheet = workbook.addWorksheet('GST Compliance Register');
    addReportHeader(sheet, 'Statutory GST Liability (Product 5% & Logistics/Platform 18%)');

    sheet.columns = [
      { header: 'Order Number', key: 'orderNumber', width: 18 },
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Customer State', key: 'state', width: 18 },
      { header: 'Honey Taxable 5% (₹)', key: 'honeyTaxable', width: 20 },
      { header: 'Honey GST (₹)', key: 'honeyGst', width: 16 },
      { header: 'Services Taxable 18% (₹)', key: 'servTaxable', width: 22 },
      { header: 'CGST 9% (₹)', key: 'cgst', width: 14 },
      { header: 'SGST 9% (₹)', key: 'sgst', width: 14 },
      { header: 'IGST 18% (₹)', key: 'igst', width: 14 },
      { header: 'Total GST (₹)', key: 'totalTax', width: 16 },
    ];

    sheet.getRow(4).values = sheet.columns.map((c) => String(c.header || '')) as any;
    sheet.getRow(4).fill = primaryHeaderFill;
    sheet.getRow(4).font = headerFont;
    sheet.getRow(4).height = 26;

    let gIdx = 5;
    for (const o of ordersList) {
      const snap = o.financialSnapshot || {};
      const addr = typeof o.shippingAddress === 'object' ? o.shippingAddress : {};
      const state = addr.state || 'Maharashtra';
      const isInterState = state !== 'Maharashtra';

      const honeyTaxable = (snap.productTaxablePaise || Math.round((o.subtotal || 85619) * 100 / 105)) / 100;
      const honeyGst = (snap.productGstPaise || Math.round((o.subtotal || 85619) * 0.05 / 1.05)) / 100;
      const servTaxable = ((snap.deliveryBasePaise || 0) + (snap.platformFeeBasePaise || 3000)) / 100;
      const servGst = ((snap.deliveryGstPaise || 0) + (snap.platformGstPaise || 540)) / 100;
      const totalTax = honeyGst + servGst;

      const cgst = isInterState ? 0 : totalTax / 2;
      const sgst = isInterState ? 0 : totalTax / 2;
      const igst = isInterState ? totalTax : 0;

      const row = sheet.addRow({
        orderNumber: o.orderNumber,
        date: new Date(o.createdAt || Date.now()),
        state,
        honeyTaxable,
        honeyGst,
        servTaxable,
        cgst,
        sgst,
        igst,
        totalTax,
      });

      row.getCell('date').numFmt = dateFormat;
      row.getCell('honeyTaxable').numFmt = currencyFormat;
      row.getCell('honeyGst').numFmt = currencyFormat;
      row.getCell('servTaxable').numFmt = currencyFormat;
      row.getCell('cgst').numFmt = currencyFormat;
      row.getCell('sgst').numFmt = currencyFormat;
      row.getCell('igst').numFmt = currencyFormat;
      row.getCell('totalTax').numFmt = currencyFormat;
      gIdx++;
    }
  }

  // Generate binary Excel buffer
  const buffer = await workbook.xlsx.writeBuffer();

  // Audit log export action
  if (dbOnline) {
    try {
      await prisma.platformFinancialAuditLog.create({
        data: {
          actorId: auth.user.id,
          actorEmail: auth.user.email,
          actorRole: auth.user.role,
          category: 'FINANCIAL_EXPORT',
          action: 'GENERATE_EXCEL_REPORT',
          reason: `Exported ${type.toUpperCase()} Excel workbook with ${ordersList.length} records`,
        },
      });
    } catch { }
  }

  const filename = `ganesh_honey_platform_finance_${type}_${Date.now()}.xlsx`;

  return new NextResponse(buffer as any, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

