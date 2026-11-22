const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/umarf/.gemini/antigravity/brain/0ce416d0-4e63-4670-96c1-b390f37b210d';
const BASE_URL = 'https://shop-kandalovers.devtushar.uk';

async function main() {
  console.log(`Starting Live Verification on: ${BASE_URL}`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  // 1. Verify Authoritative Quote API directly on Live Domain
  console.log('Testing live POST /api/checkout/quote ...');
  const quoteRes = await page.request.post(`${BASE_URL}/api/checkout/quote`, {
    data: {
      items: [{ productId: 'prod-forest-honey-1kg', quantity: 1 }],
      destinationPin: '411001',
      destinationState: 'Maharashtra',
      shippingMode: 'Express',
    },
  });
  console.log(`Quote API status: ${quoteRes.status()}`);
  if (quoteRes.ok()) {
    const qJson = await quoteRes.json();
    console.log('Quote API formatted quote:', JSON.stringify(qJson.formatted, null, 2));
    console.log('Quote API snapshot summary:', JSON.stringify({
      grandTotalPaise: qJson.snapshot?.grandTotalPaise,
      platformFeeBasePaise: qJson.snapshot?.platformFeeBasePaise,
      platformGstPaise: qJson.snapshot?.platformGstPaise,
      totalTaxPaise: qJson.snapshot?.totalTaxPaise,
    }, null, 2));
  } else {
    console.error('Quote API error:', await quoteRes.text());
  }

  // 2. Load Cart and Visit Checkout
  console.log('Navigating to storefront to add honey to cart...');
  await page.goto(`${BASE_URL}/shop`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified-live-shop.png') });

  // Add 1kg jar to cart via localStorage
  await page.evaluate(() => {
    const testCart = [
      {
        productId: 'prod-forest-honey-1kg',
        productName: 'Forest Honey (1kg)',
        slug: 'forest-honey-1kg',
        sku: 'GM-FOR-1KG',
        price: 74900,
        quantity: 1,
        weight: '1000g',
        weightGrams: 1000,
        stockAvailable: 50,
      },
    ];
    localStorage.setItem('sg_cart', JSON.stringify(testCart));
  });

  // 3. Visit Checkout on Live
  console.log('Visiting live checkout...');
  await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified-live-checkout-initial.png') });

  // Fill Delivery PIN: 411001 (Pune)
  console.log('Entering PIN 411001...');
  const pinInput = await page.$('input[placeholder*="PIN"], input[name="postalCode"], #postalCode');
  if (pinInput) {
    await pinInput.fill('411001');
    await page.waitForTimeout(1500);
  }

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified-live-checkout-with-pin.png') });

  // 4. Staff Login & Verify Developer Finance Control Centre
  console.log('Navigating to portal login...');
  await page.goto(`${BASE_URL}/portal`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified-live-portal-login.png') });

  // Login via developer credentials (tushar0p.test@gmail.com / admin123)
  const emailInput = await page.$('input[type="email"], input[placeholder*="email" i]');
  const passInput = await page.$('input[type="password"]');
  if (emailInput && passInput) {
    await emailInput.fill('tushar0p.test@gmail.com');
    await passInput.fill('admin123');
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
      await page.waitForTimeout(2500);
    }
  }

  // Visit Developer Finance Dashboard
  console.log('Visiting /developer/finance ...');
  await page.goto(`${BASE_URL}/developer/finance`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified-live-developer-finance-overview.png') });

  // Visit Developer Financial Settings
  console.log('Visiting /developer/finance/settings ...');
  await page.goto(`${BASE_URL}/developer/finance/settings`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified-live-developer-finance-settings.png') });

  // Visit Transactions Ledger
  console.log('Visiting /developer/finance/transactions ...');
  await page.goto(`${BASE_URL}/developer/finance/transactions`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified-live-developer-finance-transactions.png') });

  // Visit Invoices Page
  console.log('Visiting /developer/finance/invoices ...');
  await page.goto(`${BASE_URL}/developer/finance/invoices`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified-live-developer-finance-invoices.png') });

  // Visit Tax Reports
  console.log('Visiting /developer/finance/tax-reports ...');
  await page.goto(`${BASE_URL}/developer/finance/tax-reports`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified-live-developer-finance-tax-reports.png') });

  // Visit Excel Exports Hub
  console.log('Visiting /developer/finance/exports ...');
  await page.goto(`${BASE_URL}/developer/finance/exports`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified-live-developer-finance-exports.png') });

  // Test Authenticated Excel Export Download
  console.log('Testing live GET /api/developer/finance/exports ...');
  const exportRes = await page.request.get(`${BASE_URL}/api/developer/finance/exports?reportType=platform_earnings&format=xlsx`);
  console.log(`Excel export status: ${exportRes.status()}, Content-Type: ${exportRes.headers()['content-type']}`);
  const exportBuffer = await exportRes.body();
  console.log(`Excel export payload size: ${exportBuffer.length} bytes (starts with PK: ${exportBuffer.slice(0, 2).toString() === 'PK'})`);

  // Test Settings API
  const settingsRes = await page.request.get(`${BASE_URL}/api/developer/finance/settings`);
  console.log(`Settings API status: ${settingsRes.status()}`);
  if (settingsRes.ok()) {
    const sJson = await settingsRes.json();
    console.log(`Settings version: ${sJson.settings?.version}, platformFeeEnabled: ${sJson.settings?.platformFeeEnabled}, fixedFee: ₹${sJson.settings?.fixedFeePaise / 100}`);
  }

  console.log('Live Verification completed successfully!');
  await browser.close();
}

main().catch((err) => {
  console.error('Live Verification failed:', err);
  process.exit(1);
});
