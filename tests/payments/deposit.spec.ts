import { test, expect } from '@playwright/test';
import { MainPage } from '../../pages/MainPage';
import { AuthModal } from '../../pages/AuthModal';
import { DepositModal } from '../../pages/payments/DepositModal';
import { validUser } from '../../fixtures/userData';
import { depositMethods, minDeposit } from '../../fixtures/depositData';

const cryptoMethods = ['Tether USD (Tron)', 'Tether USD (Ethereum)', 'Bitcoin', 'Ethereum', 'Tron', 'Toncoin'];

test.describe('Deposit feature', () => {
  test.beforeEach(async ({ page }) => {
    const mainPage = new MainPage(page);
    const authModal = new AuthModal(page);
    await mainPage.open();
    await mainPage.openLoginModal();
    await authModal.login(validUser.email, validUser.password);
    await mainPage.openDepositModal();
  });

  test('deposit modal is visible', async ({ page }) => {
    const modal = new DepositModal(page);
    await modal.waitForVisible();
  });

  test('payment methods correspond to currency', async ({ page }) => {
    const modal = new DepositModal(page);
    for (const [currency, methods] of Object.entries(depositMethods)) {
      await modal.selectCurrency(currency);
      const list = await modal.getPaymentMethods();
      expect(list).toEqual(methods);
    }
  });

  test('minimal deposit amounts are correct', async ({ page }) => {
    const modal = new DepositModal(page);
    for (const [currency, methods] of Object.entries(minDeposit)) {
      await modal.selectCurrency(currency);
      for (const [method, amount] of Object.entries(methods)) {
        await modal.openPaymentMethod(method);
        const minValue = await modal.getMinDeposit();
        expect(minValue).toBeCloseTo(amount, 2);
        if (!cryptoMethods.includes(method) && amount > 0) {
          await modal.setAmount(amount - 1);
          await expect(modal.depositButton).toBeDisabled();
        }
        await modal.goBack();
      }
    }
  });
});
