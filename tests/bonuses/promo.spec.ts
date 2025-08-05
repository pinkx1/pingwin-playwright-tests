import { test, expect } from '../../fixtures';

test('страница промокодов открывается', async ({ authenticatedPage: page }) => {
  await page.goto('/promocodes');
  await page.waitForLoadState('networkidle');
  await expect(page.getByPlaceholder('Промо-код')).toBeVisible();
});

