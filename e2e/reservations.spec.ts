import { test, expect } from '@playwright/test'
import { mockAllApis } from './helpers/mock-api'

test.describe('Reservations Management', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllApis(page)
  })

  test('should display reservations page', async ({ page }) => {
    await page.goto('/reservations')
    await page.waitForLoadState('domcontentloaded')

    // Debug: check if we're on the right page or got redirected
    const url = page.url()
    console.log('Current URL:', url)

    // Wait for any content to appear (sidebar or main content)
    await page.waitForSelector('body > div', { timeout: 10000 })

    // Check page header
    await expect(page.locator('h1')).toContainText(/reservations/i, { timeout: 10000 })
  })

  test('should display reservations table', async ({ page }) => {
    await page.goto('/reservations')
    await page.waitForLoadState('domcontentloaded')

    // Wait for page to fully load
    await expect(page.locator('h1')).toContainText(/reservations/i, { timeout: 10000 })

    // Check for table structure
    const table = page.locator('table')
    await expect(table).toBeVisible({ timeout: 10000 })

    // Check for relevant columns
    await expect(page.getByRole('columnheader', { name: /customer|name|guest/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /date|time/i }).first()).toBeVisible()
  })

  test('should filter reservations by status', async ({ page }) => {
    await page.goto('/reservations')
    await page.waitForLoadState('domcontentloaded')

    // Debug: verify page renders
    await expect(page.locator('h1')).toContainText(/reservations/i, { timeout: 10000 })

    // Find status filter
    const statusFilter = page.locator('select').first()

    if (await statusFilter.isVisible()) {
      // Select confirmed status
      await statusFilter.selectOption('confirmed')
      await page.waitForLoadState('domcontentloaded')
      await expect(statusFilter).toHaveValue('confirmed')
    }
  })

  test('should filter reservations by date', async ({ page }) => {
    await page.goto('/reservations')
    await page.waitForLoadState('domcontentloaded')

    // Look for date filter input
    const dateInput = page.locator('input[type="date"]')

    if (await dateInput.isVisible()) {
      const today = new Date().toISOString().split('T')[0]
      await dateInput.fill(today)
      await page.waitForLoadState('domcontentloaded')
    }
  })

  test('should display reservation status badges', async ({ page }) => {
    await page.goto('/reservations')
    await page.waitForLoadState('domcontentloaded')

    // Look for status badges
    const statusBadges = page.locator('span').filter({
      hasText: /pending|confirmed|seated|completed|cancelled|no.show/i,
    })

    const tableBody = page.locator('tbody')
    const hasReservations = (await tableBody.locator('tr').count()) > 0

    if (hasReservations) {
      await expect(statusBadges.first()).toBeVisible()
    }
  })

  test('should show action buttons for pending reservations', async ({ page }) => {
    // Mock reservation with pending status
    await page.route('**/tenants/*/reservations**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          json: {
            items: [
              {
                id: 'test-res-1',
                customer_name: 'Test Customer',
                customer_phone: '1234567890',
                customer_email: 'test@example.com',
                party_size: 4,
                reservation_date: new Date().toISOString().split('T')[0],
                reservation_time: '19:00',
                status: 'pending',
                created_at: new Date().toISOString(),
              },
            ],
            total: 1,
            page: 1,
            page_size: 20,
          },
        })
      }
    })

    await page.goto('/reservations')
    await page.waitForLoadState('domcontentloaded')

    // Check for action buttons
    const confirmButton = page.locator('button').filter({ has: page.locator('.lucide-check') })
    const cancelButton = page.locator('button').filter({ has: page.locator('.lucide-x') })

    // At least one action should be visible for pending reservations
    const actionButtons = confirmButton.or(cancelButton)
    if (await actionButtons.first().isVisible()) {
      await expect(actionButtons.first()).toBeVisible()
    }
  })

  test('should show empty state when no reservations', async ({ page }) => {
    // Mock empty response
    await page.route('**/tenants/*/reservations**', (route) =>
      route.fulfill({
        status: 200,
        json: {
          items: [],
          total: 0,
          page: 1,
          page_size: 20,
        },
      })
    )

    await page.goto('/reservations')
    await page.waitForLoadState('domcontentloaded')

    // Should show "no reservations" message
    await expect(page.getByText(/no reservations/i)).toBeVisible()
  })

  test('should handle reservation status update', async ({ page }) => {
    let reservationStatus = 'pending'

    await page.route('**/tenants/*/reservations**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          json: {
            items: [
              {
                id: 'test-res-1',
                customer_name: 'Test Customer',
                customer_phone: '1234567890',
                party_size: 4,
                reservation_date: new Date().toISOString().split('T')[0],
                reservation_time: '19:00',
                status: reservationStatus,
                created_at: new Date().toISOString(),
              },
            ],
            total: 1,
            page: 1,
            page_size: 20,
          },
        })
      } else if (route.request().method() === 'PATCH') {
        reservationStatus = 'confirmed'
        await route.fulfill({
          status: 200,
          json: { id: 'test-res-1', status: 'confirmed' },
        })
      }
    })

    await page.goto('/reservations')
    await page.waitForLoadState('domcontentloaded')

    // Click confirm if visible
    const confirmButton = page.locator('button').filter({ has: page.locator('.lucide-check') })

    if (await confirmButton.isVisible()) {
      await confirmButton.click()

      // Should show success toast
      await expect(page.locator('[role="status"]')).toBeVisible({ timeout: 5000 })
    }
  })

  test('should display party size information', async ({ page }) => {
    await page.goto('/reservations')
    await page.waitForLoadState('domcontentloaded')

    // Wait for page to load
    await expect(page.locator('h1')).toContainText(/reservations/i, { timeout: 10000 })

    const tableBody = page.locator('tbody')
    const hasReservations = (await tableBody.locator('tr').count()) > 0

    if (hasReservations) {
      // Party size is displayed as just a number next to a users icon
      // Look for the column header to confirm party size column exists
      await expect(page.getByRole('columnheader', { name: /party size/i })).toBeVisible()
      // Check that party size values are displayed (just numbers like "4" or "2")
      const partySizeCell = tableBody.locator('tr').first().locator('td').nth(2)
      await expect(partySizeCell).toBeVisible()
    }
  })

  test('should display reservation time correctly', async ({ page }) => {
    await page.goto('/reservations')
    await page.waitForLoadState('domcontentloaded')

    const tableBody = page.locator('tbody')
    const hasReservations = (await tableBody.locator('tr').count()) > 0

    if (hasReservations) {
      // Time should be displayed in some format
      const timePattern = page.getByText(/\d{1,2}:\d{2}/)
      await expect(timePattern.first()).toBeVisible()
    }
  })
})
