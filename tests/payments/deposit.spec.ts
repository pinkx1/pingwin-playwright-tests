import { test, expect } from '../../fixtures/users/basicUser.fixture';
import type { Page } from '@playwright/test';
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


test.describe('Deposit redirects to payment systems', () => {
  test('USD methods redirect correctly', async ({ authenticatedPage }) => {
    await checkRedirectsForCurrency(authenticatedPage, 'USD');
  });

  test('EUR methods redirect correctly', async ({ authenticatedPage }) => {
    await checkRedirectsForCurrency(authenticatedPage, 'EUR');
  });

  test('UAH methods redirect correctly', async ({ authenticatedPage }) => {
    await checkRedirectsForCurrency(authenticatedPage, 'UAH');
  });

  test('KZT methods redirect correctly', async ({ authenticatedPage }) => {
    await checkRedirectsForCurrency(authenticatedPage, 'KZT');
  });

  test('RON methods redirect correctly', async ({ authenticatedPage }) => {
    await checkRedirectsForCurrency(authenticatedPage, 'RON');
  });

  test('UZS methods redirect correctly', async ({ authenticatedPage }) => {
    await checkRedirectsForCurrency(authenticatedPage, 'UZS');
  });
});

async function checkRedirectsForCurrency(page: Page, currency: string) {
  const mainPage = new MainPage(page);
  await mainPage.open();
  await mainPage.openDepositModal();
  const modal = new DepositModal(page);
  const methods = await modal.selectCurrencyAndGetMethods(currency);
  for (const method of methods) {
    await handleMethod(page, mainPage, modal, currency, method);
  }
}

async function handleMethod(
  page: Page,
  mainPage: MainPage,
  modal: DepositModal,
  currency: string,
  method: DepositMethod
) {
  const amount = Math.min(
    method.minAmount + 1,
    method.maxAmount ? method.maxAmount - 1 : method.minAmount + 1
  );
  await modal.openPaymentMethod(method.name);
  await modal.setAmount(amount);

  if (method.fields?.includes('fullForm')) {
    await modal.depositButton.click();
    await fillFullForm(page);
    if (method.fields.some((f) => f === 'holderCardForm' || f === 'cardForm')) {
      await fillHolderCardForm(page);
    }
    await page.waitForURL((url) => !url.includes('pingwincasino24.com'), {
      waitUntil: 'load',
      timeout: 15000,
    });
  } else if (method.fields?.some((f) => f === 'holderCardForm' || f === 'cardForm')) {
    await modal.depositButton.click();
    await fillHolderCardForm(page);
    await page.waitForURL((url) => !url.includes('pingwincasino24.com'), {
      waitUntil: 'load',
      timeout: 15000,
    });
  } else {
    await Promise.all([
      page.waitForURL((url) => !url.includes('pingwincasino24.com'), {
        waitUntil: 'load',
        timeout: 15000,
      }),
      modal.depositButton.click(),
    ]);
  }

  const finalUrl = page.url();
  const response = await page.request.get(finalUrl);
  expect(response.status()).toBe(200);
  expect(finalUrl).not.toContain('pingwincasino24.com');

  await mainPage.open();
  await mainPage.openDepositModal();
  await modal.selectCurrency(currency);
}

async function fillFullForm(page: Page) {
  await page.locator('input[name="fname"]').fill('John');
  await page.locator('input[name="lname"]').fill('Doe');
  const countryControl = page.locator('.select-countries .select__control');
  if (await countryControl.count()) {
    await countryControl.click();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
  }
  const selects = page.locator('select');
  if (await selects.count()) {
    await selects.nth(0).selectOption({ index: 0 });
    await selects.nth(1).selectOption({ index: 0 });
    await selects.nth(2).selectOption({ index: 0 });
  }
  await page.locator('input[name="city"]').fill('City');
  await page.locator('input[name="street"]').fill('Street');
  await page.locator('input[name="zip"]').fill('123456');
  await page.locator('input[name="email"]').fill('user@example.com');
  await page.locator('input[name="phone"]').fill('1234567890');
  await page.locator('button[type="submit"]').click();
}

async function fillHolderCardForm(page: Page) {
  await page.locator('input[name="card"]').fill('4111111111111111');
  await page.locator('input[name="expireMonth"]').fill('12');
  await page.locator('input[name="expireYear"]').fill('30');
  await page.locator('input[name="cvv"]').fill('123');
  await page.locator('input[name="holder"]').fill('JOHN DOE');
  await page.locator('button[type="submit"]').click();
}


