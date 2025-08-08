import { test, expect } from '../../fixtures/users/basicUser.fixture';

test('страница промокодов открывается', async ({ authenticatedPage: page }) => {
  await page.goto('/promocodes');
  await page.waitForLoadState('domcontentloaded');

  const input = page.getByPlaceholder('Промо-код');
  const isVisible = await input.isVisible().catch(() => false);

  await expect(input, `Ожидалось: поле ввода "Промо-код" будет видно, но получили: ${isVisible ? 'видно' : 'не видно'}`)
    .toBeVisible();
});
