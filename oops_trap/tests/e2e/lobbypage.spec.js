import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173/#';

/* =========================
   AUTH HELPER
========================= */
async function loginUser(page, username = 'testuser', password = 'password123') {
  // Переходим на базовый URL приложения
  await page.goto(BASE_URL, { timeout: 30000 });

  // Кликаем на кнопку "Sign In" для вызова формы авторизации
  await page.click('button:has-text("Sign In")', { timeout: 30000 });
  await page.waitForSelector('.auth-form', { state: 'visible' });

  // Мокаем API login, чтобы тесты работали без реального бэкенда
  await page.route('**/api/auth/login', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: { id: 1, username, name: username },
        token: 'fake-jwt-token',
      }),
    });
  });

  // Заполняем поля логина и пароля
  const inputs = page.locator('.auth-form__input');
  await inputs.nth(0).fill(username);
  await inputs.nth(1).fill(password);

  // Подтверждаем авторизацию
  await page.locator('.auth-form button:has-text("Sign In")').click();
  await page.waitForURL('**/createLobby'); // Ждём перехода на страницу создания лобби
}

/* =========================
   CREATE LOBBY HELPER
========================= */
async function createLobby(page, lobbyId = 123) {
  // Мокаем API создание нового лобби
  await page.route('**/api/lobby/newlobby', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: lobbyId }),
    });
  });

  // Кликаем на кнопку "Create a lobby"
  await page.click('button:has-text("Create a lobby")');
  await page.waitForURL(`**/lobby?id=${lobbyId}&mode=create`);
}

/* =========================
   LOBBY PAGE TESTS
========================= */
test.describe('LobbyPage — Visual Elements', () => {
  let lobbyId = 123;

  test.beforeEach(async ({ page }) => {
    await page.route('**/api/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });

    // Авторизация пользователя
    await loginUser(page);

    // Создание лобби
    await createLobby(page, lobbyId);

    // Мокаем конкретные API для LobbyPage
    await page.route(`**/api/lobby/lobbies/${lobbyId}/settings`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            ownerId: 1,
            map: 1,
            time: 'normal',
            trapper: 2
          }
        }),
      });
    });

    await page.route(`**/api/lobby/lobbies/${lobbyId}/status`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { status: 'waiting' }
        }),
      });
    });

    await page.route(`**/api/lobby/lobbies/${lobbyId}/users`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          players: [
            { id: 1, name: 'testuser', isHost: true },
            { id: 2, name: 'player2', isHost: false }
          ]
        }),
      });
    });
});


    /* =========================
    Проверка основных визуальных элементов
    ========================= */

  test('Все основные визуальные элементы отображаются', async ({ page }) => {
    // Проверяем nickname пользователя
    await expect(page.locator('.nickname')).toContainText('testuser');

    // Проверяем код лобби
    await expect(page.locator('.lobby-code')).toContainText(`Code: ${lobbyId}`);

    // Проверяем статус лобби
    await expect(page.locator('.lobby-status')).toContainText('Status: waiting');

    // Проверяем кнопки действий
    const settingsButton = page.locator('button:has-text("Settings")');
    const startButton = page.locator('button:has-text("Start")');
    const exitButton = page.locator('button:has-text("Exit")');

    await expect(settingsButton).toBeVisible();
    await expect(startButton).toBeVisible();
    await expect(exitButton).toBeVisible();

    // Проверяем заголовок списка игроков
    await expect(page.locator('.players-scrollable-layer h2')).toContainText('Players (2)');
  });


    /* =========================
    Проверка отображения игроков и хоста
    ========================= */

  test('Список игроков корректно отображает хоста и роли', async ({ page }) => {
    const players = page.locator('.players-list .player');

    // Должно быть два игрока
    await expect(players).toHaveCount(2);

    // Проверяем первого игрока — хоста
    const firstPlayer = players.nth(0);
    await expect(firstPlayer.locator('.player-name')).toContainText('testuser');
    await expect(firstPlayer.locator('.player-host-badge')).toBeVisible();

    // Проверяем второго игрока — обычного
    const secondPlayer = players.nth(1);
    await expect(secondPlayer.locator('.player-name')).toContainText('player2');
    await expect(secondPlayer.locator('.player-host-badge')).toHaveCount(0);
  });


    /* =========================
    Проверка отображения настроек в модальном окне
    ========================= */

  test('Настройки лобби отображаются корректно', async ({ page }) => {
    // Открываем модалку настроек
    const settingsButton = page.locator('button:has-text("Settings")');
    await settingsButton.click();

    const modal = page.locator('.settings-modal');
    await expect(modal).toBeVisible();

    // Проверяем группы настроек
    await expect(modal.locator('.setting-title:has-text("map type")')).toBeVisible();
    await expect(modal.locator('.setting-title:has-text("mafia")')).toBeVisible();
    await expect(modal.locator('.setting-title:has-text("time")')).toBeVisible();

    // Проверяем, что select отображает замоканные значения
    const mapSelect = modal.locator('select.setting-select').nth(0);
    await expect(mapSelect).toHaveValue('1');

    const mafiaSelect = modal.locator('select.setting-select').nth(1);
    await expect(mafiaSelect).toHaveValue('1');

    const timeSelect = modal.locator('select.setting-select').nth(2);
    await expect(timeSelect).toHaveValue('normal');
  });
});
