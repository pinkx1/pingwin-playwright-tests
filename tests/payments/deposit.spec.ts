import { test, expect } from '../../fixtures';
import { MainPage } from '../../pages/MainPage';
import { DepositModal } from '../../pages/payments/DepositModal';

const CARD_METHOD_IDENTIFIER = 'Банковская карта';

test.describe('Deposit feature', () => {
  // Перед каждым тестом открываем страницу депозита на уже авторизованном пользователе
  test.beforeEach(async ({ authenticatedPage: page }) => {
    const mainPage = new MainPage(page);
    await mainPage.open();
    await mainPage.openDepositModal();
  });

  test('deposit modal is visible', async ({ authenticatedPage: page }) => {
    const modal = new DepositModal(page);
    await modal.waitForVisible();
  });

  test('deposit limits are enforced', async ({ authenticatedPage: page }) => {
    test.setTimeout(180_000);
    const modal = new DepositModal(page);
    const currencies = await modal.getCurrencies();
    for (const currency of currencies) {
      await test.step(`Currency: ${currency}`, async () => {
        await modal.selectCurrency(currency);
        const methods = await modal.getPaymentMethods();
        for (let i = 0; i < methods.length; i++) {
          const method = methods[i];
          if (method === 'Binance Pay' || method.includes(CARD_METHOD_IDENTIFIER)) {
            await test.step(`Method: ${method}`, async () => {
              await modal.openPaymentMethodByIndex(i);
              const min = await modal.getMinDeposit();
              let max: number | null = null;
              try {
                max = await modal.getMaxDeposit();
              } catch {
                // Some methods may not provide a maximum limit
              }

              if (min > 0) {
                await modal.setAmount(min - 1);
                await expect(modal.depositButton).toBeDisabled();
              }
              await modal.setAmount(min);
              await expect(modal.depositButton).toBeEnabled();

              if (max !== null) {
                await modal.setAmount(max);
                await expect(modal.depositButton).toBeEnabled();
                await modal.setAmount(max + 1);
                await expect(modal.depositButton).toBeDisabled();
              }

              await modal.goBack();
            });
          }
        }
      });
    }
  });
});
