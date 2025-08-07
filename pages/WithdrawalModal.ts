import { Page, Locator } from '@playwright/test';

export class WithdrawalModal {
  readonly page: Page;
  readonly dialog: Locator;
  readonly closeButton: Locator;
  readonly currencyButton: Locator;
  readonly depositTab: Locator;
  readonly withdrawTab: Locator;
  readonly historyTab: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.locator('div[role="dialog"]');
    this.closeButton = this.dialog.locator('img[src*="close-dialog"]');
    this.currencyButton = this.dialog.locator('.currency-select__control');
    this.depositTab = this.dialog.getByRole('button', { name: 'Депозит' });
    this.withdrawTab = this.dialog.getByRole('button', { name: 'Вывод' });
    this.historyTab = this.dialog.getByRole('button', { name: 'История' });
  }
  async openWithdrawTab() {
    await this.withdrawTab.click();
    await this.withdrawTab.waitFor({ state: 'visible' });
    await this.withdrawTab.waitFor({ state: 'attached' });
    await this.page.waitForTimeout(1000);
  }

  async selectCurrency(code: string) {
    await this.currencyButton.click();
    await this.page.locator(`.currency-select__option img[src*="/${code}.png"]`).first().click();
  }

  async openPaymentMethod(name: string) {
    const method = this.dialog
      .locator('div.sc-90dc3735-3')
      .locator(`text="${name}"`)
      .first();
    await method.click();
    await this.dialog
      .getByText('Минимальная сумма вывода:')
      .locator('xpath=../div[2]')
      .waitFor();
    await this.dialog.getByText('Макс.').locator('xpath=../div[1]').waitFor();
  }

  async goBack() {
    await this.dialog.getByText('Назад').click();
    await this.dialog.getByText('Назад').waitFor({ state: 'hidden' });
  }

  get amountInput() {
    return this.dialog.locator('input[name="amount"]');
  }

  async setAmount(value: number) {
    const digitsOnly = String(value).replace(/[^\d]/g, '');
    await this.amountInput.fill(digitsOnly);
  }

  private parseAmount(text: string): number {
    const cleaned = text.replace(/[^\d]/g, '');
    return parseInt(cleaned, 10);
  }

  async getMinLimit(): Promise<number> {
    const label = this.dialog.locator('div.brzKwJ:has-text("Минимальная сумма вывода:")');
    const valueLocator = label.locator('xpath=following-sibling::div[contains(@class, "hLypHw")]');

    const elementHandle = await valueLocator.elementHandle();
    if (!elementHandle) throw new Error('Min limit element not found');

    await this.page.waitForFunction(
      el => el && /\d/.test((el as HTMLElement).innerText),
      elementHandle,
      { timeout: 1500 }
    );

    const text = await valueLocator.evaluate(el => (el as HTMLElement).innerText);
    return this.parseAmount(text);
  }

  async getMaxLimit(): Promise<number> {
    const label = this.dialog.locator('div.iwDBoV:has-text("Макс.")');
    const valueLocator = label.locator('xpath=preceding-sibling::div[contains(@class, "hLypHw")]');

    const elementHandle = await valueLocator.elementHandle();
    if (!elementHandle) throw new Error('Max limit element not found');

    await this.page.waitForFunction(
      el => el && /\d/.test((el as HTMLElement).innerText),
      elementHandle,
      { timeout: 2000 }
    );

    const text = await valueLocator.evaluate(el => (el as HTMLElement).innerText);
    return this.parseAmount(text);
  }
}
