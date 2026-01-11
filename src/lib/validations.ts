/**
 * Zod Validation Schemas
 *
 * Runtime validation schemas that mirror TypeScript types in src/types/
 * Used for validating data before API mutations
 */

import { z } from 'zod'

// ============================================================================
// Menu Item Schemas
// ============================================================================

/**
 * Schema for creating a new menu item
 * Matches MenuItemCreate interface in src/types/menu.ts
 */
export const menuItemCreateSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be 200 characters or less'),
  description: z
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .optional(),
  price_cents: z
    .number()
    .int('Price must be a whole number')
    .min(0, 'Price cannot be negative'),
  category: z
    .string()
    .max(100, 'Category must be 100 characters or less')
    .optional(),
  image_url: z.string().url('Invalid image URL').optional().or(z.literal('')),
  is_active: z.boolean().optional().default(true),
  is_available: z.boolean().optional().default(true),
  dietary_tags: z.array(z.string()).optional().default([]),
  allergens: z.array(z.string()).optional().default([]),
  preparation_time_minutes: z
    .number()
    .int('Preparation time must be a whole number')
    .min(0, 'Preparation time cannot be negative')
    .max(480, 'Preparation time cannot exceed 8 hours')
    .optional(),
})

/**
 * Schema for updating an existing menu item
 * All fields are optional for partial updates
 * Matches MenuItemUpdate interface in src/types/menu.ts
 */
export const menuItemUpdateSchema = z.object({
  name: z
    .string()
    .min(1, 'Name cannot be empty')
    .max(200, 'Name must be 200 characters or less')
    .optional(),
  description: z
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .optional(),
  price_cents: z
    .number()
    .int('Price must be a whole number')
    .min(0, 'Price cannot be negative')
    .optional(),
  category: z
    .string()
    .max(100, 'Category must be 100 characters or less')
    .optional(),
  image_url: z.string().url('Invalid image URL').optional().or(z.literal('')),
  is_active: z.boolean().optional(),
  is_available: z.boolean().optional(),
  dietary_tags: z.array(z.string()).optional(),
  allergens: z.array(z.string()).optional(),
  preparation_time_minutes: z
    .number()
    .int('Preparation time must be a whole number')
    .min(0, 'Preparation time cannot be negative')
    .max(480, 'Preparation time cannot exceed 8 hours')
    .optional(),
})

// ============================================================================
// Order Schemas
// ============================================================================

/**
 * Valid order status values
 */
export const orderStatusSchema = z.enum([
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'completed',
  'cancelled',
])

/**
 * Schema for updating order status
 * Matches OrderStatusUpdate interface in src/types/order.ts
 */
export const orderStatusUpdateSchema = z.object({
  status: orderStatusSchema,
  estimated_ready_at: z
    .string()
    .datetime({ message: 'Invalid datetime format' })
    .optional(),
})

// ============================================================================
// Reservation Schemas
// ============================================================================

/**
 * Valid reservation status values
 */
export const reservationStatusSchema = z.enum([
  'pending',
  'confirmed',
  'seated',
  'completed',
  'cancelled',
  'no_show',
])

/**
 * Schema for updating a reservation
 * Matches ReservationUpdate interface in src/types/reservation.ts
 */
export const reservationUpdateSchema = z.object({
  status: reservationStatusSchema.optional(),
  table_number: z
    .string()
    .max(20, 'Table number must be 20 characters or less')
    .optional(),
  party_size: z
    .number()
    .int('Party size must be a whole number')
    .min(1, 'Party size must be at least 1')
    .max(100, 'Party size cannot exceed 100')
    .optional(),
  reservation_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  reservation_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format')
    .optional(),
  special_requests: z
    .string()
    .max(500, 'Special requests must be 500 characters or less')
    .optional(),
})

/**
 * Schema for creating a reservation
 * Matches ReservationCreate interface in src/types/reservation.ts
 */
export const reservationCreateSchema = z.object({
  customer_name: z
    .string()
    .min(1, 'Customer name is required')
    .max(100, 'Customer name must be 100 characters or less'),
  customer_phone: z
    .string()
    .min(1, 'Phone number is required')
    .max(20, 'Phone number must be 20 characters or less'),
  customer_email: z.string().email('Invalid email format').optional(),
  party_size: z
    .number()
    .int('Party size must be a whole number')
    .min(1, 'Party size must be at least 1')
    .max(100, 'Party size cannot exceed 100'),
  reservation_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  reservation_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
  special_requests: z
    .string()
    .max(500, 'Special requests must be 500 characters or less')
    .optional(),
})

// ============================================================================
// Type Exports (inferred from schemas)
// ============================================================================

export type MenuItemCreateInput = z.infer<typeof menuItemCreateSchema>
export type MenuItemUpdateInput = z.infer<typeof menuItemUpdateSchema>
export type OrderStatusUpdateInput = z.infer<typeof orderStatusUpdateSchema>
export type ReservationUpdateInput = z.infer<typeof reservationUpdateSchema>
export type ReservationCreateInput = z.infer<typeof reservationCreateSchema>

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validates data and returns a result object with either data or errors
 */
export function validateSafe<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, errors: result.error }
}

/**
 * Formats Zod errors into a user-friendly object
 */
export function formatZodErrors(
  error: z.ZodError
): Record<string, string> {
  const formatted: Record<string, string> = {}
  for (const issue of error.issues) {
    const path = issue.path.join('.')
    if (!formatted[path]) {
      formatted[path] = issue.message
    }
  }
  return formatted
}
