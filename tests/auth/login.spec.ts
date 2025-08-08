import { test, expect } from '@playwright/test';
import { MainPage } from '../../pages/MainPage';
import { AuthModal } from '../../pages/AuthModal';
import { validUser, existingPhoneUser } from '../../fixtures/data/userData';

const invalidEmail = 'notanemail';
const nonExistingEmail = `no_user_${Math.random().toString(36).slice(2, 8)}@example.com`;

// ----------------------- Позитивные сценарии -----------------------

test('Успешный вход по почте с переходом в профиль', async ({ page }) => {
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);

  await mainPage.open();
  await mainPage.openLoginModal();
  await authModal.login(validUser.email, validUser.password);

  const toastList = page.locator('ol.sc-afd14a6a-1.fJlNeS > li');
  const isToastVisible = await toastList.first().isVisible().catch(() => false);

  if (isToastVisible) {
    await expect(toastList, 'Ожидалось: уведомления исчезнут, но они остались на странице.')
      .toHaveCount(0, { timeout: 5000 });
  }

  await page.getByRole('link', { name: /avatar/i }).click({ force: true });
  await page.waitForLoadState('load');

  const emailInput = page.getByPlaceholder('Ваша почта');
  const actualEmail = await emailInput.inputValue();
  await expect(emailInput, `Ожидалось: ${validUser.email}, но получили: ${actualEmail}`)
    .toHaveValue(validUser.email);
});

test('Успешный вход по телефону с переходом в профиль', async ({ page }) => {
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
  const actualPhone = await phoneInput.inputValue();
  await expect(phoneInput, `Ожидалось: ${existingPhoneUser.phone}, но получили: ${actualPhone}`)
    .toHaveValue(existingPhoneUser.phone);
});

test('Токен сессии сохраняется после входа', async ({ page }) => {
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);

  await mainPage.open();
  const before = await page.context().cookies();
  const sessionBefore = before.find(c => c.name === 'sessionId');
  const actualBefore = sessionBefore?.value ?? '';

  expect(actualBefore, `Ожидалось: пустой sessionId до входа, но получили: ${actualBefore}`)
    .toBe('');

  await mainPage.openLoginModal();
  await authModal.login(validUser.email, validUser.password);

  await expect
    .poll(async () => {
      const cookies = await page.context().cookies();
      return cookies.find(c => c.name === 'sessionId')?.value;
    }, {
      message: 'Ожидалось: sessionId будет установлен после входа, но он отсутствует или пуст.'
    })
    .toBeTruthy();
});

test('Открытие формы входа меняет URL', async ({ page }) => {
  const mainPage = new MainPage(page);
  await mainPage.open();
  await mainPage.openLoginModal();

  const actualUrl = page.url();
  await expect(page, `Ожидалось: URL содержит "/ru?modal=auth", но получили: ${actualUrl}`)
    .toHaveURL(/\/ru\?modal=auth/);
});

// ----------------------- Негативные сценарии -----------------------

test('Вход с несуществующим email', async ({ page }) => {
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);

  await mainPage.open();
  await mainPage.openLoginModal();
  await authModal.login(nonExistingEmail, validUser.password);

  const errorToast = page.locator('li[role="status"]');
  const visible = await errorToast.isVisible().catch(() => false);
  await expect(errorToast, `Ожидалось: уведомление об ошибке будет видно, но получили: ${visible ? 'видно' : 'не видно'}`)
    .toBeVisible();
});

test('Вход с неверным паролем', async ({ page }) => {
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);

  await mainPage.open();
  await mainPage.openLoginModal();
  await authModal.login(validUser.email, 'WrongPassword123');

  const errorToast = page.locator('li[role="status"]');
  const visible = await errorToast.isVisible().catch(() => false);
  await expect(errorToast, `Ожидалось: уведомление об ошибке будет видно, но получили: ${visible ? 'видно' : 'не видно'}`)
    .toBeVisible();
});

test('Нельзя войти без email', async ({ page }) => {
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);

  await mainPage.open();
  await mainPage.openLoginModal();

  await authModal.passwordInput.fill(validUser.password);
  await authModal.emailInput.focus();
  await authModal.emailInput.blur();

  const isErrorVisible = await authModal.emailError.isVisible();
  await expect(authModal.emailError, `Ожидалось: ошибка email будет видна, но получили: ${isErrorVisible ? 'видна' : 'не видна'}`)
    .toBeVisible();

  const isDisabled = await authModal.submitButton.isDisabled();
  await expect(authModal.submitButton, `Ожидалось: кнопка будет неактивна, но получили: ${isDisabled ? 'неактивна' : 'активна'}`)
    .toBeDisabled();
});

test('Невалидный email отклоняется', async ({ page }) => {
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);

  await mainPage.open();
  await mainPage.openLoginModal();

  await authModal.emailInput.fill(invalidEmail);
  await authModal.passwordInput.fill(validUser.password);
  await authModal.emailInput.blur();

  const isErrorVisible = await authModal.emailError.isVisible();
  await expect(authModal.emailError, `Ожидалось: ошибка email будет видна, но получили: ${isErrorVisible ? 'видна' : 'не видна'}`)
    .toBeVisible();

  const isDisabled = await authModal.submitButton.isDisabled();
  await expect(authModal.submitButton, `Ожидалось: кнопка будет неактивна, но получили: ${isDisabled ? 'неактивна' : 'активна'}`)
    .toBeDisabled();
});

test('Нельзя войти по телефону без номера', async ({ page }) => {
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);

  await mainPage.open();
  await mainPage.openLoginModal();
  await authModal.switchToPhone();

  await authModal.passwordInput.fill(validUser.password);
  await authModal.phoneInput.focus();
  await authModal.phoneInput.blur();

  const isErrorVisible = await authModal.phoneError.isVisible();
  await expect(authModal.phoneError, `Ожидалось: ошибка номера будет видна, но получили: ${isErrorVisible ? 'видна' : 'не видна'}`)
    .toBeVisible();

  const isDisabled = await authModal.submitButton.isDisabled();
  await expect(authModal.submitButton, `Ожидалось: кнопка будет неактивна, но получили: ${isDisabled ? 'неактивна' : 'активна'}`)
    .toBeDisabled();
});
