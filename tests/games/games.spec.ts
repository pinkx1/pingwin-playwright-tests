import { test, expect } from '../../fixtures';

// Все тесты в этом файле используют authenticatedPage,
// поэтому логин выполняется один раз в beforeAll фикстуры.

// Tests for Games page

test('каталог игр отображает все категории и карточки', async ({ authenticatedPage: page }) => {
  await page.goto('/games');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000); // на всякий случай, если lazy load

  const categories = [
    'Популярные',
    'Новые',
    'Эксклюзив',
    'Hold & Win',
    'Книги',
    'Фрукты',
    'Megaways',
    'Джекпот',
  ];

  for (const categoryName of categories) {
    const heading = page.locator('div.sc-4e55357-2', { hasText: categoryName }).first();
    await expect(heading, `Заголовок категории "${categoryName}" не найден`).toBeVisible();

    // Контейнер с карточками — ищем первый блок после заголовка
    const categoryContainer = heading.locator('xpath=../../following-sibling::*[1]');
    await expect(categoryContainer, `Контейнер карточек для "${categoryName}" не найден`).toBeVisible();

    const cards = categoryContainer.locator('[role="button"]');
    const count = await cards.count();

    console.log(`🟢 Категория "${categoryName}" содержит ${count} карточек`);
    expect(count, `Ожидалось ровно 12 карточек в категории "${categoryName}", но найдено ${count}`).toBe(12);

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);

      // 1. Проверка на видимость изображения
      const img = card.locator('img');
      await expect(img, `Изображение отсутствует в карточке #${i + 1} категории "${categoryName}"`).toBeVisible();

      // 2. Проверка наличия названия (текст или alt)
      const altText = await img.getAttribute('alt');
      const textContent = (await card.textContent())?.trim();
      expect(altText || textContent, `Карточка #${i + 1} категории "${categoryName}" не содержит названия`).toBeTruthy();

      // 3. Проверка ссылки на игру, строго заканчивается на "/play"
      const hrefCandidates = await card.locator('a').evaluateAll(anchors =>
        anchors.map(a => a.getAttribute('href')).filter(Boolean)
      );
      const playHref = hrefCandidates.find(href => href?.endsWith('/play'));
      expect(playHref, `В карточке #${i + 1} категории "${categoryName}" нет ссылки на /play`).toBeTruthy();
    }
  }
});


test('поиск текста категорий игр', async ({ authenticatedPage: page }) => {
  await page.goto('/games');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  const categories = [
    'Популярные',
    'Новые',
    'Эксклюзив',
    'Hold & Win',
    'Книги',
    'Фрукты',
    'Megaways',
    'Джекпот'
  ];

  for (const cat of categories) {
    const el = page.getByText(cat, { exact: true });
    const count = await el.count();
    console.log(`🔍 "${cat}" найдено: ${count}`);

    if (count > 0) {
      const tag = await el.first().evaluate(node => node.tagName);
      const className = await el.first().getAttribute('class');
      const outer = await el.first().evaluate(node => node.outerHTML.slice(0, 300));
      console.log(`⮕ tag=${tag}, class=${className}\n⮑ outerHTML: ${outer}`);
    } else {
      console.log(`⚠️ "${cat}" не найден вообще!`);
    }
  }

  await page.pause(); // сможешь глазами всё посмотреть
});





test('search and filters work', async ({ authenticatedPage: page }) => {
  await page.goto('/games');
  const search = page.getByPlaceholder('Найди свою игру');

  // search by name
  await search.fill('book');
  await page.goto('/games?search=book');
  const bookCard = page.getByRole('button', { name: /book/i }).first();
  await bookCard.waitFor();
  await expect(page.getByRole('button', { name: /Magic Apple/i })).toHaveCount(0);

  // reset search
  await page.goto('/games');
  await page.getByRole('button', { name: /Magic Apple/i }).first().waitFor();

  // category filter
  await page.getByRole('combobox', { name: 'Фильтр' }).click();
  await page.getByRole('option', { name: /Книги/ }).click();
  const bookFiltered = page.getByRole('button', { name: /book/i }).first();
  await bookFiltered.waitFor();
  await expect(page.getByRole('button', { name: /Magic Apple/i })).toHaveCount(0);

  // reset by reloading
  await page.goto('/games');
  await page.getByRole('button', { name: /Magic Apple/i }).first().waitFor();

  // provider filter
  await page.getByRole('combobox', { name: 'Провайдеры' }).click();
  await page.getByRole('option', { name: /Playson/ }).click();
  const playsonGame = page.getByRole('button', { name: /Hot Coins/i }).first();
  await playsonGame.waitFor();
  await expect(page.getByRole('button', { name: /Magic Apple/i })).toHaveCount(0);
});

// Launch games and visual comparison
const launchGames = [
  'Hot Fruits',
  'Magic Apple',
  'Hit Slot 2025',
  'Shining Crown',
  'Gates of Olympus',
  'Coin Express',
];

for (const game of launchGames) {
  test(`${game} launches and matches screenshot`, async ({ authenticatedPage: page }) => {
    const query = encodeURIComponent(game);
    await page.goto(`/games?search=${query}`);
    const cardButton = page
      .getByRole('button', { name: new RegExp(game, 'i') })
      .first();
    await cardButton.waitFor();
    await cardButton.hover();
    const playLink = cardButton.locator('a[href$="/play"]');
    await playLink.waitFor({ state: 'visible' });
    await Promise.all([
      page.waitForURL(/\/play/),
      playLink.click(),
    ]);
    const slug = game.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    await expect(page).toHaveScreenshot(`${slug}.png`, { maxDiffPixels: 100 });
  });
}

