import { Page, Locator, expect } from '@playwright/test';

export class AuthModal {
	readonly page: Page;

	readonly dialog: Locator;
	readonly loginTab: Locator;
	readonly registerTab: Locator;

	readonly emailInput: Locator;
	readonly passwordInput: Locator;
        readonly submitButton: Locator;

        readonly phoneInput: Locator;
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
                this.passwordInput = page.getByPlaceholder('Введите пароль');

                this.submitButton = page.getByRole('button', { name: 'Продолжить' });

                this.ageCheckbox = page.locator('input[name="isLegalAge"]');
                this.termsCheckbox = page.locator('input[name="isTerms"]');
                this.newsCheckbox = page.locator('input[name="isNews"]');

                this.phoneInput = page.locator('input[name="phone"]');
                this.closeButton = this.dialog.locator('img[src*="close-dialog"]');
        }

	async waitForVisible() {
		await expect(this.dialog).toBeVisible();
	}

	async switchToRegister() {
		await this.registerTab.click();
	}

        async switchToLogin() {
                await this.loginTab.click();
        }

        async switchToPhone() {
                await this.page.getByRole('button', { name: 'Телефон' }).click();
        }

        async isEmailRegistrationSelected(): Promise<boolean> {
                return this.emailInput.isVisible();
        }

       async close() {
               if (await this.dialog.isVisible()) {
                       try {
                               await this.closeButton.waitFor({ state: 'visible', timeout: 5000 });
                               await this.closeButton.click();
                       } catch {
                               // Auth modal may already be closed
                       }
                       await expect(this.dialog).toBeHidden();
               }
       }

	async login(email: string, password: string) {
		await this.waitForVisible();
		await this.switchToLogin();

		await this.emailInput.fill(email);
		await this.passwordInput.fill(password);

		await expect(this.submitButton).toBeEnabled();
		await this.submitButton.click();
	}

        async register(email: string, password: string) {
                await this.waitForVisible();
                await this.switchToRegister();

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
                await this.switchToPhone();

                await this.phoneInput.fill(phone);
                await this.passwordInput.fill(password);

                await this.page.locator('label', { hasText: 'Мне есть 18 лет' }).locator('span').first().click();
                await this.page.locator('label', { hasText: 'Я принимаю Условия и Положения' }).locator('span').first().click();

                await expect(this.submitButton).toBeEnabled();
                await this.submitButton.click();
        }

        get emailError() {
                return this.page.getByText('Неправильный адрес электронной почты');
        }

        get passwordLengthError() {
                return this.page.getByText('Пароль должен содержать минимум 8 символов');
        }

        get passwordLetterError() {
                return this.page.getByText('Пароль должен содержать как минимум одну букву');
        }

        get phoneError() {
                return this.page.getByText('Обязательное поле');
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

       // --- SMS confirmation modal ---

       async closeSmsConfirmationIfVisible() {
               const dialogs = this.page.locator('div[role="dialog"]');
               const smsDialog = dialogs.last();
               const closeButton = smsDialog.locator('img[src*="close-dialog"]');
               try {
                       await closeButton.waitFor({ state: 'visible', timeout: 5000 });
                       await closeButton.click();
                       await expect(smsDialog).toBeHidden();
               } catch {
                       // SMS confirmation did not appear
               }

               try {
                       const mainDialog = dialogs.first();
                       if (await mainDialog.isVisible()) {
                               const mainClose = mainDialog.locator('img[src*="close-dialog"]');
                               await mainClose.click({ timeout: 5000 });
                               await expect(mainDialog).toBeHidden();
                       }
               } catch {
                       // main auth modal already closed
               }
       }
}
