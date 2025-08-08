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
    console.log('[DEBUG] Waiting for form...');
    const form = this.dialog.locator('form').last();
    await form.waitFor();
    console.log('[DEBUG] Form appeared');

    // Дать фронту время автозаполнить поля, если такое есть
    await this.page.waitForTimeout(500);

    const inputs = form.locator('input');
    const inputCount = await inputs.count();
    console.log(`[DEBUG] Found ${inputCount} inputs`);

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const type = (await input.getAttribute('type')) || '';
      if (type === 'checkbox' || type === 'radio') continue;

      const name = (await input.getAttribute('name')) || 'NO_NAME';
      const targetValue = data[name];
      if (targetValue === undefined) continue;

      const currentValue = await input.inputValue();
      console.log(`[DEBUG] [${name}] current="${currentValue}" target="${targetValue}"`);

      if (currentValue !== targetValue) {
        await input.click(); // иногда требуется для активации
        await input.fill(targetValue);
        await input.evaluate(el => (el as HTMLElement).blur());
        console.log(`[DEBUG] [${name}] filled`);
        await this.page.waitForTimeout(50);
      }
    }

    // Заполнение <select>
    const selects = form.locator('select');
    const selectCount = await selects.count();
    console.log(`[DEBUG] Found ${selectCount} selects`);

    for (let i = 0; i < selectCount; i++) {
      const select = selects.nth(i);
      const options = await select.locator('option').all();
      if (options.length) {
        const indexToSelect = Math.min(1, options.length - 1);
        const optionValue = await options[indexToSelect].getAttribute('value');
        if (optionValue) {
          await select.selectOption(optionValue);
          console.log(`[DEBUG] [select#${i}] selected "${optionValue}"`);
        }
      }
    }

    const submit = form.locator('button[type="submit"]').first();
    console.log('[DEBUG] Clicking submit button');

    const [response] = await Promise.all([
      this.page.waitForNavigation({ waitUntil: 'load' }).catch(() => null),
      submit.click({ force: true, noWaitAfter: true }),
    ]);

    console.log('[DEBUG] Submit clicked, navigation status:', response?.status());
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
  // Подбирает корректную сумму и заполняет поле.
  // Возвращает фактически введённое значение.
  async setValidAmountWithinLimits(): Promise<number> {
    const min = await this.getMinDeposit();
    const max = await this.getMaxDeposit(); // может быть null
    // пробуем понять шаг поля
    const stepAttr = await this.amountInput.getAttribute('step');
    let step = Number(stepAttr || '1');
    if (!Number.isFinite(step) || step <= 0) step = 1;

    const decimals = step >= 1 ? 0 : (String(step).split('.')[1]?.length ?? 2);

    // стартуем с ближайшего к min кратного step
    const start = Math.ceil(min / step) * step;

    let candidate: number;
    if (max && max > min) {
      // возьмём число строго между min и max с запасом в один step
      candidate = Math.min(max - step, start + step);
      // если max - min < step, то используем min (крайний случай)
      if (candidate < min) candidate = min;
    } else {
      // нет верхней границы — просто min + step
      candidate = start + step;
    }

    const value = Number(candidate.toFixed(decimals));

    // надёжно перезаписываем поле
    await this.amountInput.click();
    await this.amountInput.fill(''); // очистка на случай автоподстановки
    await this.amountInput.type(String(value));
    // подождём, пока UI активирует кнопку
    await expect(this.depositButton, 'Ожидалось: кнопка активна при валидной сумме')
      .toBeEnabled();

    return value;
  }

}


