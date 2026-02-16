import { test, expect } from '@playwright/test';


test.describe('Homepage', () => {

  test('should load homepage successfully', async ({ page }) => {
    // ===== Arrange =====
    await page.goto('/');

    // ===== Assert: Page loaded =====
    await expect(page).toHaveTitle(/Nexus|Truck|Upgrades/i);

    // ===== Assert: Header visible =====
    await expect(page.locator('header')).toBeVisible();

    // ===== Assert: Vehicle selection present =====
    await expect(
      page.getByRole('combobox').first()
    ).toBeVisible();
  });

});
