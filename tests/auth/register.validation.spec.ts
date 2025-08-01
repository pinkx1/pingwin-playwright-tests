import { test, expect } from '@playwright/test';
import { MainPage } from '../../pages/MainPage';
import { AuthModal } from '../../pages/AuthModal';
import { validUser } from '../../fixtures/userData';

const invalidEmail = 'notanemail';
const shortPassword = '12345';

// Validation checks for registration form

test('валидация полей регистрации по email', async ({ page }) => {
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);

  await mainPage.open();
  await mainPage.openRegisterModal();
  await authModal.switchToRegister();

  // Пустые поля
  await expect(authModal.submitButton).toBeDisabled();
  await authModal.submitButton.click({ force: true });
  await expect(authModal.emailError).toBeVisible();
  await expect(authModal.passwordError).toBeVisible();

  // Только пароль
  await authModal.passwordInput.fill('Password123');
  await expect(authModal.submitButton).toBeDisabled();
  await expect(authModal.emailError).toBeVisible();

  // Только email
  await authModal.passwordInput.fill('');
  await authModal.emailInput.fill(invalidEmail);
  await expect(authModal.submitButton).toBeDisabled();
  await expect(authModal.emailError).toBeVisible();

  // Невалидный пароль
  await authModal.emailInput.fill('test@example.com');
  await authModal.passwordInput.fill(shortPassword);
  await expect(authModal.submitButton).toBeDisabled();
  await expect(authModal.passwordError).toBeVisible();
});

// Existing email

test('нельзя зарегистрироваться с уже существующим email', async ({ page }) => {
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);

  await mainPage.open();
  await mainPage.openRegisterModal();

  await authModal.register(validUser.email, 'Password123!');

  const errorToast = page.locator('text=Ошибка регистрации');
  await expect(errorToast).toBeVisible();
});
