import { test, expect, type Locator, type Page } from '@playwright/test';

const BASE_URL = 'https://nexustruckupgrades.com';

async function acceptCookiesIfPresent(page: Page) {
  const acceptButton = page.getByRole('button', { name: /accept all/i });
  if (await acceptButton.isVisible().catch(() => false)) {
    await acceptButton.click();
  }
}

async function selectOptionByName(select: Locator, name: string | RegExp) {
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

  const available = (
    await select
      .locator('option')
      .allTextContents()
  )
    .map((t) => t.trim())
    .filter(Boolean);
  throw new Error(
    `No option matched ${name}.\nAvailable options:\n- ${available.join('\n- ')}`,
  );
}

async function getVehicleSelects(page: Page) {
  const combos = page.getByRole('combobox');

  const yearByName = page.getByRole('combobox', { name: /year/i });
  const makeByName = page.getByRole('combobox', { name: /make/i });
  const modelByName = page.getByRole('combobox', { name: /model/i });

  const yearSelect = (await yearByName.count()) > 0 ? yearByName.first() : combos.nth(0);
  const makeSelect = (await makeByName.count()) > 0 ? makeByName.first() : combos.nth(1);
  const modelSelect = (await modelByName.count()) > 0 ? modelByName.first() : combos.nth(2);

  return { yearSelect, makeSelect, modelSelect };
}

test('Select vehicle from Catalog', async ({ page }) => {
  // 1️⃣ Open site & accept cookies (if shown)
  await page.goto(BASE_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  });
  await acceptCookiesIfPresent(page);

  // 2️⃣ Go to Catalog (occasionally covered by overlays, so use a resilient click)
  const catalogLink = page.getByRole('link', { name: /catalog/i });
  await expect(catalogLink).toBeVisible({ timeout: 30_000 });
  await catalogLink.click({ force: true });

  // 3️⃣ Select Year / Make / Model (using resilient selectors)
  const { yearSelect, makeSelect, modelSelect } = await getVehicleSelects(page);

  await expect(yearSelect).toBeEnabled({ timeout: 30_000 });
  await selectOptionByName(yearSelect, '2024');

  await expect(makeSelect).toBeEnabled({ timeout: 30_000 });
  await selectOptionByName(makeSelect, /tesla/i);

  await expect(modelSelect).toBeEnabled({ timeout: 30_000 });
  await selectOptionByName(modelSelect, /cybertruck/i);

  // 4️⃣ Search / Shop for parts (handle slight text variations)
  const searchButton = page
    .getByRole('button', { name: /search parts|shop/i })
    .first();
  await expect(searchButton).toBeVisible({ timeout: 30_000 });
  await searchButton.scrollIntoViewIfNeeded();
  await searchButton.click();

  // 5️⃣ Validate navigation to products / category page
  await expect(page).toHaveURL(/products|category/i);

  console.log('✅ Vehicle selection via Catalog PASSED');
});
