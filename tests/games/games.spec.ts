import { test, expect } from '@playwright/test';
import { MainPage } from '../../pages/MainPage';
import { AuthModal } from '../../pages/AuthModal';
import { validUser } from '../../fixtures/userData';

test.beforeEach(async ({ page }) => {
  const mainPage = new MainPage(page);
  const authModal = new AuthModal(page);
  await mainPage.open();
  await mainPage.openLoginModal();
  await authModal.login(validUser.email, validUser.password);
});

// Tests for Games page

test('loads and displays game list with images', async ({ page }) => {
  await page.goto('/games');
  await expect(page).toHaveURL(/\/games/);
  const firstCard = page.locator('[class*="game-card"]').first();
  await firstCard.waitFor({ state: 'visible' });
  await expect(firstCard.locator('img').first()).toBeVisible();
});

test('search and filters work', async ({ page }) => {
  await page.goto('/games');
  const search = page.getByPlaceholder('Найди свою игру');

  // search by name
  await search.fill('book');
  await page.goto('/games?search=book');
  const bookCard = page.getByRole('button', { name: /book/i }).first();
  await bookCard.waitFor();
  await expect(page.getByRole('button', { name: /Magic Apple/i })).toHaveCount(0);

  // reset search
  await page.goto('/games');
  await page.getByRole('button', { name: /Magic Apple/i }).first().waitFor();

  // category filter
  await page.getByRole('combobox', { name: 'Фильтр' }).click();
  await page.getByRole('option', { name: /Книги/ }).click();
  const bookFiltered = page.getByRole('button', { name: /book/i }).first();
  await bookFiltered.waitFor();
  await expect(page.getByRole('button', { name: /Magic Apple/i })).toHaveCount(0);

  // reset by reloading
  await page.goto('/games');
  await page.getByRole('button', { name: /Magic Apple/i }).first().waitFor();

  // provider filter
  await page.getByRole('combobox', { name: 'Провайдеры' }).click();
  await page.getByRole('option', { name: /Playson/ }).click();
  const playsonGame = page.getByRole('button', { name: /Hot Coins/i }).first();
  await playsonGame.waitFor();
  await expect(page.getByRole('button', { name: /Magic Apple/i })).toHaveCount(0);
});

// Launch games and visual comparison
const launchGames = [
  'Hot Fruits',
  'Magic Apple',
  'Hit Slot 2025',
  'Shining Crown',
  'Gates of Olympus',
  'Coin Express',
];

for (const game of launchGames) {
  test(`${game} launches and matches screenshot`, async ({ page }) => {
    const query = encodeURIComponent(game);
    await page.goto(`/games?search=${query}`);
    const cardButton = page
      .getByRole('button', { name: new RegExp(game, 'i') })
      .first();
    await cardButton.waitFor();
    await cardButton.hover();
    const playLink = cardButton.locator('a[href$="/play"]');
    await playLink.waitFor({ state: 'visible' });
    await Promise.all([
      page.waitForURL(/\/play/),
      playLink.click(),
    ]);
    const slug = game.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    await expect(page).toHaveScreenshot(`${slug}.png`, { maxDiffPixels: 100 });
  });
}

