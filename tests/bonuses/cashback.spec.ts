import { test, expect } from '../../fixtures/users/basicUser.fixture';

test('страница кешбэка открывается', async ({ authenticatedPage: page }) => {
  await page.goto('/cashback');
  await page.waitForLoadState('domcontentloaded');

  const cashbackHeader = page.getByText('Ваш кешбэк');
  const isVisible = await cashbackHeader.isVisible().catch(() => false);

  await expect(cashbackHeader, `Ожидалось: заголовок "Ваш кешбэк" будет отображён, но получили: ${isVisible ? 'виден' : 'не виден'}`)
    .toBeVisible();
});
