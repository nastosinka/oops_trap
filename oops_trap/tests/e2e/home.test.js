import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173/#';

async function openSignUpModal(page) {
  // Кликаем на кнопку Sign Up
  await page.click('button:has-text("Sign Up")');
  
  // Ждем появления модалки
  await page.waitForSelector('.modal-overlay, .modal', { state: 'visible', timeout: 5000 });
  
  // Проверяем, что появилась форма
  await expect(page.locator('.auth-form')).toBeVisible({ timeout: 5000 });
}

async function openSignInModal(page) {
  await page.click('button:has-text("Sign In")');
  await page.waitForSelector('.modal-overlay, .modal', { state: 'visible', timeout: 5000 });
  await expect(page.locator('.auth-form')).toBeVisible({ timeout: 5000 });
}

test.describe('Аутентификация', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.home-container')).toBeVisible({ timeout: 10000 });
  });

  test('должна отображать все основные кнопки', async ({ page }) => {
    await expect(page.locator('button:has-text("Sign Up")')).toBeVisible();
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
    await expect(page.locator('button:has-text("Rules")')).toBeVisible();
  });

  test('должна открывать модальное окно регистрации', async ({ page }) => {
    await openSignUpModal(page);
    

    const form = page.locator('.auth-form');
    await expect(form).toBeVisible();
    
    const inputs = form.locator('.auth-form__input');
    await expect(inputs).toHaveCount(3, { timeout: 5000 });
    
    await expect(page.getByText('Name', { exact: true })).toBeVisible();
    await expect(page.getByText('Password', { exact: true })).toBeVisible();
    await expect(page.getByText('Confirm Password', { exact: true })).toBeVisible();
    
    const labels = form.locator('.floating-label');
    await expect(labels.filter({ hasText: /^Name$/ })).toBeVisible();
    await expect(labels.filter({ hasText: /^Password$/ })).toBeVisible();
    await expect(labels.filter({ hasText: 'Confirm Password' })).toBeVisible();
  });

  test('должна открывать модальное окно входа', async ({ page }) => {
    await openSignInModal(page);
    
    const form = page.locator('.auth-form');
    await expect(form).toBeVisible();
    
    const inputs = form.locator('.auth-form__input');
    await expect(inputs).toHaveCount(2, { timeout: 5000 });
    
    await expect(page.getByText('Name', { exact: true })).toBeVisible();
    await expect(page.getByText('Password', { exact: true })).toBeVisible();
  });

  test('должна показывать ошибку при несовпадении паролей', async ({ page }) => {
    await openSignUpModal(page);
    
    const form = page.locator('.auth-form');
    const inputs = form.locator('.auth-form__input');
    

    await inputs.nth(0).fill('testuser');
    await inputs.nth(1).fill('password123');
    await inputs.nth(2).fill('differentpassword');
    
    await expect(page.locator('.auth-form__error:has-text("Passwords don\'t match")')).toBeVisible({ timeout: 5000 });
    
    const submitButton = form.locator('button[type="submit"]');
    await expect(submitButton).toBeDisabled();
  });

  test('должна показывать успех при совпадении паролей', async ({ page }) => {
    await openSignUpModal(page);
    
    const form = page.locator('.auth-form');
    const inputs = form.locator('.auth-form__input');
    
    await inputs.nth(0).fill('testuser');
    await inputs.nth(1).fill('password123');
    await inputs.nth(2).fill('password123');
    
    await expect(page.locator('.auth-form__success:has-text("Passwords match")')).toBeVisible({ timeout: 5000 });
    
    const submitButton = form.locator('button[type="submit"]');
    await expect(submitButton).toBeEnabled();
  });

  test('должна успешно регистрировать пользователя (с моком API)', async ({ page }) => {
    await page.route('**/api/auth/register', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 1, username: 'testuser' },
          token: 'fake-jwt-token'
        })
      });
    });

    await openSignUpModal(page);
    
    const form = page.locator('.auth-form');
    const inputs = form.locator('.auth-form__input');
    
    await inputs.nth(0).fill('testuser');
    await inputs.nth(1).fill('password123');
    await inputs.nth(2).fill('password123');
    
    const submitButton = form.locator('button[type="submit"]');
    await submitButton.click();
    
    try {
      await page.waitForURL('**/createLobby', { timeout: 5000 });
    } catch {
      await expect(page.locator('.modal-overlay')).not.toBeVisible({ timeout: 5000 });
    }
  });

  test('должна успешно авторизовывать пользователя (с моком API)', async ({ page }) => {
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 1, username: 'testuser' },
          token: 'fake-jwt-token'
        })
      });
    });

    await openSignInModal(page);
    
    const form = page.locator('.auth-form');
    const inputs = form.locator('.auth-form__input');
    
    await inputs.nth(0).fill('testuser');
    await inputs.nth(1).fill('password123');
    
    const submitButton = form.locator('button[type="submit"]');
    await submitButton.click();
    
    try {
      await page.waitForURL('**/createLobby', { timeout: 5000 });
    } catch {
      await expect(page.locator('.modal-overlay')).not.toBeVisible({ timeout: 5000 });
    }
  });
});
