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
      await modal.waitForPaymentMethods(methods);
    }
  });

  test('withdrawal amount validation', async ({ authenticatedPage: page }) => {
    test.setTimeout(180_000);
    const modal = new WithdrawalModal(page);
    for (const [currency, limits] of Object.entries(withdrawalLimits)) {
      await modal.selectCurrency(currency);
      await modal.waitForPaymentMethods(withdrawalMethods[currency]);
      for (const [method, { min, max }] of Object.entries(limits)) {
        await modal.openPaymentMethod(method);
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
        await modal.waitForPaymentMethods(withdrawalMethods[currency]);
      }
    }
  });
});
