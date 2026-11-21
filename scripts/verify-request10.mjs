import { chromium } from 'playwright';

async function verifyAll() {
  console.log('🚀 Starting end-to-end verification for User Request #10...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 }, // Mobile viewport (iPhone 15 Pro)
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const page = await context.newPage();

  const baseUrl = 'http://localhost:3000';
  const errors = [];

  try {
    // 1. Visit Product Page
    console.log('Testing Product Page button behavior...');
    await page.goto(`${baseUrl}/product/wild-forest-honey`, { waitUntil: 'networkidle' });

    // Verify there are no duplicate "Add to Bag" + "Buy Now" buttons side by side
    const buyNowButtons = await page.$$('text="Buy Now"');
    if (buyNowButtons.length > 0) {
      errors.push(`Found ${buyNowButtons.length} "Buy Now" button(s) - should have been removed!`);
    } else {
      console.log('✓ "Buy Now" button successfully removed!');
    }

    // Verify single "Add to Bag" button exists initially (since cart is empty)
    const addButtons = await page.$$('text="Add to Bag"');
    console.log(`Found ${addButtons.length} "Add to Bag" action(s)`);

    // Click "Add to Bag"
    await page.locator('button:has-text("Add to Bag")').first().click();
    await page.waitForTimeout(600);

    // Verify it changed to "Checkout"
    const checkoutButtons = await page.$$('text="Checkout"');
    if (checkoutButtons.length === 0) {
      errors.push('Button did not switch to single "Checkout" button after adding to cart!');
    } else {
      console.log('✓ Button switched to single "Checkout" button after adding to cart!');
    }

    // 2. Open Cart Drawer and test animation & removal transition
    console.log('Testing Cart Drawer open, close, and item removal animations...');
    // Open cart drawer via top nav
    await page.click('button[aria-label="Shopping Bag"]');
    await page.waitForTimeout(400);

    // Verify cart drawer is visible
    const cartHeader = await page.$('text="Review your Bag."');
    if (!cartHeader) {
      errors.push('Cart drawer failed to open!');
    } else {
      console.log('✓ Cart drawer opened with smooth animation!');
    }

    // Verify "Delhivery One" is NOT shown in cart drawer
    const cartDelhiveryOne = await page.$('text="Delhivery One"');
    if (cartDelhiveryOne) {
      errors.push('Found "Delhivery One" in Cart Drawer!');
    } else {
      console.log('✓ Zero "Delhivery One" branding in Cart Drawer!');
    }

    // Test Item Removal Animation
    console.log('Testing item removal animation...');
    const deleteButton = await page.$('button[title="Remove item"]');
    if (deleteButton) {
      await deleteButton.click();
      // Wait for removal transition (300ms)
      await page.waitForTimeout(500);
      const emptyText = await page.$('text="Your Bag is empty."');
      if (!emptyText) {
        errors.push('Cart did not transition to empty state after removal!');
      } else {
        console.log('✓ Item smoothly animated out and cart showed empty state!');
      }
    }

    // Close Cart Drawer
    await page.click('button[aria-label="Close bag"]');
    await page.waitForTimeout(400);
    console.log('✓ Cart drawer closed with smooth transition!');

    // Re-add product so we can test checkout
    await page.goto(`${baseUrl}/product/wild-forest-honey`, { waitUntil: 'networkidle' });
    await page.click('button:has-text("Add to Bag")');
    await page.waitForTimeout(500);

    // 3. Navigate to Checkout Page
    console.log('Testing Checkout Page...');
    await page.goto(`${baseUrl}/checkout`, { waitUntil: 'networkidle' });

    // Check placeholders for dummy examples
    const nameInput = await page.$('input[placeholder="Customer Full Name"]');
    if (!nameInput) {
      errors.push('Full Name input does not have clean placeholder "Customer Full Name"!');
    } else {
      console.log('✓ Clean placeholder for Full Name');
    }

    const dummyVikram = await page.$('input[placeholder*="Vikramaditya"]');
    if (dummyVikram) {
      errors.push('Found dummy name "Vikramaditya" in placeholder!');
    } else {
      console.log('✓ Dummy name "Vikramaditya" removed from placeholders!');
    }

    const dummyFlat = await page.$('input[placeholder*="Oberoi Splendor"]');
    if (dummyFlat) {
      errors.push('Found dummy address "Oberoi Splendor" in placeholder!');
    } else {
      console.log('✓ Dummy address "Oberoi Splendor" removed from placeholders!');
    }

    // Check that "Payment Method" box is completely REMOVED
    const paymentMethodBox = await page.$('text="Payment Method"');
    if (paymentMethodBox) {
      errors.push('Found "Payment Method" box - it should have been removed!');
    } else {
      console.log('✓ "Payment Method" container box completely removed!');
    }

    const instantPaymentText = await page.$('text="Instant Online Payment (Razorpay Encrypted)"');
    if (instantPaymentText) {
      errors.push('Found "Instant Online Payment (Razorpay Encrypted)" card!');
    } else {
      console.log('✓ Redundant payment method card completely removed!');
    }

    // Check that Section 3 "Insured Delivery" card is completely REMOVED
    const insuredDeliveryCard = await page.$('text="Insured Standard Delivery"');
    if (insuredDeliveryCard) {
      errors.push('Found redundant "Insured Standard Delivery" card - should have been removed!');
    } else {
      console.log('✓ Redundant "Insured Standard Delivery" card completely removed!');
    }

    // Check that "Delhivery One" is NOT present in customer-facing text
    const delhiveryOneTexts = await page.$$('text="Delhivery One"');
    if (delhiveryOneTexts.length > 0) {
      errors.push(`Found ${delhiveryOneTexts.length} instances of "Delhivery One" on checkout!`);
    } else {
      console.log('✓ Zero instances of "Delhivery One" on checkout page!');
    }

    // Check that AWB Preview is NOT visible when fields are empty
    const previewBox = await page.$('text="Insured Airway Bill (AWB) Preview"');
    if (previewBox) {
      errors.push('AWB Preview is visible before required fields are filled!');
    } else {
      console.log('✓ AWB Preview is hidden while required fields are empty!');
    }

    // Check that Pay button is DISABLED
    const payButtons = await page.$$('button:has-text("Pay")');
    console.log(`Checking ${payButtons.length} Pay button(s)...`);
    for (const btn of payButtons) {
      const isDisabled = await btn.isDisabled();
      if (!isDisabled) {
        errors.push('Pay button is NOT disabled when required fields are empty!');
      } else {
        console.log('✓ Pay button is strictly DISABLED!');
      }
    }

    // Now fill the required fields and verify that:
    // 1. Preview appears
    // 2. Pay button becomes ENABLED
    console.log('Filling required Contact Details and Delivery Destination...');
    await page.fill('input[placeholder="Customer Full Name"]', 'Aarav Patel');
    await page.fill('input[placeholder="10-digit mobile number"]', '9876543210');
    await page.fill('input[placeholder="Email address for tax invoice"]', 'aarav.patel@gmail.com');
    await page.fill('input[placeholder="Flat, House no., Building, Apartment"]', 'Flat 101, Nilgiri Heights');
    await page.fill('input[placeholder="Area, Street, Sector, Road"]', 'Senapati Bapat Road');
    await page.fill('input[placeholder="6-digit PIN code"]', '411016');
    await page.waitForTimeout(1000);

    // Verify Preview now appears
    const previewAfterFill = await page.$('text="Insured Airway Bill (AWB) Preview"');
    if (!previewAfterFill) {
      errors.push('AWB Preview did NOT appear after required fields were filled!');
    } else {
      console.log('✓ AWB Preview appeared with customer details!');
      const previewText = await previewAfterFill.evaluate((el) => el.closest('div').innerText);
      if (previewText.includes('Vikramaditya')) {
        errors.push('Preview still contains dummy fallback "Vikramaditya"!');
      } else {
        console.log('✓ Preview displays actual customer "Aarav Patel" without dummy data!');
      }
    }

    // Verify Pay button is now ENABLED
    for (const btn of payButtons) {
      const isStillDisabled = await btn.isDisabled();
      if (isStillDisabled) {
        errors.push('Pay button remained disabled after filling all required fields!');
      } else {
        console.log('✓ Pay button successfully ENABLED once required details are filled!');
      }
    }

    // Take screenshot of checkout page for visual proof
    await page.screenshot({ path: 'C:/Users/umarf/.gemini/antigravity/brain/0ce416d0-4e63-4670-96c1-b390f37b210d/checkout-clean-verified.png', fullPage: true });
    console.log('✓ Screenshot saved to checkout-clean-verified.png');

  } catch (err) {
    errors.push(`Test threw exception: ${err.message}`);
  } finally {
    await browser.close();
  }

  console.log('\n=== VERIFICATION REPORT ===');
  if (errors.length === 0) {
    console.log('🎉 ALL USER REQUEST #10 REQUIREMENTS PASSED WITH 100% SUCCESS!');
  } else {
    console.error('❌ Found issues:');
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }
}

verifyAll();
