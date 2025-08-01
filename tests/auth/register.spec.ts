import { test, expect } from '@playwright/test';
import { MainPage } from '../../pages/MainPage';
import { AuthModal } from '../../pages/AuthModal';
import { validUser } from '../../fixtures/userData';

function generateRandomGmail(): string {
	const prefix = Math.random().toString(36).substring(2, 10);
	return `${prefix}@gmail.com`;
}

test('новый пользователь может зарегистрироваться и попасть в профиль', async ({ page }) => {
	const mainPage = new MainPage(page);
	const authModal = new AuthModal(page);
	const email = generateRandomGmail();
	const password = 'TestPassword123!';

	await mainPage.open();

	// Открываем модалку регистрации
	await mainPage.openRegisterModal();

	// Регистрируемся
	await authModal.register(email, password);

	// Явно ждём, пока появится иконка email-confirm модалки (она появляется всегда)
	await page.locator('img[src*="email-spin.svg"]').waitFor({ state: 'visible', timeout: 5000 });

	// Закрываем её, если мешает
	await authModal.closeEmailConfirmationIfVisible();

	// Переходим в профиль
	await page.locator('a[href="/ru/profile"]').click();

	// Проверяем, что email в профиле — тот самый
	const emailInput = page.getByPlaceholder('Ваша почта');
	await expect(emailInput).toHaveValue(email);
});

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

const invalidEmail = 'notanemail';
const shortPassword = '12345';

test('валидация полей регистрации по email', async ({ page }) => {
	const mainPage = new MainPage(page);
	const authModal = new AuthModal(page);

	await mainPage.open();
	await mainPage.openRegisterModal();
	await authModal.switchToRegister();

	await expect(authModal.submitButton).toBeDisabled();
	await authModal.submitButton.click({ force: true });
	await expect(authModal.emailError).toBeVisible();
	await expect(authModal.passwordError).toBeVisible();

	await authModal.passwordInput.fill('Password123');
	await expect(authModal.submitButton).toBeDisabled();
	await expect(authModal.emailError).toBeVisible();

	await authModal.passwordInput.fill('');
	await authModal.emailInput.fill(invalidEmail);
	await expect(authModal.submitButton).toBeDisabled();
	await expect(authModal.emailError).toBeVisible();

	await authModal.emailInput.fill('test@example.com');
	await authModal.passwordInput.fill(shortPassword);
	await expect(authModal.submitButton).toBeDisabled();
	await expect(authModal.passwordError).toBeVisible();
});

test('нельзя зарегистрироваться с уже существующим email', async ({ page }) => {
	const mainPage = new MainPage(page);
	const authModal = new AuthModal(page);

	await mainPage.open();
	await mainPage.openRegisterModal();

	await authModal.register(validUser.email, 'Password123!');

	const errorToast = page.locator('text=Ошибка регистрации');
	await expect(errorToast).toBeVisible();
});
