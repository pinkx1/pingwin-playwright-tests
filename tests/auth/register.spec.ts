import { test, expect } from '@playwright/test';
import { MainPage } from '../../pages/MainPage';
import { AuthModal } from '../../pages/AuthModal';

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
