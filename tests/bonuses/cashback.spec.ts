import { test, expect } from '../../fixtures/users/basicUser.fixture';

test('страница кешбэка открывается', async ({ authenticatedPage: page }) => {
  await page.goto('/cashback');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.getByText('Ваш кешбэк')).toBeVisible();
});

