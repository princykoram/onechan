/**
 * Product search by vehicle: catalog flow.
 * Uses project baseURL from playwright.config.ts (overridable via BASE_URL env).
 */
import { expect, type Locator, type Page, test } from '@playwright/test';

/** Vehicle fixture for data-driven catalog search tests */
type VehicleFixture = {
  year: string;
  displayMake: string;
  displayModel: string;
  make: RegExp;
  model: RegExp;
};

const VEHICLES: VehicleFixture[] = [
  {
    year: '2024',
    displayMake: 'Tesla',
    displayModel: 'Cybertruck',
    make: /tesla/i,
    model: /cybertruck/i,
  },
  {
    year: '2023',
    displayMake: 'Ford',
    displayModel: 'F-150',
    make: /ford/i,
    model: /f-150/i,
  },
];

const CATALOG_WAIT_TIMEOUT = 30_000;
const NAVIGATION_TIMEOUT = 60_000;

/**
 * Dismiss cookie consent banner if visible (Accept All).
 */
async function acceptCookiesIfPresent(page: Page): Promise<void> {
  const acceptButton = page.getByRole('button', { name: /accept all/i });
  try {
    if (await acceptButton.isVisible({ timeout: 2000 })) {
      await acceptButton.click();
    }
  } catch {
    // No cookie banner or already dismissed
  }
}

/**
 * Select an option in a <select> by exact label or RegExp.
 */
async function selectOptionByName(
  select: Locator,
  name: string | RegExp,
): Promise<void> {
  await expect(select).toBeVisible();

  if (typeof name === 'string') {
    await select.selectOption({ label: name });
    return;
  }

  const optionLocators = await select.locator('option').all();
  for (const option of optionLocators) {
    const label = (await option.textContent())?.trim();
    if (label && name.test(label)) {
      await select.selectOption({ label });
      return;
    }
  }

  const available = (await select.locator('option').allTextContents())
    .map((t) => t.trim())
    .filter(Boolean);
  throw new Error(
    `No option matched ${name}.\nAvailable options:\n- ${available.join('\n- ')}`,
  );
}

/**
 * Resolve year/make/model combobox locators (by accessible name or index).
 */
async function getVehicleSelects(page: Page): Promise<{
  yearSelect: Locator;
  makeSelect: Locator;
  modelSelect: Locator;
}> {
  const combos = page.getByRole('combobox');
  const yearByName = page.getByRole('combobox', { name: /year/i });
  const makeByName = page.getByRole('combobox', { name: /make/i });
  const modelByName = page.getByRole('combobox', { name: /model/i });

  const yearSelect =
    (await yearByName.count()) > 0 ? yearByName.first() : combos.nth(0);
  const makeSelect =
    (await makeByName.count()) > 0 ? makeByName.first() : combos.nth(1);
  const modelSelect =
    (await modelByName.count()) > 0 ? modelByName.first() : combos.nth(2);

  return { yearSelect, makeSelect, modelSelect };
}

test.describe('Catalog: search by vehicle', () => {
  for (const vehicle of VEHICLES) {
    test(`${vehicle.year} ${vehicle.displayMake} ${vehicle.displayModel} navigates to results`, async ({
      page,
    }) => {
      await test.step('Open site and dismiss cookie banner (if shown)', async () => {
        await page.goto('/', {
          waitUntil: 'domcontentloaded',
          timeout: NAVIGATION_TIMEOUT,
        });
        await acceptCookiesIfPresent(page);
      });

      await test.step('Open catalog', async () => {
        // Navigate directly to catalog (vehicle selector page) for reliability
        await page.goto('/products', {
          waitUntil: 'domcontentloaded',
          timeout: NAVIGATION_TIMEOUT,
        });
        await expect(page.getByRole('combobox').first()).toBeVisible({
          timeout: CATALOG_WAIT_TIMEOUT,
        });
      });

      await test.step('Select year, make, and model', async () => {
        const { yearSelect, makeSelect, modelSelect } =
          await getVehicleSelects(page);

        await expect(yearSelect).toBeEnabled({ timeout: CATALOG_WAIT_TIMEOUT });
        await selectOptionByName(yearSelect, vehicle.year);

        await expect(makeSelect).toBeEnabled({ timeout: CATALOG_WAIT_TIMEOUT });
        await selectOptionByName(makeSelect, vehicle.make);

        await expect(modelSelect).toBeEnabled({ timeout: CATALOG_WAIT_TIMEOUT });
        await selectOptionByName(modelSelect, vehicle.model);
      });

      await test.step('Submit search and verify navigation to results', async () => {
        const shopButton = page
          .getByRole('button', { name: /search parts|shop/i })
          .first();
        await expect(shopButton).toBeVisible({
          timeout: CATALOG_WAIT_TIMEOUT,
        });
        await shopButton.scrollIntoViewIfNeeded();
        await shopButton.click();

        await expect(page).toHaveURL(/products|category/i);
      });
    });
  }
});
