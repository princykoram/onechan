// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 90 * 1000, // test timeout (navigation can use longer via page.goto timeout)
  retries: 0,

  reporter: [
    ['html', { open: 'always' }],
    ['list'],
  ],

  projects: [
    {
      name: 'chrome',
      use: {
        baseURL: 'https://nexustruckupgrades.com',
        browserName: 'chromium',
        channel: 'chrome', // Use installed Google Chrome (not Chromium)
        headless: false,
        viewport: { width: 1280, height: 800 },
        actionTimeout: 30 * 1000,
        navigationTimeout: 60 * 1000,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
      },
    },
  ],

  use: {
    baseURL: 'https://nexustruckupgrades.com',
    viewport: { width: 1280, height: 800 },
    actionTimeout: 30 * 1000,
    navigationTimeout: 60 * 1000,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
