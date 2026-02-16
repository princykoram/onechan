import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://admin.onechanneladmin.com/signin?returnUrl=%2F');
  await page.getByRole('textbox', { name: 'Email address' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('princy@onechanneladmin.com');
  await page.locator('input[name="password"]').click();
  await page.locator('input[name="password"]').fill('beR60ElTpm0?YbW');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('button', { name: 'Channel' }).click();
  await page.getByRole('link', { name: 'Product Match' }).click();
  await page.getByRole('button').filter({ hasText: /^$/ }).nth(1).click();
  await page.getByRole('option', { name: 'All Matched Items' }).click();
  await page.getByRole('button').filter({ hasText: /^$/ }).nth(1).click();
  await page.getByRole('option', { name: 'Not matched Items' }).click();
  await page.getByRole('button').filter({ hasText: /^$/ }).nth(1).click();
  await page.getByRole('option', { name: 'Not Select' }).click();
  await page.getByRole('button').filter({ hasText: /^$/ }).nth(1).click();
  await page.getByRole('option', { name: 'All Items' }).click();
  page.once('dialog', dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.getByRole('button', { name: ' Save all' }).click();
  await page.goto('https://admin.onechanneladmin.com/channel/Amazon-compare');
});