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
    await this.page.locator(`.currency-select__option img[src*="/${code}.png"]`).first().click();
  }

  async waitForPaymentMethods(expected: string[]) {
    await expect(
      this.dialog.locator('div.sc-90dc3735-3 div.sc-1d93ec92-18')
    ).toHaveText(expected);
  }

  async getPaymentMethods(): Promise<string[]> {
    const names = await this.dialog.locator('div.sc-90dc3735-3 div.sc-1d93ec92-18').allTextContents();
    return names.map(n => n.trim());
  }

  async openPaymentMethod(name: string) {
    await this.dialog.locator('div.sc-90dc3735-3').locator(`text="${name}"`).first().click();
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

  async setAmount(value: number) {
    await this.amountInput.fill(String(value));
  }

  private parseAmount(text: string): number {
    const normalized = text.replace(/\s/g, '').replace(/,/g, '').replace(/[^0-9.]/g, '');
    return parseFloat(normalized);
  }
}
