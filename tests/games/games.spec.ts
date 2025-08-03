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
  const bookCard = page.locator('[class*="game-card"]', { hasText: /book/i }).first();
  await bookCard.waitFor({ state: 'visible' });
  await expect(page.locator('[class*="game-card"]', { hasText: 'Magic Apple' })).toHaveCount(0);

  // clear search
  await search.fill('');

  // category filter
  await page.locator('#react-select-15-input').click();
  await page.getByRole('option', { name: /Книги/ }).click();
  const bookAfterFilter = page.locator('[class*="game-card"]', { hasText: /book/i }).first();
  await bookAfterFilter.waitFor({ state: 'visible' });
  await expect(page.locator('[class*="game-card"]', { hasText: 'Magic Apple' })).toHaveCount(0);

  // reset by reloading
  await page.goto('/games');

  // provider filter
  await page.locator('#react-select-16-input').click();
  await page.getByRole('option', { name: /Playson/ }).click();
  const playsonCard = page.locator('[class*="game-card"]', { hasText: 'Hot Coins' }).first();
  await playsonCard.waitFor({ state: 'visible' });
  await expect(page.locator('[class*="game-card"]', { hasText: 'Magic Apple' })).toHaveCount(0);
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
    await page.goto('/games');
    const search = page.getByPlaceholder('Найди свою игру');
    await search.fill(game);
    const card = page.locator('[class*="game-card"]', { hasText: new RegExp(game, 'i') }).first();
    await card.waitFor({ state: 'visible' });
    await card.getByRole('link', { name: 'Играть' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/play/);
    const slug = game.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    await expect(page).toHaveScreenshot(`${slug}.png`, { maxDiffPixels: 100 });
  });
}

