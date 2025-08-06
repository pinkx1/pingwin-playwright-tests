import { test as base, expect, Page } from '@playwright/test';
import fs from 'fs';
import { MainPage } from './pages/MainPage';
import { AuthModal } from './pages/AuthModal';
import { withdrawalUser } from './fixtures/userData';

const STORAGE_PATH = './storage/withdrawal-user.json';

base.beforeAll(async ({ browser }) => {
  console.log('[DEBUG] Logging in as withdrawalUser...');
  fs.mkdirSync('./storage', { recursive: true });

  const page = await browser.newPage();
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);

  await mainPage.open();
  await mainPage.openLoginModal();
  await authModal.login(withdrawalUser.email, withdrawalUser.password);

  // Закрываем модалку подтверждения, если есть
  const modalCloseButton = page.locator('img[src*="close-dialog"]');
  if (await modalCloseButton.isVisible()) {
    console.log('[DEBUG] Closing confirmation modal...');
    await modalCloseButton.click();
    await expect(modalCloseButton).toBeHidden({ timeout: 5000 });
  }

  // Переход в профиль
  await page.getByRole('link', { name: /avatar/i }).click();
  await expect(page.getByPlaceholder('Ваша почта')).toHaveValue(withdrawalUser.email);
  console.log('[DEBUG] Logged in as withdrawalUser');

  await page.context().storageState({ path: STORAGE_PATH });
  console.log('[DEBUG] Storage saved to', STORAGE_PATH);

  await page.close();
});

export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: STORAGE_PATH });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
