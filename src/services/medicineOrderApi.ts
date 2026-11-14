import { messageFromBody, request, type ApiResponse } from './api'

export type MedicineOrderStatus =
  | 'awaiting_payment'
  | 'paid'
  | 'preparing'
  | 'ready_pickup'
  | 'picked_up'
  | 'shipped'
  | 'delivered'

export type StaffMedicineOrder = {
  id: string
  patientId: string
  patientName: string
  placedAt: string
  status: MedicineOrderStatus | string
  fulfilment: 'pickup' | 'delivery'
  payment: string
  address?: string | null
  deliveryFee: number
  total: number
  lines: { id: string; name: string; detail: string; unitPrice: number; qty: number }[]
}

function unwrap<T>(result: ApiResponse<T>, fallback: string): T {
  if (!result.isSuccess || result.data == null) {
    throw new Error(messageFromBody(result, fallback))
  }

  return result.data
}

export const medicineOrderApi = {
  async listForStaff(): Promise<StaffMedicineOrder[]> {
    const result = await request<ApiResponse<StaffMedicineOrder[]>>('/api/MedicineOrder/Staff', { method: 'GET', cache: 'no-store' }, true)
    return unwrap(result, 'Unable to load medicine orders.')
  },

  async updateStatus(orderId: string, status: MedicineOrderStatus): Promise<StaffMedicineOrder> {
    const result = await request<ApiResponse<StaffMedicineOrder>>(`/api/MedicineOrder/Staff/${encodeURIComponent(orderId)}/Status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }, true)
    return unwrap(result, 'Unable to update medicine order status.')
  },
}
