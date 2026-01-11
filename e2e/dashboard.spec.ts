import { test, expect } from '@playwright/test'
import { mockDashboardApi, mockAuthApi } from './helpers/mock-api'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthApi(page)
    await mockDashboardApi(page)
  })

  test('should display dashboard page', async ({ page }) => {
    await page.goto('/')

    // Check page header
    await expect(page.locator('h1')).toContainText(/dashboard/i)

    // Check welcome message
    await expect(page.getByText(/welcome/i)).toBeVisible()
  })

  test('should display stats cards', async ({ page }) => {
    await page.goto('/')

    // Wait for stats to load
    await page.waitForLoadState('networkidle')

    // Check for stat cards (should have 4 stats)
    const statCards = page.locator('.card').filter({ hasText: /total|orders|duration|rate/i })
    await expect(statCards.first()).toBeVisible()
  })

  test('should display recent calls section', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check for recent calls heading
    await expect(page.getByText(/recent calls/i)).toBeVisible({ timeout: 10000 })

    // Check for "View All" link
    const viewAllLink = page.getByRole('link', { name: /view all/i }).first()
    await expect(viewAllLink).toBeVisible()
  })

  test('should display recent orders section', async ({ page }) => {
    await page.goto('/')

    // Check for recent orders heading
    await expect(page.getByText(/recent orders/i)).toBeVisible()
  })

  test('should navigate to calls page from dashboard', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Wait for Recent Calls section to be visible first
    await expect(page.getByText(/recent calls/i)).toBeVisible({ timeout: 10000 })

    // Click "View All" link for calls
    await page.getByRole('link', { name: /view all/i }).first().click()

    // Should navigate to calls page
    await expect(page).toHaveURL(/\/calls/)
  })

  test('should display call outcomes section', async ({ page }) => {
    await page.goto('/')

    // Check for call outcomes heading
    await expect(page.getByText(/call outcomes/i)).toBeVisible()
  })

  test('should show loading skeleton initially', async ({ page }) => {
    // Intercept API calls to delay them - use tenant-based routes
    await page.route('**/tenants/*/calls/stats**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          total_calls: 150,
          total_orders: 45,
          avg_call_duration: 180,
          success_rate: 0.92,
        }),
      })
    })

    await page.route('**/tenants/*/calls**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [], total: 0, page: 1, page_size: 5 }),
      })
    })

    await page.route('**/tenants/*/orders**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [], total: 0, page: 1, page_size: 5 }),
      })
    })

    await page.goto('/')

    // Check for loading state (skeleton or spinner)
    const loadingElement = page.locator('[class*="skeleton"], [class*="animate-pulse"]')
    await expect(loadingElement.first()).toBeVisible()
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API to return error - use tenant-based routes
    await page.route('**/tenants/*/calls/stats**', (route) =>
      route.fulfill({
        status: 500,
        body: JSON.stringify({ detail: 'Server error' }),
      })
    )

    await page.goto('/')

    // Should show error state
    await expect(page.getByText(/error/i).first()).toBeVisible({ timeout: 10000 })
  })
})
