import { test, expect } from '../../fixtures/users/basicUser.fixture';

test('страница промокодов открывается', async ({ authenticatedPage: page }) => {
  await page.goto('/promocodes');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.getByPlaceholder('Промо-код')).toBeVisible();
});

