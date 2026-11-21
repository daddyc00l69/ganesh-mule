import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  console.log('Navigating to live shop...');
  await page.goto('https://shop-kandalovers.devtushar.uk/shop', { waitUntil: 'networkidle' });

  // Tap size 250g on the first card (Multiflora)
  const size250gBtn = page.locator('article button:has-text("250g")').first();
  await size250gBtn.click();
  await page.waitForTimeout(400);

  const cardText = await page.locator('article').first().innerText();
  console.log('Size 250g selection:', cardText.includes('199.00') ? 'PASS (Price updated to ₹199)' : 'FAIL');

  // Click Buy button
  const buyBtn = page.locator('article button:has-text("Buy")').first();
  await buyBtn.click();
  await page.waitForTimeout(1000);

  await page.screenshot({ path: 'C:/Users/umarf/.gemini/antigravity/brain/0ce416d0-4e63-4670-96c1-b390f37b210d/verified-buy-drawer-open.png' });
  console.log('Captured buy drawer open screenshot');

  await browser.close();
}

main().catch(console.error);
