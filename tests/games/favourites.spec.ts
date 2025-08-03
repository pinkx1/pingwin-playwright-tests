import { test, expect } from '@playwright/test';

// Tests for favourites functionality

test('add and remove game from favourites', async ({ page }) => {
  // ensure favourites empty
  await page.goto('/games/favorite');
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('Мы не нашли таких игр')).toBeVisible();

  // add game to favourites
  await page.goto('/games');
  const search = page.getByPlaceholder('Найди свою игру');
  await search.fill('Magic Apple');
  const card = page.locator('[class*="game-card"]', { hasText: 'Magic Apple' }).first();
  await card.waitFor({ state: 'visible' });
  await card.locator('img[src*="heart"]').click();
  await expect(card.locator('img[src*="heart-filled"]').first()).toBeVisible();

  // verify in favourites
  await page.goto('/games/favorite');
  const favCard = page.locator('[class*="game-card"]', { hasText: 'Magic Apple' });
  await favCard.waitFor({ state: 'visible' });

  // remove from favourites
  await favCard.locator('img[src*="heart-filled"]').click();
  await page.reload();
  await expect(page.getByText('Мы не нашли таких игр')).toBeVisible();
});

