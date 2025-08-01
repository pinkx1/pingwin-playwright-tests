import { test, expect } from '@playwright/test';
import { MainPage } from '../../pages/MainPage';
import { AuthModal } from '../../pages/AuthModal';

const MAIL_ID = process.env.TEMP_MAIL_ID;
const MAIL_ADDRESS = process.env.TEMP_MAIL_ADDRESS;
const API_KEY = process.env.RAPIDAPI_KEY;

const shouldSkip = !(MAIL_ID && MAIL_ADDRESS && API_KEY);

(test.skip as any)(shouldSkip, 'Temp Mail credentials are not provided');

function randomPassword() {
  return 'Pwd' + Math.random().toString(36).slice(2, 10) + '!';
}

test('подтверждение email через Temp Mail', async ({ page }) => {
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);
  const password = randomPassword();

  await mainPage.open();
  await mainPage.openRegisterModal();
  await authModal.register(MAIL_ADDRESS!, password);

  await authModal.waitForEmailConfirmation();
  const response = await fetch(`https://privatix-temp-mail-v1.p.rapidapi.com/request/one_mail/id/${MAIL_ID}/`, {
    headers: {
      'x-rapidapi-host': 'privatix-temp-mail-v1.p.rapidapi.com',
      'x-rapidapi-key': API_KEY!,
    },
  });
  const json = await response.json();
  expect(json.mail_text || json.mail_html).toBeTruthy();
});
