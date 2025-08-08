import { test, expect, Page, Locator } from '@playwright/test';
import { MainPage } from '../../pages/MainPage';
import { AuthModal } from '../../pages/AuthModal';
import { validUser, existingPhoneUser } from '../../fixtures/data/userData';

const invalidEmail = 'notanemail';
const nonExistingEmail = `no_user_${Math.random().toString(36).slice(2, 8)}@example.com`;

// ----------------------- Утилиты -----------------------

const checkInputValue = async (locator: Locator, expected: string) => {
  const actual = await locator.inputValue();
  await expect(locator, `Ожидалось: ${expected}, но получили: ${actual}`).toHaveValue(expected);
};

const checkErrorVisible = async (locator: Locator, label: string) => {
  const isVisible = await locator.isVisible();
  await expect(locator, `Ожидалось: ошибка ${label} будет видна, но получили: ${isVisible ? 'видна' : 'не видна'}`).toBeVisible();
};

const checkButtonDisabled = async (locator: Locator) => {
  const isDisabled = await locator.isDisabled();
  await expect(locator, `Ожидалось: кнопка будет неактивна, но получили: ${isDisabled ? 'неактивна' : 'активна'}`).toBeDisabled();
};

const checkToastGone = async (page: Page) => {
  const toastList = page.locator('ol.sc-afd14a6a-1.fJlNeS > li');
  const isVisible = await toastList.first().isVisible().catch(() => false);
  if (isVisible) {
    await expect(toastList, 'Ожидалось: уведомления исчезнут, но они остались на странице.').toHaveCount(0, { timeout: 5000 });
  }
};

const checkToastVisible = async (locator: Locator) => {
  const isVisible = await locator.isVisible().catch(() => false);
  await expect(locator, `Ожидалось: уведомление об ошибке будет видно, но получили: ${isVisible ? 'видно' : 'не видно'}`).toBeVisible();
};

const prepare = async (page: Page) => {
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);
  await mainPage.open();
  await mainPage.openLoginModal();
  return authModal;
};

// ----------------------- Позитивные сценарии -----------------------

test('Успешный вход по почте с переходом в профиль', async ({ page }) => {
  const authModal = await prepare(page);
  await authModal.login(validUser.email, validUser.password);
  await checkToastGone(page);

  await page.getByRole('link', { name: /avatar/i }).click({ force: true });
  await page.waitForLoadState('load');
  await checkInputValue(page.getByPlaceholder('Ваша почта'), validUser.email);
});

test('Успешный вход по телефону с переходом в профиль', async ({ page }) => {
  const authModal = await prepare(page);
  await authModal.loginByPhone(existingPhoneUser.phone, existingPhoneUser.password);

  await page.waitForSelector('a[href="/ru/profile"]');
  await page.getByRole('link', { name: /avatar/i }).click({ force: true });
  await page.waitForLoadState('load');
  await checkInputValue(page.locator('#phone-input input[name="phone"]'), existingPhoneUser.phone);
});

test('Токен сессии сохраняется после входа', async ({ page }) => {
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);

  await mainPage.open();
  const before = await page.context().cookies();
  const sessionBefore = before.find(c => c.name === 'sessionId')?.value ?? '';
  expect(sessionBefore, `Ожидалось: пустой sessionId до входа, но получили: ${sessionBefore}`).toBe('');

  await mainPage.openLoginModal();
  await authModal.login(validUser.email, validUser.password);

  await expect.poll(async () => {
    const cookies = await page.context().cookies();
    return cookies.find(c => c.name === 'sessionId')?.value;
  }, {
    message: 'Ожидалось: sessionId будет установлен после входа, но он отсутствует или пуст.',
  }).toBeTruthy();
});

test('Открытие формы входа меняет URL', async ({ page }) => {
  const mainPage = new MainPage(page);
  await mainPage.open();
  await mainPage.openLoginModal();

  const url = page.url();
  await expect(page, `Ожидалось: URL содержит "/ru?modal=auth", но получили: ${url}`)
    .toHaveURL(/\/ru\?modal=auth/);
});

// ----------------------- Негативные сценарии -----------------------

test('Вход с несуществующим email', async ({ page }) => {
  const authModal = await prepare(page);
  await authModal.login(nonExistingEmail, validUser.password);

  await checkToastVisible(page.locator('li[role="status"]'));
});

test('Вход с неверным паролем', async ({ page }) => {
  const authModal = await prepare(page);
  await authModal.login(validUser.email, 'WrongPassword123');

  await checkToastVisible(page.locator('li[role="status"]'));
});

test('Нельзя войти без email', async ({ page }) => {
  const authModal = await prepare(page);

  await authModal.passwordInput.fill(validUser.password);
  await authModal.emailInput.focus();
  await authModal.emailInput.blur();

  await checkErrorVisible(authModal.emailError, 'email');
  await checkButtonDisabled(authModal.submitButton);
});

test('Невалидный email отклоняется', async ({ page }) => {
  const authModal = await prepare(page);

  await authModal.emailInput.fill(invalidEmail);
  await authModal.passwordInput.fill(validUser.password);
  await authModal.emailInput.blur();

  await checkErrorVisible(authModal.emailError, 'email');
  await checkButtonDisabled(authModal.submitButton);
});

test('Нельзя войти по телефону без номера', async ({ page }) => {
  const authModal = await prepare(page);
  await authModal.switchToPhone();

  await authModal.passwordInput.fill(validUser.password);
  await authModal.phoneInput.focus();
  await authModal.phoneInput.blur();

  await checkErrorVisible(authModal.phoneError, 'номера');
  await checkButtonDisabled(authModal.submitButton);
});
