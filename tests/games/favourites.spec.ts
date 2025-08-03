import { test, expect } from '@playwright/test';

// Tests for favourites functionality

test('add and remove game from favourites', async ({ page }) => {
  // ensure favourites empty
  await page.goto('/games/favorite');
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('Мы не нашли таких игр')).toBeVisible();

  // add game to favourites
  await page.goto('/games?search=Magic%20Apple');
  const card = page.getByRole('button', { name: /Magic Apple/ }).first();
  await card.waitFor();
  await card.hover();
  await card.locator('img[src*="heart-unfilled"]').click();
  await expect(card.locator('img[src*="heart-filled"]').first()).toBeVisible();

  // verify in favourites
  await page.goto('/games/favorite');
  const favCard = page.getByRole('button', { name: /Magic Apple/ }).first();
  await favCard.waitFor();
  await favCard.hover();

  // remove from favourites
  await favCard.locator('img[src*="heart-filled"]').click();
  await page.reload();
  await expect(page.getByText('Мы не нашли таких игр')).toBeVisible();
});

