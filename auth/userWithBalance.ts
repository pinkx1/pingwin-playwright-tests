import { test as base, expect, Page } from '@playwright/test';
import path from 'path';

const STORAGE_PATH = path.join(__dirname, '../storage/balance-user.json');

export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: STORAGE_PATH });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect };
