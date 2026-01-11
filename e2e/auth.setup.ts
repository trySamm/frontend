import { test as setup, expect } from '@playwright/test'

const authFile = 'e2e/.auth/user.json'

/**
 * Authentication Setup
 * Logs in once and saves the authenticated state for reuse by other tests
 */
setup('authenticate', async ({ page }) => {
  // Mock the login API (form-urlencoded endpoint)
  await page.route('**/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'test-access-token-12345',
        refresh_token: 'test-refresh-token-67890',
        token_type: 'bearer',
      }),
    })
  })

  // Mock the user info API
  await page.route('**/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'user-123',
        email: 'admin@loman.ai',
        full_name: 'Admin User',
        role: 'admin',
        tenant_id: 'tenant-456',
      }),
    })
  })

  // Mock calls stats API (used on dashboard - tenants/{tenantId}/calls/stats)
  await page.route('**/tenants/*/calls/stats**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        total_calls: 150,
        total_orders: 45,
        avg_call_duration: 180,
        success_rate: 0.92,
        call_outcomes: {
          order_placed: 45,
          reservation: 30,
          inquiry: 50,
          voicemail: 15,
          other: 10,
        },
      }),
    })
  })

  // Mock recent calls API (tenants/{tenantId}/calls)
  await page.route('**/tenants/*/calls**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            id: 'call-1',
            caller_number: '+1234567890',
            outcome: 'order_placed',
            duration_seconds: 120,
            created_at: new Date().toISOString(),
          },
        ],
        total: 1,
        page: 1,
        page_size: 5,
      }),
    })
  })

  // Mock orders API (tenants/{tenantId}/orders)
  await page.route('**/tenants/*/orders**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            id: 'order-1',
            customer_name: 'John Doe',
            customer_phone: '1234567890',
            total_cents: 2500,
            status: 'pending',
            created_at: new Date().toISOString(),
          },
        ],
        total: 1,
        page: 1,
        page_size: 5,
      }),
    })
  })

  // Navigate to login page
  await page.goto('/login')

  // Verify we're on the login page
  await expect(page.locator('form')).toBeVisible()

  // Fill in the demo credentials
  await page.locator('input[type="email"]').fill('admin@loman.ai')
  await page.locator('input[type="password"]').fill('admin123')

  // Submit the form
  await page.locator('button[type="submit"]').click()

  // Wait for navigation to dashboard
  await page.waitForURL('/', { timeout: 10000 })

  // Verify we're authenticated by checking for dashboard elements
  await expect(page.locator('h1')).toContainText(/dashboard/i)

  // Save the authenticated state
  await page.context().storageState({ path: authFile })
})
