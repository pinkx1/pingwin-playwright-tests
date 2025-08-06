import { test, expect } from '../../auth/user';

test('страница кешбэка открывается', async ({ authenticatedPage: page }) => {
  await page.goto('/cashback');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.getByText('Ваш кешбэк')).toBeVisible();
});

