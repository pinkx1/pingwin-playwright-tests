import { test, expect } from '../../withdrawalFixtures';
import { MainPage } from '../../pages/MainPage';
import { WithdrawalModal, WithdrawalMethod } from '../../pages/WithdrawalModal';

test.describe.configure({ mode: 'serial' });

test.describe('Withdrawal feature', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    const mainPage = new MainPage(page);
    await mainPage.open();
    await mainPage.openDepositModal();
    const modal = new WithdrawalModal(page);
    await modal.openWithdrawTab();
  });

  test('USD withdrawal limits are correct', async ({ authenticatedPage: page }) => {
    const modal = new WithdrawalModal(page);
    const methods = await modal.selectCurrencyAndGetMethods('USD');
    await modal.waitForPaymentMethods(methods.map((m) => m.name));
    await checkMethods(modal, methods);
  });

  test('EUR withdrawal limits are correct', async ({ authenticatedPage: page }) => {
    const modal = new WithdrawalModal(page);
    const methods = await modal.selectCurrencyAndGetMethods('EUR');
    await modal.waitForPaymentMethods(methods.map((m) => m.name));
    await checkMethods(modal, methods);
  });

  test('UAH withdrawal limits are correct', async ({ authenticatedPage: page }) => {
    const modal = new WithdrawalModal(page);
    const methods = await modal.selectCurrencyAndGetMethods('UAH');
    await modal.waitForPaymentMethods(methods.map((m) => m.name));
    await checkMethods(modal, methods);
  });

  test('KZT withdrawal limits are correct', async ({ authenticatedPage: page }) => {
    const modal = new WithdrawalModal(page);
    const methods = await modal.selectCurrencyAndGetMethods('KZT');
    await modal.waitForPaymentMethods(methods.map((m) => m.name));
    await checkMethods(modal, methods);
  });

  test('RON withdrawal limits are correct', async ({ authenticatedPage: page }) => {
    const modal = new WithdrawalModal(page);
    const methods = await modal.selectCurrencyAndGetMethods('RON');
    await modal.waitForPaymentMethods(methods.map((m) => m.name));
    await checkMethods(modal, methods);
  });

  test('UZS withdrawal limits are correct', async ({ authenticatedPage: page }) => {
    const modal = new WithdrawalModal(page);
    const methods = await modal.selectCurrencyAndGetMethods('UZS');
    await modal.waitForPaymentMethods(methods.map((m) => m.name));
    await checkMethods(modal, methods);
  });
});

async function checkMethods(modal: WithdrawalModal, methods: WithdrawalMethod[]) {
  for (const method of methods) {
    const row = modal.paymentMethodRows(method.name).first();
    await expect(row).toBeVisible();
    await row.click();
    const min = await modal.getMinLimit();
    const max = await modal.getMaxLimit();
    expect(min).toBe(method.minAmount);
    expect(max).toBe(method.maxAmount);
    await modal.verifyAmountBounds(min, max);
    await modal.goBack();
    await modal.waitForPaymentMethods();
  }
}
