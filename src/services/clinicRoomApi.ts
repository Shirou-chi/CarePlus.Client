import { formatApiErrorDetails, request, type ApiResponse } from './api'

export type ClinicRoomStatus = 'Available' | 'Occupied' | 'Maintenance' | 'Inactive'

export type ClinicRoomRecord = {
  roomId: string
  roomName: string
  status: ClinicRoomStatus | string
}

export type ClinicRoomCreateRequest = {
  roomName: string
  status?: ClinicRoomStatus
}

export type ClinicRoomUpdateRequest = {
  roomId: string
  roomName: string
  status: ClinicRoomStatus
}

async function unwrap<T>(result: ApiResponse<T>, fallback: string): Promise<T> {
  if (!result.isSuccess || result.data === null) {
    const details = formatApiErrorDetails(result.data)
    throw new Error([result.respMessage || fallback, details].filter(Boolean).join(': '))
  }

  return result.data
}

export const clinicRoomApi = {
  async retrieveAll(): Promise<ClinicRoomRecord[]> {
    const result = await request<ApiResponse<ClinicRoomRecord[]>>('/api/ClinicRoom/Retrieve', {}, true)
    return unwrap(result, 'Unable to load clinic rooms.')
  },

  async create(payload: ClinicRoomCreateRequest): Promise<ClinicRoomRecord> {
    const result = await request<ApiResponse<ClinicRoomRecord>>('/api/ClinicRoom/Create', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, true)

    return unwrap(result, 'Unable to create clinic room.')
  },

  async update(payload: ClinicRoomUpdateRequest): Promise<ClinicRoomRecord> {
    const result = await request<ApiResponse<ClinicRoomRecord>>('/api/ClinicRoom/Update', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }, true)

    return unwrap(result, 'Unable to update clinic room.')
  },
}
