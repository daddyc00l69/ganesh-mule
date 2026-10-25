import { NextRequest, NextResponse } from 'next/server';
import { getLiveOrderById } from '@/lib/orders/store';
import { calculateConsignmentWeightGrams } from '@/lib/shipping/delhivery';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderNumber = searchParams.get('orderNumber');

  if (!orderNumber) {
    return new NextResponse('Order number is required', { status: 400 });
  }

  const order = getLiveOrderById(orderNumber);
  if (!order) {
    return new NextResponse(`Order #${orderNumber} not found`, { status: 404 });
  }

  const awb = order.trackingNumber || order.delhiveryWaybill || '143920192837';
  const weightGrams = calculateConsignmentWeightGrams(order.items);
  const pin = order.shippingAddress.postalCode;
  const routingCode = `DELH-PNQ-${pin.slice(0, 3)}-AIR`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Delhivery One Shipping Label - ${awb}</title>
  <style>
    @page {
      size: 4in 6in;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      width: 4in;
      height: 6in;
      margin: 0 auto;
      padding: 12px;
      background: #ffffff;
      color: #000000;
      font-size: 11px;
      line-height: 1.3;
    }
    .label-box {
      border: 2px solid #000;
      height: calc(100% - 4px);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 10px;
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #000;
      padding-bottom: 8px;
    }
    .carrier-logo {
      font-size: 18px;
      font-weight: 900;
      letter-spacing: -0.5px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .carrier-badge {
      background: #000;
      color: #fff;
      padding: 2px 6px;
      font-size: 10px;
      font-weight: 700;
      border-radius: 2px;
    }
    .routing-box {
      font-size: 14px;
      font-weight: 900;
      font-family: monospace;
      text-align: right;
    }
    .barcode-section {
      text-align: center;
      padding: 10px 0;
      border-bottom: 1px dashed #000;
    }
    .mock-barcode {
      display: inline-block;
      height: 48px;
      width: 85%;
      background: repeating-linear-gradient(
        to right,
        #000 0px,
        #000 2px,
        #fff 2px,
        #fff 4px,
        #000 4px,
        #000 7px,
        #fff 7px,
        #fff 8px,
        #000 8px,
        #000 11px,
        #fff 11px,
        #fff 14px
      );
    }
    .awb-text {
      font-family: monospace;
      font-size: 15px;
      font-weight: 800;
      letter-spacing: 2px;
      margin-top: 4px;
    }
    .address-section {
      padding: 8px 0;
      border-bottom: 1px solid #000;
    }
    .dest-title {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .dest-name {
      font-size: 14px;
      font-weight: 800;
      margin-top: 2px;
    }
    .dest-addr {
      font-size: 11px;
      margin-top: 2px;
      line-height: 1.3;
    }
    .pincode-highlight {
      display: inline-block;
      font-size: 18px;
      font-weight: 900;
      background: #000;
      color: #fff;
      padding: 2px 8px;
      margin-top: 4px;
      border-radius: 2px;
      letter-spacing: 1px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      padding: 6px 0;
      border-bottom: 1px solid #000;
      font-size: 10px;
    }
    .glass-warning {
      background: #fff;
      border: 2px solid #000;
      padding: 6px;
      text-align: center;
      font-weight: 900;
      font-size: 11px;
      letter-spacing: 0.5px;
      margin: 6px 0;
    }
    .shipper-row {
      font-size: 9px;
      color: #333;
      padding-top: 4px;
    }
    .print-btn-bar {
      margin-bottom: 10px;
      text-align: right;
    }
    @media print {
      .print-btn-bar {
        display: none;
      }
      body {
        padding: 0;
      }
    }
    .btn {
      background: #0071e3;
      color: #fff;
      border: none;
      padding: 8px 16px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="print-btn-bar">
    <button class="btn" onclick="window.print()">🖨️ Print Label (4x6 / A4)</button>
  </div>
  <div class="label-box">
    <div class="header-row">
      <div class="carrier-logo">
        <span>DELHIVERY</span>
        <span class="carrier-badge">ONE AIR</span>
      </div>
      <div class="routing-box">
        <div>${routingCode}</div>
        <div style="font-size: 9px; font-weight: 600;">PREPAID • PRIORITY</div>
      </div>
    </div>

    <div class="barcode-section">
      <div class="mock-barcode"></div>
      <div class="awb-text">AWB: ${awb}</div>
    </div>

    <div class="address-section">
      <div class="dest-title">Ship To (Consignee):</div>
      <div class="dest-name">${order.customerName}</div>
      <div class="dest-addr">
        ${order.shippingAddress.street}<br/>
        ${order.shippingAddress.city}, ${order.shippingAddress.state} - India<br/>
        <strong>Phone:</strong> ${order.shippingAddress.phone || order.customerPhone || 'N/A'}
      </div>
      <div>
        <span class="pincode-highlight">PIN: ${pin}</span>
      </div>
    </div>

    <div class="meta-grid">
      <div>
        <strong>Order No:</strong> ${order.orderNumber}<br/>
        <strong>Order Date:</strong> ${order.createdAt.split('T')[0]}<br/>
        <strong>Payment:</strong> PREPAID (Razorpay)
      </div>
      <div>
        <strong>Gross Weight:</strong> ${(weightGrams / 1000).toFixed(2)} KG<br/>
        <strong>Items Qty:</strong> ${order.items.reduce((acc, i) => acc + i.quantity, 0)} Units<br/>
        <strong>Dimensions:</strong> 18 x 14 x 14 cm
      </div>
    </div>

    <div class="glass-warning">
      ⚠️ FRAGILE: SOLID GLASS PACKAGING • HANDLE WITH EXTREME CARE
    </div>

    <div class="shipper-row">
      <strong>Shipped By:</strong> Ganesh Mule Pure Raw Honey Apiaries<br/>
      Dispatch Center, Pune Apiary Farm, Maharashtra 411004 • Portal: <a href="https://one.delhivery.com" target="_blank" style="color:#000; text-decoration:none;">one.delhivery.com</a>
    </div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
