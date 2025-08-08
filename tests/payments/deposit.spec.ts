import { test, expect } from '../../fixtures/users/basicUser.fixture';
import { MainPage } from '../../pages/MainPage';
import { DepositModal, DepositMethod } from '../../pages/DepositModal';

// test.describe.configure({ mode: 'serial' });

test.describe('Deposit feature', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    test.setTimeout(90000);
    const mainPage = new MainPage(page);
    await mainPage.open();
    await mainPage.openDepositModal();
  });

  test('USD deposit limits are correct', async ({ authenticatedPage: page }) => {
    const modal = new DepositModal(page);
    const methods = await modal.selectCurrencyAndGetMethods('USD');
    await checkMethods(modal, methods);
  });

  test('EUR deposit limits are correct', async ({ authenticatedPage: page }) => {
    const modal = new DepositModal(page);
    const methods = await modal.selectCurrencyAndGetMethods('EUR');
    await checkMethods(modal, methods);
  });

  test('UAH deposit limits are correct', async ({ authenticatedPage: page }) => {
    const modal = new DepositModal(page);
    const methods = await modal.selectCurrencyAndGetMethods('UAH');
    await checkMethods(modal, methods);
  });

  test('KZT deposit limits are correct', async ({ authenticatedPage: page }) => {
    const modal = new DepositModal(page);
    const methods = await modal.selectCurrencyAndGetMethods('KZT');
    await checkMethods(modal, methods);
  });

  test('RON deposit limits are correct', async ({ authenticatedPage: page }) => {
    const modal = new DepositModal(page);
    const methods = await modal.selectCurrencyAndGetMethods('RON');
    await checkMethods(modal, methods);
  });

  test('UZS deposit limits are correct', async ({ authenticatedPage: page }) => {
    const modal = new DepositModal(page);
    const methods = await modal.selectCurrencyAndGetMethods('UZS');
    await checkMethods(modal, methods);
  });
});

async function checkMethods(modal: DepositModal, methods: DepositMethod[]) {
  for (const method of methods) {
    const row = modal.getPaymentMethodRow(method);
    await expect(row).toBeVisible();
    await row.click();
    await modal.verifyAmountBounds(method.minAmount, method.maxAmount);
    await modal.goBack();
    await modal.waitForPaymentMethods();
  }
}


