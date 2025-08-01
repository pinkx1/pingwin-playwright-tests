import { expect, Locator, Page } from '@playwright/test';

export class RegisterPage {
    readonly page: Page;
    readonly dialog: Locator;
    readonly header: Locator;
    readonly emailTab: Locator;
    readonly phoneTab: Locator;
    readonly emailInput: Locator;
    readonly phoneInput: Locator;
    readonly passwordInput: Locator;
    readonly ageCheckbox: Locator;
    readonly termsCheckbox: Locator;
    readonly newsCheckbox: Locator;
    readonly submitButton: Locator;
    readonly closeButton: Locator;
    readonly toastError: Locator;

    constructor(page: Page) {
        this.page = page;
        this.dialog = page.getByRole('dialog');
        this.header = this.dialog.getByText('Регистрация');
        this.emailTab = this.dialog.getByRole('button', { name: 'Почта' });
        this.phoneTab = this.dialog.getByRole('button', { name: 'Телефон' });
        this.emailInput = page.getByPlaceholder('Введите вашу электронную почту');
        this.phoneInput = page.locator('input[name="phone"]');
        this.passwordInput = page.getByPlaceholder('Введите пароль');
        this.ageCheckbox = page.locator('input[name="isLegalAge"]');
        this.termsCheckbox = page.locator('input[name="isTerms"]');
        this.newsCheckbox = page.locator('input[name="isNews"]');
        this.submitButton = page.getByRole('button', { name: 'Продолжить' });
        this.closeButton = this.dialog.locator('img[src*="close-dialog"]');
        this.toastError = page.locator('li[role="status"]');
    }

    async waitForVisible() {
        await expect(this.dialog).toBeVisible();
    }

    async waitForHidden() {
        await expect(this.dialog).toBeHidden();
    }

    async close() {
        await this.closeButton.click();
        await this.waitForHidden();
    }

    async switchToPhone() {
        await this.phoneTab.click();
    }

    async switchToEmail() {
        await this.emailTab.click();
    }

    async fillEmail(email: string) {
        await this.emailInput.fill(email);
    }

    async fillPhone(phone: string) {
        await this.phoneInput.fill(phone);
    }

    async fillPassword(password: string) {
        await this.passwordInput.fill(password);
    }

    async checkAge() {
        await this.ageCheckbox.check();
    }

    async checkTerms() {
        await this.termsCheckbox.check();
    }

    async uncheckNews() {
        if (await this.newsCheckbox.isChecked()) {
            await this.newsCheckbox.uncheck();
        }
    }

    async submit() {
        await this.submitButton.click();
    }
}
