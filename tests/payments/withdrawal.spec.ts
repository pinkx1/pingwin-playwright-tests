import { test, expect } from '@playwright/test';
import { MainPage } from '../../pages/MainPage';
import { AuthModal } from '../../pages/AuthModal';
import { WithdrawalModal } from '../../pages/payments/WithdrawalModal';
import { validUser } from '../../fixtures/userData';
import { withdrawalMethods } from '../../fixtures/withdrawalData';

test.describe('Withdrawal feature', () => {
  test.beforeEach(async ({ page }) => {
    const mainPage = new MainPage(page);
    const authModal = new AuthModal(page);
    await mainPage.open();
    await mainPage.openLoginModal();
    await authModal.login(validUser.email, validUser.password);
    await mainPage.openDepositModal();
    const modal = new WithdrawalModal(page);
    await modal.withdrawTab.click();
  });

  test('withdrawal modal is visible', async ({ page }) => {
    const modal = new WithdrawalModal(page);
    await modal.waitForVisible();
  });

  test('payment methods correspond to currency', async ({ page }) => {
    const modal = new WithdrawalModal(page);
    for (const [currency, methods] of Object.entries(withdrawalMethods)) {
      await modal.selectCurrency(currency);
      await modal.waitForPaymentMethods(methods);
    }
  });

  test.skip('withdrawal amount validation', async ({ page }) => {
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

  test.skip('redirects to selected payment system', async ({ page }) => {
    // Placeholder for redirect check
    const modal = new WithdrawalModal(page);
    await modal.selectCurrency('USD');
    await modal.openPaymentMethod('Выплата на Binance BinPay');
    await modal.setAmount(5);
    await modal.withdrawButton.click();
    // TODO: Assert that navigation to the payment system occurred
  });
});
