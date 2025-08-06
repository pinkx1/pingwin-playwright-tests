import { test, expect } from '../../withdrawalFixtures';
import { MainPage } from '../../pages/MainPage';
import { WithdrawalModal } from '../../pages/payments/WithdrawalModal';
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

  test('payment methods correspond to currency', async ({ authenticatedPage: page }) => {
    const modal = new WithdrawalModal(page);
    await modal.openWithdrawTab();

    for (const [currency, methods] of Object.entries(withdrawalMethods)) {
      await modal.selectCurrency(currency);
      const methodsLocator = modal.dialog.locator('div.sc-90dc3735-3 div.sc-1d93ec92-18');
      await expect(methodsLocator, `Unexpected payment methods for currency ${currency}`).toHaveText(methods);
    }
  });

  async function runWithdrawalAmountValidation(page, currency: string) {
    const methods = withdrawalMethods[currency];
    const modal = new WithdrawalModal(page);

    await modal.openWithdrawTab();
    await modal.selectCurrency(currency);

    const methodsLocator = modal.dialog.locator('div.sc-90dc3735-3 div.sc-1d93ec92-18');
    await expect(methodsLocator, `Unexpected payment methods for currency ${currency}`).toHaveText(methods);

    for (const method of methods) {
      await page.waitForTimeout(1000); // Wait for UI to stabilize
      await test.step(`Method: ${method}`, async () => {
        await modal.openPaymentMethod(method);

        const min = await modal.getMinLimit();
        const max = await modal.getMaxLimit();

        if (min > 0) {
          await modal.setAmount(min - 1);
          const actualBelow = await modal.amountInput.inputValue();
          await expect(modal.amountInput).toHaveClass(/eTDIAg/);
          await expect(modal.amountInput).toHaveCSS('color', 'rgb(218, 68, 68)');
        }

        await modal.setAmount(min);
        const actualMin = await modal.amountInput.inputValue();
        await expect(modal.amountInput).toHaveClass(/jBHWnj/);

        await modal.setAmount(max);
        const actualMax = await modal.amountInput.inputValue();
        await expect(modal.amountInput).toHaveClass(/jBHWnj/);

        await modal.setAmount(max + 1);
        const actualAbove = await modal.amountInput.inputValue();
        await expect(modal.amountInput).toHaveClass(/eTDIAg/);
        await expect(modal.amountInput).toHaveCSS('color', 'rgb(218, 68, 68)');

        await modal.goBack();
        await expect(methodsLocator).toHaveText(methods);
      });
    }
  }

  test('withdrawal amount validation [USD]', async ({ authenticatedPage: page }) => {
    test.setTimeout(60_000);
    await runWithdrawalAmountValidation(page, 'USD');
  });

  test('withdrawal amount validation [EUR]', async ({ authenticatedPage: page }) => {
    test.setTimeout(60_000);
    await runWithdrawalAmountValidation(page, 'EUR');
  });

  test('withdrawal amount validation [UAH]', async ({ authenticatedPage: page }) => {
    test.setTimeout(60_000);
    await runWithdrawalAmountValidation(page, 'UAH');
  });

  test('withdrawal amount validation [KZT]', async ({ authenticatedPage: page }) => {
    test.setTimeout(60_000);
    await runWithdrawalAmountValidation(page, 'KZT');
  });

  test('withdrawal amount validation [RON]', async ({ authenticatedPage: page }) => {
    test.setTimeout(60_000);
    await runWithdrawalAmountValidation(page, 'RON');
  });

  test('withdrawal amount validation [UZS]', async ({ authenticatedPage: page }) => {
    test.setTimeout(60_000);
    await runWithdrawalAmountValidation(page, 'UZS');
  });
});
