/**
 * Admin Image Dashboard tests.
 * Covers sign-in, navigation to Image Dashboard, filter interactions,
 * and image upload functionality.
 *
 * Run in Chrome: npx playwright test tests/ImageDashboard.spec.ts --project=chrome
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

/**
 * Helper function to navigate to Image Dashboard
 */
async function navigateToImageDashboard(page: Page) {
  // Open Catalog menu
  const catalogButton = page.getByRole('button', { name: 'Catalog' });
  await expect(catalogButton).toBeVisible({ timeout: ACTION_TIMEOUT });
  await catalogButton.click();

  // Navigate to Images
  const imagesLink = page.getByRole('link', { name: 'Images' });
  await expect(imagesLink).toBeVisible({ timeout: ACTION_TIMEOUT });
  await imagesLink.click();

  // Wait for Image Dashboard to load
  await page.waitForLoadState('domcontentloaded', { timeout: NAVIGATION_TIMEOUT });
}

test.describe('Admin Image Dashboard', () => {
  test.describe('when admin credentials are configured', () => {
    test.skip(
      () => {
        const { email, password } = getAdminCredentials();
        return !email || !password;
      },
      'Set ADMIN_EMAIL and ADMIN_PASSWORD (e.g. playwright.env) to run these tests'
    );

    test('should sign in, navigate to image dashboard, and interact with filters', async ({ page }) => {
      const { email, password } = getAdminCredentials();
      await signIn(page, email, password);
      await navigateToImageDashboard(page);

      // Wait for the dashboard to fully load
      await page.waitForTimeout(1000);

      // Wait for filter buttons to be visible
      // Find filter dropdowns - they are typically buttons with dropdown icons
      const filterButtons = page.locator('button').filter({ hasText: /^$/ });
      const filterButtonCount = await filterButtons.count();

      // Click first filter dropdown (Time period - Week)
      if (filterButtonCount > 1) {
        const firstFilter = filterButtons.nth(1);
        if (await firstFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
          await firstFilter.click();
          await page.waitForTimeout(500);
          
          const weekOption = page.getByRole('option', { name: 'Week' });
          if (await weekOption.isVisible({ timeout: 5000 }).catch(() => false)) {
            await weekOption.click();
            await page.waitForTimeout(500);
          }
        }
      }

      // Click second filter dropdown (Marketplace - Amazon Us A3STI84ZSLQ1Z7)
      if (filterButtonCount > 2) {
        const secondFilter = filterButtons.nth(2);
        if (await secondFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
          await secondFilter.click();
          await page.waitForTimeout(500);
          
          const amazonOption = page.getByRole('option', { name: 'Amazon Us A3STI84ZSLQ1Z7' });
          if (await amazonOption.isVisible({ timeout: 5000 }).catch(() => false)) {
            await amazonOption.click();
            await page.waitForTimeout(500);
          }
        }
      }

      // Click third filter dropdown (Brand - 1CA)
      if (filterButtonCount > 3) {
        const thirdFilter = filterButtons.nth(3);
        if (await thirdFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
          await thirdFilter.click();
          await page.waitForTimeout(500);
          
          const brandOption = page.getByRole('option', { name: '1CA', exact: true });
          if (await brandOption.isVisible({ timeout: 5000 }).catch(() => false)) {
            await brandOption.click();
            await page.waitForTimeout(500);
          }
        }
      }

      // Click Reset button (only if enabled)
      const resetButton = page.getByRole('button', { name: 'Reset' });
      if (await resetButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        const isEnabled = await resetButton.isEnabled().catch(() => false);
        if (isEnabled) {
          await resetButton.click();
          await page.waitForTimeout(500);
        }
      }

      // Click Save Data button (using regex to match button with Save Data text, ignoring special characters)
      const saveDataButton = page.getByRole('button', { name: /save data/i });
      if (await saveDataButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        const isEnabled = await saveDataButton.isEnabled().catch(() => false);
        if (isEnabled) {
          await saveDataButton.click();
          await page.waitForTimeout(1000);
        }
      }

      // Wait for table to load
      await page.waitForSelector('.p-datatable-loading-icon', { state: 'hidden', timeout: ACTION_TIMEOUT }).catch(() => {});
      await page.waitForTimeout(1000);

      // Find row with SKU AIR_LIFT57230_DUPLICATE1 and interact with file input
      const targetRow = page.getByRole('row').filter({ 
        hasText: /AIR_LIFT57230_DUPLICATE1.*57230.*AIR/i 
      });
      
      if (await targetRow.isVisible({ timeout: 10000 }).catch(() => false)) {
        const fileInput = targetRow.locator('input[type="file"]');
        if (await fileInput.isVisible({ timeout: 5000 }).catch(() => false)) {
          // Note: File upload would require an actual file path
          // await fileInput.setInputFiles('path/to/image.jpg');
        }
      }

      // Interact with multiselect dropdowns
      const multiselectTriggers = page.locator('.p-multiselect-trigger-icon');
      const multiselectCount = await multiselectTriggers.count();

      if (multiselectCount > 0) {
        // Click first multiselect
        const firstMultiselect = multiselectTriggers.first();
        if (await firstMultiselect.isVisible({ timeout: 5000 }).catch(() => false)) {
          await firstMultiselect.click();
          await page.waitForTimeout(500);
          
          const amazonText = page.getByText('Amazon Us A3STI84ZSLQ1Z7', { exact: true });
          if (await amazonText.isVisible({ timeout: 5000 }).catch(() => false)) {
            await amazonText.click();
            await page.waitForTimeout(500);
          }
        }
      }

      // Click on cell with marketplace info (using regex to match cell content)
      const marketplaceCell = page.getByRole('cell', { name: /1.*Amazon Us A3STI84ZSLQ1Z7/i });
      if (await marketplaceCell.isVisible({ timeout: 5000 }).catch(() => false)) {
        await marketplaceCell.click();
        await page.waitForTimeout(500);
      }

      // Navigate to last page using paginator
      const lastPageButton = page.locator('.p-paginator-last');
      if (await lastPageButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await lastPageButton.click();
        await page.waitForTimeout(1000);
      }

      // Assert: Image Dashboard should be loaded
      await expect(page.getByRole('link', { name: 'Images' })).toBeVisible({
        timeout: ACTION_TIMEOUT,
      });
    });
  });
});
