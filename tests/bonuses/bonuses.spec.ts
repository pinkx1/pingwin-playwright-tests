import { test, expect } from '../../fixtures';
import { MainPage } from '../../pages/MainPage';
import { AuthModal } from '../../pages/AuthModal';

function generateAutotestEmail(): string {
  const prefix = `autotest_${Math.random().toString(36).substring(2, 10)}`;
  return `${prefix}@gmail.com`;
}

test('страница бонусов содержит акции', async ({ authenticatedPage: page }) => {
  await page.goto('/profile/bonuses');
  await page.waitForLoadState('networkidle');
  const bonuses = page.getByRole('button', { name: 'Активировать' });
  await expect(bonuses.first()).toBeVisible();
});

test('активация бонуса открывает модалку депозита', async ({ page }) => {
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);
  const email = generateAutotestEmail();
  const password = 'TestPassword123!';

  await mainPage.open();
  await mainPage.openRegisterModal();
  await authModal.register(email, password);
  await authModal.closeEmailConfirmationIfVisible();
  await authModal.closeSmsConfirmationIfVisible();

  await page.goto('/profile/bonuses');
  const activateButton = page.getByRole('button', { name: 'Активировать' }).first();
  await activateButton.waitFor({ state: 'visible', timeout: 15000 });
  await activateButton.click();

  const confirmation = page.getByText('Ваш бонус успешно активирован!');
  await expect(confirmation).toBeVisible();
});

