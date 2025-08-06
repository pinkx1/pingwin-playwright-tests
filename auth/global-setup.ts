import { chromium, FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { MainPage } from '../pages/MainPage';
import { AuthModal } from '../pages/AuthModal';
import { validUser, withdrawalUser } from '../fixtures/userData';

const STORAGE_DIR = path.resolve(__dirname, '../storage');

async function login(user: { email: string; password: string }, storageFile: string, baseURL: string) {
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL, locale: 'ru', ignoreHTTPSErrors: true });
  const page = await context.newPage();
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);

  await mainPage.open();
  await mainPage.openLoginModal();
  await authModal.login(user.email, user.password);
  await authModal.closeSmsConfirmationIfVisible();
  await authModal.closeEmailConfirmationIfVisible();

  await context.storageState({ path: storageFile });
  await browser.close();
}

async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL as string;
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
  await login(validUser, path.join(STORAGE_DIR, 'user.json'), baseURL);
  await login(withdrawalUser, path.join(STORAGE_DIR, 'balance-user.json'), baseURL);
}

export default globalSetup;
