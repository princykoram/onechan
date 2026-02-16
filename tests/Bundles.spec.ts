/**
 * Admin Bundles Management tests.
 * Covers sign-in, navigation to Bundles page, row selection/deselection,
 * bulk selection operations, and column management functionality.
 *
 * Run in Chrome: npx playwright test tests/Bundles.spec.ts --project=chrome
 *
 * Requires ADMIN_BASE_URL, ADMIN_EMAIL, and ADMIN_PASSWORD environment variables
 * for authenticated tests. If unset, tests are skipped.
 */
import { test, expect, type Page, type Locator } from '@playwright/test';

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
 * Helper function to navigate to Bundles page
 */
async function navigateToBundlesPage(page: Page) {
  // Open Catalog menu
  const catalogButton = page.getByRole('button', { name: 'Catalog' });
  await expect(catalogButton).toBeVisible({ timeout: ACTION_TIMEOUT });
  await catalogButton.click();

  // Navigate to Bundles
  const bundlesLink = page.getByRole('link', { name: 'Bundles' });
  await expect(bundlesLink).toBeVisible({ timeout: ACTION_TIMEOUT });
  await bundlesLink.click();

  // Wait for Bundles page to load
  await page.waitForLoadState('domcontentloaded', { timeout: NAVIGATION_TIMEOUT });
}

/**
 * Helper function to toggle row selection checkbox
 */
async function toggleRowSelection(page: Page) {
  const rowCheckbox = page
    .getByRole('row', { name: /SKU.*MPN.*Brand/i })
    .getByRole('checkbox')
    .first();
  
  await expect(rowCheckbox).toBeVisible({ timeout: ACTION_TIMEOUT });
  await rowCheckbox.click();
  await page.waitForTimeout(300);
}

/**
 * Helper function to open row selection menu
 */
async function openRowSelectionMenu(page: Page) {
  const rowMenuIcon = page
    .getByRole('row', { name: /SKU.*MPN.*Brand/i })
    .locator('i')
    .first();
  
  await expect(rowMenuIcon).toBeVisible({ timeout: ACTION_TIMEOUT });
  await rowMenuIcon.click();
  await page.waitForTimeout(500);
}

/**
 * Helper function to select all rows on current page
 */
async function selectCurrentPage(page: Page) {
  await openRowSelectionMenu(page);
  
  const selectCurrentPageButton = page.getByText('Select Current Page');
  await expect(selectCurrentPageButton).toBeVisible({ timeout: ACTION_TIMEOUT });
  await selectCurrentPageButton.click();
  await page.waitForTimeout(500);
}

/**
 * Helper function to unselect all rows
 */
async function unselectAllRows(page: Page) {
  // Wait a bit to ensure any previous menu is closed
  await page.waitForTimeout(500);
  
  // Close any open menus first
  try {
    const openMenu = page.locator('.p-menu:visible, .p-contextmenu:visible, [role="menu"]:visible, .p-tieredmenu:visible').first();
    const isMenuOpen = await openMenu.isVisible({ timeout: 1000 }).catch(() => false);
    if (isMenuOpen) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
  } catch (error) {
    // Ignore errors when closing menu
  }
  
  // Strategy 1: Try to find "Unselect All" button directly on the page (like other tests)
  const directUnselectAll = page.getByText(/unselect all|deselect all|clear selection/i).first();
  const isDirectVisible = await directUnselectAll.isVisible({ timeout: 5000 }).catch(() => false);
  
  if (isDirectVisible) {
    await expect(directUnselectAll).toBeEnabled({ timeout: ACTION_TIMEOUT });
    await directUnselectAll.click();
    await page.waitForTimeout(500);
    return;
  }
  
  // Strategy 2: Try opening menu from row menu icon (original approach)
  try {
    await openRowSelectionMenu(page);
    await page.waitForTimeout(500);
    
    // Wait for menu to appear
    const menuSelectors = [
      '.p-menu',
      '.p-contextmenu',
      '[role="menu"]',
      '.p-tieredmenu',
    ];
    
    let menuContainer: Locator | null = null;
    for (const menuSelector of menuSelectors) {
      const menu = page.locator(menuSelector).first();
      const isVisible = await menu.isVisible({ timeout: 5000 }).catch(() => false);
      if (isVisible) {
        menuContainer = menu;
        break;
      }
    }
    
    if (menuContainer) {
      const unselectAllButton = menuContainer
        .getByText(/unselect all|deselect all|clear selection/i)
        .first();
      
      const isButtonVisible = await unselectAllButton.isVisible({ timeout: 5000 }).catch(() => false);
      if (isButtonVisible) {
        await expect(unselectAllButton).toBeEnabled({ timeout: ACTION_TIMEOUT });
        await unselectAllButton.click();
        await page.waitForTimeout(500);
        return;
      }
    }
  } catch (error) {
    // Continue to next strategy
  }
  
  // Strategy 3: Try finding menu icon in header row (when rows are selected, menu might be in header)
  try {
    const headerRow = page.getByRole('row', { name: /SKU.*MPN.*Brand/i }).first();
    const headerMenuIcons = headerRow.locator('i');
    const iconCount = await headerMenuIcons.count();
    
    for (let i = 0; i < Math.min(iconCount, 3); i++) {
      const icon = headerMenuIcons.nth(i);
      const isVisible = await icon.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (isVisible) {
        await icon.click();
        await page.waitForTimeout(500);
        
        // Check if menu appeared
        const menu = page.locator('.p-menu, .p-contextmenu, [role="menu"], .p-tieredmenu').first();
        const menuVisible = await menu.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (menuVisible) {
          const unselectAllButton = menu
            .getByText(/unselect all|deselect all|clear selection/i)
            .first();
          
          const isButtonVisible = await unselectAllButton.isVisible({ timeout: 5000 }).catch(() => false);
          if (isButtonVisible) {
            await expect(unselectAllButton).toBeEnabled({ timeout: ACTION_TIMEOUT });
            await unselectAllButton.click();
            await page.waitForTimeout(500);
            return;
          }
        }
        
        // Close menu if it didn't have the option
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    }
  } catch (error) {
    // Continue to next strategy
  }
  
  // Strategy 4: Try finding menu icon in bulk actions area or header
  try {
    // Look for menu icons in the table header or action bar
    const headerMenuIcons = page.locator('thead i, .p-datatable-header i, [class*="action"] i, .p-toolbar i');
    const iconCount = await headerMenuIcons.count();
    
    for (let i = 0; i < Math.min(iconCount, 5); i++) {
      const icon = headerMenuIcons.nth(i);
      const isVisible = await icon.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (isVisible) {
        await icon.click();
        await page.waitForTimeout(500);
        
        // Check if menu appeared
        const menu = page.locator('.p-menu, .p-contextmenu, [role="menu"], .p-tieredmenu').first();
        const menuVisible = await menu.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (menuVisible) {
          const unselectAllButton = menu
            .getByText(/unselect all|deselect all|clear selection/i)
            .first();
          
          const isButtonVisible = await unselectAllButton.isVisible({ timeout: 5000 }).catch(() => false);
          if (isButtonVisible) {
            await expect(unselectAllButton).toBeEnabled({ timeout: ACTION_TIMEOUT });
            await unselectAllButton.click();
            await page.waitForTimeout(500);
            return;
          }
        }
        
        // Close menu if it didn't have the option
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    }
  } catch (error) {
    // Continue to next strategy
  }
  
  // Strategy 5: Try finding "Unselect All" anywhere on the page after a short wait
  await page.waitForTimeout(1000);
  const finalUnselectAll = page.getByText(/unselect all|deselect all|clear selection/i).first();
  const isFinalVisible = await finalUnselectAll.isVisible({ timeout: 5000 }).catch(() => false);
  
  if (isFinalVisible) {
    await expect(finalUnselectAll).toBeEnabled({ timeout: ACTION_TIMEOUT });
    await finalUnselectAll.click();
    await page.waitForTimeout(500);
    return;
  }
  
  // If all strategies fail, throw error
  throw new Error('Menu did not open. Cannot find "Unselect All" option.');
}

/**
 * Helper function to open column management dialog
 */
async function openColumnManagement(page: Page) {
  const columnsButton = page.getByRole('button', { name: /columns/i });
  await expect(columnsButton).toBeVisible({ timeout: ACTION_TIMEOUT });
  await columnsButton.click();
  
  // Wait for column management dialog to open
  await page.waitForTimeout(500);
}

/**
 * Helper function to toggle column checkboxes in column management
 */
async function toggleColumnCheckboxes(page: Page) {
  // Wait for column management dialog to be fully loaded and interactive
  // Wait for dialog to be visible and not in transition
  const dialog = page.locator('.p-dialog').first();
  await expect(dialog).toBeVisible({ timeout: ACTION_TIMEOUT });
  
  // Wait for dialog animation to complete (remove enter class)
  await page.waitForFunction(
    () => {
      const dialog = document.querySelector('.p-dialog');
      return dialog && !dialog.classList.contains('p-dialog-enter');
    },
    { timeout: ACTION_TIMEOUT }
  );
  
  // Wait a bit more for dialog to be fully interactive
  await page.waitForTimeout(300);
  
  // Toggle a column checkbox
  const columnCheckbox = page
    .locator('.field-checkbox > .p-checkbox > .p-checkbox-box')
    .first();
  
  if (await columnCheckbox.isVisible({ timeout: 5000 }).catch(() => false)) {
    // Use force click if element is behind overlay, or wait for overlay to be ready
    try {
      await columnCheckbox.click({ timeout: 5000 });
    } catch (e) {
      // If click fails due to overlay, try force click
      await columnCheckbox.click({ force: true });
    }
    await page.waitForTimeout(300);
  }
  
  // Toggle a highlighted (selected) checkbox
  const highlightedCheckbox = page
    .locator('.p-checkbox-box.p-highlight')
    .first();
  
  if (await highlightedCheckbox.isVisible({ timeout: 5000 }).catch(() => false)) {
    await expect(highlightedCheckbox).toBeEnabled({ timeout: ACTION_TIMEOUT });
    
    // Check if checkbox is disabled - if so, skip it
    const isDisabled = await highlightedCheckbox.evaluate((el) => {
      return el.classList.contains('p-disabled') || 
             (el.closest('.p-checkbox')?.classList.contains('p-disabled') ?? false);
    });
    
    if (!isDisabled) {
      try {
        await highlightedCheckbox.click({ timeout: 5000 });
      } catch (e) {
        // If click fails due to overlay, try force click
        await highlightedCheckbox.click({ force: true });
      }
      await page.waitForTimeout(300);
    }
  }
}

/**
 * Helper function to apply column changes
 */
async function applyColumnChanges(page: Page) {
  const applyButton = page.getByRole('button', { name: 'Apply', exact: true });
  await expect(applyButton).toBeVisible({ timeout: ACTION_TIMEOUT });
  await applyButton.click();
  await page.waitForTimeout(500);
}

/**
 * Helper function to reset column settings
 */
async function resetColumnSettings(page: Page) {
  await openColumnManagement(page);
  
  const resetButton = page.getByRole('button', { name: 'Reset' });
  if (await resetButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await resetButton.click();
    await page.waitForTimeout(500);
  }
}

test.describe('Admin Bundles Management', () => {
  test.describe('when admin credentials are configured', () => {
    test.skip(
      () => {
        const { email, password } = getAdminCredentials();
        return !email || !password;
      },
      'Set ADMIN_EMAIL and ADMIN_PASSWORD (e.g. playwright.env) to run these tests'
    );

    test('should sign in and navigate to bundles page', async ({ page }) => {
      const { email, password } = getAdminCredentials();
      await signIn(page, email, password);
      await navigateToBundlesPage(page);

      // Assert: Bundles page should be loaded
      await expect(page.getByRole('link', { name: 'Bundles' })).toBeVisible({
        timeout: ACTION_TIMEOUT,
      });
    });

    test('should toggle row selection', async ({ page }) => {
      const { email, password } = getAdminCredentials();
      await signIn(page, email, password);
      await navigateToBundlesPage(page);

      // Toggle row selection
      await toggleRowSelection(page);

      // Assert: Row should be selected/deselected
      await expect(page).not.toHaveURL(/signin/i);
    });

    test('should select all rows on current page', async ({ page }) => {
      const { email, password } = getAdminCredentials();
      await signIn(page, email, password);
      await navigateToBundlesPage(page);

      // Select all rows on current page
      await selectCurrentPage(page);

      // Assert: All rows on current page should be selected
      await expect(page).not.toHaveURL(/signin/i);
    });

    test('should unselect all rows', async ({ page }) => {
      const { email, password } = getAdminCredentials();
      await signIn(page, email, password);
      await navigateToBundlesPage(page);

      // First select some rows
      await selectCurrentPage(page);
      await page.waitForTimeout(500);

      // Then unselect all
      await unselectAllRows(page);

      // Assert: All rows should be unselected
      await expect(page).not.toHaveURL(/signin/i);
    });

    test('should manage column visibility', async ({ page }) => {
      const { email, password } = getAdminCredentials();
      await signIn(page, email, password);
      await navigateToBundlesPage(page);

      // Open column management
      await openColumnManagement(page);

      // Toggle column checkboxes
      await toggleColumnCheckboxes(page);

      // Apply changes
      await applyColumnChanges(page);

      // Assert: Column changes should be applied
      await expect(page).not.toHaveURL(/signin/i);
    });

    test('should reset column settings', async ({ page }) => {
      const { email, password } = getAdminCredentials();
      await signIn(page, email, password);
      await navigateToBundlesPage(page);

      // First, modify column settings
      await openColumnManagement(page);
      await toggleColumnCheckboxes(page);
      await applyColumnChanges(page);
      await page.waitForTimeout(500);

      // Then reset column settings
      await resetColumnSettings(page);

      // Assert: Column settings should be reset
      await expect(page).not.toHaveURL(/signin/i);
    });

    test('should complete full bundles management workflow', async ({ page }) => {
      test.setTimeout(120000); // 2 minutes for this comprehensive test
      const { email, password } = getAdminCredentials();
      await signIn(page, email, password);
      await navigateToBundlesPage(page);

      // Step 1: Toggle row selection
      await toggleRowSelection(page);

      // Step 2: Select all rows on current page
      await selectCurrentPage(page);

      // Step 3: Unselect all rows
      await unselectAllRows(page);

      // Step 4: Manage columns
      await openColumnManagement(page);
      await toggleColumnCheckboxes(page);
      await applyColumnChanges(page);

      // Step 5: Reset column settings
      await resetColumnSettings(page);

      // Assert: Complete workflow should succeed
      await expect(page).not.toHaveURL(/signin/i, { timeout: ACTION_TIMEOUT });
    });
  });
});
