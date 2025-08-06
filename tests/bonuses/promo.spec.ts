import { test, expect } from '../../auth/user';

test('страница промокодов открывается', async ({ authenticatedPage: page }) => {
  await page.goto('/promocodes');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.getByPlaceholder('Промо-код')).toBeVisible();
});

