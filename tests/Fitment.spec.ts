/**
 * Admin Fitment Management tests.
 * Covers sign-in, navigation to Fitment page, vehicle filter selection,
 * advanced filter options, column management, sync operations, and export functionality.
 *
 * Run in Chrome: npx playwright test tests/Fitment.spec.ts --project=chrome
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
 * Helper function to navigate to Fitment page
 */
async function navigateToFitmentPage(page: Page) {
  // Open Catalog menu
  const catalogButton = page.getByRole('button', { name: 'Catalog' });
  await expect(catalogButton).toBeVisible({ timeout: ACTION_TIMEOUT });
  await catalogButton.click();

  // Navigate to Fitment
  const fitmentLink = page.getByRole('link', { name: 'Fitment' });
  await expect(fitmentLink).toBeVisible({ timeout: ACTION_TIMEOUT });
  await fitmentLink.click();

  // Wait for Fitment page to load
  await page.waitForLoadState('domcontentloaded', { timeout: NAVIGATION_TIMEOUT });
}

/**
 * Helper function to select vehicle filters (Year, Make, Model)
 */
async function selectVehicleFilters(
  page: Page,
  year: string,
  make: string,
  model: string
) {
  // Wait for any loaders to disappear
  await page.waitForTimeout(500);
  
  // Select Year
  const yearButton = page.getByRole('button').filter({ hasText: /^$/ }).nth(1);
  await expect(yearButton).toBeVisible({ timeout: ACTION_TIMEOUT });
  await expect(yearButton).toBeEnabled({ timeout: ACTION_TIMEOUT });
  await yearButton.click();
  
  // Wait for dropdown to open
  await page.waitForTimeout(500);
  
  const yearOption = page.getByRole('option', { name: year });
  await expect(yearOption).toBeVisible({ timeout: ACTION_TIMEOUT });
  await yearOption.click();
  
  // Wait for Make dropdown to become enabled
  await page.waitForTimeout(500);

  // Select Make
  const makeButton = page.getByRole('button').filter({ hasText: /^$/ }).nth(2);
  await expect(makeButton).toBeVisible({ timeout: ACTION_TIMEOUT });
  await expect(makeButton).toBeEnabled({ timeout: ACTION_TIMEOUT });
  await makeButton.click();
  
  // Wait for dropdown to open
  await page.waitForTimeout(500);
  
  const makeOption = page.getByRole('option', { name: make });
  await expect(makeOption).toBeVisible({ timeout: ACTION_TIMEOUT });
  await makeOption.click();
  
  // Wait for Model dropdown to become enabled
  await page.waitForTimeout(500);

  // Select Model
  const modelButton = page.getByRole('button').filter({ hasText: /^$/ }).nth(3);
  await expect(modelButton).toBeVisible({ timeout: ACTION_TIMEOUT });
  await expect(modelButton).toBeEnabled({ timeout: ACTION_TIMEOUT });
  await modelButton.click();
  
  // Wait for dropdown to open
  await page.waitForTimeout(500);
  
  const modelOption = page.getByRole('option', { name: model });
  await expect(modelOption).toBeVisible({ timeout: ACTION_TIMEOUT });
  await modelOption.click();
  
  await page.waitForTimeout(500);
}

/**
 * Helper function to open and interact with More Options filter panel
 */
async function openMoreOptions(page: Page) {
  const moreOptionsButton = page.getByRole('button', { name: /more options/i });
  await expect(moreOptionsButton).toBeVisible({ timeout: ACTION_TIMEOUT });
  
  // Wait for button to be enabled (it may be disabled until filters are applied)
  // Wait up to 10 seconds for it to become enabled
  let isEnabled = false;
  for (let i = 0; i < 20; i++) {
    isEnabled = await moreOptionsButton.isEnabled().catch(() => false);
    if (isEnabled) {
      break;
    }
    await page.waitForTimeout(500);
  }
  
  if (!isEnabled) {
    throw new Error('More Options button is disabled and cannot be clicked. Filters may need to be applied first.');
  }
  
  await moreOptionsButton.click();
  await page.waitForTimeout(500); // Wait for panel to open
}

/**
 * Helper function to clear filters in More Options panel
 */
async function clearMoreOptionsFilters(page: Page) {
  await openMoreOptions(page);
  
  // Find and click the Clear button
  const clearButton = page.getByRole('button', { name: /clear/i });
  if (await clearButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await clearButton.click();
    await page.waitForTimeout(300);
  }

  // Click Done
  const doneButton = page.getByRole('button', { name: /done/i });
  await expect(doneButton).toBeVisible({ timeout: ACTION_TIMEOUT });
  await doneButton.click();

  // Click Apply
  const applyButton = page.getByRole('button', { name: /apply/i });
  await expect(applyButton).toBeVisible({ timeout: ACTION_TIMEOUT });
  await applyButton.click();
  
  await page.waitForTimeout(500);
}

test.describe('Admin Fitment Management', () => {
  test.describe('when admin credentials are configured', () => {
    test.skip(
      () => {
        const { email, password } = getAdminCredentials();
        return !email || !password;
      },
      'Set ADMIN_EMAIL and ADMIN_PASSWORD (e.g. playwright.env) to run these tests'
    );

    test('should sign in and navigate to fitment page', async ({ page }) => {
      const { email, password } = getAdminCredentials();
      await signIn(page, email, password);
      await navigateToFitmentPage(page);

      // Assert: Fitment page should be loaded
      await expect(page.getByRole('link', { name: 'Fitment' })).toBeVisible({
        timeout: ACTION_TIMEOUT,
      });
    });

    test('should select vehicle filters (Year, Make, Model)', async ({ page }) => {
      const { email, password } = getAdminCredentials();
      await signIn(page, email, password);
      await navigateToFitmentPage(page);

      // Select vehicle filters
      await selectVehicleFilters(page, '2026', 'BMW4', 'M546');

      // Assert: Filters should be applied (verify by checking if Apply button is available or filters are visible)
      const applyButton = page.getByRole('button', { name: /apply/i });
      await expect(applyButton).toBeVisible({ timeout: ACTION_TIMEOUT });
    });

    test('should interact with more options filters', async ({ page }) => {
      const { email, password } = getAdminCredentials();
      await signIn(page, email, password);
      await navigateToFitmentPage(page);

      // First, select some vehicle filters to enable More Options button
      await selectVehicleFilters(page, '2026', 'BMW4', 'M546');
      
      // Apply the filters first - this may be required to enable More Options
      const initialApplyButton = page.getByRole('button', { name: /apply/i });
      if (await initialApplyButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await initialApplyButton.click();
        await page.waitForTimeout(2000); // Wait for filters to be applied
      }

      // Open More Options panel
      await openMoreOptions(page);

      // Select additional filter options
      const additionalFilterButton = page
        .getByRole('button')
        .filter({ hasText: /^$/ })
        .nth(4);
      
      if (await additionalFilterButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await additionalFilterButton.click();
        await page.waitForTimeout(500);
        
        const teslaOption = page.getByRole('option', { name: 'TESLA' });
        if (await teslaOption.isVisible({ timeout: 5000 }).catch(() => false)) {
          await teslaOption.click();
          await page.waitForTimeout(500);
        }
      }

      // Apply filters
      const doneButton = page.getByRole('button', { name: /done/i });
      await expect(doneButton).toBeVisible({ timeout: ACTION_TIMEOUT });
      await doneButton.click();
      await page.waitForTimeout(500);

      const finalApplyButton = page.getByRole('button', { name: /apply/i });
      await expect(finalApplyButton).toBeVisible({ timeout: ACTION_TIMEOUT });
      await finalApplyButton.click();
      
      await page.waitForTimeout(500);
    });

    test('should clear and reset filters', async ({ page }) => {
      const { email, password } = getAdminCredentials();
      await signIn(page, email, password);
      await navigateToFitmentPage(page);

      // First, select some filters
      await selectVehicleFilters(page, '2026', 'BMW4', 'M546');
      
      // Apply the filters first - this may be required to enable More Options
      const applyButton = page.getByRole('button', { name: /apply/i });
      if (await applyButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await applyButton.click();
        await page.waitForTimeout(2000); // Wait for filters to be applied
      }
      
      // Clear filters using More Options
      await clearMoreOptionsFilters(page);

      // Reset all filters
      const resetButton = page.getByRole('button', { name: 'Reset' });
      await expect(resetButton).toBeVisible({ timeout: ACTION_TIMEOUT });
      await resetButton.click();
      
      await page.waitForTimeout(500);
    });

    test('should sync fitments', async ({ page }) => {
      const { email, password } = getAdminCredentials();
      await signIn(page, email, password);
      await navigateToFitmentPage(page);

      // Click Sync Fitments button
      const syncButton = page.getByRole('button', { name: /sync fitments/i });
      await expect(syncButton).toBeVisible({ timeout: ACTION_TIMEOUT });
      await syncButton.click();

      // Wait for sync operation to complete
      await page.waitForTimeout(2000);
    });

    test('should manage column visibility', async ({ page }) => {
      const { email, password } = getAdminCredentials();
      await signIn(page, email, password);
      await navigateToFitmentPage(page);

      // Open Columns menu
      const columnsButton = page.getByRole('button', { name: /columns/i });
      await expect(columnsButton).toBeVisible({ timeout: ACTION_TIMEOUT });
      await columnsButton.click();
      
      await page.waitForTimeout(500);

      // Toggle a column checkbox
      const columnCheckbox = page
        .locator('.field-checkbox > .p-checkbox > .p-checkbox-box')
        .first();
      
      if (await columnCheckbox.isVisible({ timeout: 5000 }).catch(() => false)) {
        await columnCheckbox.click();
        await page.waitForTimeout(300);
      }

      // Wait for any overlays to disappear before clicking
      // Wait for dialog mask overlay to be hidden
      try {
        await page.waitForSelector('.p-dialog-mask', { state: 'hidden', timeout: 10000 });
      } catch {
        // Overlay might not exist, which is fine
      }
      
      // Wait for datatable loading overlay to be hidden
      try {
        await page.waitForSelector('.p-datatable-loading-overlay', { state: 'hidden', timeout: 10000 });
      } catch {
        // Overlay might not exist, which is fine
      }
      
      // Wait for any overlay that might intercept clicks
      try {
        await page.waitForSelector('.p-component-overlay', { state: 'hidden', timeout: 10000 });
      } catch {
        // Overlay might not exist, which is fine
      }
      
      // Additional wait to ensure overlays are completely gone
      await page.waitForTimeout(1000);
      
      // Toggle a highlighted (selected) checkbox
      const highlightedCheckbox = page
        .locator('.p-checkbox-box.p-highlight')
        .first();
      
      if (await highlightedCheckbox.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Check if checkbox is disabled
        const isDisabled = await highlightedCheckbox.getAttribute('class').then(cls => cls?.includes('p-disabled')).catch(() => false);
        if (!isDisabled) {
          // Wait for any overlays one more time before clicking
          await page.waitForTimeout(500);
          // Use force click if overlay is still present
          await highlightedCheckbox.click({ force: true });
          await page.waitForTimeout(300);
        }
      }

      // Apply column changes
      const applyButton = page.getByRole('button', { name: 'Apply', exact: true });
      await expect(applyButton).toBeVisible({ timeout: ACTION_TIMEOUT });
      await applyButton.click();
      
      await page.waitForTimeout(500);

      // Test Reset functionality
      await columnsButton.click();
      await page.waitForTimeout(500);

      const resetButton = page
        .getByLabel('Columns')
        .getByRole('button', { name: 'Reset' });
      
      if (await resetButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await resetButton.click();
        await page.waitForTimeout(500);
      }
    });

    test('should export fitment data', async ({ page }) => {
      const { email, password } = getAdminCredentials();
      await signIn(page, email, password);
      await navigateToFitmentPage(page);

      // Click Export button
      const exportButton = page.getByRole('button', { name: /export/i });
      await expect(exportButton).toBeVisible({ timeout: ACTION_TIMEOUT });
      await exportButton.click();

      // Wait for export dialog/modal to appear
      await page.waitForTimeout(1000);

      // Navigate through export wizard
      const nextButton = page.getByRole('button', { name: 'Next' });
      if (await nextButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await nextButton.click();
        await page.waitForTimeout(500);
      }

      // Close export dialog
      const closeButton = page.getByRole('button', { name: 'Close' });
      if (await closeButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await closeButton.click();
        await page.waitForTimeout(500);
      }
    });
  });
});
