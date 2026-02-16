import { test, expect } from '@playwright/test';
import { acceptCookies, selectVehicle, confirmVehicle, validateVehicleFits } from './utils';

test('Guest vehicle selection persists after login', async ({ page }) => {
  await page.goto('https://nexustruckupgrades.com', { waitUntil: 'load', timeout: 60000 });
  await acceptCookies(page);

  // Ensure vehicle selector is in view (hero section may need scroll or panel open)
  const vehicleSection = page.getByRole('combobox').first();
  await vehicleSection.scrollIntoViewIfNeeded({ timeout: 30000 });

  await selectVehicle(page, '2024', 'Ford', 'F-150');
  await confirmVehicle(page);

  // Simulate guest login (replace with real login steps)
  const loginLink = page.getByRole('link', { name: /Log in|Login/i }).first();
  await loginLink.waitFor({ state: 'visible', timeout: 15000 });
  await loginLink.click();

  const emailInput = page.locator('#username, input[name="username"], input[type="email"]').first();
  const passwordInput = page.locator('#password, input[name="password"], input[type="password"]').first();
  await emailInput.waitFor({ state: 'visible', timeout: 10000 });
  await emailInput.fill('guest@example.com');
  await passwordInput.waitFor({ state: 'visible', timeout: 5000 });
  await passwordInput.fill('Password123');

  await page.getByRole('button', { name: /Log in|Login|Sign in/i }).first().click();

  await validateVehicleFits(page);

  console.log('Guest vehicle persists after login ✅');
});
