import { test, expect } from '@playwright/test';
import { acceptCookies, selectVehicle, confirmVehicle, validateVehicleFits } from './utils';

test('Fitment validation on PDP and Cart', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('https://nexustruckupgrades.onechanneladmin.com/', {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  });
  await acceptCookies(page);

  // Navigate to PDP
  await page.goto('https://nexustruckupgrades.onechanneladmin.com/product/12345');

  await selectVehicle(page, '2024', 'Ford', 'F-150');
  await confirmVehicle(page);
  await validateVehicleFits(page);

  // Add to cart
  await page.getByRole('button', { name: 'Add to Cart' }).click();
  console.log('Fitment validation test passed ✅');
});
