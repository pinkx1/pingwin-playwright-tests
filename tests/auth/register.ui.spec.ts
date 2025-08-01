import { test, expect } from '@playwright/test';
import { MainPage } from '../../pages/MainPage';
import { AuthModal } from '../../pages/AuthModal';

// Test opening and closing of the registration modal

test('модалка регистрации открывается по кнопке и закрывается', async ({ page }) => {
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);

  await mainPage.open();
  await mainPage.openRegisterModal();

  await authModal.waitForVisible();
  await expect(authModal.registerTab).toBeVisible();
  await expect(await authModal.isEmailRegistrationSelected()).toBe(true);

  await authModal.close();
  await expect(authModal.dialog).toBeHidden();
});
