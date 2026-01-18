import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:5173/#'

/* =========================
   AUTH HELPER
========================= */
async function loginUser(
  page,
  username = 'testuser',
  password = 'password123'
) {
  // Переходим на базовый URL приложения
  await page.goto(BASE_URL, { timeout: 30000 })

  // Кликаем на кнопку "Sign In" для вызова формы авторизации
  await page.click('button:has-text("Sign In")', { timeout: 30000 })
  await page.waitForSelector('.auth-form', { state: 'visible' })

  // Мокаем API login, чтобы тесты работали без реального бэкенда
  await page.route('**/api/auth/login', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: { id: 1, username, name: username },
        token: 'fake-jwt-token'
      })
    })
  })

  // Заполняем поля логина и пароля
  const inputs = page.locator('.auth-form__input')
  await inputs.nth(0).fill(username)
  await inputs.nth(1).fill(password)

  // Подтверждаем авторизацию
  await page.locator('.auth-form button:has-text("Sign In")').click()
  await page.waitForURL('**/createLobby') // Ждём перехода на страницу создания лобби
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
      body: JSON.stringify({ id: lobbyId })
    })
  })

  // Кликаем на кнопку "Create a lobby"
  await page.click('button:has-text("Create a lobby")')
  await page.waitForURL(`**/lobby?id=${lobbyId}&mode=create`)
}

/* =========================
   LOBBY PAGE TESTS
========================= */
test.describe('LobbyPage — Visual Elements', () => {
  let lobbyId = 123

  test.beforeEach(async ({ page }) => {
    // Мокаем все неспецифичные API запросы
    await page.route('**/api/**', async route => {
      // Пропускаем только те, которые будем мокать отдельно
      if (
        route.request().url().includes('/lobby/lobbies/') ||
        route.request().url().includes('/auth/')
      ) {
        return route.continue()
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({})
      })
    })

    // Авторизация пользователя
    await loginUser(page)

    // Создание лобби
    await createLobby(page, lobbyId)

    // Мокаем конкретные API для LobbyPage в правильном порядке

    // 1. API для проверки хоста (checkIfUserIsHost)
    await page.route(
      `**/api/lobby/lobbies/${lobbyId}/settings`,
      async route => {
        const method = route.request().method()

        if (method === 'GET') {
          // Первоначальный запрос для проверки хоста
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                ownerId: 1, // Убедитесь, что это совпадает с ID пользователя (1)
                map: 1,
                time: 'normal',
                trapper: 1 // Устанавливаем trapper в 1 для теста
              }
            })
          })
        } else if (method === 'POST') {
          // POST запрос для сохранения настроек
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true })
          })
        }
      }
    )

    // 2. API для статуса лобби
    await page.route(`**/api/lobby/lobbies/${lobbyId}/status`, async route => {
      const method = route.request().method()

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { status: 'waiting' }
          })
        })
      } else if (method === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      }
    })

    // 3. API для списка игроков
    await page.route(`**/api/lobby/lobbies/${lobbyId}/users`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          players: [
            { id: 1, name: 'testuser', isHost: true },
            { id: 2, name: 'player2', isHost: false }
          ]
        })
      })
    })

    // 4. API для heartbeat/ping
    await page.route(`**/api/lobby/lobbies/${lobbyId}/ping`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })

    // Ждем загрузки страницы лобби
    await page.waitForSelector('.lobby-container', { state: 'visible' })
    // Даем время для выполнения всех начальных запросов
    await page.waitForTimeout(1000)
  })

  /* =========================
    Проверка основных визуальных элементов
    ========================= */

  test('Все основные визуальные элементы отображаются', async ({ page }) => {
    // Проверяем nickname пользователя
    await expect(page.locator('.nickname')).toContainText('testuser')

    // Проверяем код лобби
    await expect(page.locator('.lobby-code')).toContainText(`Code: ${lobbyId}`)

    // Проверяем статус лобби
    await expect(page.locator('.lobby-status')).toContainText('Status: waiting')

    // Проверяем кнопки действий
    const settingsButton = page.locator('button:has-text("Settings")')
    const startButton = page.locator('button:has-text("Start")')
    const exitButton = page.locator('button:has-text("Exit")')

    await expect(settingsButton).toBeVisible()
    await expect(startButton).toBeVisible()
    await expect(exitButton).toBeVisible()

    // Проверяем заголовок списка игроков
    await expect(page.locator('.players-scrollable-layer h2')).toContainText(
      'Players (2)'
    )
  })

  /* =========================
    Проверка отображения игроков и хоста
    ========================= */

  test('Список игроков корректно отображает хоста и роли', async ({ page }) => {
    const players = page.locator('.players-list .player')

    // Должно быть два игрока
    await expect(players).toHaveCount(2)

    // Проверяем первого игрока — хоста
    const firstPlayer = players.nth(0)
    await expect(firstPlayer.locator('.player-name')).toContainText('testuser')
    await expect(firstPlayer.locator('.player-host-badge')).toBeVisible()

    // Проверяем второго игрока — обычного
    const secondPlayer = players.nth(1)
    await expect(secondPlayer.locator('.player-name')).toContainText('player2')
    await expect(secondPlayer.locator('.player-host-badge')).toHaveCount(0)
  })

  /* =========================
    Проверка отображения настроек в модальном окне
    ========================= */

  test('Настройки лобби отображаются корректно', async ({ page }) => {
    // Ждем пока загрузится список игроков
    await expect(page.locator('.players-list .player')).toHaveCount(2)

    // Даем время для завершения всех асинхронных операций
    await page.waitForTimeout(500)

    // Открываем модалку настроек
    const settingsButton = page.locator('button:has-text("Settings")')
    await settingsButton.click()

    const modal = page.locator('.settings-modal')
    await expect(modal).toBeVisible()

    // Даем время модалке полностью отрендериться
    await page.waitForTimeout(300)

    // Проверяем группы настроек
    await expect(
      modal.locator('.setting-title:has-text("map type")')
    ).toBeVisible()
    await expect(
      modal.locator('.setting-title:has-text("mafia")')
    ).toBeVisible()
    await expect(modal.locator('.setting-title:has-text("time")')).toBeVisible()

    // Проверяем, что select отображает замоканные значения

    // 1. Map select - должен быть '1'
    const mapSelect = modal.locator('select.setting-select').nth(0)
    await expect(mapSelect).toHaveValue('1')

    // 2. Mafia select - должен быть '1' (потому что trapper = 1 в моке)
    const mafiaSelect = modal.locator('select.setting-select').nth(1)
    // Даем дополнительное время для синхронизации данных
    await page.waitForTimeout(300)
    await expect(mafiaSelect).toHaveValue('1')

    // 3. Time select - должен быть 'normal'
    const timeSelect = modal.locator('select.setting-select').nth(2)
    await expect(timeSelect).toHaveValue('normal')
  })
})
