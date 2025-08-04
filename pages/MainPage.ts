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
                const candidates = [
                        this.page.getByRole('button', { name: 'Депозит' }),
                        this.page.locator('button:has-text("$")'),
                        this.page.locator('img[src="/images/icons/wallet-balance.svg"]'),
                ];

                for (const locator of candidates) {
                        try {
                                await locator.first().click({ timeout: 5000 });
                                await this.page.getByRole('dialog').waitFor({ state: 'visible' });
                                return;
                        } catch {
                                // try next locator
                        }
                }

                throw new Error('Deposit control not found');
       }
}
