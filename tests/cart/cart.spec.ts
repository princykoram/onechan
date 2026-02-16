import { test, expect } from '@playwright/test';

test.describe('Cart - Ecommerce Auto Parts', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('https://nexustruckupgrades.onechanneladmin.com/');
  });

  test('Add multiple compatible parts to cart', async ({ page }) => {
    await page.locator('button:has-text("Add to Cart")').nth(0).click();
    await page.locator('button:has-text("Add to Cart")').nth(1).click();

    await page.locator('[data-testid="cart-icon"]').click();
    await expect(page.locator('.cart-item')).toHaveCount(2);
  });

  test('Prevent adding incompatible parts', async ({ page }) => {
    await page.locator('button:has-text("Add to Cart")').first().click();

    await expect(
      page.locator('.cart-warning')
    ).toContainText('does not fit');
  });

  test('Update quantity beyond available stock', async ({ page }) => {
    await page.locator('button:has-text("Add to Cart")').first().click();
    await page.locator('[data-testid="cart-icon"]').click();

    const qtyInput = page.locator('input.qty');
    await qtyInput.fill('999');
    await qtyInput.press('Enter');

    await expect(
      page.locator('.cart-warning')
    ).toContainText('Exceeds available stock');
  });

  test('Remove item and validate cart totals', async ({ page }) => {
    await page.locator('button:has-text("Add to Cart")').first().click();
    await page.locator('[data-testid="cart-icon"]').click();

    const totalBefore = await page.locator('.cart-total').textContent();
    await page.locator('button:has-text("Remove")').click();

    await expect(page.locator('.cart-item')).toHaveCount(0);

    const totalAfter = await page.locator('.cart-total').textContent();
    expect(totalBefore).not.toBe(totalAfter);
  });

  test('Save cart item for later', async ({ page }) => {
    await page.locator('button:has-text("Add to Cart")').first().click();
    await page.locator('[data-testid="cart-icon"]').click();

    await page.locator('button:has-text("Save for Later")').click();
    await expect(page.locator('.saved-item')).toBeVisible();
  });

  test('Merge guest cart after login', async ({ page }) => {
    await page.locator('button:has-text("Add to Cart")').first().click();

    await page.locator('text=Login').click();
    await page.fill('#email', 'testuser@email.com');
    await page.fill('#password', 'Password@123');
    await page.click('button:has-text("Login")');

    await page.locator('[data-testid="cart-icon"]').click();
    await expect(page.locator('.cart-item')).toHaveCount(1);
  });

  test('Cart persistence across sessions', async ({ page }) => {
    await page.locator('button:has-text("Add to Cart")').first().click();

    await page.reload();
    await page.locator('[data-testid="cart-icon"]').click();

    await expect(page.locator('.cart-item')).toHaveCount(1);
  });

});
