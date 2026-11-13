import { messageFromBody, request, type ApiResponse } from './api'
import type { MedicineRow } from '@/utils/prescribed-medicine'

export type MedicineRecord = MedicineRow

export type MedicineCreateRequest = {
  medicineName: string
  nameZh?: string
  description: string
  descriptionZh?: string
  method?: string
  methodZh?: string
  price: number
}

export type MedicineUpdateRequest = {
  medicineId: string
  medicineName?: string
  nameZh?: string
  description?: string
  descriptionZh?: string
  method?: string
  methodZh?: string
  price?: number
  status?: string
}

function unwrap<T>(result: ApiResponse<T>, fallback: string): T {
  if (!result.isSuccess || result.data == null) {
    throw new Error(messageFromBody(result, fallback))
  }

  return result.data
}

export const medicineApi = {
  async list(): Promise<MedicineRecord[]> {
    const result = await request<ApiResponse<MedicineRecord[]>>('/api/Medicine/Retrieve', { cache: 'no-store' }, true)

    if (!result.isSuccess && result.respCode === 404) {
      return []
    }

    return unwrap(result, 'Unable to load medicines.')
  },

  async retrieveAll(): Promise<MedicineRecord[]> {
    return medicineApi.list()
  },

  async create(body: MedicineCreateRequest): Promise<MedicineRecord> {
    const result = await request<ApiResponse<MedicineRecord>>('/api/Medicine/Create', {
      method: 'POST',
      body: JSON.stringify(body),
    }, true)

    return unwrap(result, 'Unable to create medicine.')
  },

  async update(body: MedicineUpdateRequest): Promise<void> {
    const result = await request<ApiResponse<unknown>>('/api/Medicine/Update', {
      method: 'PUT',
      body: JSON.stringify(body),
    }, true)

    if (!result.isSuccess) {
      throw new Error(messageFromBody(result, 'Unable to update medicine.'))
    }
  },
}
