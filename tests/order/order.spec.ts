import { test, expect } from '@playwright/test';

test.describe('Order Flow - Ecommerce Auto Parts', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('https://nexustruckupgrades.onechanneladmin.com/');
  });

  test('Order confirmation page validation', async ({ page }) => {
    // Add product
    await page.locator('button:has-text("Add to Cart")').first().click();
    await page.locator('[data-testid="cart-icon"]').click();
    await page.locator('button:has-text("Checkout")').click();

    // Place order (assumes address & payment auto-filled or sandbox)
    await page.locator('button:has-text("Place Order")').click();

    // Validate confirmation page
    await expect(page.locator('text=Order Confirmation')).toBeVisible();
    await expect(page.locator('.order-number')).toBeVisible();
    await expect(page.locator('.order-summary')).toBeVisible();
  });

  test('Order ID generation', async ({ page }) => {
    await page.locator('button:has-text("Add to Cart")').first().click();
    await page.locator('[data-testid="cart-icon"]').click();
    await page.locator('button:has-text("Checkout")').click();
    await page.locator('button:has-text("Place Order")').click();

    const orderId = await page.locator('.order-number').textContent();
    expect(orderId).not.toBeNull();
  });

  test('Order email notification (UI validation)', async ({ page }) => {
    await page.locator('button:has-text("Add to Cart")').first().click();
    await page.locator('[data-testid="cart-icon"]').click();
    await page.locator('button:has-text("Checkout")').click();
    await page.locator('button:has-text("Place Order")').click();

    await expect(
      page.locator('text=Confirmation email sent')
    ).toBeVisible();
  });

  test('View order details from My Orders', async ({ page }) => {
    await page.locator('text=My Account').click();
    await page.locator('text=Orders').click();
    await page.locator('.order-item').first().click();

    await expect(page.locator('.order-details')).toBeVisible();
    await expect(page.locator('.order-number')).toBeVisible();
  });

  test('Split shipment order validation', async ({ page }) => {
    // Add multiple items
    await page.locator('button:has-text("Add to Cart")').nth(0).click();
    await page.locator('button:has-text("Add to Cart")').nth(1).click();

    await page.locator('[data-testid="cart-icon"]').click();
    await page.locator('button:has-text("Checkout")').click();
    await page.locator('button:has-text("Place Order")').click();

    await expect(page.locator('.tracking-id')).toHaveCountGreaterThan(1);
  });

  test('Track shipment', async ({ page }) => {
    await page.locator('text=My Account').click();
    await page.locator('text=Orders').click();
    await page.locator('.order-item').first().click();

    await page.locator('text=Track Shipment').click();
    await expect(page.locator('.shipment-status')).toBeVisible();
  });

  test('Download invoice', async ({ page }) => {
    await page.locator('text=My Account').click();
    await page.locator('text=Orders').click();
    await page.locator('.order-item').first().click();

    const [ download ] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('text=Download Invoice').click()
    ]);

    expect(download.suggestedFilename()).toContain('.pdf');
  });

});
