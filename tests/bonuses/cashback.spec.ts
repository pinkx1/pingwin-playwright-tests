import { test, expect } from '../../fixtures';

test('страница кешбэка открывается', async ({ authenticatedPage: page }) => {
  await page.goto('/cashback');
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('Ваш кешбэк')).toBeVisible();
});

