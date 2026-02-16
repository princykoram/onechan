import { test, expect } from '@playwright/test';
import { VehicleSelector } from '../pages/VehicleSelector.page';

test('vehicle selection works', async ({ page }) => {
  await page.goto('https://your-site-url.com'); // replace with your site

  const vehicle = new VehicleSelector(page);
  await vehicle.selectVehicle('2024', 'BMW', 'X5', '3.0L');

  await expect(page).toHaveURL(/vehicle/); // check URL changed
});
