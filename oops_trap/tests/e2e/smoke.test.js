import { test, expect } from '@playwright/test'

test('app should load', async ({ page }) => {
  const response = await page.goto('/')
  expect(response?.status()).toBe(200)
})

test('home page should have content', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('body')).toContainText('Osssi Trap')
})
git add .