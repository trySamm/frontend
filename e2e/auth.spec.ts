import { test, expect } from '@playwright/test'
import { mockAuthApi, mockDashboardApi } from './helpers/mock-api'

test.describe('Authentication', () => {
  // Don't use the authenticated state for auth tests
  test.use({ storageState: { cookies: [], origins: [] } })

  test('should display login page', async ({ page }) => {
    await page.goto('/login')

    // Check page structure
    await expect(page.locator('h2')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()

    // Check demo credentials are shown
    await expect(page.getByText('admin@loman.ai')).toBeVisible()
  })

  test('should login successfully with valid credentials', async ({ page }) => {
    // Setup mocks before navigating
    await mockAuthApi(page)
    await mockDashboardApi(page)

    await page.goto('/login')

    // Fill in credentials
    await page.locator('input[type="email"]').fill('admin@loman.ai')
    await page.locator('input[type="password"]').fill('admin123')

    // Submit form
    await page.locator('button[type="submit"]').click()

    // Should redirect to dashboard or orders - wait for URL change
    // The regex matches full URL ending with / or /orders
    await page.waitForURL(/\/(orders)?$/, { timeout: 15000 })

    // Wait for content to load - could be dashboard or orders
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 })
  })

  test('should show error with invalid credentials', async ({ page }) => {
    // Setup mocks before navigating
    await mockAuthApi(page)

    await page.goto('/login')

    // Fill in invalid credentials
    await page.locator('input[type="email"]').fill('invalid@test.com')
    await page.locator('input[type="password"]').fill('wrongpassword')

    // Submit form
    await page.locator('button[type="submit"]').click()

    // Should show error toast (react-hot-toast)
    await expect(page.locator('[role="status"]')).toBeVisible({ timeout: 5000 })
  })

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Try to access protected route
    await page.goto('/orders')

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/)
  })

  test('should validate required fields', async ({ page }) => {
    await page.goto('/login')

    // Try to submit without filling fields
    await page.locator('button[type="submit"]').click()

    // Form should not submit (HTML5 validation)
    await expect(page).toHaveURL(/\/login/)
  })

  test('should show loading state during login', async ({ page }) => {
    // Setup mocks with a delay to see loading state
    await page.route('**/auth/login', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          token_type: 'bearer',
        }),
      })
    })

    await page.goto('/login')

    // Fill credentials
    await page.locator('input[type="email"]').fill('admin@loman.ai')
    await page.locator('input[type="password"]').fill('admin123')

    // Click submit and check for loading state
    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()

    // Button should be disabled during loading
    await expect(submitButton).toBeDisabled()
  })
})
