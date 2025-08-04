import { test, expect } from '../../fixtures';
import { MainPage } from '../../pages/MainPage';
import { DepositModal } from '../../pages/payments/DepositModal';
import { depositMethods, minDeposit } from '../../fixtures/depositData';

const cryptoMethods = ['Tether USD (Tron)', 'Tether USD (Ethereum)', 'Bitcoin', 'Ethereum', 'Tron', 'Toncoin'];

test.describe('Deposit feature', () => {
  // Перед каждым тестом открываем страницу депозита на уже авторизованном пользователе
  test.beforeEach(async ({ authenticatedPage: page }) => {
    const mainPage = new MainPage(page);
    await mainPage.open();
    await mainPage.openDepositModal();
  });

  test('deposit modal is visible', async ({ authenticatedPage: page }) => {
    const modal = new DepositModal(page);
    await modal.waitForVisible();
  });

  test('payment methods correspond to currency', async ({ authenticatedPage: page }) => {
    const modal = new DepositModal(page);
    for (const [currency, methods] of Object.entries(depositMethods)) {
      await modal.selectCurrency(currency);
      await modal.waitForPaymentMethods(methods);
    }
  });

  test('minimal deposit amounts are correct', async ({ authenticatedPage: page }) => {
    test.setTimeout(120_000); // Increase timeout for this test due to multiple interactions
    const modal = new DepositModal(page);
    for (const [currency, methods] of Object.entries(minDeposit)) {
      await modal.selectCurrency(currency);
      await modal.waitForPaymentMethods(depositMethods[currency]);
      for (const [method, amount] of Object.entries(methods)) {
        await modal.openPaymentMethod(method);
        const minValue = await modal.getMinDeposit();
        expect(minValue).toBeCloseTo(amount, 2);
        if (!cryptoMethods.includes(method) && amount > 0) {
          await modal.setAmount(amount - 1);
          await expect(modal.depositButton).toBeDisabled();
        }
        await modal.goBack();
        await modal.waitForPaymentMethods(depositMethods[currency]);
      }
    }
  });
});
