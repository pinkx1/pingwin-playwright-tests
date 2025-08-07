import { test, expect } from '../../fixtures/fixtures';
import { MainPage } from '../../pages/MainPage';
import { DepositModal } from '../../pages/DepositModal';

const currencies = ['USD', 'EUR', 'UAH', 'KZT', 'RON', 'UZS'];

test.describe.configure({ mode: 'serial' });

test.describe('Deposit feature', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    const mainPage = new MainPage(page);
    await mainPage.open();
    await mainPage.openDepositModal();
  });

  for (const currency of currencies) {
    test(`${currency} deposit flow matches API limits`, async ({ authenticatedPage: page }) => {
      const modal = new DepositModal(page);

      const [convert, converted, methodsResp] = await Promise.all([
        page.waitForResponse(
          (r) =>
            r.url().includes('/server/convertBalance') &&
            r.url().includes(`currency=${currency}`)
        ),
        page.waitForResponse((r) => r.url().includes('/server/getConvertedBalance')),
        page.waitForResponse((r) => r.url().includes('/server/payment/fiat/payment/methods')),
        modal.selectCurrency(currency),
      ]);

      expect(convert.status()).toBe(200);
      expect(converted.status()).toBe(200);
      expect(methodsResp.status()).toBe(200);

      const { methods } = await methodsResp.json();
      const apiNames = methods.map((m: any) => m.name);

      await modal.waitForPaymentMethods();
      const uiNames = await modal.getPaymentMethodNames();
      for (const name of apiNames) {
        expect(uiNames).toContain(name);
      }

      for (const method of methods) {
        await modal.openPaymentMethod(method.name);

        const uiMin = await modal.getMinDeposit();
        const uiMax = await modal.getMaxDeposit();
        expect(uiMin).toBe(method.minAmount);
        expect(uiMax).toBe(method.maxAmount);

        await modal.setAmount(method.minAmount - 1);
        await expect(modal.depositButton).toBeDisabled();
        await expect(modal.amountInput).toHaveCSS('color', 'rgb(218, 68, 68)');

        await modal.setAmount(method.minAmount);
        await expect(modal.depositButton).toBeEnabled();

        await modal.setAmount(method.maxAmount);
        await expect(modal.depositButton).toBeEnabled();

        await modal.setAmount(method.maxAmount + 1);
        await expect(modal.depositButton).toBeDisabled();
        await expect(modal.amountInput).toHaveCSS('color', 'rgb(218, 68, 68)');

        await modal.goBack();
        await modal.waitForPaymentMethods();
      }
    });
  }
});

