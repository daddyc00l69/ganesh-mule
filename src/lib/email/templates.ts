import { OrderRecord } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  BRAND_NAME,
  BRAND_SHORT,
  BRAND_TAGLINE,
  SUPPORT_EMAIL,
  COMPANY_LEGAL_NAME,
} from '@/lib/constants/brand';

const PRIMARY_COLOR = '#d97706'; // warm amber gold
const DARK_BG = '#0f0f11';
const TEXT_MUTED = '#86868b';

/**
 * Shared email shell wrapping content in high-end Apple/Amber & Glass aesthetics
 */
function wrapEmailShell(title: string, bodyContent: string, appUrl = 'http://localhost:3001'): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f5f5f7;
      color: #1d1d1f;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 600px;
      margin: 24px auto;
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
      border: 1px solid #d2d2d7;
    }
    .header {
      background: #0f0f11;
      padding: 32px 28px;
      text-align: center;
      color: #ffffff;
      border-bottom: 2px solid #d97706;
    }
    .header-logo {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.5px;
      color: #f59e0b;
      margin: 0;
      text-transform: uppercase;
    }
    .header-subtitle {
      font-size: 11px;
      color: #a1a1a6;
      margin-top: 6px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.3px;
    }
    .badge-amber {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
    }
    .badge-green {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }
    .badge-red {
      background: #fef2f2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }
    .badge-blue {
      background: #eff6ff;
      color: #1e40af;
      border: 1px solid #bfdbfe;
    }
    .content {
      padding: 32px 28px;
    }
    .title {
      font-size: 20px;
      font-weight: 700;
      color: #1d1d1f;
      margin: 0 0 12px 0;
      letter-spacing: -0.3px;
    }
    .description {
      font-size: 13px;
      line-height: 1.6;
      color: #515154;
      margin: 0 0 24px 0;
    }
    .card {
      background: #f9f9fb;
      border: 1px solid #e5e5ea;
      border-radius: 14px;
      padding: 18px;
      margin-bottom: 20px;
    }
    .card-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #86868b;
      margin-bottom: 12px;
    }
    .item-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #e5e5ea;
      font-size: 12px;
    }
    .item-row:last-child {
      border-bottom: none;
    }
    .item-name {
      font-weight: 600;
      color: #1d1d1f;
    }
    .item-sku {
      font-size: 10px;
      color: #86868b;
      font-family: monospace;
      margin-top: 2px;
    }
    .table-summary {
      width: 100%;
      border-collapse: collapse;
      margin-top: 14px;
      font-size: 12px;
    }
    .table-summary td {
      padding: 6px 0;
      color: #6e6e73;
    }
    .table-summary td.amount {
      text-align: right;
      font-weight: 500;
      color: #1d1d1f;
    }
    .table-summary tr.total td {
      border-top: 1px solid #d2d2d7;
      padding-top: 12px;
      font-size: 15px;
      font-weight: 700;
      color: #1d1d1f;
    }
    .btn {
      display: inline-block;
      background: #0071e3;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      text-align: center;
      margin: 16px 0;
    }
    .btn-amber {
      background: #d97706;
    }
    .btn:hover {
      opacity: 0.95;
    }
    .instruction-box {
      background: #fffbeb;
      border: 1px solid #fef3c7;
      border-left: 4px solid #f59e0b;
      border-radius: 12px;
      padding: 16px;
      margin: 20px 0;
      font-size: 12px;
      line-height: 1.6;
      color: #78350f;
    }
    .instruction-title {
      font-weight: 700;
      font-size: 13px;
      color: #92400e;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .schedule-box {
      background: #f5f5f7;
      border: 1px solid #d2d2d7;
      border-radius: 12px;
      padding: 14px;
      margin: 20px 0;
      font-size: 11px;
      color: #1d1d1f;
    }
    .footer {
      background: #f5f5f7;
      padding: 24px 28px;
      text-align: center;
      font-size: 11px;
      color: #86868b;
      border-top: 1px solid #e5e5ea;
      line-height: 1.5;
    }
    .footer a {
      color: #0071e3;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="header-logo">✦ ${BRAND_NAME} ✦</h1>
      <p class="header-subtitle">${BRAND_TAGLINE}</p>
    </div>
    <div class="content">
      ${bodyContent}
    </div>
    <div class="footer">
      <p><strong>${COMPANY_LEGAL_NAME}</strong><br>
      Western Ghats Deciduous Biosphere &amp; Himalayan Valley Reserves<br>
      Support: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a> • FSSAI Lic. Verified</p>
      <p style="margin-top: 8px; font-size: 10px; color: #a1a1a6;">
        Strict Food Safety Standard: 100% Sealed Consumables Non-Refundable.<br>
        Covered by our 100% Zero-Breakage Solid Glass Transit Replacement Guarantee.
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * 1. Customer Order Confirmation & Payment Success Email
 */
export function getOrderConfirmationEmailHtml(order: OrderRecord, appUrl = 'http://localhost:3001'): string {
  const invoiceUrl = `${appUrl}/invoice/${order.orderNumber}`;
  const accountUrl = `${appUrl}/account`;

  const itemsHtml = order.items
    .map(
      (item) => `
    <div style="padding: 10px 0; border-bottom: 1px solid #e5e5ea;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="vertical-align: top; text-align: left;">
            <div style="font-weight: 600; color: #1d1d1f; font-size: 13px;">${item.productName}</div>
            <div style="font-size: 11px; color: #86868b; font-family: monospace; margin-top: 2px;">
              SKU: ${item.sku} × ${item.quantity}
            </div>
          </td>
          <td style="vertical-align: top; text-align: right; font-weight: 600; color: #1d1d1f; font-size: 13px;">
            ${formatCurrency(item.total)}
          </td>
        </tr>
      </table>
    </div>`
    )
    .join('');

  const bodyContent = `
    <div style="text-align: right; margin-bottom: 12px;">
      <span class="badge badge-green">✓ 100% PREPAID PAYMENT VERIFIED</span>
    </div>
    <h2 class="title">Thank you for your order, ${order.customerName}!</h2>
    <p class="description">
      Your payment has been successfully authenticated via Razorpay. Your raw honey harvest jars have been reserved in our climate-controlled cellar and queued for precision packing.
    </p>

    <!-- Order Metadata -->
    <div class="card">
      <div class="card-title">Order Reference &amp; Destination</div>
      <table style="width: 100%; font-size: 12px; line-height: 1.6;">
        <tr>
          <td style="color: #86868b; width: 35%;">Order Number:</td>
          <td style="font-weight: 700; font-family: monospace; color: #1d1d1f;">${order.orderNumber}</td>
        </tr>
        <tr>
          <td style="color: #86868b;">Order Date:</td>
          <td style="color: #1d1d1f;">${formatDate(order.createdAt)}</td>
        </tr>
        <tr>
          <td style="color: #86868b;">Payment Method:</td>
          <td style="color: #1d1d1f;">Online Prepaid (Razorpay Verified)</td>
        </tr>
        <tr>
          <td style="color: #86868b; vertical-align: top;">Delivery Address:</td>
          <td style="color: #1d1d1f;">
            <strong>${order.shippingAddress.fullName}</strong><br>
            ${order.shippingAddress.street}<br>
            ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.postalCode}<br>
            Phone: ${order.shippingAddress.phone}
          </td>
        </tr>
      </table>
    </div>

    <!-- Items -->
    <div class="card">
      <div class="card-title">Harvest Items Ordered</div>
      ${itemsHtml}

      <!-- Financial Calculation -->
      <table class="table-summary">
        <tr>
          <td>Subtotal</td>
          <td class="amount">${formatCurrency(order.subtotal)}</td>
        </tr>
        ${
          order.discountAmount > 0
            ? `<tr>
          <td style="color: #059669; font-weight: 600;">Promotional Coupon Discount</td>
          <td class="amount" style="color: #059669; font-weight: 600;">-${formatCurrency(order.discountAmount)}</td>
        </tr>`
            : ''
        }
        <tr>
          <td>Courier Shipping &amp; Insured Transit (Base + 18% GST)</td>
          <td class="amount">${order.shippingCost === 0 ? '<span style="color: #059669; font-weight: 600;">FREE</span>' : formatCurrency(order.shippingCost)}</td>
        </tr>
        <tr>
          <td>Statutory GST Collected</td>
          <td class="amount">${formatCurrency(order.taxAmount)}</td>
        </tr>
        <tr class="total">
          <td>Total Paid (Prepaid)</td>
          <td class="amount">${formatCurrency(order.totalAmount)}</td>
        </tr>
      </table>
    </div>

    <!-- Warehouse Operating Schedule -->
    <div class="schedule-box">
      <div style="font-weight: 700; margin-bottom: 6px; color: #1d1d1f; font-size: 12px;">
        ⏱ Daily Warehouse Dispatch SLA (IST Schedule):
      </div>
      <table style="width: 100%; font-size: 11px; line-height: 1.5; color: #515154;">
        <tr><td style="width: 25%; font-weight: 600;">• 12:30 AM IST:</td><td>Automated batch reconciliation &amp; warehouse queue generation</td></tr>
        <tr><td style="font-weight: 600;">• 09:00 AM IST:</td><td>Individual picking &amp; heavy solid glass kraft cushioning</td></tr>
        <tr><td style="font-weight: 600;">• 11:00 AM IST:</td><td>Batch 1 packing completion &amp; courier manifest</td></tr>
        <tr><td style="font-weight: 600;">• 01:00 PM IST:</td><td>Delhivery Insured Air courier pickup</td></tr>
        <tr><td style="font-weight: 600;">• 04:00 PM IST:</td><td>Final same-day packing cutoff</td></tr>
      </table>
    </div>

    <!-- Care Instructions -->
    <div class="instruction-box">
      <div class="instruction-title">
        🍯 Essential Raw Honey Handling &amp; Storage Instructions
      </div>
      <ul style="margin: 0; padding-left: 18px;">
        <li><strong>Living Enzymes (Diastase &amp; Invertase):</strong> Never heat this honey above 40°C or microwave it. High temperatures destroy its delicate bioactive properties.</li>
        <li><strong>Natural Velvet Crystallization:</strong> Raw, unpasteurized honey naturally crystallizes below 20°C due to natural glucose and pollen grains. To reliquefy, simply place the sealed glass jar in a bowl of lukewarm water (under 40°C).</li>
        <li><strong>Heavy Solid Glass Packaging:</strong> Our heavy glass preserves aromatics without microplastic chemical leaching. Keep tightly capped at room temperature. Raw honey never naturally spoils.</li>
        <li><strong>No Cash-on-Delivery (COD):</strong> All Amber &amp; Glass harvests are 100% prepaid to guarantee hygiene, cold-chain safety, and sealed authenticity.</li>
      </ul>
    </div>

    <!-- Actions -->
    <div style="text-align: center; margin-top: 24px;">
      <a href="${invoiceUrl}" target="_blank" class="btn btn-amber">
        Download Official GST Tax Invoice (PDF)
      </a>
      <div style="margin-top: 10px;">
        <a href="${accountUrl}" style="font-size: 12px; color: #0071e3; text-decoration: none;">
          View Order Status in My Account →
        </a>
      </div>
    </div>
  `;

  return wrapEmailShell(`Order Confirmed: #${order.orderNumber}`, bodyContent, appUrl);
}

/**
 * 2. Customer Payment Failed Notification Email
 */
export function getPaymentFailedEmailHtml(
  order: Partial<OrderRecord>,
  errorReason = 'Transaction interrupted or declined by issuing bank',
  appUrl = 'http://localhost:3001'
): string {
  const retryUrl = `${appUrl}/checkout`;

  const bodyContent = `
    <div style="text-align: right; margin-bottom: 12px;">
      <span class="badge badge-red">PAYMENT INCOMPLETE</span>
    </div>
    <h2 class="title">We couldn't process your payment</h2>
    <p class="description">
      Your online payment for Order <strong>#${order.orderNumber || 'Pending'}</strong> could not be authenticated via Razorpay gateway.
    </p>

    <div class="card" style="border-left: 4px solid #ef4444;">
      <div class="card-title">Reason Provided by Gateway</div>
      <p style="margin: 0; font-size: 13px; color: #991b1b; font-weight: 500;">
        ${errorReason}
      </p>
      <p style="margin: 8px 0 0 0; font-size: 11px; color: #86868b;">
        No money has been permanently deducted from your account. If amount was debited, your bank will automatically reverse it within 24-48 hours.
      </p>
    </div>

    <div class="card">
      <div class="card-title">Order Amount &amp; Payment Options</div>
      <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #1d1d1f;">
        Total Amount: ${formatCurrency(order.totalAmount || 0)}
      </p>
      <p style="margin: 0; font-size: 12px; color: #6e6e73; line-height: 1.5;">
        You can resume checkout immediately using any alternative UPI app (Google Pay, PhonePe, Paytm), Credit/Debit Card, or NetBanking.
      </p>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${retryUrl}" class="btn">
        Resume Checkout &amp; Complete Order →
      </a>
      <p style="font-size: 11px; color: #86868b; margin-top: 12px;">
        Need help? Contact our desk at <a href="mailto:support@ganeshmule.com">support@ganeshmule.com</a>
      </p>
    </div>
  `;

  return wrapEmailShell(`Payment Incomplete: #${order.orderNumber || 'Ganesh Mule'}`, bodyContent, appUrl);
}

/**
 * 3. Customer Order Processing & Warehouse Queued Email
 */
export function getOrderConfirmedEmailHtml(order: OrderRecord, appUrl = 'http://localhost:3001'): string {
  const bodyContent = `
    <div style="text-align: right; margin-bottom: 12px;">
      <span class="badge badge-amber">WAREHOUSE QUEUED</span>
    </div>
    <h2 class="title">Your harvest is in the warehouse packing queue</h2>
    <p class="description">
      Order <strong>#${order.orderNumber}</strong> has been verified in our 12:30 AM IST automated reconciliation batch. Stock is reserved and assigned for custom solid-glass packaging.
    </p>

    <div class="card">
      <div class="card-title">Fulfillment Checklist</div>
      <table style="width: 100%; font-size: 12px; line-height: 1.6;">
        <tr><td style="color: #059669; font-weight: 600;">✓ NMR Purity Fingerprint Verified</td><td>Batch 100% Free of C3/C4 Syrups</td></tr>
        <tr><td style="color: #059669; font-weight: 600;">✓ Heavy Glass Inspection</td><td>Airtight seal &amp; zero micro-fractures confirmed</td></tr>
        <tr><td style="color: #059669; font-weight: 600;">✓ Courier Manifest Generated</td><td>Scheduled for insured express air dispatch</td></tr>
      </table>
    </div>

    <div class="schedule-box">
      <strong>Next Operational Milestone:</strong> Packaging will be completed at 11:00 AM IST and handed to Delhivery Insured Air freight at 1:00 PM IST. You will receive an immediate tracking update as soon as the AWB is scanned.
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${appUrl}/account" class="btn">
        View Live Status in My Account
      </a>
    </div>
  `;

  return wrapEmailShell(`Order In Packing Queue: #${order.orderNumber}`, bodyContent, appUrl);
}

/**
 * 4. Customer Order Dispatched / In Transit Email
 */
export function getOrderShippedEmailHtml(order: OrderRecord, appUrl = 'http://localhost:3001'): string {
  const trackingNumber = order.trackingNumber || 'DELHIVERY-HNY-LIVE';
  const carrier = order.carrier || 'Delhivery Insured Air';
  const trackingUrl = `https://www.delhivery.com/track/package/${trackingNumber}`;

  const bodyContent = `
    <div style="text-align: right; margin-bottom: 12px;">
      <span class="badge badge-blue">EN ROUTE • INSURED AIR FREIGHT</span>
    </div>
    <h2 class="title">Your raw honey harvest has shipped!</h2>
    <p class="description">
      Order <strong>#${order.orderNumber}</strong> has completed morning packaging and has been handed over to our national courier partner.
    </p>

    <!-- Tracking Card -->
    <div class="card" style="border: 2px solid #bfdbfe; background: #f0f7ff;">
      <div class="card-title" style="color: #1e40af;">Courier Tracking Information</div>
      <table style="width: 100%; font-size: 13px; line-height: 1.7;">
        <tr>
          <td style="color: #64748b; width: 35%;">Courier Partner:</td>
          <td style="font-weight: 600; color: #0f172a;">${carrier}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Airway Bill (AWB):</td>
          <td style="font-weight: 700; font-family: monospace; color: #0f172a; font-size: 14px;">${trackingNumber}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Estimated Delivery:</td>
          <td style="font-weight: 600; color: #059669;">2 - 4 Business Days (Express Insured Transit)</td>
        </tr>
      </table>

      <div style="text-align: center; margin-top: 16px;">
        <a href="${trackingUrl}" target="_blank" class="btn btn-amber" style="margin: 0;">
          Track Live Air Courier Status →
        </a>
      </div>
    </div>

    <!-- Zero Breakage Assurance -->
    <div class="instruction-box" style="background: #f0fdf4; border-color: #bbf7d0; border-left-color: #22c55e; color: #14532d;">
      <div class="instruction-title" style="color: #15803d;">
        🛡 100% Zero-Breakage Solid Glass Guarantee
      </div>
      Every jar is cushioned in 5-layer engineered shock-absorbent corrugated kraft paper. In the rare event of transit damage, inspect upon delivery and our team will issue an <strong>instant free replacement harvest</strong> immediately upon photo verification.
    </div>
  `;

  return wrapEmailShell(`Dispatched: Ganesh Mule Order #${order.orderNumber}`, bodyContent, appUrl);
}

/**
 * 5. Customer Order Delivered Email & Tasting Notes
 */
export function getOrderDeliveredEmailHtml(order: OrderRecord, appUrl = 'http://localhost:3001'): string {
  const bodyContent = `
    <div style="text-align: right; margin-bottom: 12px;">
      <span class="badge badge-green">DELIVERED</span>
    </div>
    <h2 class="title">Your harvest has arrived!</h2>
    <p class="description">
      Order <strong>#${order.orderNumber}</strong> was marked as successfully delivered. We hope you savor the botanical complexity of wild canopy flora.
    </p>

    <div class="card">
      <div class="card-title">Sommelier Tasting &amp; Pairing Notes</div>
      <ul style="margin: 0; padding-left: 18px; font-size: 12px; line-height: 1.7; color: #374151;">
        <li><strong>Morning Tonic:</strong> Stir 1 teaspoon into warm water (below 40°C) with freshly squeezed lemon. Never use boiling water to keep active catalase and invertase intact.</li>
        <li><strong>Gourmet Pairings:</strong> Drizzle over toasted artisan sourdough with salted cultured butter, whipped ricotta, or sharp aged cheddar.</li>
        <li><strong>Pure Honey Comb:</strong> If you received our Virgin Honeycomb Slab, cut small squares and chew the natural edible beeswax cell like gum to enjoy pure floral propolis.</li>
      </ul>
    </div>

    <div class="instruction-box">
      <div class="instruction-title">
        🔍 Verify Your Batch NMR Certificate
      </div>
      Every Ganesh Mule jar features a lot code on the tamper seal. You can inspect the German NMR spectroscopy purity graph confirming 0.0% added syrups at <a href="${appUrl}/support" style="color: #d97706; font-weight: 600;">our Purity Portal</a>.
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${appUrl}/shop" class="btn btn-amber">
        Explore Next Seasonal Harvests
      </a>
    </div>
  `;

  return wrapEmailShell(`Delivered: Ganesh Mule Order #${order.orderNumber}`, bodyContent, appUrl);
}

/**
 * 6. Admin & Manager High-Priority New Order Alert Email
 */
export function getNewOrderAdminAlertEmailHtml(order: OrderRecord, appUrl = 'http://localhost:3001'): string {
  const itemsSummary = order.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ');

  const bodyContent = `
    <div style="text-align: right; margin-bottom: 12px;">
      <span class="badge badge-green">NEW PAID ORDER</span>
    </div>
    <h2 class="title" style="color: #1d1d1f;">New Order: ${order.orderNumber} (₹${(order.totalAmount / 100).toFixed(2)})</h2>
    <p class="description">
      A prepaid transaction has been verified via Razorpay and requires processing in the upcoming IST warehouse batch.
    </p>

    <div class="card">
      <div class="card-title">Order Intelligence</div>
      <table style="width: 100%; font-size: 12px; line-height: 1.6;">
        <tr><td style="color: #86868b; width: 35%;">Customer:</td><td style="font-weight: 600;">${order.customerName} (${order.customerEmail})</td></tr>
        <tr><td style="color: #86868b;">Phone:</td><td>${order.customerPhone || 'N/A'}</td></tr>
        <tr><td style="color: #86868b;">Destination:</td><td>${order.shippingAddress.city}, ${order.shippingAddress.state} (${order.shippingAddress.postalCode})</td></tr>
        <tr><td style="color: #86868b;">Items Ordered:</td><td>${itemsSummary}</td></tr>
        <tr><td style="color: #86868b;">Total Prepaid:</td><td style="font-weight: 700; color: #059669;">${formatCurrency(order.totalAmount)}</td></tr>
      </table>
    </div>

    <div class="schedule-box">
      <strong>Next Warehouse Action:</strong> Automatic inclusion in 12:30 AM IST batch reconciliation. Target picking at 9:00 AM IST.
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${appUrl}/admin/orders" class="btn">
        Open Admin Order Console →
      </a>
      &nbsp;&nbsp;
      <a href="${appUrl}/manager/orders" class="btn btn-amber">
        Open Manager Desk →
      </a>
    </div>
  `;

  return wrapEmailShell(`[New Order] ${order.orderNumber} - ₹${(order.totalAmount / 100).toFixed(2)}`, bodyContent, appUrl);
}

/**
 * 7. Admin Per-Manager Daily Performance & Sales Report Email
 */
export function getDailyManagerReportEmailHtml(
  reportData: {
    date: string;
    totalOrders: number;
    totalRevenue: number;
    managers: {
      name: string;
      email: string;
      department: string;
      assignedCoupons: string[];
      ordersCount: number;
      revenue: number;
      discountGiven: number;
      supportTickets: number;
    }[];
  },
  appUrl = 'http://localhost:3001'
): string {
  const managerRows = reportData.managers
    .map(
      (m) => `
    <tr style="border-bottom: 1px solid #e5e5ea;">
      <td style="padding: 10px 6px;">
        <strong style="color: #1d1d1f;">${m.name}</strong><br>
        <span style="font-size: 10px; color: #86868b;">${m.department}</span>
      </td>
      <td style="padding: 10px 6px; text-align: center; font-family: monospace;">
        ${m.assignedCoupons.join(', ') || 'None'}
      </td>
      <td style="padding: 10px 6px; text-align: center; font-weight: 600;">
        ${m.ordersCount}
      </td>
      <td style="padding: 10px 6px; text-align: right; font-weight: 700; color: #059669;">
        ${formatCurrency(m.revenue)}
      </td>
      <td style="padding: 10px 6px; text-align: right; color: #dc2626;">
        -${formatCurrency(m.discountGiven)}
      </td>
    </tr>`
    )
    .join('');

  const bodyContent = `
    <div style="text-align: right; margin-bottom: 12px;">
      <span class="badge badge-amber">EXECUTIVE AUDIT REPORT</span>
    </div>
    <h2 class="title">Daily Operations &amp; Manager Performance Report</h2>
    <p class="description">
      Audit report for <strong>${reportData.date}</strong> across all active operations and regional managers.
    </p>

    <!-- Top KPI cards -->
    <table style="width: 100%; margin-bottom: 20px;">
      <tr>
        <td style="width: 50%; padding-right: 6px;">
          <div class="card" style="text-align: center; margin: 0;">
            <div class="card-title">Total Orders</div>
            <div style="font-size: 22px; font-weight: 700; color: #1d1d1f;">${reportData.totalOrders}</div>
          </div>
        </td>
        <td style="width: 50%; padding-left: 6px;">
          <div class="card" style="text-align: center; margin: 0;">
            <div class="card-title">Gross Revenue</div>
            <div style="font-size: 22px; font-weight: 700; color: #059669;">${formatCurrency(reportData.totalRevenue)}</div>
          </div>
        </td>
      </tr>
    </table>

    <!-- Manager Breakdown Table -->
    <div class="card">
      <div class="card-title">Per-Manager Performance Breakdown</div>
      <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 2px solid #d2d2d7; color: #86868b; text-transform: uppercase; font-size: 10px;">
            <th style="text-align: left; padding: 6px;">Manager</th>
            <th style="text-align: center; padding: 6px;">Coupons</th>
            <th style="text-align: center; padding: 6px;">Orders</th>
            <th style="text-align: right; padding: 6px;">Revenue</th>
            <th style="text-align: right; padding: 6px;">Discounts</th>
          </tr>
        </thead>
        <tbody>
          ${managerRows}
        </tbody>
      </table>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${appUrl}/admin/reports" class="btn">
        View Full Enterprise Analytics Portal →
      </a>
    </div>
  `;

  return wrapEmailShell(`Daily Manager Report - ${reportData.date}`, bodyContent, appUrl);
}

/**
 * 8. Warehouse 12:30 AM Reconciled Queue Dispatch Email
 */
export function getWarehouseBatchEmailHtml(
  batchData: {
    batchId: string;
    reconciledAt: string;
    ordersCount: number;
    totalUnits: number;
    skuSummary: { sku: string; name: string; quantity: number }[];
  },
  appUrl = 'http://localhost:3001'
): string {
  const skuListHtml = batchData.skuSummary
    .map(
      (s) => `
    <tr style="border-bottom: 1px solid #e5e5ea;">
      <td style="padding: 8px 6px; font-weight: 600; color: #1d1d1f;">${s.name}</td>
      <td style="padding: 8px 6px; font-family: monospace; color: #86868b; text-align: center;">${s.sku}</td>
      <td style="padding: 8px 6px; font-weight: 700; text-align: right; color: #d97706;">${s.quantity} units</td>
    </tr>`
    )
    .join('');

  const bodyContent = `
    <div style="text-align: right; margin-bottom: 12px;">
      <span class="badge badge-amber">12:30 AM IST BATCH GENERATED</span>
    </div>
    <h2 class="title">Warehouse Fulfillment Queue: ${batchData.batchId}</h2>
    <p class="description">
      Automated 12:30 AM IST reconciliation complete. <strong>${batchData.ordersCount} paid orders</strong> (${batchData.totalUnits} jars) have been locked into the morning picking schedule.
    </p>

    <div class="card">
      <div class="card-title">Picking Manifest Summary (SKU Aggregate)</div>
      <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 2px solid #d2d2d7; color: #86868b; text-transform: uppercase; font-size: 10px;">
            <th style="text-align: left; padding: 6px;">Product</th>
            <th style="text-align: center; padding: 6px;">SKU</th>
            <th style="text-align: right; padding: 6px;">Required Qty</th>
          </tr>
        </thead>
        <tbody>
          ${skuListHtml}
        </tbody>
      </table>
    </div>

    <div class="schedule-box">
      <strong>Action Required:</strong> Morning picking begins at 9:00 AM IST. All packages must have zero-breakage corrugated kraft cushioning applied by 11:00 AM IST for 1:00 PM IST courier handover.
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${appUrl}/manager/orders" class="btn btn-amber">
        Open Packing Queue &amp; Print Manifests →
      </a>
    </div>
  `;

  return wrapEmailShell(`[Warehouse Batch] ${batchData.batchId} - ${batchData.ordersCount} Orders`, bodyContent, appUrl);
}

/**
 * Customer 6-Digit Email OTP Login Verification Template
 */
export function getCustomerOtpEmailHtml({
  email,
  otp,
  expiresMinutes = 10,
  appUrl = 'http://localhost:3001',
}: {
  email: string;
  otp: string;
  expiresMinutes?: number;
  appUrl?: string;
}): string {
  const bodyContent = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span class="badge badge-amber">Customer Sign-In Verification</span>
      <h2 class="title" style="margin-top: 12px;">Your One-Time Passcode (OTP)</h2>
      <p class="description">
        Use the 6-digit verification code below to log in to your ${BRAND_NAME} account, track your shipments, and access official GST tax invoices.
      </p>
    </div>

    <div style="background: #f9f9fb; border: 2px dashed #d97706; border-radius: 16px; padding: 28px 20px; text-align: center; margin: 24px 0;">
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #86868b; margin-bottom: 8px;">
        Login Verification Passcode
      </div>
      <div style="font-size: 38px; font-weight: 800; letter-spacing: 10px; font-family: monospace; color: #d97706; padding: 6px 0;">
        ${otp}
      </div>
      <div style="font-size: 11px; color: #86868b; margin-top: 8px;">
        Code expires in <strong>${expiresMinutes} minutes</strong>. Valid only for <strong>${email}</strong>.
      </div>
    </div>

    <div class="instruction-box">
      <div class="instruction-title">Security & Account Safeguards</div>
      <p style="margin: 0 0 6px 0;">• Never share this OTP with anyone, including ${BRAND_SHORT} customer care representatives.</p>
      <p style="margin: 0 0 6px 0;">• If you did not initiate this request, your account remains secure and you can disregard this email.</p>
      <p style="margin: 0;">• All orders are 100% prepaid and insured for secure solid-glass air delivery across India.</p>
    </div>

    <div style="text-align: center; margin-top: 20px;">
      <a href="${appUrl}/login" class="btn btn-amber">
        Return to Login Page →
      </a>
    </div>
  `;

  return wrapEmailShell(`Your ${BRAND_SHORT} Verification Passcode: ${otp}`, bodyContent, appUrl);
}

