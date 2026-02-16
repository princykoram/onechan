import { test, expect } from '@playwright/test';

/* ================= SELECTORS ================= */

const cartIcon = (page) =>
  page.getByRole('link', { name: /cart/i });

const addToCartBtn = (page) =>
  page.getByRole('button', { name: /add to cart/i });

const cartItems = (page) =>
  page.locator('[id*="CartItem"], [class*="cart-item"]');

const qtyInput = (page) =>
  page.locator('input[type="number"]').first();

const removeBtn = (page) =>
  page.getByRole('button', { name: /remove/i }).first();

/* ================= HELPERS ================= */

/**
 * Add ANY product safely (PLP → PDP → Add to Cart)
 * This avoids PLP hover / fitment issues
 */
async function addAnyProduct(page) {
  // Open PLP
  await page.goto('/collections/all', {
    waitUntil: 'domcontentloaded',
  });

  // Click first product card → PDP
  await page.locator('a[href*="/products/"]').first().click();

  // Wait for Add to Cart on PDP
  await expect(addToCartBtn(page)).toBeVisible({ timeout: 30000 });

  // Add to cart
  await addToCartBtn(page).click();
}

/* ================= TESTS ================= */

test.describe('Cart Management – Stable Version', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('Add product and open cart', async ({ page }) => {
    await addAnyProduct(page);

    await cartIcon(page).click();

    await expect(cartItems(page).first()).toBeVisible();
  });

  test('Increase quantity', async ({ page }) => {
    await addAnyProduct(page);
    await cartIcon(page).click();

    await qtyInput(page).fill('2');
    await qtyInput(page).blur();

    await expect(qtyInput(page)).toHaveValue('2');
  });

  test('Remove item from cart', async ({ page }) => {
    await addAnyProduct(page);
    await cartIcon(page).click();

    await removeBtn(page).click();

    await expect(cartItems(page)).toHaveCount(0);
  });

});
