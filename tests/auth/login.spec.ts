import { test, expect } from '@playwright/test';
import { MainPage } from '../../pages/MainPage';
import { AuthModal } from '../../pages/AuthModal';
import { validUser, existingPhoneUser } from '../../fixtures/data/userData';

const invalidEmail = 'notanemail';
const nonExistingEmail = `no_user_${Math.random().toString(36).slice(2, 8)}@example.com`;

// ----------------------- Позитивные сценарии -----------------------

// 1. Успешный вход по почте с переходом в профиль
test('user can login with email and access profile', async ({ page }) => {

  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);

  await mainPage.open();
  await mainPage.openLoginModal();
  await authModal.login(validUser.email, validUser.password);
  // Попытка найти хотя бы одно уведомление (без падения, если не нашлось)
  const toastList = page.locator('ol.sc-afd14a6a-1.fJlNeS > li');
  const isToastVisible = await toastList.first().isVisible().catch(() => false);

  // Если есть хотя бы одно — ждём, пока все исчезнут
  if (isToastVisible) {
    await expect(toastList).toHaveCount(0, { timeout: 5000 });
  }


  await page.getByRole('link', { name: /avatar/i }).click({ force: true });
  await page.waitForLoadState('load');
  const emailInput = page.getByPlaceholder('Ваша почта');
  await expect(emailInput).toHaveValue(validUser.email);
});

// 2. Успешный вход по телефону с переходом в профиль
test('user can login with phone and access profile', async ({ page }) => {
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);

  await mainPage.open();
  await mainPage.openLoginModal();
  await authModal.loginByPhone(existingPhoneUser.phone, existingPhoneUser.password);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('a[href="/ru/profile"]');

  await page.getByRole('link', { name: /avatar/i }).click({ force: true });
  await page.waitForLoadState('load');
  const phoneInput = page.locator('#phone-input input[name="phone"]');
  await expect(phoneInput).toHaveValue(existingPhoneUser.phone);
});

// 3. Токен сессии сохраняется после входа
test('session token is stored after login', async ({ page }) => {
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);

  await mainPage.open();
  const before = await page.context().cookies();

  // Убедиться, что cookie sessionId отсутствует до входа или пустая
  const sessionBefore = before.find(c => c.name === 'sessionId');
  expect(sessionBefore?.value ?? '').toBe('');

  await mainPage.openLoginModal();
  await authModal.login(validUser.email, validUser.password);

  await expect
    .poll(async () => {
      const cookies = await page.context().cookies();
      return cookies.find(c => c.name === 'sessionId')?.value;
    })
    .toBeTruthy();
});

// 4. Открытие формы входа меняет URL
test('login modal opens with correct url', async ({ page }) => {
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);

  await mainPage.open();
  await mainPage.openLoginModal();
  // await authModal.waitForVisible();

  await expect(page).toHaveURL(/\/ru\?modal=auth/);
});

// ----------------------- Негативные сценарии -----------------------

// 6. Вход с несуществующим email
test('login fails with non-existing email', async ({ page }) => {
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);

  await mainPage.open();
  await mainPage.openLoginModal();
  await authModal.login(nonExistingEmail, validUser.password);

  const errorToast = page.locator('li[role="status"]');
  await expect(errorToast).toBeVisible();
});

// 7. Вход с неверным паролем
test('login fails with wrong password', async ({ page }) => {
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);

  await mainPage.open();
  await mainPage.openLoginModal();
  await authModal.login(validUser.email, 'WrongPassword123');

  const errorToast = page.locator('li[role="status"]');
  await expect(errorToast).toBeVisible();
});

// 8. Нельзя войти без email
test('cannot login without email', async ({ page }) => {
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);

  await mainPage.open();
  await mainPage.openLoginModal();

  await authModal.passwordInput.fill(validUser.password);
  await authModal.emailInput.focus();
  await authModal.emailInput.blur();

  await expect(authModal.emailError).toBeVisible();
  await expect(authModal.submitButton).toBeDisabled();
});

// 9. Невалидный email отклоняется
test('invalid email is rejected', async ({ page }) => {
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);

  await mainPage.open();
  await mainPage.openLoginModal();

  await authModal.emailInput.fill(invalidEmail);
  await authModal.passwordInput.fill(validUser.password);
  await authModal.emailInput.blur();

  await expect(authModal.emailError).toBeVisible();
  await expect(authModal.submitButton).toBeDisabled();
});

// 10. Нельзя войти по телефону без номера
test('cannot login by phone without phone number', async ({ page }) => {
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);

  await mainPage.open();
  await mainPage.openLoginModal();
  await authModal.switchToPhone();

  await authModal.passwordInput.fill(validUser.password);
  await authModal.phoneInput.focus();
  await authModal.phoneInput.blur();

  await expect(authModal.phoneError).toBeVisible();
  await expect(authModal.submitButton).toBeDisabled();
});
