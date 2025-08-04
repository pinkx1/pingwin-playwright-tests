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
  await authModal.closeSmsConfirmationIfVisible();
  await authModal.closeEmailConfirmationIfVisible();
  await page.getByRole('button', { name: 'Депозит' }).first().waitFor();
});

// Tests for Games page

test('loads and validates game catalog', async ({ page }) => {
  await page.goto('/games');
  await expect(page).toHaveURL(/\/games/);

  const categories = [
    'Популярные',
    'Новые',
    'Эксклюзив',
    'Hold & Win',
    'Книги',
    'Фрукты',
    'Megaways',
    'Джекпот',
  ];

  for (const category of categories) {
    const section = page.locator('section:has(h2:has-text("' + category + '"))');
    await expect(section, `Section with heading ${category} should be visible`).toBeVisible();

    const cards = section.locator('a[href][class*="game-card"]');
    await expect(cards, `Category ${category} should have 12 cards`).toHaveCount(12);

    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const href = await card.getAttribute('href');
      expect(href, `Card href should lead to game play page`).toMatch(/\/ru\/games\/.*\/play$/);
      await expect(card.locator('img'), 'Card should have an image').toBeVisible();
      const alt = await card.locator('img').getAttribute('alt');
      const text = (await card.textContent())?.trim();
      expect(alt?.trim() || text, 'Card should have a game name').toBeTruthy();
    }
  }
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

