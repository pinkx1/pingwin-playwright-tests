import { test, expect } from '@playwright/test';
import { MainPage } from '../../pages/MainPage';
import { AuthModal } from '../../pages/AuthModal';
import { validUser } from '../../fixtures/userData';

test('успешный вход через модалку', async ({ page }) => {
	const mainPage = new MainPage(page);
	const authModal = new AuthModal(page);

	await mainPage.open();
	await mainPage.openLoginModal();

	await authModal.login(validUser.email, validUser.password);
	// 1. Переход в профиль
	await page.getByRole('link', { name: /avatar/i }).click();

	// 2. Проверка, что мы на странице профиля и видим нужную почту
	const emailInput = page.getByPlaceholder('Ваша почта');
	await expect(emailInput).toHaveValue(validUser.email);
});
