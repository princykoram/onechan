import { test, expect } from '@playwright/test';

/*
  File: checkout-and-cart.spec.ts
  Module: Cart Management & Checkout
  Application: E-commerce (Auto Parts / Fitment Based)
*/

test.describe('Cart Management', () => {

  test('Checkout with valid cart navigates to checkout page', async ({ page }) => {
    await page.goto('/plp');
    await page.locator('[data-testid="add-to-cart"]').first().click();

    await page.goto('/cart');
    await page.click('[data-testid="checkout-btn"]');

    await expect(page).toHaveURL(/checkout/);
  });

  test('Checkout blocked when cart contains out-of-stock item', async ({ page }) => {
    await page.goto('/cart?mock=oos');

    await page.click('[data-testid="checkout-btn"]');
    await expect(page.locator('.error-message'))
      .toContainText('Out of stock');
  });

  test('Checkout blocked when cart contains incompatible item', async ({ page }) => {
    await page.goto('/cart?mock=incompatible');

    await page.click('[data-testid="checkout-btn"]');
    await expect(page.locator('.error-message'))
      .toContainText('Incompatible');
  });

  test('Shipping eligibility shows correct shipping options', async ({ page }) => {
    await page.goto('/cart');
    await expect(page.locator('.shipping-options')).toBeVisible();
  });

  test('Mixed shipping items show split shipping', async ({ page }) => {
    await page.goto('/cart?mock=mixedShipping');
    await expect(page.locator('.split-shipping')).toBeVisible();
  });

  test('Delivery date estimate displayed correctly', async ({ page }) => {
    await page.goto('/cart');
    await expect(page.locator('.delivery-date')).toBeVisible();
  });

  test('Cart recovery after page refresh', async ({ page }) => {
    await page.goto('/plp');
    await page.locator('[data-testid="add-to-cart"]').first().click();

    await page.reload();
    await expect(page.locator('.cart-item')).toHaveCount(1);
  });

  test('Duplicate add prevention on refresh', async ({ page }) => {
    await page.goto('/plp');
    await page.locator('[data-testid="add-to-cart"]').first().click();
    await page.reload();

    await expect(page.locator('.cart-item')).toHaveCount(1);
  });

  test('Cart sync across multiple tabs', async ({ context }) => {
    const tab1 = await context.newPage();
    const tab2 = await context.newPage();

    await tab1.goto('/plp');
    await tab1.locator('[data-testid="add-to-cart"]').first().click();

    await tab2.goto('/cart');
    await expect(tab2.locator('.cart-item')).toHaveCount(1);
  });

});

test.describe('Checkout Process – Guest & Logged-in', () => {

  test('Logged-in user proceeds to checkout successfully', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'user@test.com');
    await page.fill('#password', 'Password123');
    await page.click('[data-testid="login"]');

    await page.goto('/cart');
    await page.click('[data-testid="checkout-btn"]');

    await expect(page).toHaveURL(/checkout/);
  });

  test('Checkout blocked for logged-in user with empty cart', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'user@test.com');
    await page.fill('#password', 'Password123');
    await page.click('[data-testid="login"]');

    await page.goto('/checkout');
    await expect(page.locator('.error-message'))
      .toContainText('Cart is empty');
  });

  test('Guest user proceeds to checkout', async ({ page }) => {
    await page.goto('/plp');
    await page.locator('[data-testid="add-to-cart"]').first().click();

    await page.click('[data-testid="checkout-btn"]');
    await expect(page).toHaveURL(/checkout/);
  });

  test('Guest prompted to login during checkout', async ({ page }) => {
    await page.goto('/checkout');
    await page.click('[data-testid="continue-btn"]');

    await expect(page.locator('.login-prompt')).toBeVisible();
  });

  test('Guest continues checkout without login', async ({ page }) => {
    await page.goto('/checkout');
    await page.click('[data-testid="continue-as-guest"]');

    await expect(page.locator('h2'))
      .toHaveText('Shipping Address');
  });

  test('Guest cart merged when logging in during checkout', async ({ page }) => {
    await page.goto('/checkout');
    await page.click('[data-testid="login-during-checkout"]');

    await page.fill('#email', 'user@test.com');
    await page.fill('#password', 'Password123');
    await page.click('[data-testid="login"]');

    await expect(page.locator('.cart-item')).toHaveCountGreaterThan(0);
  });

});

test.describe('Checkout – Address & Shipping Validation', () => {

  test('Auto-populate city and state using ZIP/Pincode', async ({ page }) => {
    await page.goto('/checkout');

    await page.fill('#zip', '560001');
    await expect(page.locator('#city')).not.toBeEmpty();
    await expect(page.locator('#state')).not.toBeEmpty();
  });

  test('Invalid ZIP/Pincode validation error', async ({ page }) => {
    await page.goto('/checkout');

    await page.fill('#zip', '000000');
    await page.click('[data-testid="save-address"]');

    await expect(page.locator('.error-message'))
      .toContainText('Invalid ZIP');
  });

  test('ZIP API failure allows manual city/state entry', async ({ page }) => {
    await page.goto('/checkout?mock=zipDown');

    await page.fill('#zip', '560001');
    await expect(page.locator('#city')).toBeEditable();
    await expect(page.locator('#state')).toBeEditable();
  });

  test('Changing address updates tax and shipping', async ({ page }) => {
    await page.goto('/checkout');

    const oldTax = await page.locator('.tax-amount').textContent();
    await page.fill('#zip', '10001');
    await page.click('[data-testid="update-address"]');

    const newTax = await page.locator('.tax-amount').textContent();
    expect(oldTax).not.toEqual(newTax);
  });

});

test.describe('Checkout – Promo, Pricing & Order Placement', () => {

  test('Apply valid promo code successfully', async ({ page }) => {
    await page.goto('/checkout');

    await page.fill('#promo-code', 'SAVE10');
    await page.click('[data-testid="apply-promo"]');

    await expect(page.locator('.discount-row')).toBeVisible();
  });

  test('Invalid promo code shows error', async ({ page }) => {
    await page.goto('/checkout');

    await page.fill('#promo-code', 'INVALID');
    await page.click('[data-testid="apply-promo"]');

    await expect(page.locator('.error-message'))
      .toContainText('Invalid promo');
  });

  test('Prevent duplicate order on multiple clicks', async ({ page }) => {
    await page.goto('/checkout');

    await page.click('[data-testid="place-order"]');
    await page.click('[data-testid="place-order"]');

    await expect(page.locator('.order-confirmation')).toHaveCount(1);
  });

  test('Place order successfully and show confirmation', async ({ page }) => {
    await page.goto('/checkout');

    await page.click('[data-testid="place-order"]');

    await expect(page).toHaveURL(/order-confirmation/);
    await expect(page.locator('.order-number')).toBeVisible();
  });

});
