import { test, expect } from '@playwright/test';
import { MainPage } from '../../pages/MainPage';
import { AuthModal } from '../../pages/AuthModal';

// Проверяем открытие и закрытие модалки регистрации

test('открытие и закрытие модалки регистрации', async ({ page }) => {
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);

  await mainPage.open();
  await mainPage.openRegisterModal();
  await authModal.waitForVisible();

  await expect(authModal.registerTab).toBeVisible();
  await expect(authModal.emailInput).toBeVisible();

  await authModal.close();
  await expect(authModal.dialog).toBeHidden();
});

// Проверяем переключение на регистрацию по телефону

test('переключение на регистрацию по телефону', async ({ page }) => {
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);

  await mainPage.open();
  await mainPage.openRegisterModal();
  await authModal.waitForVisible();

  await authModal.switchToPhoneMethod();
  await expect(authModal.phoneInput).toBeVisible();
});
