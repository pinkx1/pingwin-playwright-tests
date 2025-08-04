import { test, expect } from '../../withdrawalFixtures';
import { MainPage } from '../../pages/MainPage';
import { WithdrawalModal } from '../../pages/payments/WithdrawalModal';
import { withdrawalMethods, withdrawalLimits } from '../../fixtures/withdrawalData';

test.describe('Withdrawal feature', () => {
  // Перед каждым тестом открываем вкладку вывода средств в уже авторизованной сессии
  test.beforeEach(async ({ authenticatedPage: page }) => {
    const mainPage = new MainPage(page);
    await mainPage.open();
    await mainPage.openDepositModal();
    const modal = new WithdrawalModal(page);
    await modal.withdrawTab.click();
  });

  test('withdrawal modal is visible', async ({ authenticatedPage: page }) => {
    const modal = new WithdrawalModal(page);
    await modal.waitForVisible();
  });

  test('payment methods correspond to currency', async ({ authenticatedPage: page }) => {
    const modal = new WithdrawalModal(page);
    for (const [currency, methods] of Object.entries(withdrawalMethods)) {
      await modal.selectCurrency(currency);
      await modal.waitForPaymentMethods(methods, currency);
    }
  });

  test('withdrawal amount validation', async ({ authenticatedPage: page }) => {
    test.setTimeout(180_000);
    const modal = new WithdrawalModal(page);
    for (const [currency, limits] of Object.entries(withdrawalLimits)) {
      await test.step(`Currency: ${currency}`, async () => {
        await modal.selectCurrency(currency);
        await modal.waitForPaymentMethods(withdrawalMethods[currency], currency);
        for (const [method, { min, max }] of Object.entries(limits)) {
          await test.step(`Method: ${method}`, async () => {
            await modal.openPaymentMethod(method);
            if (min > 0) {
              await modal.setAmount(min - 1);
              await expect(
                modal.amountInput,
                `${currency} ${method}: amount below min should be rejected`,
              ).toHaveClass(/eTDIAg/);
              await expect(
                modal.amountInput,
                `${currency} ${method}: amount below min should be red`,
              ).toHaveCSS('color', 'rgb(218, 68, 68)');
            }
            await modal.setAmount(min);
            await expect(
              modal.amountInput,
              `${currency} ${method}: min amount should be accepted`,
            ).toHaveClass(/jBHWnj/);
            await modal.setAmount(max);
            await expect(
              modal.amountInput,
              `${currency} ${method}: max amount should be accepted`,
            ).toHaveClass(/jBHWnj/);
            await modal.setAmount(max + 1);
            await expect(
              modal.amountInput,
              `${currency} ${method}: amount above max should be rejected`,
            ).toHaveClass(/eTDIAg/);
            await expect(
              modal.amountInput,
              `${currency} ${method}: amount above max should be red`,
            ).toHaveCSS('color', 'rgb(218, 68, 68)');
            await modal.goBack();
            await modal.waitForPaymentMethods(withdrawalMethods[currency], currency);
          });
        }
      });
    }
  });
});
