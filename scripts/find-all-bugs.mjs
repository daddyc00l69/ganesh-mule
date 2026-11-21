import { chromium, devices } from 'playwright';

const BASE_URL = 'https://shop-kandalovers.devtushar.uk';

async function audit() {
  console.log('=== STARTING DEEP COMPREHENSIVE BUG AUDIT ===');
  const browser = await chromium.launch({ headless: true });
  const bugs = [];

  // Helper for tracking console errors
  function attachErrorListener(page, pageName) {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore known benign noise if any
        if (!text.includes('Chatwoot') && !text.includes('favicon')) {
          bugs.push({
            severity: 'Console Error',
            location: pageName,
            details: text,
          });
        }
      }
    });

    page.on('pageerror', (err) => {
      bugs.push({
        severity: 'Unhandled Page Error',
        location: pageName,
        details: err.message,
      });
    });
  }

  // 1. Audit Desktop
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await desktopContext.newPage();
  attachErrorListener(page, 'Desktop');

  console.log('1. Checking Homepage (Desktop)...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  const homeTitle = await page.title();
  if (!homeTitle) bugs.push({ severity: 'SEO Bug', location: '/', details: 'Missing page title' });

  // Check dead links on home
  const homeLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href]'))
      .map(a => a.getAttribute('href'))
      .filter(h => h && !h.startsWith('mailto:') && !h.startsWith('tel:') && !h.startsWith('#'));
  });
  console.log(` - Found ${homeLinks.length} navigation links on homepage`);

  // Check pincode form
  console.log('2. Testing Homepage Pincode Checker...');
  const pinInput = page.locator('input[placeholder*="Pincode"]');
  if (await pinInput.count() > 0) {
    await pinInput.fill('400001');
    await page.locator('button:has-text("Check")').click();
    await page.waitForTimeout(600);
    const pinResult = await page.locator('text=Delivery Available').count();
    if (pinResult === 0) {
      bugs.push({ severity: 'Feature Issue', location: '/', details: 'Pincode 400001 did not show Delivery Available result on homepage' });
    }
  } else {
    bugs.push({ severity: 'UI Issue', location: '/', details: 'Pincode input not found on homepage' });
  }

  // Check Shop page
  console.log('3. Checking Shop Page (/shop)...');
  await page.goto(`${BASE_URL}/shop`, { waitUntil: 'networkidle' });
  const categoryCards = await page.locator('article').count();
  console.log(` - Displayed category cards: ${categoryCards}`);
  if (categoryCards !== 6) {
    bugs.push({ severity: 'CRITICAL REQUIREMENT VIOLATION', location: '/shop', details: `Expected exactly 6 category cards on /shop, found ${categoryCards}` });
  }

  // Test search on /shop
  console.log('4. Testing Shop Search...');
  const searchInput = page.locator('input[placeholder*="Search"]');
  if (await searchInput.count() > 0) {
    await searchInput.fill('sesame');
    await page.waitForTimeout(400);
    const filteredCount = await page.locator('article').count();
    if (filteredCount !== 1) {
      bugs.push({ severity: 'Functional Bug', location: '/shop', details: `Search for "sesame" returned ${filteredCount} cards instead of 1` });
    }
    await searchInput.fill('');
    await page.waitForTimeout(400);
  }

  // Check Product Configurator Page
  console.log('5. Checking Product Configurator (/product/forest-honey)...');
  await page.goto(`${BASE_URL}/product/forest-honey`, { waitUntil: 'networkidle' });
  
  // Check 3 size options
  const sizeCards = await page.locator('button:has-text("250g"), div:has-text("250g")').count();
  if (sizeCards === 0) {
    bugs.push({ severity: 'Functional Bug', location: '/product/forest-honey', details: 'Size selection cards not found' });
  }

  // Test price updates when selecting sizes
  console.log('6. Testing Size Switching and Dynamic Pricing...');
  const card250g = page.locator('text=250g Glass Sampler').first();
  if (await card250g.count() > 0) {
    await card250g.click();
    await page.waitForTimeout(300);
    const has199 = await page.locator('text=₹199.00').count();
    if (has199 === 0) {
      bugs.push({ severity: 'Pricing Bug', location: '/product/forest-honey', details: 'Selecting 250g did not update price to ₹199.00' });
    }
  }

  const card1kg = page.locator('text=1kg Grand Reserve Jar').first();
  if (await card1kg.count() > 0) {
    await card1kg.click();
    await page.waitForTimeout(300);
    const has749 = await page.locator('text=₹749.00').count();
    if (has749 === 0) {
      bugs.push({ severity: 'Pricing Bug', location: '/product/forest-honey', details: 'Selecting 1kg did not update price to ₹749.00' });
    }
  }

  // Test "Add to Bag" does NOT auto-open drawer
  console.log('7. Testing "Add to Bag" Auto-Open Prevention...');
  const addToBagBtn = page.locator('button:has-text("Add to Cart"), button:has-text("Add to Bag")').first();
  await addToBagBtn.click();
  await page.waitForTimeout(500);

  // Check if cart drawer is open
  const isDrawerVisible = await page.locator('div[role="dialog"]:has-text("Review your Bag"), div:has-text("Review your Bag.")').isVisible();
  if (isDrawerVisible) {
    bugs.push({ severity: 'User Preference Bug', location: '/product/forest-honey', details: 'Cart drawer still opened automatically after clicking Add to Bag' });
  } else {
    console.log(' - PASSED: Cart drawer stayed closed on Add to Bag');
  }

  // Check bag counter in navbar
  const bagBadge = await page.locator('header span:has-text("1")').count();
  if (bagBadge === 0) {
    bugs.push({ severity: 'State Sync Bug', location: 'Navbar', details: 'Bag count did not increment to 1 after adding product' });
  } else {
    console.log(' - PASSED: Navbar bag count incremented to 1');
  }

  // Test Checkout Page
  console.log('8. Checking Checkout Page (/checkout)...');
  await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle' });

  // Check for removed strings
  const forbiddenPhrases = [
    'Western Ghats Direct Dispatch',
    'Delhivery One Automated Courier',
    'Checkout & Shipment Speed',
    'Air Express Priority',
    'Fastest door-to-door domestic air transit'
  ];

  const checkoutText = await page.locator('body').innerText();
  for (const phrase of forbiddenPhrases) {
    if (checkoutText.includes(phrase)) {
      bugs.push({
        severity: 'Unwanted Content Found',
        location: '/checkout',
        details: `Found forbidden phrase: "${phrase}" on checkout page`
      });
    }
  }

  // Check Pincode auto-detection on checkout
  console.log('9. Testing Pincode auto-detection on Checkout...');
  const chkPinInput = page.locator('input[placeholder*="400093"], input[inputmode="numeric"]').first();
  if (await chkPinInput.count() > 0) {
    await chkPinInput.fill('413304');
    await page.waitForTimeout(1000);
    const cityVal = await page.locator('input[placeholder="Town or City"]').inputValue();
    console.log(` - Pincode 413304 resolved City to: "${cityVal}"`);
    if (!cityVal.toLowerCase().includes('pandharpur') && !cityVal.toLowerCase().includes('solapur')) {
      bugs.push({
        severity: 'Address Auto-population Issue',
        location: '/checkout',
        details: `Pincode 413304 did not auto-populate Pandharpur/Solapur (got "${cityVal}")`
      });
    }
  }

  // 2. Audit Mobile Experience (iPhone 14 Pro: 393 x 852)
  console.log('10. Auditing Mobile Responsiveness (393 x 852)...');
  const mobileContext = await browser.newContext({
    ...devices['iPhone 14 Pro']
  });
  const mobilePage = await mobileContext.newPage();
  attachErrorListener(mobilePage, 'Mobile');

  const mobileRoutes = ['/', '/shop', '/product/forest-honey', '/checkout'];
  for (const route of mobileRoutes) {
    await mobilePage.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(500);

    // Check for horizontal overflow
    const hasHorizontalOverflow = await mobilePage.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    if (hasHorizontalOverflow) {
      const overflowDetails = await mobilePage.evaluate(() => {
        const elements = [];
        document.querySelectorAll('*').forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.right > window.innerWidth) {
            elements.push(`${el.tagName}.${el.className.slice(0, 30)} (right: ${rect.right})`);
          }
        });
        return elements.slice(0, 3);
      });
      bugs.push({
        severity: 'Mobile Horizontal Overflow Bug',
        location: route,
        details: `Page width ${overflowDetails} exceeds viewport width 393px`,
      });
    } else {
      console.log(` - PASSED: ${route} has ZERO mobile horizontal overflow`);
    }
  }

  // 3. Check All 6 Product Detail Pages
  console.log('11. Checking All 6 Honey Category Slugs...');
  const slugs = ['forest-honey', 'sesame-honey', 'ajwain-honey', 'multiflora-honey', 'ber-honey', 'sheesham-honey'];
  for (const slug of slugs) {
    const res = await page.goto(`${BASE_URL}/product/${slug}`);
    if (res.status() !== 200) {
      bugs.push({
        severity: 'HTTP Status Error',
        location: `/product/${slug}`,
        details: `Returned HTTP ${res.status()}`
      });
    }
  }

  // 4. Check Admin & Manager Routes (Smoke Test)
  console.log('12. Smoke Testing Internal Routes...');
  const internalRoutes = ['/admin', '/admin/products', '/admin/inventory', '/admin/orders', '/manager', '/manager/inventory', '/account'];
  for (const r of internalRoutes) {
    const res = await page.goto(`${BASE_URL}${r}`);
    if (res.status() >= 500) {
      bugs.push({
        severity: '500 Server Error',
        location: r,
        details: `Returned HTTP ${res.status()}`
      });
    }
  }

  await browser.close();

  console.log('\n========================================');
  console.log(`AUDIT FINISHED. Total Issues/Bugs Found: ${bugs.length}`);
  console.log('========================================');
  for (const [i, b] of bugs.entries()) {
    console.log(`[Bug #${i+1}] [${b.severity}] ${b.location}: ${b.details}`);
  }
}

audit().catch(console.error);
