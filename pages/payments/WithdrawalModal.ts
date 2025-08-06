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

  async selectCurrency(code: string) {
    await this.currencyButton.click();
    await this.page.locator(`.currency-select__option img[src*="/${code}.png"]`).first().click();
  }

  async getPaymentMethods(): Promise<string[]> {
    return await this.dialog
      .locator('div.sc-90dc3735-3 div.sc-1d93ec92-18')
      .allTextContents();
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

  get withdrawButton() {
    return this.dialog.getByRole('button', { name: /Вывести/ });
  }

  async setAmount(value: number) {
    await this.amountInput.fill(String(value));
  }

  private parseAmount(text: string): number {
    return parseInt(text.replace(/[^0-9]/g, ''), 10);
  }

  async getMinLimit(): Promise<number> {
    const text = await this.dialog
      .getByText('Минимальная сумма вывода:')
      .locator('xpath=../div[2]')
      .innerText();
    return this.parseAmount(text);
  }

  async getMaxLimit(): Promise<number> {
    const text = await this.dialog
      .getByText('Макс.')
      .locator('xpath=../div[1]')
      .innerText();
    return this.parseAmount(text);
  }
}
