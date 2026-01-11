// Order Types

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled'

export type OrderType = 'pickup' | 'delivery' | 'dine_in'

export interface OrderItem {
  id: string
  menu_item_id: string
  menu_item_name: string
  quantity: number
  unit_price_cents: number
  total_price_cents: number
  special_instructions: string | null
  modifiers: OrderItemModifier[]
}

export interface OrderItemModifier {
  name: string
  price_cents: number
}

export interface Order {
  id: string
  tenant_id: string
  call_id: string | null
  customer_name: string
  customer_phone: string
  order_type: OrderType
  status: OrderStatus
  items: OrderItem[]
  subtotal_cents: number
  tax_cents: number
  tip_cents: number
  total_cents: number
  special_instructions: string | null
  estimated_ready_at: string | null
  created_at: string
  updated_at: string
}

export interface OrderStatusUpdate {
  status: OrderStatus
  estimated_ready_at?: string
}

export interface OrdersQueryParams {
  page?: number
  page_size?: number
  status?: OrderStatus
  order_type?: OrderType
  start_date?: string
  end_date?: string
}

export interface OrderStats {
  total_orders: number
  total_revenue_cents: number
  average_order_cents: number
  orders_by_status: Record<OrderStatus, number>
  orders_by_type: Record<OrderType, number>
}
