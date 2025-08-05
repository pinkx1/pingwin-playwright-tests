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

test('search and filters work', async ({ authenticatedPage: page }) => {
  await page.goto('/games');

  const search = page.getByPlaceholder('Найди свою игру');
  await expect(search, 'Поле поиска не найдено').toBeVisible();

  // 🔎 Поиск по названию
  await search.fill('book');
  await page.keyboard.press('Enter');
  await page.waitForURL(/search=book/, { timeout: 5000 });

  const bookCard = page.getByRole('button').filter({ hasText: /book/i }).first();
  await expect(bookCard, 'Игра с названием "book" не найдена после поиска').toBeVisible();

  await expect(
    page.getByRole('button').filter({ hasText: /^Magic Apple$/ })
  ).toHaveCount(0);

  // 🔄 Сброс поиска
  await page.goto('/games');
  const magicApples = page.getByRole('button').filter({ hasText: /Magic Apple/i });
  const count = await magicApples.count();
  expect(count, 'Ожидалось хотя бы одно совпадение с "Magic Apple"').toBeGreaterThan(0);




  // 🗂️ Фильтр по категории
  const categoryFilter = page.locator('div.react-select__single-value', { hasText: 'Фильтр' });
  await expect(categoryFilter, 'Фильтр по категориям не найден').toBeVisible();
  await categoryFilter.click();


  const booksOption = page.locator('[role="option"]').filter({ hasText: 'Книги' }).first();
  await expect(booksOption, 'Опция "Книги" в фильтре не найдена').toBeVisible();
  await booksOption.click();

  const filteredBook = page.getByRole('button').filter({ hasText: /book/i }).first();
  await expect(filteredBook, 'Игра "book" не найдена после фильтрации по категории').toBeVisible();
  await expect(
    page.getByRole('button').filter({ hasText: /Magic Apple/i })
  ).toHaveCount(0);

  // 🔄 Сброс фильтрации
  await page.goto('/games');
  const resetMagicApples = page.getByRole('button').filter({ hasText: /Magic Apple/i });
  const resetCount = await resetMagicApples.count();
  expect(resetCount, 'Ожидалось хотя бы одно совпадение с "Magic Apple" после сброса фильтра').toBeGreaterThan(0);




  // 🧪 Фильтр по провайдеру
  // 🧪 Фильтр по провайдеру
  const providerFilter = page.locator('div.react-select__single-value', { hasText: 'Провайдеры' });
  await expect(providerFilter, 'Фильтр по провайдерам не найден').toBeVisible();
  await providerFilter.click();

  const playsonOption = page.locator('div[role="option"]', { hasText: 'Playson' }).first();
  await expect(playsonOption, 'Опция "Playson" в фильтре не найдена').toBeVisible();
  await playsonOption.click();

  // ⏳ Ожидаем загрузку результатов фильтрации
  await page.waitForLoadState('networkidle');

  const playsonGame = page.getByRole('button').filter({ hasText: /Hot Coins/i }).first();
  await expect(playsonGame, 'Игра Playson не найдена после фильтрации по провайдеру').toBeVisible();

  const filteredOut = page.getByRole('button').filter({ hasText: /Magic Apple/i });
  const filteredCount = await filteredOut.count();
  expect(filteredCount, 'Ожидалось, что Magic Apple не попадёт в результат фильтрации по провайдеру').toBe(0);


});



// Launch games and check that game URLs load successfully
const launchGames = [
  'Hot Fruits',
  'Magic Apple',
  'Hit Slot 2025',
  'Shining Crown',
  'Gates of Olympus',
  'Coin Express',
];

for (const game of launchGames) {
  test(`${game} link loads without HTTP errors`, async ({ authenticatedPage: page }) => {
    const query = encodeURIComponent(game);
    await page.goto(`/games?search=${query}`);

    const cardButton = page
      .getByRole('button', { name: new RegExp(game, 'i') })
      .first();
    await expect(cardButton, `Карточка игры ${game} не найдена`).toBeVisible();
    await cardButton.hover();

    const playLink = cardButton.locator('a[href$="/play"]');
    await expect(playLink, `Кнопка запуска для ${game} не найдена`).toBeVisible();
    const playHref = await playLink.getAttribute('href');
    expect(playHref, `Ссылка запуска для ${game} отсутствует`).toBeTruthy();

    await Promise.all([
      page.waitForURL(/\/play/),
      playLink.click(),
    ]);

    const iframe = page.locator('iframe.game-iframe');
    await expect(iframe, `iframe для игры ${game} не найден`).toBeVisible();
    const gameSrc = await iframe.getAttribute('src');
    expect(gameSrc, `src для iframe игры ${game} отсутствует`).toBeTruthy();

    const response = await page.request.get(gameSrc!);
    expect(response.ok(), `Загрузка игры ${game} вернула статус ${response.status()}`).toBeTruthy();
  });
}
