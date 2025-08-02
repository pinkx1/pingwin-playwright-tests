import { test, expect } from '@playwright/test';
import { MainPage } from '../../pages/MainPage';
import { AuthModal } from '../../pages/AuthModal';
import { validUser, existingPhoneUser } from '../../fixtures/userData';

function generateRandomGmail(): string {
  const prefix = Math.random().toString(36).substring(2, 10);
  return `${prefix}@gmail.com`;
}

function generateRandomPhone(): string {
  const suffix = Math.floor(Math.random() * 90 + 10);
  return `(33)211-39-${suffix}`;
}

const invalidEmail = 'notanemail';
const sevenCharPassword = '1234567';
const eightCharLetterPassword = '1234567a';
const eightDigitsPassword = '12345678';

async function checkRequiredCheckboxes(page) {
  await page.locator('label', { hasText: 'Мне есть 18 лет' }).locator('span').first().click();
  await page.locator('label', { hasText: 'Я принимаю Условия и Положения' }).locator('span').first().click();
}

// 1. Opening registration modal
test('registration modal opens', async ({ page }) => {
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);

  await mainPage.open();
  await mainPage.openRegisterModal();

  await authModal.waitForVisible();
  await expect(authModal.registerTab).toBeVisible();
});

// 2. Closing registration modal
test('registration modal can be closed', async ({ page }) => {
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);

  await mainPage.open();
  await mainPage.openRegisterModal();
  await authModal.waitForVisible();

  await authModal.close();
  await expect(authModal.dialog).toBeHidden();
});

// 3. Presence of all required fields
test('registration form contains all required fields', async ({ page }) => {
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);

  await mainPage.open();
  await mainPage.openRegisterModal();
  await authModal.switchToRegister();

  await expect(authModal.emailInput).toBeVisible();
  await expect(authModal.passwordInput).toBeVisible();
  await expect(authModal.ageCheckbox).toBeVisible();
  await expect(authModal.termsCheckbox).toBeVisible();
  await expect(authModal.newsCheckbox).toBeVisible();

  await authModal.switchToPhone();
  await expect(authModal.phoneInput).toBeVisible();
  await expect(authModal.passwordInput).toBeVisible();
});

// 4. Validation: no email
test('cannot register without email', async ({ page }) => {
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);

  await mainPage.open();
  await mainPage.openRegisterModal();
  await authModal.switchToRegister();

  await authModal.passwordInput.fill('Password123!');
  await authModal.emailInput.focus();
  await authModal.emailInput.blur();
  await checkRequiredCheckboxes(page);

  await expect(authModal.emailError).toBeVisible();
  await expect(authModal.submitButton).toBeDisabled();
});

// 5. Validation: no password
test('cannot register without password', async ({ page }) => {
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);

  await mainPage.open();
  await mainPage.openRegisterModal();
  await authModal.switchToRegister();

  await authModal.emailInput.fill('test@example.com');
  await authModal.passwordInput.focus();
  await authModal.passwordInput.blur();
  await checkRequiredCheckboxes(page);

  await expect(authModal.passwordError).toBeVisible();
  await expect(authModal.submitButton).toBeDisabled();
});

// 6. Validation: phone mode without phone number
test('cannot register by phone without phone number', async ({ page }) => {
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);

  await mainPage.open();
  await mainPage.openRegisterModal();
  await authModal.switchToRegister();
  await authModal.switchToPhone();

  await authModal.passwordInput.fill('Password123!');
  await authModal.phoneInput.focus();
  await authModal.phoneInput.blur();
  await checkRequiredCheckboxes(page);

  await expect(authModal.phoneError).toBeVisible();
  await expect(authModal.submitButton).toBeDisabled();
});

// 7. Validation: phone mode without password
test('cannot register by phone without password', async ({ page }) => {
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);

  await mainPage.open();
  await mainPage.openRegisterModal();
  await authModal.switchToRegister();
  await authModal.switchToPhone();

  await authModal.phoneInput.fill('+79991234567');
  await authModal.passwordInput.focus();
  await authModal.passwordInput.blur();
  await checkRequiredCheckboxes(page);

  await expect(authModal.passwordError).toBeVisible();
  await expect(authModal.submitButton).toBeDisabled();
});

// 8. Validation: invalid email format
test('invalid email is rejected', async ({ page }) => {
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);

  await mainPage.open();
  await mainPage.openRegisterModal();
  await authModal.switchToRegister();

  await authModal.emailInput.fill(invalidEmail);
  await authModal.passwordInput.fill('Password123!');
  await checkRequiredCheckboxes(page);
  await authModal.emailInput.blur();

  await expect(authModal.emailError).toBeVisible();
  await expect(authModal.submitButton).toBeDisabled();
});

// 9. Password validation rules
test('password validation enforces length and character requirements', async ({ page }) => {
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);

  await mainPage.open();
  await mainPage.openRegisterModal();
  await authModal.switchToRegister();

  await authModal.emailInput.fill('test@example.com');
  await checkRequiredCheckboxes(page);

  await test.step('rejects passwords shorter than 8 characters', async () => {
    await authModal.passwordInput.fill(sevenCharPassword);
    await authModal.passwordInput.blur();
    await expect(authModal.passwordError).toBeVisible();
    await expect(authModal.submitButton).toBeDisabled();
  });

  await test.step('accepts passwords of 8 characters with letters', async () => {
    await authModal.passwordInput.fill(eightCharLetterPassword);
    await authModal.passwordInput.blur();
    await expect(authModal.passwordError).toBeHidden();
    await expect(authModal.submitButton).toBeEnabled();
  });

  await test.step('rejects passwords of 8 digits without letters', async () => {
    await authModal.passwordInput.fill(eightDigitsPassword);
    await authModal.passwordInput.blur();
    await expect(authModal.passwordError).toBeVisible();
    await expect(authModal.submitButton).toBeDisabled();
  });
});

// 10. Successful registration
test('new user can register and access profile', async ({ page }) => {
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);
  const email = generateRandomGmail();
  const password = 'TestPassword123!';

  await mainPage.open();
  await mainPage.openRegisterModal();
  await authModal.register(email, password);

  await page.locator('img[src*="email-spin.svg"]').waitFor({ state: 'visible', timeout: 5000 });
  await authModal.closeEmailConfirmationIfVisible();
  await page.locator('a[href="/ru/profile"]').click();

  const emailInput = page.getByPlaceholder('Ваша почта');
  await expect(emailInput).toHaveValue(email);
});

// 11. Successful registration by phone
test('new user can register by phone', async ({ page }) => {
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);
  const phone = generateRandomPhone();
  const password = 'TestPassword123!';

  await mainPage.open();
  await mainPage.openRegisterModal();
  await authModal.registerByPhone(phone, password);

  const closeIcon = page.locator('img[src*="close-dialog"]');
  await closeIcon.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  if (await closeIcon.isVisible()) {
    await closeIcon.click();
  }

  await page.locator('a[href="/ru/profile"]').click();

  const phoneInput = page.getByPlaceholder(/телефон/i);
  await expect(phoneInput).toHaveValue(phone);
});

// 12. Registration with existing email
test('registration with existing email fails', async ({ page }) => {
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);

  await mainPage.open();
  await mainPage.openRegisterModal();
  await authModal.register(validUser.email, 'Password123!');

  const errorToast = page.locator('li[role="status"]:has-text("Ошибка регистрации")');
  await expect(errorToast).toBeVisible();
});

// 13. Registration with existing phone number
test('registration with existing phone fails', async ({ page }) => {
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);

  await mainPage.open();
  await mainPage.openRegisterModal();
  await authModal.registerByPhone(existingPhoneUser.phone, existingPhoneUser.password);

  const errorToast = page.locator('li[role="status"]:has-text("Ошибка регистрации")');
  await expect(errorToast).toBeVisible();
});

// 14. Registration without agreeing to terms
test('registration without accepting terms is disabled', async ({ page }) => {
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);

  await mainPage.open();
  await mainPage.openRegisterModal();
  await authModal.switchToRegister();

  await authModal.emailInput.fill('test@example.com');
  await authModal.passwordInput.fill('Password123!');
  await page.locator('label', { hasText: 'Мне есть 18 лет' }).locator('span').first().click();

  await expect(authModal.submitButton).toBeDisabled();
});

// 15. Registration without confirming age
test('registration under 18 is disabled', async ({ page }) => {
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);

  await mainPage.open();
  await mainPage.openRegisterModal();
  await authModal.switchToRegister();

  await authModal.emailInput.fill('test@example.com');
  await authModal.passwordInput.fill('Password123!');
  await page.locator('label', { hasText: 'Я принимаю Условия и Положения' }).locator('span').first().click();

  await expect(authModal.submitButton).toBeDisabled();
});
