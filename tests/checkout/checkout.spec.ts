import { test, expect } from '@playwright/test';

test.describe('Checkout Flow - Ecommerce Auto Parts', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('https://nexustruckupgrades.onechanneladmin.com/');
  });

  test('Guest checkout', async ({ page }) => {
    await page.locator('button:has-text("Add to Cart")').first().click();
    await page.locator('[data-testid="cart-icon"]').click();
    await page.locator('button:has-text("Checkout")').click();

    await page.locator('button:has-text("Continue as Guest")').click();

    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', 'guest@test.com');
    await page.fill('input[name="phone"]', '9876543210');

    await page.fill('input[name="zip"]', '560001');
    await page.fill('input[name="address"]', 'Test Street');
    await page.fill('input[name="city"]', 'Bangalore');
    await page.fill('input[name="state"]', 'KA');

    await page.locator('button:has-text("Place Order")').click();

    await expect(page.locator('text=Order Confirmed')).toBeVisible();
  });

  test('Logged-in checkout', async ({ page }) => {
    await page.locator('text=Login').click();
    await page.fill('input[name="email"]', 'user@test.com');
    await page.fill('input[name="password"]', 'Password@123');
    await page.locator('button:has-text("Login")').click();

    await page.locator('button:has-text("Add to Cart")').first().click();
    await page.locator('[data-testid="cart-icon"]').click();
    await page.locator('button:has-text("Checkout")').click();

    await page.locator('button:has-text("Place Order")').click();

    await expect(page.locator('text=Order Confirmed')).toBeVisible();
  });

  test('Address auto-fill using ZIP/Pincode', async ({ page }) => {
    await page.locator('button:has-text("Add to Cart")').first().click();
    await page.locator('[data-testid="cart-icon"]').click();
    await page.locator('button:has-text("Checkout")').click();

    await page.fill('input[name="zip"]', '560001');

    await expect(page.locator('input[name="city"]')).not.toBeEmpty();
    await expect(page.locator('input[name="state"]')).not.toBeEmpty();
  });

  test('Add new shipping address', async ({ page }) => {
    await page.locator('button:has-text("Add to Cart")').first().click();
    await page.locator('[data-testid="cart-icon"]').click();
    await page.locator('button:has-text("Checkout")').click();

    await page.locator('button:has-text("Add New Address")').click();

    await page.fill('input[name="address"]', 'New Address Line');
    await page.fill('input[name="zip"]', '560001');

    await page.locator('button:has-text("Save Address")').click();

    await expect(page.locator('text=New Address Line')).toBeVisible();
  });

  test('Edit shipping address', async ({ page }) => {
    await page.locator('button:has-text("Checkout")').click();
    await page.locator('button:has-text("Edit Address")').first().click();

    await page.fill('input[name="address"]', 'Updated Address');
    await page.locator('button:has-text("Save")').click();

    await expect(page.locator('text=Updated Address')).toBeVisible();
  });

  test('Select shipping method', async ({ page }) => {
    await page.locator('button:has-text("Checkout")').click();

    await page.locator('input[value="express"]').click();
    await page.locator('button:has-text("Continue")').click();

    await expect(page.locator('text=Express Shipping')).toBeVisible();
  });

  test('Mixed cart shipping (freight + regular)', async ({ page }) => {
    await page.locator('text=Heavy Item').click();
    await page.locator('button:has-text("Add to Cart")').click();

    await page.locator('text=Regular Item').click();
    await page.locator('button:has-text("Add to Cart")').click();

    await page.locator('[data-testid="cart-icon"]').click();
    await page.locator('button:has-text("Checkout")').click();

    await expect(page.locator('text=Freight Shipping')).toBeVisible();
    await expect(page.locator('text=Standard Shipping')).toBeVisible();
  });

  test('Fitment validation at checkout', async ({ page }) => {
    await page.locator('text=Incompatible Part').click();
    await page.locator('button:has-text("Add to Cart")').click();

    await page.locator('[data-testid="cart-icon"]').click();
    await page.locator('button:has-text("Checkout")').click();

    await expect(page.locator('text=Incompatible with selected vehicle')).toBeVisible();
  });

  test('Apply promo code', async ({ page }) => {
    await page.locator('button:has-text("Add to Cart")').first().click();
    await page.locator('[data-testid="cart-icon"]').click();
    await page.locator('button:has-text("Checkout")').click();

    await page.fill('input[name="promoCode"]', 'SAVE10');
    await page.locator('button:has-text("Apply")').click();

    await expect(page.locator('text=Discount applied')).toBeVisible();
  });

  test('Remove promo code', async ({ page }) => {
    await page.locator('button:has-text("Remove Promo")').click();
    await expect(page.locator('text=Discount applied')).not.toBeVisible();
  });

});
