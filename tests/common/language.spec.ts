import { test, expect } from '../../fixtures';

// Тесты локализации главной страницы
// Проверяем, что при переключении языка текст кнопки депозита меняется

const languages = [
  { name: 'English', deposit: 'Deposit' },
  { name: 'Українська', deposit: 'Депозит' },
  { name: 'Қазақ', deposit: 'Депозит' },
  { name: 'Русский', deposit: 'Депозит' },
  { name: 'Deutsch', deposit: 'Einzahlen' },
  { name: 'Română', deposit: 'Depozit' },
  { name: "O'zbek", deposit: 'Depozit' },
];

for (const { name, deposit } of languages) {
  test(`deposit button is translated to ${deposit} for ${name}`, async ({ authenticatedPage: page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000); // ждем появления кнопки после загрузки

    // Открываем переключатель языка в подвале
    const control = page.locator('.language-select__control').last();
    await control.click();

    const option = page.locator('.language-select__option', { hasText: name }).first();
    await option.click();
    await page.waitForTimeout(1000); // ждем применения языка

    const depositButton = page
      .locator('img[src="/images/icons/wallet-balance.svg"]').locator('xpath=..');
    await expect(depositButton).toBeVisible();
    await expect(depositButton).toContainText(deposit, { timeout: 7000 });
  });
}

// TODO: добавить тесты переключения языка на страницах оплаты, когда появятся требования

