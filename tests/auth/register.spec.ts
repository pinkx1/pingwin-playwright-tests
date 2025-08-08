import { test, expect } from '@playwright/test';
import { MailSlurp } from 'mailslurp-client';
import { MainPage } from '../../pages/MainPage';
import { AuthModal } from '../../pages/AuthModal';
import { validUser, existingPhoneUser } from '../../fixtures/data/userData';
import { generateAutotestEmail, generateRandomPhone } from '../../fixtures/helpers';

const invalidEmail = 'notanemail';
const sevenCharPassword = '1234567';
const eightCharLetterPassword = '1234567a';
const eightDigitsPassword = '12345678';
const passwordLengthError = 'Пароль должен содержать минимум 8 символов';
const passwordLetterError = 'Пароль должен содержать как минимум одну букву';

async function openRegisterModal(page) {
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);
  await mainPage.open();
  await mainPage.openRegisterModal();
  return authModal;
}

async function setupEmailRegistration(page) {
  const authModal = await openRegisterModal(page);
  await authModal.switchToRegister();
  return authModal;
}

async function setupPhoneRegistration(page) {
  const authModal = await setupEmailRegistration(page);
  await authModal.switchToPhone();
  return authModal;
}

async function checkRequiredCheckboxes(page) {
  await page
    .locator('label', { hasText: 'Мне есть 18 лет' })
    .locator('span')
    .first()
    .click();
  await page
    .locator('label', { hasText: 'Я принимаю Условия и Положения' })
    .locator('span')
    .first()
    .click();
}

// 1. Successful registration
test('new user can register and access profile', async ({ page }) => {
  const authModal = await openRegisterModal(page);
  const email = generateAutotestEmail();
  const password = 'TestPassword123!';

  const [registerResponse] = await Promise.all([
    page.waitForResponse(
      res => res.url().includes('/server/register') && res.status() === 200
    ),
    authModal.register(email, password),
  ]);

  const responseBody = await registerResponse.json();
  expect(
    responseBody,
    'Ожидалось: ответ содержит token, но получили: отсутствует'
  ).toHaveProperty('token');
  expect(
    typeof responseBody.token,
    `Ожидалось: token будет строкой, но получили: ${typeof responseBody.token}`
  ).toBe('string');
  expect(
    responseBody.token.length,
    `Ожидалось: длина token > 10, но получили: ${responseBody.token.length}`
  ).toBeGreaterThan(10);
  expect(
    responseBody,
    `Ожидалось: свойство expired = 31536000, но получили: ${responseBody.expired}`
  ).toHaveProperty('expired', 31536000);

  await page
    .locator('img[src*="email-spin.svg"]')
    .waitFor({ state: 'visible', timeout: 4000 });
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('a[href="/ru/profile"]');

  await authModal.closeEmailConfirmationIfVisible();
  await page.locator('a[href="/ru/profile"]').click({ force: true });
  await page.waitForLoadState('load');

  const emailInput = page.getByPlaceholder('Ваша почта');
  await expect(
    emailInput,
    'Ожидалось: поле email содержит адрес пользователя, но получили: другое значение'
  ).toHaveValue(email);
});

// 2. Successful registration by phone
test('new user can register by phone', async ({ page }) => {
  const authModal = await openRegisterModal(page);
  const phone = generateRandomPhone();
  const password = 'TestPassword123!';

  await authModal.registerByPhone(phone, password);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('a[href="/ru/profile"]');
  await authModal.closeSmsConfirmationIfVisible();
  await page.locator('a[href="/ru/profile"]').click({ force: true });
  await page.locator('a[href="/ru/profile"]').click({ force: true });
  await page.waitForLoadState('load');

  const phoneInput = page.locator('#phone-input input[name="phone"]');
  await expect(
    phoneInput,
    'Ожидалось: поле телефона содержит введенный номер, но получили: другое значение'
  ).toHaveValue(phone);
});

// 3. Password of 8 characters with letters is accepted
test('password of 8 characters with letters is accepted', async ({ page }) => {
  const authModal = await setupEmailRegistration(page);

  await authModal.emailInput.fill('test@example.com');
  await checkRequiredCheckboxes(page);
  await authModal.passwordInput.fill(eightCharLetterPassword);
  await authModal.passwordInput.blur();

  await expect(
    authModal.passwordLengthError,
    'Ожидалось: сообщение о длине пароля скрыто, но получили: видно'
  ).toBeHidden();
  await expect(
    authModal.passwordLetterError,
    'Ожидалось: сообщение о букве в пароле скрыто, но получили: видно'
  ).toBeHidden();
  await expect(
    authModal.submitButton,
    'Ожидалось: кнопка будет активна, но получили: неактивна'
  ).toBeEnabled();
});

// 4. Email confirmation removes confirm button
test('email confirmation removes confirm button', async ({ page }) => {
  const authModal = await openRegisterModal(page);
  const mailslurp = new MailSlurp({ apiKey: process.env.MAILSLURP_API_KEY! });

  const inbox = await mailslurp.inboxController.createInboxWithDefaults();
  const email = inbox.emailAddress as string;
  const password = 'TestPassword123!';

  await authModal.register(email, password);
  await authModal.waitForEmailConfirmation();

  const latestEmail = await mailslurp.waitController.waitForLatestEmail({
    inboxId: inbox.id!,
    timeout: 60000,
    unreadOnly: true,
  });

  const confirmationLinkMatch = latestEmail.body?.match(/https?:\/\/[^\s]+/);
  expect(
    confirmationLinkMatch,
    'Ожидалось: ссылка подтверждения найдена, но получили: не найдена'
  ).not.toBeNull();
  const confirmationLink = confirmationLinkMatch![0];

  await page.goto(confirmationLink);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('a[href="/ru/profile"]');

  await page.locator('a[href="/ru/profile"]').waitFor({ state: 'visible' });
  await page.locator('a[href="/ru/profile"]').click();
  await page.waitForLoadState('domcontentloaded');

  await expect(
    page.getByPlaceholder('Ваша почта'),
    'Ожидалось: поле с email видно, но получили: скрыто'
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Подтвердить' }),
    'Ожидалось: кнопка подтверждения отсутствует, но получили: присутствует'
  ).toHaveCount(0);
});

// 5. Registration with existing email
test('registration with existing email fails', async ({ page }) => {
  const authModal = await openRegisterModal(page);

  await authModal.register(validUser.email, 'Password123!');

  const errorToast = page.locator('li[role="status"]:has-text("Ошибка регистрации")');
  await expect(
    errorToast,
    'Ожидалось: увидеть тост об ошибке регистрации, но получили: не отображается'
  ).toBeVisible();
});

// 6. Registration with existing phone number
test('registration with existing phone fails', async ({ page }) => {
  const authModal = await openRegisterModal(page);

  await authModal.registerByPhone(
    existingPhoneUser.phone,
    existingPhoneUser.password
  );

  const errorToast = page.locator('li[role="status"]:has-text("Ошибка регистрации")');
  await expect(
    errorToast,
    'Ожидалось: увидеть тост об ошибке регистрации, но получили: не отображается'
  ).toBeVisible();
});

// 7. Cannot register without email
test('cannot register without email', async ({ page }) => {
  const authModal = await setupEmailRegistration(page);

  await authModal.passwordInput.fill('Password123!');
  await authModal.emailInput.focus();
  await authModal.emailInput.blur();
  await checkRequiredCheckboxes(page);

  await expect(
    authModal.emailError,
    'Ожидалось: появится ошибка email, но получили: отсутствует'
  ).toBeVisible();
  await expect(
    authModal.submitButton,
    'Ожидалось: кнопка будет неактивна, но получили: активна'
  ).toBeDisabled();
});

// 8. Cannot register without password
test('cannot register without password', async ({ page }) => {
  const authModal = await setupEmailRegistration(page);

  await authModal.emailInput.fill('test@example.com');
  await authModal.passwordInput.focus();
  await authModal.passwordInput.blur();
  await checkRequiredCheckboxes(page);

  await expect(
    authModal.passwordLengthError,
    'Ожидалось: сообщение о длине пароля отображается, но получили: отсутствует'
  ).toHaveText(passwordLengthError);
  await expect(
    authModal.submitButton,
    'Ожидалось: кнопка будет неактивна, но получили: активна'
  ).toBeDisabled();
});

// 9. Cannot register by phone without phone number
test('cannot register by phone without phone number', async ({ page }) => {
  const authModal = await setupPhoneRegistration(page);

  await authModal.passwordInput.fill('Password123!');
  await authModal.phoneInput.focus();
  await authModal.phoneInput.blur();
  await checkRequiredCheckboxes(page);

  await expect(
    authModal.phoneError,
    'Ожидалось: появится ошибка телефона, но получили: отсутствует'
  ).toBeVisible();
  await expect(
    authModal.submitButton,
    'Ожидалось: кнопка будет неактивна, но получили: активна'
  ).toBeDisabled();
});

// 10. Cannot register by phone without password
test('cannot register by phone without password', async ({ page }) => {
  const authModal = await setupPhoneRegistration(page);

  await authModal.phoneInput.fill('+79991234567');
  await authModal.passwordInput.focus();
  await authModal.passwordInput.blur();
  await checkRequiredCheckboxes(page);

  await expect(
    authModal.passwordLengthError,
    'Ожидалось: сообщение о длине пароля отображается, но получили: отсутствует'
  ).toHaveText(passwordLengthError);
  await expect(
    authModal.submitButton,
    'Ожидалось: кнопка будет неактивна, но получили: активна'
  ).toBeDisabled();
});

// 11. Invalid email format
test('invalid email is rejected', async ({ page }) => {
  const authModal = await setupEmailRegistration(page);

  await authModal.emailInput.fill(invalidEmail);
  await authModal.passwordInput.fill('Password123!');
  await checkRequiredCheckboxes(page);
  await authModal.emailInput.blur();

  await expect(
    authModal.emailError,
    'Ожидалось: появится ошибка email, но получили: отсутствует'
  ).toBeVisible();
  await expect(
    authModal.submitButton,
    'Ожидалось: кнопка будет неактивна, но получили: активна'
  ).toBeDisabled();
});

// 12. Password shorter than 8 characters is rejected
test('password shorter than 8 characters is rejected', async ({ page }) => {
  const authModal = await setupEmailRegistration(page);

  await authModal.emailInput.fill('test@example.com');
  await checkRequiredCheckboxes(page);
  await authModal.passwordInput.fill(sevenCharPassword);
  await authModal.passwordInput.blur();

  await expect(
    authModal.passwordLengthError,
    'Ожидалось: сообщение о длине пароля отображается, но получили: отсутствует'
  ).toHaveText(passwordLengthError);
  await expect(
    authModal.submitButton,
    'Ожидалось: кнопка будет неактивна, но получили: активна'
  ).toBeDisabled();
});

// 13. Password of 8 digits without letters is rejected
test('password of 8 digits without letters is rejected', async ({ page }) => {
  const authModal = await setupEmailRegistration(page);

  await authModal.emailInput.fill('test@example.com');
  await checkRequiredCheckboxes(page);
  await authModal.passwordInput.fill(eightDigitsPassword);
  await authModal.passwordInput.blur();

  await expect(
    authModal.passwordLetterError,
    'Ожидалось: сообщение о букве в пароле отображается, но получили: отсутствует'
  ).toHaveText(passwordLetterError);
  await expect(
    authModal.submitButton,
    'Ожидалось: кнопка будет неактивна, но получили: активна'
  ).toBeDisabled();
});

// 14. Registration without agreeing to terms
test('registration without accepting terms is disabled', async ({ page }) => {
  const authModal = await setupEmailRegistration(page);

  await authModal.emailInput.fill('test@example.com');
  await authModal.passwordInput.fill('Password123!');
  await page
    .locator('label', { hasText: 'Мне есть 18 лет' })
    .locator('span')
    .first()
    .click();

  await expect(
    authModal.submitButton,
    'Ожидалось: кнопка будет неактивна, но получили: активна'
  ).toBeDisabled();
});

// 15. Registration without confirming age
test('registration under 18 is disabled', async ({ page }) => {
  const authModal = await setupEmailRegistration(page);

  await authModal.emailInput.fill('test@example.com');
  await authModal.passwordInput.fill('Password123!');
  await page
    .locator('label', { hasText: 'Я принимаю Условия и Положения' })
    .locator('span')
    .first()
    .click();

  await expect(
    authModal.submitButton,
    'Ожидалось: кнопка будет неактивна, но получили: активна'
  ).toBeDisabled();
});

