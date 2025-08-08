import { Page, Locator, expect, Response } from '@playwright/test';

export interface DepositMethod {
  method: string;
  name: string;
  minAmount: number;
  maxAmount: number;
  icon: string;
  fields?: string[];
}

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
    await this.page
      .locator(`.currency-select__option img[src*="/${code}.png"]`)
      .first()
      .click();
  }

  async selectCurrencyAndGetMethods(code: string): Promise<DepositMethod[]> {
    await this.currencyButton.click();
    const option = this.page
      .locator(`.currency-select__option img[src*="/${code}.png"]`)
      .first();
    const [methodsResponse] = await Promise.all([
      this.page.waitForResponse(
        (res) =>
          res.url().includes('/payment/fiat/payment/methods') &&
          res.status() === 200
      ),
      this.page.waitForResponse(
        (res) =>
          res
            .url()
            .includes(`/convertBalance?currency=${code}`) && res.status() === 200
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
      method: m.method,
      name: m.name,
      minAmount: m.minAmount,
      maxAmount: m.maxAmount,
      icon: m.icon,
      fields: m.fields || [],
    }));

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

  async getMinDeposit(): Promise<number> {
    const primaryLabel = this.dialog.getByText('Минимальный депозит');
    if (await primaryLabel.count()) {
      await primaryLabel.waitFor();
      const primary = primaryLabel.locator('..').locator('.sc-1d93ec92-19');
      const text = await primary.first().textContent();
      return this.parseAmount(text || '');
    }
    const altLabel = this.dialog.getByText('Минимальная сумма пополнения');
    if (await altLabel.count()) {
      await altLabel.waitFor();
      const alt = altLabel.locator('..').locator('.sc-1d93ec92-19');
      const text = await alt.first().textContent();
      return this.parseAmount(text || '');
    }
    const secondaryAlt = this.dialog.getByText('Минимальная сумма депозита');
    await secondaryAlt.waitFor();
    const secondary = secondaryAlt.locator('..').locator('.sc-1d93ec92-19');
    const text = await secondary.first().textContent();
    return this.parseAmount(text || '');
  }

  async getMaxDeposit(): Promise<number | null> {
    const primaryLabel = this.dialog.getByText('Максимальный депозит');
    if (await primaryLabel.count()) {
      await primaryLabel.waitFor();
      const primary = primaryLabel.locator('..').locator('.sc-1d93ec92-19');
      const text = await primary.first().textContent();
      return this.parseAmount(text || '');
    }
    const altLabel = this.dialog.getByText('Максимальний депозит');
    if (await altLabel.count()) {
      await altLabel.waitFor();
      const alt = altLabel.locator('..').locator('.sc-1d93ec92-19');
      const text = await alt.first().textContent();
      return this.parseAmount(text || '');
    }
    const anotherLabel = this.dialog.getByText('Максимальная сумма пополнения');
    if (await anotherLabel.count()) {
      await anotherLabel.waitFor();
      const another = anotherLabel.locator('..').locator('.sc-1d93ec92-19');
      const text = await another.first().textContent();
      return this.parseAmount(text || '');
    }
    return null;
  }

  async setAmount(value: number) {
    await this.amountInput.fill(String(value));
  }

  async expectInvalidAmount(value: number) {
    await this.setAmount(value);
    await expect(this.depositButton).toBeDisabled();
    await expect(this.amountInput).toHaveCSS('color', 'rgb(218, 68, 68)');
  }

  async expectValidAmount(value: number) {
    await this.setAmount(value);
    await expect(this.depositButton).toBeEnabled();
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

  async fillAndSubmitAdditionalForm(data: Record<string, string>): Promise<Response | null> {
    const form = this.dialog.locator('form').last();
    await form.waitFor();
    const inputs = form.locator('input');
    const inputCount = await inputs.count();
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const type = (await input.getAttribute('type')) || '';
      if (type === 'checkbox' || type === 'radio') {
        continue;
      }
      const name = (await input.getAttribute('name')) || '';
      const value = data[name] || data['default'] || '';
      await input.fill(value);
    }
    const selects = form.locator('select');
    const selectCount = await selects.count();
    for (let i = 0; i < selectCount; i++) {
      const select = selects.nth(i);
      const options = await select.locator('option').all();
      if (options.length) {
        const optionValue = await options[Math.min(1, options.length - 1)].getAttribute('value');
        if (optionValue) {
          await select.selectOption(optionValue);
        }
      }
    }
    const submit = form.locator('button[type="submit"], button:has-text("Pay")').first();
    await expect(submit).toBeEnabled();
    const [response] = await Promise.all([
      this.page.waitForNavigation({ waitUntil: 'load' }).catch(() => null),
      submit.click(),
    ]);
    return response;
  }

  private parseAmount(text: string): number {
    const normalized = text.replace(/\s/g, '').replace(/,/g, '').replace(/[^0-9.]/g, '');
    return parseFloat(normalized);
  }

  getPaymentMethodRow(method: DepositMethod): Locator {
    const iconFile = method.icon.split('/').pop();
    return this.methodsContainer.locator('> div').filter({
      hasText: method.name,
      has: this.page.locator(`img[src*="${iconFile}"]`)
    }).first();
  }

}

