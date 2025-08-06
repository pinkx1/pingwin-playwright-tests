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

  test('withdrawal modal is visible', async ({ authenticatedPage: page }) => {
    const modal = new WithdrawalModal(page);
    await expect(modal.dialog).toBeVisible();
  });

  async function runWithdrawalAmountValidation(page, currency: string) {
    const methods = withdrawalMethods[currency];
    const modal = new WithdrawalModal(page);

    await modal.openWithdrawTab();
    await modal.selectCurrency(currency);

    const methodsLocator = modal.dialog.locator('div.sc-90dc3735-3 div.sc-1d93ec92-18');
    await expect(methodsLocator, `Unexpected payment methods for currency ${currency}`).toHaveText(methods);

    for (const method of methods) {
      await page.waitForTimeout(1000);
      await test.step(`Method: ${method}`, async () => {
        await modal.openPaymentMethod(method);

        const min = await modal.getMinLimit();
        const max = await modal.getMaxLimit();

        if (min > 0) {
          await modal.setAmount(min - 1);
          await expect(modal.amountInput).toHaveClass(/eTDIAg/);
          await expect(modal.amountInput).toHaveCSS('color', 'rgb(218, 68, 68)');
        }

        await modal.setAmount(min);
        await expect(modal.amountInput).toHaveClass(/jBHWnj/);

        await modal.setAmount(max);
        await expect(modal.amountInput).toHaveClass(/jBHWnj/);

        await modal.setAmount(max + 1);
        await expect(modal.amountInput).toHaveClass(/eTDIAg/);
        await expect(modal.amountInput).toHaveCSS('color', 'rgb(218, 68, 68)');

        await modal.goBack();
        await expect(methodsLocator).toHaveText(methods);
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
