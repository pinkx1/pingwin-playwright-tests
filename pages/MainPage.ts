import { Page } from '@playwright/test';

export class MainPage {
	constructor(private page: Page) { }

	async open() {
		await this.page.goto('/');
	}

	async openLoginModal() {
		await this.page.getByRole('button', { name: 'Войти' }).click();
		await this.page.getByRole('dialog').waitFor({ state: 'visible' });
	}

        async openRegisterModal() {
                await this.page.getByRole('button', { name: 'Регистрация' }).click();
                await this.page.getByRole('dialog').waitFor({ state: 'visible' });
        }

        async openDepositModal() {
                await this.page.getByRole('button', { name: 'Депозит' }).first().click();
                await this.page.getByRole('dialog').waitFor({ state: 'visible' });
        }
}
