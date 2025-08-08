import { test, expect } from '../../fixtures/users/basicUser.fixture';
import { MainPage } from '../../pages/MainPage';
import { AuthModal } from '../../pages/AuthModal';
import { MailSlurp } from 'mailslurp-client';

// Проверка: страница бонусов содержит хотя бы одну акцию
test('страница бонусов содержит акции', async ({ authenticatedPage: page }) => {
  await page.goto('/profile/bonuses');
  await page.waitForLoadState('domcontentloaded');

  const bonuses = page.getByRole('button', { name: 'Активировать' });
  const isVisible = await bonuses.first().isVisible().catch(() => false);
  await expect(bonuses.first(), `Ожидалось: хотя бы один бонус будет отображён, но получили: ${isVisible ? 'виден' : 'не виден'}`)
    .toBeVisible();
});

// Проверка: активация бонуса открывает модалку депозита
test('активация бонуса открывает модалку депозита', async ({ page }) => {
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);
  const mailslurp = new MailSlurp({
    apiKey: process.env.MAILSLURP_API_KEY!,
  });

  const inbox = await mailslurp.inboxController.createInboxWithDefaults();
  const email = inbox.emailAddress as string;
  const password = 'TestPassword123!';

  // Регистрация
  await mainPage.open();
  await mainPage.openRegisterModal();
  await authModal.register(email, password);
  await authModal.waitForEmailConfirmation();

  // Получаем письмо
  const latestEmail = await mailslurp.waitController.waitForLatestEmail({
    inboxId: inbox.id!,
    timeout: 60_000,
    unreadOnly: true,
  });

  const confirmationLinkMatch = latestEmail.body?.match(/https?:\/\/[^\s]+/);
  expect(confirmationLinkMatch, 'Ожидалось: в теле письма будет ссылка подтверждения, но не нашли').not.toBeNull();

  const confirmationLink = confirmationLinkMatch![0];
  await page.goto(confirmationLink);

  // Авторизация (если требуется)
  await mainPage.open();
  const loginButton = page.getByRole('button', { name: 'Войти' });
  if (await loginButton.isVisible()) {
    await mainPage.openLoginModal();
    await authModal.login(email, password);
    await authModal.closeSmsConfirmationIfVisible();
    await authModal.closeEmailConfirmationIfVisible();
  }

  // Переход на страницу бонусов и активация
  await page.goto('/profile/bonuses');

  const activateButton = page.getByRole('button', { name: 'Активировать' }).first();
  await activateButton.waitFor({ state: 'visible', timeout: 15_000 });
  const isActivateVisible = await activateButton.isVisible();
  await expect(activateButton, `Ожидалось: кнопка "Активировать" будет видна, но получили: ${isActivateVisible ? 'видна' : 'не видна'}`)
    .toBeVisible();

  await activateButton.click();

  const confirmation = page.getByText('Ваш бонус успешно активирован!');
  const isConfirmationVisible = await confirmation.isVisible().catch(() => false);
  await expect(confirmation, `Ожидалось: сообщение об активации бонуса будет видно, но получили: ${isConfirmationVisible ? 'видно' : 'не видно'}`)
    .toBeVisible();
});
