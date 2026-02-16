// tests/utils.ts
import { Page, expect, type Locator } from '@playwright/test';

export async function acceptCookies(page: Page) {
  try {
    let frameWithButton: Page | import('@playwright/test').Frame = page;
    for (const frame of page.frames()) {
      const button = frame.locator('button', { hasText: 'Accept All' }).first();
      if ((await button.count()) > 0) {
        frameWithButton = frame;
        break;
      }
    }
    const acceptButton = frameWithButton.locator('button', { hasText: 'Accept All' });
    if ((await acceptButton.count()) > 0) {
      await acceptButton.waitFor({ state: 'visible', timeout: 15000 });
      await acceptButton.click();
    }
  } catch {
    // No cookie banner or already dismissed
  }
}

export async function retryAction(fn: () => Promise<void>, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await fn();
      return;
    } catch (err) {
      if (i === retries - 1) throw err;
      console.warn(`Retry ${i + 1} failed, retrying...`);
    }
  }
}

/** Select option by exact label, or by label matching regex (partial match). */
async function selectOptionByLabel(select: Locator, label: string | RegExp): Promise<void> {
  await expect(select).toBeVisible();
  if (typeof label === 'string') {
    try {
      await select.selectOption({ label });
      return;
    } catch {
      // Fallback: match by option text
    }
  }
  const re = typeof label === 'string' ? new RegExp(`^${escapeRegExp(label)}$`, 'i') : label;
  const options = await select.locator('option').all();
  for (const opt of options) {
    const text = (await opt.textContent())?.trim();
    const val = await opt.getAttribute('value');
    if (text && re.test(text)) {
      await select.selectOption({ value: val ?? text });
      return;
    }
  }
  const available = (await select.locator('option').allTextContents()).map((t) => t.trim()).filter(Boolean);
  throw new Error(`No option matched ${label}. Available: ${available.slice(0, 10).join(', ')}${available.length > 10 ? '...' : ''}`);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Resolve Year/Make/Model comboboxes with name regex or fallback to order (nth). */
function getVehicleCombos(page: Page) {
  const combos = page.getByRole('combobox');
  const byYear = page.getByRole('combobox', { name: /year/i });
  const byMake = page.getByRole('combobox', { name: /make/i });
  const byModel = page.getByRole('combobox', { name: /model/i });
  return {
    year: byYear.count().then((n) => (n > 0 ? byYear.first() : combos.nth(0))),
    make: byMake.count().then((n) => (n > 0 ? byMake.first() : combos.nth(1))),
    model: byModel.count().then((n) => (n > 0 ? byModel.first() : combos.nth(2))),
  };
}

export async function selectVehicle(page: Page, year: string, make: string, model: string) {
  const { year: yearCombo, make: makeCombo, model: modelCombo } = getVehicleCombos(page);
  const yearSelect = await yearCombo;
  const makeSelect = await makeCombo;
  const modelSelect = await modelCombo;

  await yearSelect.waitFor({ state: 'visible', timeout: 30000 });
  await selectOptionByLabel(yearSelect, year);

  // Cascading dropdowns: Make is disabled until Year is selected
  await makeSelect.waitFor({ state: 'visible', timeout: 15000 });
  await expect(makeSelect).toBeEnabled({ timeout: 30000 });
  await selectOptionByLabel(makeSelect, new RegExp(make, 'i'));

  // Model is disabled until Make is selected
  await modelSelect.waitFor({ state: 'visible', timeout: 15000 });
  await expect(modelSelect).toBeEnabled({ timeout: 30000 });
  await selectOptionByLabel(modelSelect, new RegExp(model, 'i'));
}

export async function confirmVehicle(page: Page) {
  const confirmBtn = page.getByRole('button', { name: /Confirm|Apply|Select Vehicle/i }).first();
  await confirmBtn.waitFor({ state: 'visible', timeout: 15000 });
  await confirmBtn.click();
}

export async function validateVehicleFits(page: Page) {
  const warning = page.locator('text=Does not fit');
  if ((await warning.count()) > 0) {
    console.warn('Warning: Vehicle does not fit this product!');
  }
}
