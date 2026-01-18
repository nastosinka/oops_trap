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

  // Ждём и кликаем на кнопку "Sign In"
  await page.click('button:has-text("Sign In")', { timeout: 30000 })

  // Ждём, пока форма авторизации станет видимой
  await page.waitForSelector('.auth-form', { state: 'visible' })

  // Перехватываем API-запрос на login и возвращаем фиктивный ответ
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

  // Получаем все поля ввода формы
  const inputs = page.locator('.auth-form__input')

  // Вводим логин
  await inputs.nth(0).fill(username)

  // Вводим пароль
  await inputs.nth(1).fill(password)

  // Нажимаем кнопку "Sign In"
  await page.locator('.auth-form button:has-text("Sign In")').click()

  // Ждём перехода на страницу создания лобби
  await page.waitForURL('**/createLobby')
}

/* =========================
   TESTS
========================= */
test.describe('CreateLobbyPage — FULL COVERAGE', () => {
  /* =========================
     BEFORE EACH
  ========================= */
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({})
      })
    })
    // Логиним пользователя перед каждым тестом
    await loginUser(page)

    // Проверяем, что главная страница CreateLobbyPage видима
    await expect(page.locator('.create-lobby-page')).toBeVisible()
  })

  /* =========================
     RULES MODAL TEST
  ========================= */
  test('Rules modal открывается и закрывается', async ({ page }) => {
    // Нажимаем кнопку "Rules"
    await page.click('button:has-text("Rules")')

    // Находим модалку правил
    const modal = page.locator('.modal--rules')

    // Проверяем, что модалка видима
    await expect(modal).toBeVisible()

    // Проверяем, что правила отображаются
    await expect(modal.locator('.rules-accordion')).toBeVisible()

    // Закрываем модалку
    await modal.locator('.modal__close').click()

    // Проверяем, что модалки больше нет на странице
    await expect(modal).toHaveCount(0)
  })

  /* =========================
     STATS MODAL: DATA
  ========================= */
  test('Stats modal отображает статистику', async ({ page }) => {
    // Подменяем ответ API для статистики
    await page.route('**/api/stats/*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { map_id: 'Map 1', role: 'runner', best_time: 120 }
        ])
      })
    })

    // Кликаем на иконку трофея для открытия модалки статистики
    await page.click('.trophy-icon')

    // Находим модалку статистики
    const modal = page.locator('.modal--stats')

    // Проверяем, что модалка видима
    await expect(modal).toBeVisible()

    // Проверяем, что таблица с данными видна
    await expect(modal.locator('table')).toBeVisible()

    // Закрываем модалку статистики
    await modal.locator('.modal__close').click()
  })

  /* =========================
     STATS MODAL: EMPTY
  ========================= */
  test('Stats modal корректно обрабатывает пустую статистику', async ({
    page
  }) => {
    // Подменяем API на пустой массив
    await page.route('**/api/stats/*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      })
    })

    // Кликаем на иконку трофея
    await page.click('.trophy-icon')

    // Находим модалку статистики
    const modal = page.locator('.modal--stats')

    // Проверяем, что модалка видима
    await expect(modal).toBeVisible()

    // Проверяем, что текст "No statistics available" виден
    await expect(modal).toContainText('No statistics available')

    // Закрываем модалку
    await modal.locator('.modal__close').click()
  })

  /* =========================
     CREATE LOBBY: SUCCESS
  ========================= */
  test('успешное создание лобби', async ({ page }) => {
    await page.route('**/api/lobby/lobbies/*/settings', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 123,
          name: 'Test Lobby',
          owner: 'testuser',
          players: ['testuser'],
          mode: 'join',
          settings: { map: 'Map 1', difficulty: 'easy' }
        })
      })
    })
    // Перехватываем API для создания лобби
    await page.route('**/api/lobby/newlobby', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 111 })
      })
    })

    // Нажимаем кнопку создания лобби
    await page.click('button:has-text("Create a lobby")')

    // Ждём, пока URL изменится на новый лобби
    await page.waitForURL('**/lobby?id=111&mode=create')
  })

  /* =========================
     CREATE LOBBY: ERROR
  ========================= */
  test('ошибка при создании лобби отображается пользователю', async ({
    page
  }) => {
    // Подменяем API на ошибку сервера
    await page.route('**/api/lobby/newlobby', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Create lobby failed' })
      })
    })

    // Нажимаем кнопку создания лобби
    await page.click('button:has-text("Create a lobby")')

    // Находим модалку ошибки
    const errorModal = page.locator('.ant-modal, .modal')

    // Проверяем, что модалка видима
    await expect(errorModal).toBeVisible()

    // Проверяем, что текст ошибки содержит слово "error" или "failed"
    await expect(errorModal).toContainText(/error|failed/i)
  })

  /* =========================
     JOIN LOBBY: SUCCESS
  ========================= */
  test('успешное подключение к лобби', async ({ page }) => {
    await page.route('**/api/lobby/lobbies/*/settings', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 123,
          name: 'Test Lobby',
          owner: 'adminchik',
          players: ['adminchik', 'testuser'],
          mode: 'join',
          settings: { map: 'Map 1', difficulty: 'easy' }
        })
      })
    })
    // Открываем модалку Join Lobby
    await page.click('button:has-text("Join the lobby")')

    const modal = page.locator('.modal:not(.modal--rules):not(.modal--stats)')

    // Проверяем, что модалка видима
    await expect(modal).toBeVisible()

    // Подменяем API для join lobby
    await page.route('**/api/lobby/lobbies/123/join', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 123 })
      })
    })

    // Вводим код лобби
    await modal.locator('input.auth-form__input').fill('123')

    // Кликаем кнопку Join
    await modal.locator('button:has-text("Join")').click()

    // Ждём редиректа на страницу лобби
    await page.waitForURL('**/lobby?id=123&mode=join')
  })

  /* =========================
     JOIN LOBBY: ERROR
  ========================= */
  test('ошибка при подключении к лобби отображается', async ({ page }) => {
    // Открываем модалку Join Lobby
    await page.click('button:has-text("Join the lobby")')

    const joinModal = page.locator(
      '.modal:not(.modal--rules):not(.modal--stats)'
    )
    await expect(joinModal).toBeVisible()

    // Вводим код лобби, который приведет к ошибке
    await joinModal.locator('input.auth-form__input').fill('999')

    // Коды ошибок
    const errorCodes = [401, 404, 500]
    let currentCodeIndex = 0

    await page.route('**/api/lobby/lobbies/999/join', async route => {
      const code = errorCodes[currentCodeIndex % errorCodes.length]
      currentCodeIndex++

      await route.fulfill({
        status: code,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Failed to join lobby' })
      })
    })

    // Нажимаем кнопку Join
    await joinModal.locator('button:has-text("Join")').click()

    // Ждём появления ошибки
    const errorToast = page.locator('text=Failed to join lobby')

    // Проверяем, что текст содержит один из кодов ошибки
    await expect(errorToast).toContainText(
      /Failed to join lobby: (401|404|500)/
    )

    // Закрываем ошибку, если есть кнопка OK
    const okButton = errorToast.locator('button:has-text("OK")')
    if (await okButton.count()) {
      await okButton.click()
    }
  })

  /* =========================
     EXIT MODAL TEST
  ========================= */
  test('Exit показывает confirm и Cancel не выходит', async ({ page }) => {
    // Нажимаем кнопку Exit
    await page.click('button:has-text("Exit")')

    // Находим confirm модалку
    const confirm = page.locator('.ant-modal-confirm')

    // Проверяем, что confirm модалка видима
    await expect(confirm).toBeVisible()

    // Нажимаем Cancel
    await confirm.locator('button:has-text("Cancel")').click()

    // Проверяем, что мы остались на CreateLobbyPage
    await expect(page.locator('.create-lobby-page')).toBeVisible()
  })

  /* =========================
     MOBILE VIEW TEST
  ========================= */
  test('страница корректно работает на мобильном разрешении', async ({
    page
  }) => {
    // Устанавливаем размер экрана для мобильного устройства
    await page.setViewportSize({ width: 375, height: 667 })

    // Проверяем видимость основных элементов
    await expect(page.locator('.create-lobby-page')).toBeVisible()
    await expect(page.locator('.nickname-label')).toBeVisible()
    await expect(page.locator('.trophy-icon')).toBeVisible()

    await expect(page.getByRole('button', { name: 'Rules' })).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Create a lobby' })
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Join the lobby' })
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Exit' })).toBeVisible()
  })

  /* =========================
     VISUAL ELEMENTS TEST
  ========================= */
  test('все основные элементы CreateLobbyPage видны', async ({ page }) => {
    // Проверяем видимость ключевых элементов
    const elements = [
      '.nickname-label',
      '.trophy-icon',
      'button:has-text("Rules")',
      'button:has-text("Create a lobby")',
      'button:has-text("Join the lobby")',
      'button:has-text("Exit")'
    ]

    for (const selector of elements) {
      await expect(page.locator(selector)).toBeVisible()
    }
  })

  test('кнопки и иконки не пересекаются', async ({ page }) => {
    // Находим элементы, которые должны не пересекаться
    const button = page.locator('button:has-text("Create a lobby")')
    const trophy = page.locator('.trophy-icon')

    // Получаем размеры и позиции на странице
    const buttonBox = await button.boundingBox()
    const trophyBox = await trophy.boundingBox()

    // Проверяем, что элементы существуют
    if (!buttonBox || !trophyBox) {
      throw new Error('Не удалось получить размеры кнопки или иконки')
    }

    // Проверяем, что элементы не пересекаются по вертикали
    const verticalOverlap = Math.max(
      0,
      Math.min(buttonBox.y + buttonBox.height, trophyBox.y + trophyBox.height) -
        Math.max(buttonBox.y, trophyBox.y)
    )
    expect(verticalOverlap).toBe(0)

    // Проверяем, что элементы не пересекаются по горизонтали
    const horizontalOverlap = Math.max(
      0,
      Math.min(buttonBox.x + buttonBox.width, trophyBox.x + trophyBox.width) -
        Math.max(buttonBox.x, trophyBox.x)
    )
    expect(horizontalOverlap).toBeLessThanOrEqual(trophyBox.width)
  })

  test('CreateLobbyPage корректно отображается на планшете', async ({
    page
  }) => {
    // Устанавливаем размер экрана планшета
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.waitForTimeout(1000)

    // Проверяем размеры кнопок, чтобы они не выходили за экран
    const buttons = page.locator('button')
    for (let i = 0; i < (await buttons.count()); i++) {
      const box = await buttons.nth(i).boundingBox()
      expect(box.width).toBeLessThanOrEqual(768)
    }
  })

  test('интерфейс адаптируется при изменении размеров окна', async ({
    page
  }) => {
    // Массив разных размеров: мобильный, планшет, десктоп
    const viewports = [
      { width: 375, height: 667 },
      { width: 768, height: 1024 },
      { width: 1440, height: 900 }
    ]

    const keyElements = [
      '.nickname-label',
      '.trophy-icon',
      'button:has-text("Rules")',
      'button:has-text("Create a lobby")',
      'button:has-text("Join the lobby")',
      'button:has-text("Exit")'
    ]

    for (const vp of viewports) {
      // Меняем размер окна
      await page.setViewportSize(vp)
      await page.waitForTimeout(500)

      // Проверяем видимость и границы элементов
      for (const selector of keyElements) {
        const el = page.locator(selector)
        await expect(el).toBeVisible()

        // Проверяем, что элемент не выходит за границы экрана
        const box = await el.boundingBox()
        expect(box.x + box.width).toBeLessThanOrEqual(vp.width)
        expect(box.y + box.height).toBeLessThanOrEqual(vp.height)
      }
    }
  })
})
