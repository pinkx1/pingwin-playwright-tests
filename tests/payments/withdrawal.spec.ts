import { test, expect } from '../../fixtures';
import { MainPage } from '../../pages/MainPage';
import { WithdrawalModal } from '../../pages/payments/WithdrawalModal';
import { withdrawalMethods } from '../../fixtures/withdrawalData';

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

  test.skip('withdrawal amount validation', async ({ authenticatedPage: page }) => {
    // Example placeholder for boundary tests
    const modal = new WithdrawalModal(page);
    await modal.selectCurrency('USD');
    await modal.openPaymentMethod('Выплата на Binance BinPay');
    await modal.setAmount(4); // below minimum
    await expect(modal.withdrawButton).toBeDisabled();
    await modal.setAmount(5); // minimum
    await expect(modal.withdrawButton).toBeEnabled();
    await modal.setAmount(10); // maximum
    await expect(modal.withdrawButton).toBeEnabled();
    await modal.setAmount(11); // above maximum
    await expect(modal.withdrawButton).toBeDisabled();
  });
});
