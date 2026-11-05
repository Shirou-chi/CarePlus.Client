import { messageFromBody, request, type ApiResponse } from './api'

export type MedicineBatchRecord = {
  batchId: string
  medicineId: string
  medicineName: string
  stockQuantity: number
  expiryDate: string
}

export type MedicineBatchCreateRequest = {
  medicineId: string
  stockQuantity: number
  expiryDate: string
}

export type MedicineBatchUpdateRequest = {
  batchId: string
  stockQuantity?: number
  expiryDate?: string
}

function unwrap<T>(result: ApiResponse<T>, fallback: string): T {
  if (!result.isSuccess || result.data == null) {
    throw new Error(messageFromBody(result, fallback))
  }

  return result.data
}

export const medicineBatchApi = {
  async list(): Promise<MedicineBatchRecord[]> {
    const result = await request<ApiResponse<MedicineBatchRecord[]>>('/api/MedicineBatch/Retrieve', {}, true)

    if (!result.isSuccess && result.respCode === 404) {
      return []
    }

    return unwrap(result, 'Unable to load medicine batches.')
  },

  async create(body: MedicineBatchCreateRequest): Promise<MedicineBatchRecord> {
    const result = await request<ApiResponse<MedicineBatchRecord>>('/api/MedicineBatch/Create', {
      method: 'POST',
      body: JSON.stringify(body),
    }, true)

    return unwrap(result, 'Unable to create medicine batch.')
  },

  async update(body: MedicineBatchUpdateRequest): Promise<MedicineBatchRecord> {
    const result = await request<ApiResponse<MedicineBatchRecord>>('/api/MedicineBatch/Update', {
      method: 'PUT',
      body: JSON.stringify(body),
    }, true)

    return unwrap(result, 'Unable to update medicine batch.')
  },
}
