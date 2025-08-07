import { Page, Locator, expect } from '@playwright/test';

export class DepositModal {
  readonly page: Page;
  readonly dialog: Locator;
  readonly closeButton: Locator;
  readonly currencyButton: Locator;
  readonly depositTab: Locator;
  readonly withdrawTab: Locator;
  readonly historyTab: Locator;
  readonly methodsContainer: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.locator('div[role="dialog"]');
    this.closeButton = this.dialog.locator('img[src*="close-dialog"]');
    this.currencyButton = this.dialog.locator('.currency-select__control');
    this.depositTab = this.dialog.getByRole('button', { name: 'Депозит' });
    this.withdrawTab = this.dialog.getByRole('button', { name: 'Вывод' });
    this.historyTab = this.dialog.getByRole('button', { name: 'История' });
    this.methodsContainer = this.dialog.locator('div.sc-90dc3735-3');
  }

  async selectCurrency(code: string) {
    await this.currencyButton.click();
    await this.page.locator(`.currency-select__option img[src*="/${code}.png"]`).first().click();
  }

  async waitForPaymentMethods(expected?: string[]) {
    if (expected) {
      await expect(
        this.methodsContainer.locator('div.sc-1d93ec92-18')
      ).toHaveText(expected);
      return;
    }
    await this.methodsContainer.locator('div.sc-1d93ec92-18').first().waitFor();
  }

  async getPaymentMethodNames(): Promise<string[]> {
    return this.methodsContainer.locator('div.sc-1d93ec92-18').allTextContents();
  }

  paymentMethodRows(search: string): Locator {
    return this.methodsContainer.locator('> div').filter({ hasText: search });
  }

  async openPaymentMethod(name: string) {
    await this.methodsContainer.locator(`text="${name}"`).first().click();
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

  async getAmountColor(): Promise<string> {
    return this.amountInput.evaluate((el) => getComputedStyle(el).color);
  }

  async getMinDeposit(): Promise<number> {
    const primaryLabel = this.dialog.getByText('Минимальный депозит');
    if (await primaryLabel.count()) {
      await primaryLabel.waitFor();
      const primary = primaryLabel.locator('..').locator('.sc-1d93ec92-19');
      const text = await primary.first().textContent();
      console.log('[UI] Min deposit (primary label):', text);

      return this.parseAmount(text || '');
    }
    const altLabel = this.dialog.getByText('Минимальная сумма пополнения');
    if (await altLabel.count()) {
      await altLabel.waitFor();
      const alt = altLabel.locator('..').locator('.sc-1d93ec92-19');
      const text = await alt.first().textContent();
      console.log('[UI] Min deposit (alt label):', text);

      return this.parseAmount(text || '');
    }
    const secondaryAlt = this.dialog.getByText('Минимальная сумма депозита');
    await secondaryAlt.waitFor();
    const secondary = secondaryAlt.locator('..').locator('.sc-1d93ec92-19');
    const text = await secondary.first().textContent();
    console.log('[UI] Min deposit (secondary alt label):', text);

    return this.parseAmount(text || '');
  }

  async getMaxDeposit(): Promise<number | null> {
    const primaryLabel = this.dialog.getByText('Максимальный депозит');
    if (await primaryLabel.count()) {
      await primaryLabel.waitFor();
      const primary = primaryLabel.locator('..').locator('.sc-1d93ec92-19');
      const text = await primary.first().textContent();
      console.log('[UI] Max deposit (primary label):', text);


      return this.parseAmount(text || '');
    }
    const altLabel = this.dialog.getByText('Максимальний депозит');
    if (await altLabel.count()) {
      await altLabel.waitFor();
      const alt = altLabel.locator('..').locator('.sc-1d93ec92-19');
      const text = await alt.first().textContent();
      console.log('[UI] Max deposit (alt label):', text);

      return this.parseAmount(text || '');
    }
    const anotherLabel = this.dialog.getByText('Максимальная сумма пополнения');
    if (await anotherLabel.count()) {
      await anotherLabel.waitFor();
      const another = anotherLabel.locator('..').locator('.sc-1d93ec92-19');
      const text = await another.first().textContent();
      console.log('[UI] Max deposit (another label):', text);

      return this.parseAmount(text || '');
    }
    return null;
  }

  async setAmount(value: number) {
    await this.amountInput.fill(String(value));
  }

  private parseAmount(text: string): number {
    const normalized = text.replace(/\s/g, '').replace(/,/g, '').replace(/[^0-9.]/g, '');
    return parseFloat(normalized);
  }
  async openPaymentMethodByIndex(index: number) {
    const method = this.methodsContainer.locator('> div').nth(index);
    const title = await method.textContent();
    console.log(`[DEBUG] Clicking method[${index}]: ${title?.trim()}`);
    await method.click();
    await this.dialog.getByText('Назад').waitFor();
  }

}
