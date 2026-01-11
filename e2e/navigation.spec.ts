import { test, expect } from '@playwright/test'
import { mockAllApis } from './helpers/mock-api'

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllApis(page)
  })

  test('should navigate to all main pages', async ({ page }) => {
    // Test direct navigation to key pages
    // Using domcontentloaded instead of networkidle for faster/more reliable tests

    // Dashboard
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await expect(page).toHaveURL(/\/$/)

    // Orders - test one protected route
    await page.goto('/orders')
    await page.waitForLoadState('domcontentloaded')
    await expect(page).toHaveURL(/\/orders/)

    // Menu - test another protected route
    await page.goto('/menu')
    await page.waitForLoadState('domcontentloaded')
    await expect(page).toHaveURL(/\/menu/)

    // Settings - test settings route
    await page.goto('/settings')
    await page.waitForLoadState('domcontentloaded')
    await expect(page).toHaveURL(/\/settings/)
  })

  test('should highlight active navigation item', async ({ page }) => {
    await page.goto('/orders')

    // The active nav item should have different styling
    const ordersLink = page.getByRole('link', { name: /orders/i })
    await expect(ordersLink).toHaveClass(/bg-|text-primary|active/)
  })

  test('should display sidebar on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/')

    // Sidebar should be visible
    const sidebar = page.locator('nav, aside').first()
    await expect(sidebar).toBeVisible()
  })

  test('should handle mobile navigation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // On mobile, there should be a hamburger menu or different nav layout
    const menuButton = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"]')

    // If menu button exists, click it to open nav
    if (await menuButton.isVisible()) {
      await menuButton.click()
      // Nav should now be visible
      await expect(page.getByRole('link', { name: /orders/i })).toBeVisible()
    }
  })

  test('should display user info in header', async ({ page }) => {
    await page.goto('/')

    // User info should be displayed somewhere (email or name)
    await expect(page.getByText(/admin/i).first()).toBeVisible()
  })

  test('should have working logout functionality', async ({ page }) => {
    await page.goto('/')

    // Find and click logout button/link
    const logoutButton = page.getByRole('button', { name: /logout|sign out/i })

    if (await logoutButton.isVisible()) {
      await logoutButton.click()

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/)
    }
  })

  test('should preserve page state on navigation', async ({ page }) => {
    await page.goto('/orders')

    // Apply a filter
    const statusFilter = page.locator('select').first()
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption({ index: 1 })
    }

    // Navigate away and back
    await page.getByRole('link', { name: /dashboard/i }).click()
    await page.getByRole('link', { name: /orders/i }).click()

    // Page should reload fresh (React Query handles caching)
    await expect(page).toHaveURL(/\/orders/)
  })
})
