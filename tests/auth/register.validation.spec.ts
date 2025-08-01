import { test, expect } from '@playwright/test';
import { MainPage } from '../../pages/MainPage';
import { AuthModal } from '../../pages/AuthModal';
import { validUser } from '../../fixtures/userData';

function randomEmail() {
  const prefix = Math.random().toString(36).slice(2, 10);
  return `${prefix}@gmail.com`;
}

const shortPassword = '123';
const validPassword = 'TestPassword123!';

// Проверка обязательных полей и базовой валидации

test('валидация обязательных полей', async ({ page }) => {
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);
  await mainPage.open();
  await mainPage.openRegisterModal();
  await authModal.waitForVisible();

  // Кнопка должна быть неактивна при пустых полях
  await expect(authModal.submitButton).toBeDisabled();

  // Заполним только пароль
  await authModal.passwordInput.fill(validPassword);
  await expect(authModal.submitButton).toBeDisabled();

  // Заполним только email
  await authModal.passwordInput.fill('');
  await authModal.emailInput.fill(randomEmail());
  await expect(authModal.submitButton).toBeDisabled();
});

// Проверка невалидных значений и дублирующейся почты

test('валидация некорректных значений и повторяющегося email', async ({ page }) => {
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);
  await mainPage.open();
  await mainPage.openRegisterModal();
  await authModal.waitForVisible();

  await authModal.emailInput.fill('not-an-email');
  await authModal.passwordInput.fill(shortPassword);
  await expect(authModal.submitButton).toBeDisabled();

  // Используем уже зарегистрированный email
  await authModal.emailInput.fill(validUser.email);
  await authModal.passwordInput.fill(validPassword);
  await authModal.ageCheckbox.check();
  await authModal.termsCheckbox.check();
  await expect(authModal.submitButton).toBeEnabled();
  await authModal.submitButton.click();

  await expect(authModal.toastError).toBeVisible();
});
