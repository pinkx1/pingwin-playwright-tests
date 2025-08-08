import { test, expect } from '../../fixtures/users/basicUser.fixture';

test.describe.configure({ mode: 'serial' })
test('игра добавляется в избранное и отображается в списке', async ({ authenticatedPage: page }) => {
  await page.goto('/games/favorite');
  const emptyState = page.getByText('Мы не нашли таких игр');
  await emptyState.waitFor();
  await expect(emptyState, 'Ожидалось: избранное пустое до добавления').toBeVisible();

  await page.goto('/games?search=Magic%20Apple');
  const card = page.getByRole('button', { name: /Magic Apple/ }).first();
  await card.scrollIntoViewIfNeeded();
  await card.hover();
  await card.click();
  await page.waitForTimeout(1000);

  const heartEmpty = page.locator('img[src*="heart-unfilled"]');
  await heartEmpty.waitFor({ state: 'visible' });
  await heartEmpty.click();

  const heartFilled = page.locator('img[src*="heart-filled"]').first();
  await expect(heartFilled, 'Ожидалось: иконка "в избранном" станет видимой после клика').toBeVisible();

  await page.goto('/games/favorite');
  const favCard = page.getByRole('button', { name: /Magic Apple/ }).first();
  await expect(favCard, 'Ожидалось: игра "Magic Apple" будет в избранном после добавления').toBeVisible();
});

test('удаление игры из избранного очищает список', async ({ authenticatedPage: page }) => {
  await page.goto('/games/favorite');
  const favCard = page.getByRole('button', { name: /Magic Apple/ }).first();
  await expect(favCard, 'Ожидалось: игра "Magic Apple" есть в избранном перед удалением').toBeVisible();

  await favCard.scrollIntoViewIfNeeded();
  await favCard.hover();

  const favHeartFilled = favCard.locator('img[src*="heart-filled"]');
  await favHeartFilled.waitFor({ state: 'visible' });
  await favHeartFilled.click();

  await page.reload();
  const emptyState = page.getByText('Мы не нашли таких игр');
  await expect(emptyState, 'Ожидалось: избранное станет пустым после удаления игры').toBeVisible();
});
