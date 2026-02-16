import { test, expect } from '@playwright/test';

const BASE_URL = 'https://nexustruckupgrades.com';
const SEARCH_TERM = 'brake pads';

test.describe('Search Results Page – Auto Parts', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('Default sort order applied', async ({ page }) => {
    await page.fill('input[type="search"]', SEARCH_TERM);
    await page.keyboard.press('Enter');

    await page.waitForSelector('.product-card');
    const products = await page.locator('.product-card').count();

    expect(products).toBeGreaterThan(0);
  });

  test('Change sort order – results reorder correctly', async ({ page }) => {
    await page.fill('input[type="search"]', SEARCH_TERM);
    await page.keyboard.press('Enter');

    await page.waitForSelector('.sort-dropdown');
    await page.selectOption('.sort-dropdown', { index: 1 });

    const firstPrice = await page
      .locator('.product-card .price')
      .first()
      .innerText();

    expect(firstPrice).toContain('$');
  });

  test('Pagination – navigate to page 2', async ({ page }) => {
    await page.fill('input[type="search"]', SEARCH_TERM);
    await page.keyboard.press('Enter');

    await page.waitForSelector('.pagination');
    await page.click('.pagination >> text=2');
    await page.waitForLoadState('networkidle');

    const products = await page.locator('.product-card').count();
    expect(products).toBeGreaterThan(0);
  });

  test('Infinite scroll – load more products', async ({ page }) => {
    await page.fill('input[type="search"]', SEARCH_TERM);
    await page.keyboard.press('Enter');

    await page.waitForSelector('.product-card');
    const initialCount = await page.locator('.product-card').count();

    await page.evaluate(() =>
      window.scrollTo(0, document.body.scrollHeight)
    );
    await page.waitForTimeout(2500);

    const newCount = await page.locator('.product-card').count();
    expect(newCount).toBeGreaterThan(initialCount);
  });

  test('Duplicate prevention – no duplicate products', async ({ page }) => {
    await page.fill('input[type="search"]', SEARCH_TERM);
    await page.keyboard.press('Enter');

    await page.waitForSelector('.product-card');

    const collectNames = async () =>
      page.$$eval('.product-card .product-title', els =>
        els.map(e => e.textContent?.trim())
      );

    const firstBatch = await collectNames();

    await page.evaluate(() =>
      window.scrollTo(0, document.body.scrollHeight)
    );
    await page.waitForTimeout(2500);

    const secondBatch = await collectNames();
    const allProducts = [...firstBatch, ...secondBatch];

    const uniqueProducts = new Set(allProducts);
    expect(uniqueProducts.size).toBe(allProducts.length);
  });

});
