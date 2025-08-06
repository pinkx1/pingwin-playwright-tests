import { Page } from '@playwright/test';

export class MainPage {
        constructor(private page: Page, private baseURL: string = '/') { }

        async open() {
                await this.page.goto(this.baseURL); // теперь работает и с полным урлом
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
                const button = this.page.locator('img[src="/images/icons/wallet-balance.svg"]');
                await button.waitFor({ state: 'visible', timeout: 5000 });
                await button.click();

                await this.page.getByRole('dialog').waitFor({ state: 'visible', timeout: 5000 });
        }

}
