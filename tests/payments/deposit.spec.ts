import { test, expect } from '../../fixtures/fixtures';
import { Page } from '@playwright/test';
import { MainPage } from '../../pages/MainPage';
import { DepositModal } from '../../pages/DepositModal';

const currencies = ['USD', 'EUR', 'UAH', 'KZT', 'RON', 'UZS'];
const ERROR_COLOR = 'rgb(218, 68, 68)';

test.describe.configure({ mode: 'serial' });

test('Deposit methods limits validation', async ({ authenticatedPage: page }) => {
  const mainPage = new MainPage(page);
  await mainPage.open();
  await mainPage.openDepositModal();
  const modal = new DepositModal(page);

  for (const currency of currencies) {
    await checkCurrency(page, modal, currency);
  }
});

async function checkCurrency(page: Page, modal: DepositModal, currency: string) {
  const convertPromise = page.waitForResponse(r =>
    r.url().includes('/server/convertBalance') && r.url().includes(`currency=${currency}`)
  );
  const balancePromise = page.waitForResponse(r =>
    r.url().includes('/server/getConvertedBalance')
  );
  const methodsPromise = page.waitForResponse(r =>
    r.url().includes('/server/payment/fiat/payment/methods')
  );

  await modal.selectCurrency(currency);

  const convertResp = await convertPromise;
  expect(convertResp.status()).toBe(200);
  const balanceResp = await balancePromise;
  expect(balanceResp.status()).toBe(200);
  const methodsResp = await methodsPromise;
  expect(methodsResp.status()).toBe(200);
  const data = await methodsResp.json();
  const methods = data.methods.map((m: any) => ({ name: m.name, min: m.minAmount, max: m.maxAmount }));

  const uiNames = await modal.getPaymentMethodNames();
  for (const m of methods) {
    expect(uiNames).toContain(m.name);
  }

  for (const m of methods) {
    await modal.openPaymentMethod(m.name);
    const min = await modal.getMinDeposit();
    const max = await modal.getMaxDeposit();
    expect(min).toBe(m.min);
    expect(max).toBe(m.max);

    await checkAmount(modal, m.min - 1, false);
    await checkAmount(modal, m.min, true);
    await checkAmount(modal, m.max, true);
    await checkAmount(modal, m.max + 1, false);

    await modal.goBack();
    await modal.waitForPaymentMethods();
  }
}

async function checkAmount(modal: DepositModal, value: number, valid: boolean) {
  await modal.setAmount(value);
  if (valid) {
    await expect(modal.depositButton).toBeEnabled();
    expect(await modal.getAmountColor()).not.toBe(ERROR_COLOR);
  } else {
    await expect(modal.depositButton).toBeDisabled();
    expect(await modal.getAmountColor()).toBe(ERROR_COLOR);
  }
}
