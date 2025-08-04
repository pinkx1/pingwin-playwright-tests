import { test, expect } from '../../withdrawalFixtures';
import { MainPage } from '../../pages/MainPage';
import { WithdrawalModal } from '../../pages/payments/WithdrawalModal';
import { withdrawalMethods, withdrawalLimits } from '../../fixtures/withdrawalData';

test.describe('Withdrawal feature', () => {
  // Перед каждым тестом открываем вкладку вывода средств в уже авторизованной сессии
  test.beforeEach(async ({ authenticatedPage: page }) => {
    const mainPage = new MainPage(page);
    await mainPage.open();
    await mainPage.openDepositModal();
    const modal = new WithdrawalModal(page);
    await modal.withdrawTab.click();
  });

  test('withdrawal modal is visible', async ({ authenticatedPage: page }) => {
    const modal = new WithdrawalModal(page);
    await modal.waitForVisible();
  });

  test('payment methods correspond to currency', async ({ authenticatedPage: page }) => {
    const modal = new WithdrawalModal(page);
    for (const [currency, methods] of Object.entries(withdrawalMethods)) {
      await modal.selectCurrency(currency);
      await modal.waitForPaymentMethods(methods, currency);
    }
  });

  test('withdrawal amount validation', async ({ authenticatedPage: page }) => {
    test.setTimeout(180_000);
    const modal = new WithdrawalModal(page);
    for (const [currency, limits] of Object.entries(withdrawalLimits)) {
      await test.step(`Currency: ${currency}`, async () => {
        await modal.selectCurrency(currency);
        await modal.waitForPaymentMethods(withdrawalMethods[currency], currency);
        for (const [method, { min, max }] of Object.entries(limits)) {
          await test.step(`Method: ${method}`, async () => {
            await modal.openPaymentMethod(method);
            if (min > 0) {
              await modal.setAmount(min - 1);
              const actualBelow = await modal.amountInput.inputValue();
              await expect(
                modal.amountInput,
                `${currency} ${method}: entered ${actualBelow} but min is ${min} – expected invalid`,
              ).toHaveClass(/eTDIAg/);
              await expect(
                modal.amountInput,
                `${currency} ${method}: entered ${actualBelow} but min is ${min} – expected red color`,
              ).toHaveCSS('color', 'rgb(218, 68, 68)');
            }
            await modal.setAmount(min);
            const actualMin = await modal.amountInput.inputValue();
            await expect(
              modal.amountInput,
              `${currency} ${method}: entered ${actualMin} (min ${min}) – expected accepted`,
            ).toHaveClass(/jBHWnj/);
            await modal.setAmount(max);
            const actualMax = await modal.amountInput.inputValue();
            await expect(
              modal.amountInput,
              `${currency} ${method}: entered ${actualMax} (max ${max}) – expected accepted`,
            ).toHaveClass(/jBHWnj/);
            await modal.setAmount(max + 1);
            const actualAbove = await modal.amountInput.inputValue();
            await expect(
              modal.amountInput,
              `${currency} ${method}: entered ${actualAbove} > max ${max} – expected invalid`,
            ).toHaveClass(/eTDIAg/);
            await expect(
              modal.amountInput,
              `${currency} ${method}: entered ${actualAbove} > max ${max} – expected red color`,
            ).toHaveCSS('color', 'rgb(218, 68, 68)');
            await modal.goBack();
            await modal.waitForPaymentMethods(withdrawalMethods[currency], currency);
          });
        }
      });
    }
  });
});
