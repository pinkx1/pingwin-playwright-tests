import { Page, Locator, expect } from '@playwright/test';

export interface WithdrawalMethod {
  name: string;
  minAmount: number;
  maxAmount: number;
}

export class WithdrawalModal {
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
  async openWithdrawTab() {
    await this.withdrawTab.click();
    await this.withdrawTab.waitFor({ state: 'visible' });
    await this.withdrawTab.waitFor({ state: 'attached' });
    await this.page.waitForTimeout(1000);
  }

  async selectCurrency(code: string) {
    await this.currencyButton.click();
    await this.page
      .locator(`.currency-select__option img[src*="/${code}.png"]`)
      .first()
      .click();
  }

  async selectCurrencyAndGetMethods(code: string): Promise<WithdrawalMethod[]> {
    await this.currencyButton.click();
    const option = this.page
      .locator(`.currency-select__option img[src*="/${code}.png"]`)
      .first();
    const [methodsResponse] = await Promise.all([
      this.page.waitForResponse(
        (res) =>
          res.url().includes('/payment/fiat/payout/methods') &&
          res.status() === 200
      ),
      this.page.waitForResponse(
        (res) =>
          res
            .url()
            .includes(`/convertBalance?currency=${code}`) &&
          res.status() === 200
      ),
      this.page.waitForResponse(
        (res) =>
          res.url().includes('/getConvertedBalance') && res.status() === 200
      ),
      option.click(),
    ]);
    const json = await methodsResponse.json();
    await this.waitForPaymentMethods();
    return json.methods.map((m: any) => ({
      name: m.name,
      minAmount: m.minAmount,
      maxAmount: m.maxAmount,
    }));
  }

  async waitForPaymentMethods(expected?: string[]) {

    const rows = this.methodsContainer.locator('div.sc-1d93ec92-18');
    if (expected) {
      for (const name of expected) {

        await rows.filter({ hasText: name }).first().waitFor();
      }
      return;
    }
    await rows.first().waitFor();
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

  async setAmount(value: number) {
    const valueStr = value.toString(); // без .replace
    await this.amountInput.fill(valueStr);
  }

  async expectInvalidAmount(value: number) {
    await this.setAmount(value);
    const actualColor = await this.amountInput.evaluate(el => getComputedStyle(el).color);
    await expect(this.amountInput).toHaveCSS('color', 'rgb(218, 68, 68)');
  }

  async expectValidAmount(value: number) {
    await this.setAmount(value);
    const actualColor = await this.amountInput.evaluate(el => getComputedStyle(el).color);
    await expect(this.amountInput).not.toHaveCSS(
      'color',
      'rgb(218, 68, 68)'
    );
  }

  async verifyAmountBounds(min: number, max: number) {
    const belowMin = min > 1 ? min - 1 : min / 2;

    await this.expectInvalidAmount(belowMin);
    await this.expectValidAmount(min);
    if (max) {
      await this.expectValidAmount(max);
      const aboveMax = max > 1 ? max + 1 : max * 2;
      await this.expectInvalidAmount(aboveMax);
    }
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
