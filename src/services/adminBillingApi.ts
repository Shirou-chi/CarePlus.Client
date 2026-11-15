import { getAuthToken, request, type ApiResponse } from './api'

export type AdminBillingRecord = {
  invoiceId: string
  patientId: string
  patientName: string
  patientUsername: string
  source: 'Consultation' | 'Medicine order' | string
  recordId: string
  doctorName: string
  visitType: string
  issuedAt: string
  dueAt: string | null
  status: 'Paid' | 'Pending' | 'Overdue' | string
  total: number
  paidAmount: number
  lateFee: number
  amountOutstanding: number
  daysOverdue: number
  paymentMethod: string | null
  paidAt: string | null
}

export const adminBillingApi = {
  async list(): Promise<AdminBillingRecord[]> {
    if (!getAuthToken()) return []

    const result = await request<ApiResponse<AdminBillingRecord[]>>(
      '/api/Invoice/Admin',
      { method: 'GET', cache: 'no-store' },
      true,
    )

    if (!result.isSuccess) {
      throw new Error(result.respMessage || 'Billing records could not be loaded.')
    }

    return result.data ?? []
  },
}
