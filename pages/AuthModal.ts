import { Page, Locator, expect } from '@playwright/test';

export class AuthModal {
	readonly page: Page;

	readonly dialog: Locator;
	readonly loginTab: Locator;
	readonly registerTab: Locator;

        readonly emailInput: Locator;
        readonly phoneInput: Locator;
        readonly passwordInput: Locator;
        readonly submitButton: Locator;

        readonly emailMethodButton: Locator;
        readonly phoneMethodButton: Locator;
        readonly closeButton: Locator;

	readonly ageCheckbox: Locator;
	readonly termsCheckbox: Locator;
	readonly newsCheckbox: Locator;

	constructor(page: Page) {
		this.page = page;

		this.dialog = page.getByRole('dialog');

		this.loginTab = page.locator('div[role="dialog"] >> text=Войти');
		this.registerTab = page.locator('div[role="dialog"] >> text=Регистрация');

                this.emailInput = page.getByPlaceholder('Введите вашу электронную почту');
                this.phoneInput = page.locator('input[name="phone"]');
                this.passwordInput = page.getByPlaceholder('Введите пароль');

                this.submitButton = page.getByRole('button', { name: 'Продолжить' });

                this.emailMethodButton = page.getByRole('button', { name: 'Почта' });
                this.phoneMethodButton = page.getByRole('button', { name: 'Телефон' });
                this.closeButton = page.locator('img[src*="close-dialog"]');

                this.ageCheckbox = page.locator('input[name="isLegalAge"]');
                this.termsCheckbox = page.locator('input[name="isTerms"]');
                this.newsCheckbox = page.locator('input[name="isNews"]');
	}

	async waitForVisible() {
		await expect(this.dialog).toBeVisible();
	}

        async switchToRegister() {
                await this.registerTab.click();
        }

        async switchToEmailMethod() {
                await this.emailMethodButton.click();
        }

        async switchToPhoneMethod() {
                await this.phoneMethodButton.click();
        }

        async switchToLogin() {
                await this.loginTab.click();
        }

        async login(email: string, password: string) {
                await this.waitForVisible();
                await this.switchToLogin();

		await this.emailInput.fill(email);
		await this.passwordInput.fill(password);

		await expect(this.submitButton).toBeEnabled();
                await this.submitButton.click();
        }

        async close() {
                await this.closeButton.click();
                await expect(this.dialog).toBeHidden();
        }

        async register(email: string, password: string) {
                await this.waitForVisible();
                await this.switchToRegister();

                await this.switchToEmailMethod();

		await this.emailInput.fill(email);
		await this.passwordInput.fill(password);

		// Чекбокс: Мне есть 18 лет
		await this.page.locator('label', { hasText: 'Мне есть 18 лет' }).locator('span').first().click();

		// Чекбокс: Я принимаю Условия и Положения
		await this.page.locator('label', { hasText: 'Я принимаю Условия и Положения' }).locator('span').first().click();

		await expect(this.submitButton).toBeEnabled();
                await this.submitButton.click();
        }

        async registerByPhone(phone: string, password: string) {
                await this.waitForVisible();
                await this.switchToRegister();

                await this.switchToPhoneMethod();

                await this.phoneInput.fill(phone);
                await this.passwordInput.fill(password);

                await this.page.locator('label', { hasText: 'Мне есть 18 лет' }).locator('span').first().click();
                await this.page.locator('label', { hasText: 'Я принимаю Условия и Положения' }).locator('span').first().click();

                await expect(this.submitButton).toBeEnabled();
                await this.submitButton.click();
        }

	// --- Email confirmation modal ---

	get emailConfirmationDialog() {
		return this.page.locator('text=Мы отправили письмо на указанный вами электронный адрес');
	}

	get displayedConfirmationEmail() {
		return this.page.locator('div.sc-1d93ec92-18');
	}

	get resendButton() {
		return this.page.getByRole('button', { name: /Отправить еще раз/i });
	}

	get emailConfirmationCloseButton() {
		// По иконке с крестиком
		return this.page.locator('img[src*="close-dialog"]');
	}

	async waitForEmailConfirmation(timeout = 5000): Promise<void> {
		await expect(this.emailConfirmationDialog).toBeVisible({ timeout });
	}

	async isEmailConfirmationVisible(): Promise<boolean> {
		try {
			return await this.page.locator('img[src*="email-spin.svg"]').isVisible({ timeout: 3000 });
		} catch {
			return false;
		}
	}


	async getEmailFromConfirmation(): Promise<string | null> {
		if (await this.displayedConfirmationEmail.isVisible()) {
			return this.displayedConfirmationEmail.textContent();
		}
		return null;
	}

	async resendEmailConfirmation() {
		await this.resendButton.click();
	}

        async closeEmailConfirmationIfVisible() {
                if (await this.isEmailConfirmationVisible()) {
                        await this.emailConfirmationCloseButton.click();
                        await expect(this.emailConfirmationDialog).toBeHidden();
                }
        }

        get toastError() {
                return this.page.locator('li[role="status"]:has-text("Ошибка регистрации")');
        }
}
