// global-setup.ts
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { MainPage } from './pages/MainPage';
import { AuthModal } from './pages/AuthModal';
import { DepositModal } from './pages/DepositModal';
import { validUser, withdrawalUser } from './fixtures/data/userData';

const BASE_URL = 'https://pingwincasino24.com';
const CURRENCIES = ['USD', 'EUR', 'UAH', 'KZT', 'RON', 'UZS'] as const;

async function loginAndSaveState(user: { email: string; password: string }, storagePath: string) {
	const browser = await chromium.launch();
	const context = await browser.newContext({
		locale: 'ru',
		viewport: { width: 1400, height: 800 },
		ignoreHTTPSErrors: true,
	});

	const page = await context.newPage();
	const authModal = new AuthModal(page);
	const mainPage = new MainPage(page, BASE_URL);

	await mainPage.open();
	await mainPage.openLoginModal();
	await authModal.login(user.email, user.password);

	// убедимся, что вошли
	await page.getByRole('link', { name: /avatar/i }).click({ force: true });
	await page.getByPlaceholder('Ваша почта').waitFor({ state: 'visible' });

	fs.mkdirSync('./storage', { recursive: true });
	await context.storageState({ path: storagePath });
	await browser.close();
}

async function collectPaymentMethodsWithUI(storageStatePath: string) {
	const browser = await chromium.launch();
	const context = await browser.newContext({
		storageState: storageStatePath,
		locale: 'ru',
		viewport: { width: 1400, height: 800 },
		ignoreHTTPSErrors: true,
	});
	const page = await context.newPage();

	const mainPage = new MainPage(page, BASE_URL);
	await mainPage.open();
	await mainPage.openDepositModal();

	const modal = new DepositModal(page);
	const result: Record<string, any[]> = {};

	for (const cur of CURRENCIES) {
		try {
			const methods = await modal.selectCurrencyAndGetMethods(cur);
			result[cur] = methods.map(m => ({
				method: m.method,
				name: m.name,
				minAmount: m.minAmount,
				maxAmount: m.maxAmount,
				icon: m.icon,
				fields: m.fields || [],
			}));
		} catch (e) {
			console.warn(`[payment-methods] ${cur} failed:`, e);
			result[cur] = [];
		}
	}

	const out = path.resolve(__dirname, 'fixtures', 'data', 'payment-methods.json');
	fs.mkdirSync(path.dirname(out), { recursive: true });
	fs.writeFileSync(out, JSON.stringify(result, null, 2), 'utf-8');

	await browser.close();
}

export default async function globalSetup() {
	// 1) логиним и сохраняем стейты
	await loginAndSaveState(validUser, './storage/user.json');
	await loginAndSaveState(withdrawalUser, './storage/withdrawal-user.json');

	// 2) собираем методы через UI и сохраняем JSON
	await collectPaymentMethodsWithUI('./storage/user.json');
}
