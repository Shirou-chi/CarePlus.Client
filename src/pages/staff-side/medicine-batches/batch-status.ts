import type { MedicineBatchRecord } from '@/services/medicineBatchApi'

export const LOW_STOCK_THRESHOLD = 10

export function getBatchStatus(batch: MedicineBatchRecord): 'In stock' | 'Low stock' | 'Expired' {
  const expiry = new Date(batch.expiryDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (!Number.isNaN(expiry.getTime()) && expiry < today) return 'Expired'
  if (batch.stockQuantity <= LOW_STOCK_THRESHOLD) return 'Low stock'
  return 'In stock'
}
