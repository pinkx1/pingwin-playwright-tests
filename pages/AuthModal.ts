import { Page, Locator, expect } from '@playwright/test';

export class AuthModal {
	readonly page: Page;
	readonly dialog: Locator;
	readonly emailInput: Locator;
	readonly passwordInput: Locator;
	readonly submitButton: Locator;
	readonly loginTab: Locator;

	constructor(page: Page) {
		this.page = page;

		this.dialog = page.getByRole('dialog');

		this.emailInput = page.getByPlaceholder('Введите вашу электронную почту');
		this.passwordInput = page.getByPlaceholder('Введите пароль');

		this.submitButton = page.getByRole('button', { name: 'Продолжить' });

		this.loginTab = page.locator('div[role="dialog"] >> text=Войти');
	}

	async waitForVisible() {
		await expect(this.dialog).toBeVisible();
	}

	async login(email: string, password: string) {
		await this.waitForVisible();

		await this.emailInput.fill(email);
		await this.passwordInput.fill(password);

		await expect(this.submitButton).toBeEnabled();
		await this.submitButton.click();
	}
}
