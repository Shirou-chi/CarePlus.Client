import { formatApiErrorDetails, request, type ApiResponse } from './api'

export type WorkShift = 'Morning' | 'Night'

export type WorkScheduleRecord = {
  scheduleId: string
  staffId: string
  staffName: string
  username: string
  role: string
  workingDate: string
  shift?: WorkShift | string
  status: 'Active' | 'Inactive' | string
}

export type WorkScheduleCreateRequest = {
  staffId: string
  workingDate: string
  shift: WorkShift
}

export type WorkScheduleUpdateRequest = {
  scheduleId: string
  workingDate?: string
  shift?: WorkShift
  status?: 'Active' | 'Inactive'
}

async function unwrap<T>(result: ApiResponse<T>, failureMessage: string): Promise<T> {
  if (!result.isSuccess || result.data === null) {
    const errorDetails = formatApiErrorDetails(result.data)

    throw new Error(
      [result.respMessage || failureMessage, errorDetails]
        .filter(Boolean)
        .join(': '),
    )
  }

  return result.data
}

export const workScheduleApi = {
  async retrieveAll(): Promise<WorkScheduleRecord[]> {
    try {
      const result = await request<ApiResponse<WorkScheduleRecord[]>>('/api/WorkSchedule/Retrieve', {}, true)

      if (!result.isSuccess && result.respCode === 404) {
        return []
      }

      return unwrap(result, 'Unable to load working schedules.')
    } catch (error) {
      if (error instanceof Error && error.message.toLowerCase().includes('no work schedule found')) {
        return []
      }

      throw error
    }
  },

  async create(payload: WorkScheduleCreateRequest): Promise<WorkScheduleRecord> {
    const result = await request<ApiResponse<WorkScheduleRecord>>('/api/WorkSchedule/Create', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, true)

    return unwrap(result, 'Unable to create working schedule.')
  },

  async update(payload: WorkScheduleUpdateRequest): Promise<WorkScheduleRecord> {
    const result = await request<ApiResponse<WorkScheduleRecord>>('/api/WorkSchedule/Update', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }, true)

    return unwrap(result, 'Unable to update working schedule.')
  },
}
