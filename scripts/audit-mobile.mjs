import { chromium, devices } from 'playwright';
import path from 'path';

const ARTIFACTS_DIR = 'C:/Users/umarf/.gemini/antigravity/brain/0ce416d0-4e63-4670-96c1-b390f37b210d';
const BASE_URL = 'https://shop-kandalovers.devtushar.uk';

async function main() {
  const browser = await chromium.launch({ headless: true });
  // iPhone 14 Pro emulation (393 x 852, mobile scale)
  const iPhone = devices['iPhone 14 Pro'];
  const context = await browser.newContext({
    ...iPhone,
  });
  const page = await context.newPage();

  // 1. Mobile Home
  console.log('Capturing Mobile Home...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'mobile-1-home-hero.png'),
    fullPage: false
  });
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'mobile-1-home-full.png'),
    fullPage: true
  });

  // 2. Mobile Shop
  console.log('Capturing Mobile Shop...');
  await page.goto(`${BASE_URL}/shop`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'mobile-2-shop-hero.png'),
    fullPage: false
  });
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'mobile-2-shop-full.png'),
    fullPage: true
  });

  // 3. Mobile Product Detail Page (Configurator)
  console.log('Capturing Mobile Product Page...');
  await page.goto(`${BASE_URL}/product/forest-honey`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'mobile-3-product-top.png'),
    fullPage: false
  });
  // Scroll to size selector
  await page.evaluate(() => window.scrollBy(0, 520));
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'mobile-3-product-selector.png'),
    fullPage: false
  });
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'mobile-3-product-full.png'),
    fullPage: true
  });

  // 4. Mobile Cart Drawer
  console.log('Capturing Mobile Cart Drawer...');
  const addBtn = await page.locator('button:has-text("Add to Cart"), button:has-text("Add to Bag")').first();
  if (addBtn) {
    await addBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'mobile-4-cart-drawer.png'),
      fullPage: false
    });
  }

  // 5. Mobile Checkout
  console.log('Capturing Mobile Checkout...');
  await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'mobile-5-checkout-top.png'),
    fullPage: false
  });
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'mobile-5-checkout-full.png'),
    fullPage: true
  });

  await browser.close();
  console.log('Mobile audit captures on production completed successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
