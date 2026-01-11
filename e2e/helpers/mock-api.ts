import { Page } from '@playwright/test'

/**
 * Mock authentication APIs for E2E testing
 */
export async function mockAuthApi(page: Page) {
  // Mock the login API
  await page.route('**/auth/login', async (route) => {
    const request = route.request()
    const postData = request.postData() || ''

    // Decode URL-encoded form data before checking credentials
    // Form data encodes @ as %40, so we need to decode it
    const decodedPostData = decodeURIComponent(postData)

    // Check for valid credentials
    if (decodedPostData.includes('admin@loman.ai') && decodedPostData.includes('admin123')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'test-access-token-12345',
          refresh_token: 'test-refresh-token-67890',
          token_type: 'bearer',
        }),
      })
    } else {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: 'Invalid email or password',
        }),
      })
    }
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
        role: 'restaurant_admin',
        tenant_id: 'tenant-456',
      }),
    })
  })
}

/**
 * Mock dashboard APIs
 */
export async function mockDashboardApi(page: Page) {
  // Mock calls stats API (dashboard uses tenants/{tenantId}/calls/stats)
  await page.route('**/tenants/*/calls/stats**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        total_calls: 150,
        avg_duration_seconds: 180,
        escalation_rate: 0.08,
        outcomes: {
          order_placed: 45,
          reservation_made: 30,
          inquiry_answered: 50,
          voicemail: 15,
          no_action: 10,
        },
        calls_by_hour: {},
        calls_by_day: {},
      }),
    })
  })

  // Mock recent calls API (tenants/{tenantId}/calls)
  await page.route('**/tenants/*/calls**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: 'call-1',
              tenant_id: 'tenant-456',
              from_number: '+1234567890',
              to_number: '+5551234567',
              direction: 'inbound',
              status: 'completed',
              outcome: 'order_placed',
              duration_seconds: 120,
              started_at: new Date().toISOString(),
              ended_at: new Date().toISOString(),
              escalated: false,
              escalated_to: null,
              recording_url: null,
              transcript: null,
              summary: null,
              sentiment: 'positive',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: 'call-2',
              tenant_id: 'tenant-456',
              from_number: '+0987654321',
              to_number: '+5551234567',
              direction: 'inbound',
              status: 'completed',
              outcome: 'reservation_made',
              duration_seconds: 90,
              started_at: new Date().toISOString(),
              ended_at: new Date().toISOString(),
              escalated: false,
              escalated_to: null,
              recording_url: null,
              transcript: null,
              summary: null,
              sentiment: 'neutral',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
          total: 2,
          page: 1,
          page_size: 5,
        }),
      })
    } else {
      await route.continue()
    }
  })

  // Mock orders API (tenants/{tenantId}/orders)
  await page.route('**/tenants/*/orders**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: 'order-1',
              customer_name: 'John Doe',
              customer_phone: '1234567890',
              items: [
                { name: 'Margherita Pizza', quantity: 2, price_cents: 1599 },
                { name: 'Caesar Salad', quantity: 1, price_cents: 1299 },
              ],
              total_cents: 2500,
              status: 'pending',
              created_at: new Date().toISOString(),
            },
            {
              id: 'order-2',
              customer_name: 'Jane Smith',
              customer_phone: '0987654321',
              items: [
                { name: 'Grilled Salmon', quantity: 1, price_cents: 2499 },
              ],
              total_cents: 3500,
              status: 'confirmed',
              created_at: new Date().toISOString(),
            },
          ],
          total: 2,
          page: 1,
          page_size: 20,
        }),
      })
    } else if (route.request().method() === 'PATCH') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'order-1', status: 'confirmed' }),
      })
    } else {
      await route.continue()
    }
  })
}

/**
 * Mock all APIs for a fully functional test environment
 */
export async function mockAllApis(page: Page) {
  await mockAuthApi(page)
  await mockDashboardApi(page)

  // Mock reservations API (tenants/{tenantId}/reservations)
  await page.route('**/tenants/*/reservations**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: 'reservation-1',
              customer_name: 'Jane Smith',
              customer_phone: '5551234567',
              customer_email: 'jane@example.com',
              party_size: 4,
              reservation_datetime: new Date().toISOString(),
              status: 'confirmed',
              created_at: new Date().toISOString(),
            },
            {
              id: 'reservation-2',
              customer_name: 'Bob Johnson',
              customer_phone: '5559876543',
              customer_email: 'bob@example.com',
              party_size: 2,
              reservation_datetime: new Date(Date.now() + 3600000).toISOString(),
              status: 'pending',
              created_at: new Date().toISOString(),
            },
          ],
          total: 2,
          page: 1,
          page_size: 20,
        }),
      })
    } else if (route.request().method() === 'PATCH') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'reservation-1', status: 'confirmed' }),
      })
    } else {
      await route.continue()
    }
  })

  // Mock menu API (tenants/{tenantId}/menu_items)
  await page.route('**/tenants/*/menu_items**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'item-1',
            name: 'Margherita Pizza',
            description: 'Classic tomato and mozzarella',
            price_cents: 1599,
            category: 'Pizza',
            is_active: true,
            is_available: true,
            dietary_tags: ['vegetarian'],
          },
          {
            id: 'item-2',
            name: 'Caesar Salad',
            description: 'Fresh romaine with parmesan',
            price_cents: 1299,
            category: 'Salads',
            is_active: true,
            is_available: true,
            dietary_tags: ['gluten-free'],
          },
          {
            id: 'item-3',
            name: 'Grilled Salmon',
            description: 'Atlantic salmon with herbs',
            price_cents: 2499,
            category: 'Main',
            is_active: true,
            is_available: false,
            dietary_tags: ['gluten-free', 'dairy-free'],
          },
        ]),
      })
    } else if (route.request().method() === 'DELETE') {
      await route.fulfill({ status: 204 })
    } else if (route.request().method() === 'PATCH') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'item-1', is_available: true }),
      })
    } else if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'item-new',
          name: 'New Item',
          price_cents: 999,
          category: 'Main',
          is_active: true,
          is_available: true,
        }),
      })
    } else {
      await route.continue()
    }
  })

  // Mock settings API (tenants/{tenantId}/settings)
  await page.route('**/tenants/*/settings**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          restaurant_name: 'Test Restaurant',
          phone: '555-123-4567',
          address: '123 Main St',
          timezone: 'America/New_York',
        }),
      })
    } else {
      await route.continue()
    }
  })
}
