import { test, expect } from '@playwright/test';
import { acceptCookies, selectVehicle, confirmVehicle, validateVehicleFits } from './utils';

test('Select vehicle from PDP and update pricing', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('https://nexustruckupgrades.onechanneladmin.com/', {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  });
  await acceptCookies(page);

  // Navigate to a product page (replace with real PDP URL)
  await page.goto('https://nexustruckupgrades.onechanneladmin.com/product/12345');

  await selectVehicle(page, '2024', 'Ford', 'F-150');
  await confirmVehicle(page);
  await validateVehicleFits(page);

  const price = page.locator('.product-price');
  expect(await price.isVisible()).toBeTruthy();

  console.log('PDP vehicle selection passed ✅');
});
