import { test, expect } from '@playwright/test';
import { MainPage } from '../../pages/MainPage';
import { RegisterPage } from '../../pages/auth/RegisterPage';

function generateRandomGmail(): string {
    const prefix = Math.random().toString(36).substring(2, 10);
    return `${prefix}@gmail.com`;
}

test('форма регистрации открывается и закрывается', async ({ page }) => {
    const mainPage = new MainPage(page);
    const register = new RegisterPage(page);

    await mainPage.open();
    await mainPage.openRegisterModal();
    await register.waitForVisible();
    await expect(register.header).toBeVisible();
    await expect(register.emailInput).toBeVisible();
    await register.close();
});

// Validation tests

test('валидация пустых полей при регистрации по почте', async ({ page }) => {
    const mainPage = new MainPage(page);
    const register = new RegisterPage(page);

    await mainPage.open();
    await mainPage.openRegisterModal();

    await register.submit();

    const errors = register.dialog.locator('.error');
    await expect(errors).toHaveCount(2);
});

test('нельзя зарегистрироваться с уже существующим email', async ({ page }) => {
    const mainPage = new MainPage(page);
    const register = new RegisterPage(page);
    const email = 'aaccforgithubtests@gmail.com';
    const password = '123qweQWE!';

    await mainPage.open();
    await mainPage.openRegisterModal();
    await register.fillEmail(email);
    await register.fillPassword(password);
    await register.checkAge();
    await register.checkTerms();
    await register.submit();

    await expect(register.toastError).toContainText('Ошибка регистрации');
});

test('успешная регистрация нового пользователя', async ({ page }) => {
    const mainPage = new MainPage(page);
    const register = new RegisterPage(page);
    const email = generateRandomGmail();
    const password = 'TestPassword123!';

    await mainPage.open();
    await mainPage.openRegisterModal();
    await register.fillEmail(email);
    await register.fillPassword(password);
    await register.checkAge();
    await register.checkTerms();
    await register.submit();

    // ждем появление модалки подтверждения и закрываем ее если нужно
    await page.locator('img[src*="email-spin.svg"]').waitFor({ state: 'visible', timeout: 5000 });
    await page.locator('img[src*="close-dialog"]').first().click();

    await page.locator('a[href="/ru/profile"]').click();
    const emailInput = page.getByPlaceholder('Ваша почта');
    await expect(emailInput).toHaveValue(email);
});

// Пример теста подтверждения почты через Temp Mail
// Для запуска требуется ключ RAPIDAPI_KEY в переменных окружения
// Тест будет пропущен, если ключ не задан

test('подтверждение почты через письмо', async ({ page }) => {
    test.skip(!process.env.RAPIDAPI_KEY, 'no api key');

    const mainPage = new MainPage(page);
    const register = new RegisterPage(page);

    // Получаем домен для временной почты
    const domainsResp = await fetch('https://privatix-temp-mail-v1.p.rapidapi.com/request/domains/', {
        headers: {
            'X-Rapidapi-Key': process.env.RAPIDAPI_KEY!,
            'X-Rapidapi-Host': 'privatix-temp-mail-v1.p.rapidapi.com'
        }
    });
    const domains = await domainsResp.json() as string[];
    const email = `${Math.random().toString(36).substring(2,8)}${domains[0]}`;

    // Создаём id почтового ящика
    const md5 = await page.evaluate((e) => {
        return window.crypto.subtle.digest('MD5', new TextEncoder().encode(e)).then(buf => {
            return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
        });
    }, email);

    const password = 'TestPassword123!';
    await mainPage.open();
    await mainPage.openRegisterModal();
    await register.fillEmail(email);
    await register.fillPassword(password);
    await register.checkAge();
    await register.checkTerms();
    await register.submit();

    await page.locator('img[src*="email-spin.svg"]').waitFor({ state: 'visible', timeout: 5000 });

    // Пытаемся получить письмо
    const mailResp = await fetch(`https://privatix-temp-mail-v1.p.rapidapi.com/request/one_mail/id/${md5}/`, {
        headers: {
            'X-Rapidapi-Key': process.env.RAPIDAPI_KEY!,
            'X-Rapidapi-Host': 'privatix-temp-mail-v1.p.rapidapi.com'
        }
    });
    const mail = await mailResp.json();
    expect(mail.mail_html).toBeTruthy();
});
