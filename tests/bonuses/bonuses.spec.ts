import { test, expect } from '../../fixtures';
import { MainPage } from '../../pages/MainPage';
import { AuthModal } from '../../pages/AuthModal';
import { MailSlurp } from 'mailslurp-client';

test('страница бонусов содержит акции', async ({ authenticatedPage: page }) => {
  await page.goto('/profile/bonuses');
  await page.waitForLoadState('domcontentloaded');
  const bonuses = page.getByRole('button', { name: 'Активировать' });
  await expect(bonuses.first()).toBeVisible();
});

test('активация бонуса открывает модалку депозита', async ({ page }) => {
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);
  const mailslurp = new MailSlurp({
    apiKey: process.env.MAILSLURP_API_KEY!,
  });


  const inbox = await mailslurp.inboxController.createInboxWithDefaults();
  const email = inbox.emailAddress as string;
  const password = 'TestPassword123!';

  await mainPage.open();
  await mainPage.openRegisterModal();
  await authModal.register(email, password);
  await authModal.waitForEmailConfirmation();

  const latestEmail = await mailslurp.waitController.waitForLatestEmail({
    inboxId: inbox.id!,
    timeout: 60000,
    unreadOnly: true,
  });
  const confirmationLinkMatch = latestEmail.body?.match(/https?:\/\/[^\s]+/);
  expect(confirmationLinkMatch).not.toBeNull();
  const confirmationLink = confirmationLinkMatch![0];
  await page.goto(confirmationLink);

  await mainPage.open();
  const loginButton = page.getByRole('button', { name: 'Войти' });
  if (await loginButton.isVisible()) {
    await mainPage.openLoginModal();
    await authModal.login(email, password);
    await authModal.closeSmsConfirmationIfVisible();
    await authModal.closeEmailConfirmationIfVisible();
  }

  await page.goto('/profile/bonuses');
  const activateButton = page.getByRole('button', { name: 'Активировать' }).first();
  await activateButton.waitFor({ state: 'visible', timeout: 15000 });
  await activateButton.click();

  const confirmation = page.getByText('Ваш бонус успешно активирован!');
  await expect(confirmation).toBeVisible();
});

