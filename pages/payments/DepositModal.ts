import { Page, Locator, expect } from '@playwright/test';

export class DepositModal {
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

  async waitForVisible() {
    await expect(this.dialog).toBeVisible();
  }

  async close() {
    await this.closeButton.click();
    await expect(this.dialog).toBeHidden();
  }

  async selectCurrency(code: string) {
    await this.currencyButton.click();
    await this.page
      .locator(`.currency-select__option img[src*="/${code}.png"]`)
      .first()
      .click();
  }

  async getCurrencies(): Promise<string[]> {
    await this.currencyButton.click();
    const options = this.page.locator('.currency-select__option img');
    const count = await options.count();
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const src = await options.nth(i).getAttribute('src');
      const match = src?.match(/\/([A-Z]{3})\.png$/i);
      if (match) codes.push(match[1]);
    }
    await this.currencyButton.click();
    return codes;
  }

  async waitForPaymentMethods(expected: string[]) {
    await expect(
      this.dialog.locator('div.sc-90dc3735-3 div.sc-1d93ec92-18')
    ).toHaveText(expected);
  }

  async getPaymentMethods(): Promise<string[]> {
    const locator = this.dialog.locator('div.sc-90dc3735-3 div.sc-1d93ec92-18');
    await locator.first().waitFor();
    const names = await locator.allTextContents();
    return names.map(n => n.trim());
  }

  async openPaymentMethod(name: string) {
    await this.dialog
      .locator('div.sc-90dc3735-3')
      .locator(`text="${name}"`)
      .first()
      .click();
    await this.dialog.getByText('Назад').waitFor();
  }

  async openPaymentMethodByIndex(index: number) {
    await this.dialog
      .locator('div.sc-90dc3735-3 div.sc-1d93ec92-18')
      .nth(index)
      .click();
    await this.dialog.getByText('Назад').waitFor();
  }

  async goBack() {
    await this.dialog.getByText('Назад').click();
    await this.dialog.getByText('Назад').waitFor({ state: 'hidden' });
  }

  get amountInput() {
    return this.dialog.locator('input[name="amount"]');
  }

  get depositButton() {
    return this.dialog.getByRole('button', { name: /Депозит на/ });
  }

  async getMinDeposit(): Promise<number> {
    const primaryLabel = this.dialog.getByText('Минимальный депозит');
    if (await primaryLabel.count()) {
      await primaryLabel.waitFor();
      const primary = primaryLabel.locator('..').locator('.sc-1d93ec92-19');
      const text = await primary.first().textContent();
      return this.parseAmount(text || '');
    }
    const altLabel = this.dialog.getByText('Минимальная сумма пополнения');
    await altLabel.waitFor();
    const alt = altLabel.locator('..').locator('.sc-1d93ec92-19');
    const text = await alt.first().textContent();
    return this.parseAmount(text || '');
  }

  async getMaxDeposit(): Promise<number> {
    const labels = [
      'Максимальный депозит',
      'Максимальная сумма пополнения',
      'Максимальная сумма депозита',
      'Максимальная сумма',
      'Макс.'
    ];

    for (const label of labels) {
      const locator = this.dialog.getByText(label);
      if (await locator.count()) {
        await locator.waitFor();
        const value = locator.locator('..').locator('.sc-1d93ec92-19');
        const text = await value.first().textContent();
        return this.parseAmount(text || '');
      }
    }

    throw new Error('Max deposit value not found');
  }

  async setAmount(value: number) {
    await this.amountInput.fill(String(value));
  }

  private parseAmount(text: string): number {
    const normalized = text.replace(/\s/g, '').replace(/,/g, '').replace(/[^0-9.]/g, '');
    return parseFloat(normalized);
  }
}
