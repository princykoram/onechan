import { test } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'https://nexustruckupgrades.onechanneladmin.com';
const NAV_TIMEOUT = 60_000;

// Use domcontentloaded only – never 'networkidle' (often never fires on busy sites and causes timeouts).
test.setTimeout(90_000);

test('vehicle selector: accept cookies, open Catalog, select year', async ({ page }) => {
  await page.goto(BASE_URL, {
    waitUntil: 'domcontentloaded', // avoid 'networkidle' – often never fires on busy sites
    timeout: NAV_TIMEOUT,
  });

  const acceptButton = page.getByRole('button', { name: 'Accept All' });
  await acceptButton.waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
  if (await acceptButton.isVisible()) {
    await acceptButton.click();
  }

  await page.getByRole('link', { name: 'Catalog' }).click();
  await page.getByRole('combobox').first().selectOption('2024');
});
