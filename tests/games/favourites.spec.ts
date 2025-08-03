import { test, expect } from '@playwright/test';

// Tests for favourites functionality

test('add and remove game from favourites', async ({ page }) => {
  // ensure favourites empty
  await page.goto('/games/favorite');
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('Мы не нашли таких игр')).toBeVisible();

  // add game to favourites
  await page.goto('/games?search=Magic%20Apple', { waitUntil: 'networkidle' });
  const card = page.getByRole('button', { name: /Magic Apple/ }).first();
  await card.scrollIntoViewIfNeeded();
  await card.hover();
  await card.click();
  const heartEmpty = page.locator('img[src*="heart-unfilled"]');
  await heartEmpty.waitFor({ state: 'visible' });
  await heartEmpty.click();
  await expect(page.locator('img[src*="heart-filled"]').first()).toBeVisible();

  // verify in favourites
  await page.goto('/games/favorite');
  const favCard = page.getByRole('button', { name: /Magic Apple/ }).first();
  await favCard.scrollIntoViewIfNeeded();
  await favCard.hover();

  // remove from favourites
  const heartFilled = favCard.locator('img[src*="heart-filled"]');
  await heartFilled.waitFor({ state: 'visible' });
  await heartFilled.click();
  await page.reload();
  await expect(page.getByText('Мы не нашли таких игр')).toBeVisible();
});

