import { test as base, expect, Page } from '@playwright/test';
import fs from 'fs';
import { MainPage } from './pages/MainPage';
import { AuthModal } from './pages/AuthModal';
import { withdrawalUser } from './fixtures/userData';

// Path where we will store the authenticated storage state for withdrawal tests
const STORAGE_PATH = './storage/withdrawal-user.json';

// Perform login once before all tests that require authentication.
// Storage state will be reused for every test via the authenticatedPage fixture.
base.beforeAll(async ({ browser }) => {
  // Skip login if storage already exists to speed up test runs
  if (!fs.existsSync(STORAGE_PATH)) {
    // Ensure storage directory exists
    fs.mkdirSync('./storage', { recursive: true });

    const page = await browser.newPage();
    const mainPage = new MainPage(page);
    const authModal = new AuthModal(page);

    await mainPage.open();
    await mainPage.openLoginModal();
    await authModal.login(withdrawalUser.email, withdrawalUser.password);
    await authModal.closeSmsConfirmationIfVisible();
    await authModal.closeEmailConfirmationIfVisible();

    // Save signed-in state to reuse later
    await page.context().storageState({ path: STORAGE_PATH });
    await page.close();
  }
});

// Extend base test with an authenticatedPage fixture that uses the saved storage state.
// Tests can request this page to run in an already authenticated context.
export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: STORAGE_PATH });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

// Re-export expect for convenience
export { expect } from '@playwright/test';
