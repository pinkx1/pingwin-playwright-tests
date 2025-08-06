import { test, expect } from '../../fixtures';
import { MainPage } from '../../pages/MainPage';
import { DepositModal } from '../../pages/payments/DepositModal';
import { depositMethods } from '../../fixtures/depositData';

test.describe.configure({ mode: 'serial' });
test.describe('Deposit feature', () => {
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
    for (const currency of Object.keys(depositMethods)) {
      await modal.selectCurrency(currency);
      await modal.waitForPaymentMethods();

      const binance = modal.paymentMethodRows('Binance Pay');
      if (await binance.count()) {
        await binance.first().click();
        await verifyLimits(modal);
        await modal.goBack();
        await modal.waitForPaymentMethods();
      }

      const bankCards = modal.paymentMethodRows('Банковская карта');
      const bankCardCount = await bankCards.count();
      for (let i = 0; i < bankCardCount; i++) {
        await bankCards.nth(i).click();
        await verifyLimits(modal);
        await modal.goBack();
        await modal.waitForPaymentMethods();
      }
    }
  });
});

async function verifyLimits(modal: DepositModal) {
  const min = await modal.getMinDeposit();
  const max = await modal.getMaxDeposit();
  await modal.setAmount(min - 1);
  await expect(modal.depositButton).toBeDisabled();
  await modal.setAmount(min);
  await expect(modal.depositButton).toBeEnabled();
  await modal.setAmount(max);
  await expect(modal.depositButton).toBeEnabled();
  await modal.setAmount(max + 1);
  await expect(modal.depositButton).toBeDisabled();
}
