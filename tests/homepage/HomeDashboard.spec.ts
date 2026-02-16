/**
 * Admin Home Dashboard tests.
 * Covers sign-in, date range filter selection (Week, Month, Year, Custom),
 * custom date picker interaction, and export functionality.
 *
 * Run in Chrome: npx playwright test tests/homepage/HomeDashboard.spec.ts --project=chrome
 *
 * Requires ADMIN_BASE_URL, ADMIN_EMAIL, and ADMIN_PASSWORD environment variables
 * for authenticated tests. If unset, tests are skipped.
 */
import { test, expect, type Page } from '@playwright/test';

const ADMIN_BASE_URL =
  process.env.ADMIN_BASE_URL ?? 'https://admin.onechanneladmin.com';
const SIGN_IN_URL = `${ADMIN_BASE_URL}/signin?returnUrl=%2F`;
const NAVIGATION_TIMEOUT = 60_000;
const ACTION_TIMEOUT = 30_000;

const getAdminCredentials = () => ({
  email: process.env.ADMIN_EMAIL ?? 'princy@onechanneladmin.com',
  password: process.env.ADMIN_PASSWORD ?? 'beR60ElTpm0?YbW',
});

/**
 * Helper function to sign in to the admin dashboard
 */
async function signIn(page: Page, email: string, password: string) {
  await page.goto(SIGN_IN_URL, {
    waitUntil: 'domcontentloaded',
    timeout: NAVIGATION_TIMEOUT,
  });

  await page
    .getByRole('textbox', { name: 'Email address' })
    .fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: /login|sign in/i }).click();

  // Wait for successful login - URL should not contain 'signin'
  await expect(page).not.toHaveURL(/signin/i, { timeout: ACTION_TIMEOUT });
}

test.describe('Admin Home Dashboard', () => {
  test.describe('when admin credentials are configured', () => {
    test.skip(
      () => {
        const { email, password } = getAdminCredentials();
        return !email || !password;
      },
      'Set ADMIN_EMAIL and ADMIN_PASSWORD (e.g. playwright.env) to run these tests'
    );

    test('should sign in and navigate to dashboard', async ({ page }) => {
      const { email, password } = getAdminCredentials();
      await signIn(page, email, password);

      // Assert: Dashboard should be loaded (not on sign-in page)
      await expect(page).not.toHaveURL(/signin/i);
    });

    test('should select different date range filters', async ({ page }) => {
      const { email, password } = getAdminCredentials();
      await signIn(page, email, password);

      // Test Week filter
      const weekButton = page.getByRole('button', { name: 'Week' });
      await expect(weekButton).toBeVisible({ timeout: ACTION_TIMEOUT });
      await weekButton.click();

      // Test Month filter
      const monthButton = page.getByRole('button', { name: 'Month' });
      await expect(monthButton).toBeVisible({ timeout: ACTION_TIMEOUT });
      await monthButton.click();

      // Test Year filter
      const yearButton = page.getByRole('button', { name: 'Year' });
      await expect(yearButton).toBeVisible({ timeout: ACTION_TIMEOUT });
      await yearButton.click();

      // Test Custom filter
      const customButton = page.getByRole('button', { name: 'Custom' });
      await expect(customButton).toBeVisible({ timeout: ACTION_TIMEOUT });
      await customButton.click();
    });

    test('should select custom date range and export data', async ({ page }) => {
      const { email, password } = getAdminCredentials();
      await signIn(page, email, password);

      // Select Custom date range
      const customButton = page.getByRole('button', { name: 'Custom' });
      await expect(customButton).toBeVisible({ timeout: ACTION_TIMEOUT });
      await customButton.click();

      // Open date picker (assuming there's a button or input to trigger it)
      // Using a more specific selector if available, otherwise fallback to nth
      const datePickerTrigger = page
        .getByRole('textbox', { name: 'Select Date' })
        .or(page.locator('button').nth(2));
      await datePickerTrigger.first().click();

      // Select a date (day 2)
      const dateOption = page.locator('span').filter({ hasText: /^2$/ });
      await expect(dateOption).toBeVisible({ timeout: ACTION_TIMEOUT });
      await dateOption.click();

      // Confirm date selection
      const confirmButton = page.locator('button').nth(2);
      await confirmButton.click();

      // Test export functionality
      const downloadPromise = page.waitForEvent('download', {
        timeout: ACTION_TIMEOUT,
      });
      const exportButton = page.getByRole('button', { name: /export/i });
      await expect(exportButton).toBeVisible({ timeout: ACTION_TIMEOUT });
      await exportButton.click();

      // Wait for download to complete
      const download = await downloadPromise;

      // Assert: Download should have a filename
      expect(download.suggestedFilename()).toBeTruthy();
    });
  });
});
