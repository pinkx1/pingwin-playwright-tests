import { test, expect } from '../../fixtures/users/basicUser.fixture';
import { Page } from '@playwright/test';
import { MainPage } from '../../pages/MainPage';
import { DepositModal, DepositMethod } from '../../pages/DepositModal';

const paymentData: Record<string, string> = {
  card: '4111111111111111',
  expireMonth: '12',
  expireYear: '30',
  cvv: '123',
  holder: 'JOHN DOE',
  fname: 'John',
  lname: 'Doe',
  city: 'TestCity',
  street: 'Main street 1',
  zip: '123456',
  email: 'test@example.com',
  phone: '1234567890',
  iban: 'DE89370400440532013000',
  tin: '123456789',
  default: 'test'
};

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



async function checkRedirects(page: Page, currency: string) {
  const mainPage = new MainPage(page);
  await mainPage.open();
  await mainPage.openDepositModal();
  let modal = new DepositModal(page);
  const methods = await modal.selectCurrencyAndGetMethods(currency);

  for (const method of methods) {
    await modal.openPaymentMethod(method.name);
    const amount = method.minAmount + 1 <= method.maxAmount ? method.minAmount + 1 : method.minAmount;
    await modal.setAmount(amount);

    const originBefore = new URL(page.url()).origin;

    // пробуем кликнуть по кнопке депозита
    await Promise.all([
      page.waitForURL(url => new URL(url).origin !== originBefore, { timeout: 10000 }),
      modal.depositButton.click({ force: true }),
    ]).catch(async () => {
      // возможно, требуется доп. форма — проверим
      const isDialogVisible = await modal.dialog.isVisible().catch(() => false);

      if (isDialogVisible) {
        page.on('console', msg => {
        });
        const response = await modal.fillAndSubmitAdditionalForm(paymentData);
        if (!response) {
          await expect(page.getByText('Payment Failed')).toBeVisible();
          return;
        }
      }
    });

    const redirectedUrl = page.url();
    const finalResp = await page.request.get(redirectedUrl).catch(() => null);

    expect(finalResp?.status(), `Статус ${redirectedUrl}`).toBe(200);
    expect(new URL(redirectedUrl).hostname).not.toContain('pingwincasino24');

    // Открываем модалку заново
    await page.goto('/');
    await mainPage.openDepositModal();
    modal = new DepositModal(page);
    await modal.selectCurrency(currency);
    await modal.waitForPaymentMethods();
  }
}


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


