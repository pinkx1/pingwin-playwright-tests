import { test as base, expect, Page } from '@playwright/test';
import fs from 'fs';
import { MainPage } from './pages/MainPage';
import { AuthModal } from './pages/AuthModal';
import { validUser } from './fixtures/userData';

const STORAGE_PATH = './storage/user.json';

// Логинимся каждый раз — без if
base.beforeAll(async ({ browser }) => {
  console.log('[DEBUG] Logging in fresh for each run...');
  fs.mkdirSync('./storage', { recursive: true });

  const page = await browser.newPage();
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);

  await mainPage.open();
  await mainPage.openLoginModal();
  await authModal.login(validUser.email, validUser.password);

  // Закрываем подтверждения, если есть
  const modalCloseButton = page.locator('img[src*="close-dialog"]');
  if (await modalCloseButton.isVisible()) {
    console.log('[DEBUG] Closing confirmation modal...');
    await modalCloseButton.click();
    await expect(modalCloseButton).toBeHidden({ timeout: 5000 });
  }

  // Переход в профиль
  await page.getByRole('link', { name: /avatar/i }).click();
  await expect(page.getByPlaceholder('Ваша почта')).toHaveValue(validUser.email);
  console.log('[DEBUG] Logged in successfully');

  // Сохраняем актуальную сессию
  await page.context().storageState({ path: STORAGE_PATH });
  console.log('[DEBUG] Storage saved to', STORAGE_PATH);

  await page.close();
});

// Фикстура с авторизованным контекстом
export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: STORAGE_PATH });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
