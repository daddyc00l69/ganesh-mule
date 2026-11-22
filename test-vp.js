const { chromium } = require('playwright');
async function inspectDom() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 452, height: 1024 } });
  const page = await context.newPage();
  
  await page.goto('https://shop-kandalovers.devtushar.uk/shop');
  await page.waitForTimeout(2000);
  const addBtn = await page.$('button:has-text("Add to Bag"), button:has-text("Add to Cart")');
  if (addBtn) await addBtn.click();
  await page.waitForTimeout(1000);

  await page.goto('https://shop-kandalovers.devtushar.uk/checkout');
  await page.waitForTimeout(2500);

  const iconInfo = await page.evaluate(() => {
    const userLink = document.querySelector('a[href="/account"]');
    const bagBtn = document.querySelector('button[aria-label="Shopping Bag"]');
    return {
      userRect: userLink ? userLink.getBoundingClientRect() : null,
      bagRect: bagBtn ? bagBtn.getBoundingClientRect() : null,
      headerRect: document.querySelector('header')?.getBoundingClientRect(),
      scrollY: window.scrollY
    };
  });
  console.log('Icon info at top:', iconInfo);

  // Now scroll to bottom
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);

  const iconInfoBottom = await page.evaluate(() => {
    const userLink = document.querySelector('a[href="/account"]');
    const bagBtn = document.querySelector('button[aria-label="Shopping Bag"]');
    return {
      userRect: userLink ? userLink.getBoundingClientRect() : null,
      bagRect: bagBtn ? bagBtn.getBoundingClientRect() : null,
      headerRect: document.querySelector('header')?.getBoundingClientRect(),
      scrollY: window.scrollY
    };
  });
  console.log('Icon info at bottom:', iconInfoBottom);

  await page.screenshot({ path: 'test-scroll-bottom.png', fullPage: false });
  await browser.close();
}
inspectDom().catch(console.error);
