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
                const depositButton = this.page.locator('button:has-text("Депозит")').first();
                if (await depositButton.isVisible()) {
                        await depositButton.click();
                } else {
                        const dollarButton = this.page.locator('button:has-text("$")').first();
                        if (await dollarButton.isVisible()) {
                                await dollarButton.click();
                        } else {
                                const walletIcon = this.page.locator('img[src="/images/icons/wallet-balance.svg"]').first();
                                if (await walletIcon.isVisible()) {
                                        await walletIcon.click();
                                } else {
                                        throw new Error('Deposit control not found');
                                }
                        }
                }
                await this.page.getByRole('dialog').waitFor({ state: 'visible' });
        }
}
