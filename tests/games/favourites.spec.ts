import { test, expect } from '../../fixtures';

test('add and remove game from favourites', async ({ authenticatedPage: page }) => {
  // ensure favourites empty
  await page.goto('/games/favorite');
  const emptyState = page.getByText('Мы не нашли таких игр');
  await emptyState.waitFor();
  await expect(emptyState).toBeVisible();

  // add game to favourites
  await page.goto('/games?search=Magic%20Apple');
  const card = page.getByRole('button', { name: /Magic Apple/ }).first();
  await card.scrollIntoViewIfNeeded();
  await card.hover();
  await card.click();
  await page.waitForTimeout(1000); // wait for animation
  const heartEmpty = page.locator('img[src*="heart-unfilled"]');
  await heartEmpty.waitFor({ state: 'visible' });
  await heartEmpty.click();
  await expect(page.locator('img[src*="heart-filled"]').first()).toBeVisible();

  // verify in favourites
  await page.goto('/games/favorite');
  const favCard = page.getByRole('button', { name: /Magic Apple/ }).first();
  await favCard.waitFor();
  await favCard.scrollIntoViewIfNeeded();
  await favCard.hover();

  // remove from favourites
  const heartFilled = favCard.locator('img[src*="heart-filled"]');
  await heartFilled.waitFor({ state: 'visible' });
  await heartFilled.click();
  await page.reload();
  await expect(page.getByText('Мы не нашли таких игр')).toBeVisible();
});

