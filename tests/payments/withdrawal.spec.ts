import { test, expect } from '../../withdrawalFixtures';
import { MainPage } from '../../pages/MainPage';
import { WithdrawalModal } from '../../pages/WithdrawalModal';
import { withdrawalMethods } from '../../fixtures/withdrawalData';

test.describe.configure({ mode: 'serial' });

test.describe('Withdrawal feature', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    const mainPage = new MainPage(page);
    await mainPage.open();
    await mainPage.openDepositModal();

    const modal = new WithdrawalModal(page);
    await modal.openWithdrawTab();
  });

  async function runWithdrawalAmountValidation(page, currency: string) {
    const methods = withdrawalMethods[currency];
    const modal = new WithdrawalModal(page);

    await modal.openWithdrawTab();
    await modal.selectCurrency(currency);

    const methodsLocator = modal.dialog.locator('div.sc-90dc3735-3 div.sc-1d93ec92-18');
    await expect(methodsLocator, `Неверный список способов вывода для валюты: ${currency}`).toHaveText(methods);

    for (const method of methods) {
      await page.waitForTimeout(1000);
      await test.step(`Проверка метода: ${method}`, async () => {
        await modal.openPaymentMethod(method);

        const min = await modal.getMinLimit();
        const max = await modal.getMaxLimit();

        if (min > 0) {
          const belowMin = min - 1;
          await modal.setAmount(belowMin);
          await expect(
            modal.amountInput,
            `Ожидался КРАСНЫЙ стиль при вводе значения МЕНЬШЕ минимума: ${belowMin} (${currency}, ${method})`
          ).toHaveClass(/eTDIAg/);

          await expect(
            modal.amountInput,
            `Ожидался КРАСНЫЙ цвет текста при значении МЕНЬШЕ минимума: ${belowMin} (${currency}, ${method})`
          ).toHaveCSS('color', 'rgb(218, 68, 68)');
        }

        await modal.setAmount(min);
        await expect(
          modal.amountInput,
          `Ожидался ЗЕЛЁНЫЙ стиль при вводе значения РАВНОГО минимуму: ${min} (${currency}, ${method})`
        ).toHaveClass(/jBHWnj/);

        await modal.setAmount(max);
        await expect(
          modal.amountInput,
          `Ожидался ЗЕЛЁНЫЙ стиль при вводе значения РАВНОГО максимуму: ${max} (${currency}, ${method})`
        ).toHaveClass(/jBHWnj/);

        const aboveMax = max + 1;
        await modal.setAmount(aboveMax);
        await expect(
          modal.amountInput,
          `Ожидался КРАСНЫЙ стиль при вводе значения БОЛЬШЕ максимума: ${aboveMax} (${currency}, ${method})`
        ).toHaveClass(/eTDIAg/);

        await expect(
          modal.amountInput,
          `Ожидался КРАСНЫЙ цвет текста при значении БОЛЬШЕ максимума: ${aboveMax} (${currency}, ${method})`
        ).toHaveCSS('color', 'rgb(218, 68, 68)');

        await modal.goBack();
        await expect(methodsLocator, `Методы после возврата не совпадают с ожидаемыми (${currency})`).toHaveText(methods);
      });
    }
  }


  test.describe('withdrawal amount validation by currency', () => {
    test.setTimeout(90000);
    test('USD', async ({ authenticatedPage: page }) => {
      await runWithdrawalAmountValidation(page, 'USD');
    });

    test('EUR', async ({ authenticatedPage: page }) => {
      await runWithdrawalAmountValidation(page, 'EUR');
    });

    test('UAH', async ({ authenticatedPage: page }) => {
      await runWithdrawalAmountValidation(page, 'UAH');
    });

    test('KZT', async ({ authenticatedPage: page }) => {
      await runWithdrawalAmountValidation(page, 'KZT');
    });

    test('RON', async ({ authenticatedPage: page }) => {
      await runWithdrawalAmountValidation(page, 'RON');
    });

    test('UZS', async ({ authenticatedPage: page }) => {
      await runWithdrawalAmountValidation(page, 'UZS');
    });
  });
});
