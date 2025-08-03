import { test, expect } from '@playwright/test';

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

  // category filter
  await page.getByRole('combobox', { name: 'Фильтр' }).click();
  await page.getByRole('option', { name: /Книги/ }).click();
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('button', { name: /book/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Magic Apple/i })).toHaveCount(0);

  // reset by reloading
  await page.goto('/games');

  // provider filter
  await page.getByRole('combobox', { name: 'Провайдеры' }).click();
  await page.getByRole('option', { name: /Playson/ }).click();
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('button', { name: /Hot Coins/i })).toBeVisible();
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
    const cardButton = page.getByRole('button', { name: new RegExp(game, 'i') }).first();
    await cardButton.hover();
    await cardButton.click();
    await page.getByRole('link', { name: 'Играть' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/play/);
    const slug = game.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    await expect(page).toHaveScreenshot(`${slug}.png`, { maxDiffPixels: 100 });
  });
}

