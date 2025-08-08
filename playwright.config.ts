import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  testDir: './tests',
  globalSetup: require.resolve('./global-setup'),
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 4,
  reporter: 'html',

  // ❌ УБРАН глобальный use — он создавал "безымянный" проект

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1800, height: 1200 },
        baseURL: 'https://pingwincasino24.com',
        locale: 'ru',
        trace: 'on-first-retry',
        headless: true,
        ignoreHTTPSErrors: true,
        screenshot: 'only-on-failure',
      },
    },
    // Если понадобится включить webkit:
    // {
    //   name: 'webkit',
    //   use: {
    //     ...devices['Desktop Safari'],
    //     viewport: { width: 1400, height: 800 },
    //     baseURL: 'https://pingwincasino24.com',
    //     locale: 'ru',
    //     trace: 'on-first-retry',
    //     headless: false,
    //     ignoreHTTPSErrors: true,
    //     screenshot: 'only-on-failure',
    //   },
    //   timeout: 180_000,
    //   fullyParallel: false,
    // },
  ],
});
