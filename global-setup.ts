// global-setup.ts
import { chromium } from '@playwright/test';
import fs from 'fs';
import { MainPage } from './pages/MainPage';
import { AuthModal } from './pages/AuthModal';
import { validUser, withdrawalUser } from './fixtures/data/userData';

async function loginAndSaveState(user: { email: string; password: string }, storagePath: string) {
	const browser = await chromium.launch();
	const context = await browser.newContext({
		locale: 'ru',
		viewport: { width: 1400, height: 800 },
		ignoreHTTPSErrors: true,
	});

	const page = await context.newPage();
	const authModal = new AuthModal(page);

	const baseURL = 'https://pingwincasino24.com';
	const mainPage = new MainPage(page, baseURL);

	await mainPage.open();

	await mainPage.openLoginModal();
	await authModal.login(user.email, user.password);

	await page.getByRole('link', { name: /avatar/i }).click({ force: true });

	await page.getByPlaceholder('Ваша почта').waitFor({ state: 'visible' });

	fs.mkdirSync('./storage', { recursive: true });
	await page.context().storageState({ path: storagePath });

	await browser.close();
}

export default async function globalSetup() {
	await loginAndSaveState(validUser, './storage/user.json');
	await loginAndSaveState(withdrawalUser, './storage/withdrawal-user.json');
}
