import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export function formatPhoneNumber(phone: string): string {
  // Format E.164 to readable format
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  return phone
}

export function maskPhoneNumber(phone: string): string {
  const formatted = formatPhoneNumber(phone)
  return formatted.replace(/\d(?=\d{4})/g, '•')
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date))
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    completed: 'badge-success',
    confirmed: 'badge-success',
    ready: 'badge-success',
    'in-progress': 'badge-info',
    preparing: 'badge-info',
    pending: 'badge-warning',
    initiated: 'badge-warning',
    cancelled: 'badge-error',
    failed: 'badge-error',
    escalated: 'badge-error',
    no_show: 'badge-error',
  }
  return colors[status] || 'badge-neutral'
}

export function getOutcomeLabel(outcome: string | null): string {
  const labels: Record<string, string> = {
    order_placed: 'Order Placed',
    reservation_made: 'Reservation Made',
    faq_answered: 'FAQ Answered',
    escalated: 'Escalated',
    abandoned: 'Abandoned',
  }
  return outcome ? labels[outcome] || outcome : 'Unknown'
}

