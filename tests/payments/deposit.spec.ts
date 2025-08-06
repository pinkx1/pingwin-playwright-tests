import { test, expect } from '../../fixtures';
import { MainPage } from '../../pages/MainPage';
import { DepositModal } from '../../pages/payments/DepositModal';

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

  test('USD deposit limits are correct', async ({ authenticatedPage: page }) => {
    const modal = new DepositModal(page);
    await modal.selectCurrency('USD');
    await modal.waitForPaymentMethods();
    await verifyAllMethods(modal);
  });

  test('EUR deposit limits are correct', async ({ authenticatedPage: page }) => {
    const modal = new DepositModal(page);
    await modal.selectCurrency('EUR');
    await modal.waitForPaymentMethods();
    await verifyAllMethods(modal);
  });

  test('UAH deposit limits are correct', async ({ authenticatedPage: page }) => {
    const modal = new DepositModal(page);
    await modal.selectCurrency('UAH');
    await modal.waitForPaymentMethods();
    await verifyAllMethods(modal);
  });

  test('KZT deposit limits are correct', async ({ authenticatedPage: page }) => {
    const modal = new DepositModal(page);
    await modal.selectCurrency('KZT');
    await modal.waitForPaymentMethods();
    await verifyAllMethods(modal);
  });

  test('RON deposit limits are correct', async ({ authenticatedPage: page }) => {
    const modal = new DepositModal(page);
    await modal.selectCurrency('RON');
    await modal.waitForPaymentMethods();
    await verifyAllMethods(modal);
  });

  test('UZS deposit limits are correct', async ({ authenticatedPage: page }) => {
    const modal = new DepositModal(page);
    await modal.selectCurrency('UZS');
    await modal.waitForPaymentMethods();
    await verifyAllMethods(modal);
  });
});

async function verifyLimits(modal: DepositModal) {
  const min = await modal.getMinDeposit();
  const max = await modal.getMaxDeposit();
  await modal.setAmount(min - 1);
  await expect(modal.depositButton).toBeDisabled();
  await modal.setAmount(min);
  await expect(modal.depositButton).toBeEnabled();
  if (max) {
    await modal.setAmount(max);
    await expect(modal.depositButton).toBeEnabled();
    await modal.setAmount(max + 1);
    await expect(modal.depositButton).toBeDisabled();
  }
}

async function verifyAllMethods(modal: DepositModal) {
  await verifyMethod(modal, 'Binance Pay');

  const bankCards = modal.paymentMethodRows('Банковская карта');
  const count = await bankCards.count();
  for (let i = 0; i < count; i++) {
    await bankCards.nth(i).click();
    await verifyLimits(modal);
    await modal.goBack();
    await modal.waitForPaymentMethods();
  }
}

async function verifyMethod(modal: DepositModal, name: string) {
  const methodRow = modal.paymentMethodRows(name).first();
  await expect(methodRow).toBeVisible();
  await methodRow.click();
  await verifyLimits(modal);
  await modal.goBack();
  await modal.waitForPaymentMethods();
}
