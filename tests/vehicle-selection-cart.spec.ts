/**
 * Vehicle selection and change after adding products to cart.
 * Ensures vehicle selector works in cart/PDP context and fitment is validated.
 */
import { test, expect } from '@playwright/test';
import { acceptCookies, selectVehicle, confirmVehicle, validateVehicleFits } from './utils';

const BASE_URL = process.env.BASE_URL ?? 'https://nexustruckupgrades.com';
const NAVIGATION_TIMEOUT = 60_000;
const ACTION_TIMEOUT = 30_000;

test.describe('Vehicle selection – cart context', () => {
  test('Change vehicle after adding products to cart', async ({ page }) => {
    await page.goto(BASE_URL, {
      waitUntil: 'domcontentloaded',
      timeout: NAVIGATION_TIMEOUT,
    });
    await acceptCookies(page);

    // Navigate to catalog / product selector (direct URL for reliability)
    await page.goto(`${BASE_URL}/products`, {
      waitUntil: 'domcontentloaded',
      timeout: NAVIGATION_TIMEOUT,
    });

    // Select initial vehicle so we can reach product listing (Year / Make / Model)
    await selectVehicle(page, '2024', 'Ford', 'F-150');

    // Go to product listing (Shop / Search parts)
    const shopButton = page
      .getByRole('button', { name: /search parts|shop/i })
      .first();
    await expect(shopButton).toBeVisible({ timeout: ACTION_TIMEOUT });
    await shopButton.scrollIntoViewIfNeeded();
    await shopButton.click();

    // Wait for product list or category page
    await expect(page).toHaveURL(/products|category|\/catalog/i, { timeout: ACTION_TIMEOUT });

    const productSelectors = [
      'a[href*="/product/"]',
      'a[href*="/p/"]',
      'a[href*="product"]',
      '.product-item a, .product-card a, .product a',
      '[data-product] a, [data-testid*="product"] a',
      'main a[href*="/"], [role="main"] a[href*="/"]',
    ];
    const addToCartOnListing = page.getByRole('button', { name: /add to cart/i }).first();

    let openedProduct = false;
    for (const sel of productSelectors) {
      const link = page.locator(sel).first();
      if (await link.isVisible({ timeout: 5000 }).catch(() => false)) {
        await link.click({ timeout: 15_000 });
        openedProduct = true;
        break;
      }
    }
    if (!openedProduct && (await addToCartOnListing.isVisible({ timeout: 3000 }).catch(() => false))) {
      await addToCartOnListing.click();
      openedProduct = true;
    }
    if (!openedProduct) {
      const anyCard = page.locator('.product-item, .product-card, [data-product], article a, .grid a').first();
      await anyCard.click({ timeout: 15_000 });
    }

    // If we went to PDP, add to cart
    const addToCartPdp = page.getByRole('button', { name: /add to cart/i });
    if (await addToCartPdp.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addToCartPdp.click();
    }

    // Open vehicle selector to change vehicle (header link or button)
    const changeVehicleTrigger = page.getByRole('button', { name: /change vehicle|select vehicle|your vehicle/i })
      .or(page.getByText(/change vehicle|select vehicle|your vehicle/i).first());
    if (await changeVehicleTrigger.isVisible({ timeout: 5000 }).catch(() => false)) {
      await changeVehicleTrigger.click();
    }
    // If selector is already visible (e.g. on PDP), comboboxes will be found by selectVehicle

    // Change to different vehicle
    await selectVehicle(page, '2024', 'Chevrolet', 'Silverado');
    await confirmVehicle(page);
    await validateVehicleFits(page);

    // Assert: cart or page still in a valid state (no hard failure from fitment)
    await expect(page).not.toHaveURL(/error|404/);
  });
});
