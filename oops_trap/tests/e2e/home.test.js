import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    // Переходим на домашнюю страницу перед каждым тестом
    await page.goto('/');
  });

  test('should load home page successfully', async ({ page }) => {
    // Проверяем что страница загрузилась
    await expect(page).toHaveURL('#/');
    await expect(page.locator('.home-page')).toBeVisible();
  });

  test('should display all main buttons', async ({ page }) => {
    // Проверяем наличие всех кнопок
    await expect(page.getByRole('button', { name: 'Sign Up' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Rules' })).toBeVisible();
  });

  test('should have responsive design on mobile', async ({ page }) => {
    // Устанавливаем мобильное разрешение
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Проверяем что контейнер адаптировался
    await expect(page.locator('.home-container')).toBeVisible();
    
    // Проверяем что кнопки отображаются корректно
    await expect(page.getByRole('button', { name: 'Sign Up' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Rules' })).toBeVisible();
  });
});