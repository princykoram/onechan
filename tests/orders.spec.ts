/**
 * Admin order creation and fulfillment flows.
 * Covers sign-in, navigation to Rentals, creating an order with a customer and product,
 * and completing the order (e.g. Pay Later).
 *
 * Run in Chrome: npm run test:orders  (or: npx playwright test tests/orders.spec.ts)
 * Config uses channel: 'chrome' in playwright.config.ts.
 *
 * Requires ADMIN_BASE_URL, ADMIN_EMAIL, and ADMIN_PASSWORD environment variables
 * for authenticated tests. If unset, tests are skipped. Uses One Channel Admin fulfillment UI.
 */
import { test, expect } from '@playwright/test';

const ADMIN_BASE_URL =
  process.env.ADMIN_BASE_URL ?? 'https://admin.onechanneladmin.com';
const SIGN_IN_URL = `${ADMIN_BASE_URL}/signin?returnUrl=%2F`;
const NAVIGATION_TIMEOUT = 60_000;
const ACTION_TIMEOUT = 30_000;

const getAdminCredentials = () => ({
  email: process.env.ADMIN_EMAIL ?? '',
  password: process.env.ADMIN_PASSWORD ?? '',
});

test.describe('Admin orders – fulfillment', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SIGN_IN_URL, {
      waitUntil: 'domcontentloaded',
      timeout: NAVIGATION_TIMEOUT,
    });
  });

  test.describe('when admin credentials are configured', () => {
    test.skip(
      () => {
        const { email, password } = getAdminCredentials();
        return !email || !password;
      },
      'Set ADMIN_EMAIL and ADMIN_PASSWORD (e.g. .env or export) to run these tests in Chrome'
    );

    test('sign in and reach fulfillment Rentals', async ({ page }) => {
      const { email, password } = getAdminCredentials();
      await page.getByRole('textbox', { name: 'Email address' }).fill(email);
      await page.locator('input[name="password"]').fill(password);
      await page.getByRole('button', { name: /login|sign in/i }).click();

      await expect(page).not.toHaveURL(/signin/i, { timeout: ACTION_TIMEOUT });

      await page.getByRole('button', { name: 'Fulfillment' }).click();
      await page.getByRole('link', { name: 'Rentals' }).click();

      await expect(page.getByRole('button', { name: 'Add Order' })).toBeVisible({
        timeout: ACTION_TIMEOUT,
      });
    });

    test('create rental order with customer and product then pay later', async ({
      page,
    }) => {
      const { email, password } = getAdminCredentials();
      await page.getByRole('textbox', { name: 'Email address' }).fill(email);
      await page.locator('input[name="password"]').fill(password);
      await page.getByRole('button', { name: /login|sign in/i }).click();

      await expect(page).not.toHaveURL(/signin/i, { timeout: ACTION_TIMEOUT });

      await page.getByRole('button', { name: 'Fulfillment' }).click();
      await page.getByRole('link', { name: 'Rentals' }).click();
      await page.getByRole('button', { name: 'Add Order' }).click();

      const customerSearch = page.getByRole('textbox', {
        name: 'Search or add new customer...',
      });
      await customerSearch.fill('one');
      await page.getByText('Admin', { exact: true }).click();

      await page.getByText('Add Products').click();

      const dialog = page.getByRole('dialog').filter({ hasText: 'Search Products' });
      await expect(dialog).toBeVisible({ timeout: ACTION_TIMEOUT });

      await dialog.getByText('Rental', { exact: true }).click();

      const searchInput = dialog
        .getByPlaceholder('Search by item name...')
        .or(dialog.getByRole('textbox', { name: 'Search by item name...' }));
      await expect(searchInput.first()).toBeVisible({ timeout: ACTION_TIMEOUT });
      await searchInput.first().fill('AIR LIFT 57213');

      // Wait for search to finish (progressbar/spinner in dialog to disappear)
      await expect(dialog.getByRole('progressbar')).toBeHidden({
        timeout: ACTION_TIMEOUT,
      });

      const productOption = dialog.getByText(/AIR LIFT 57213 Rear Air/i).first();
      await expect(productOption).toBeVisible({ timeout: ACTION_TIMEOUT });
      await productOption.click({ timeout: ACTION_TIMEOUT });
      await page.getByText('1 Week').click();
      await page.locator('div').filter({ hasText: /^No$/ }).first().click();
      await page.getByText('Add to Cart').click();

      await page.getByText('Pay Later').click();

      const closeOrSubmit = page
        .getByRole('button', { name: /close|done|submit|confirm/i })
        .or(page.locator('button').filter({ has: page.locator('svg') }).first());
      if (await closeOrSubmit.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await closeOrSubmit.first().click();
      }

      await expect(page).not.toHaveURL(/error|404/);
    });
  });
});
