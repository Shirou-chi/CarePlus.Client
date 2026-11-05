import { baseUrl, formatApiErrorDetails, request, type ApiResponse } from './api'

export type LeaveStatus = 'Pending' | 'Approved' | 'Declined'

export type LeaveRecord = {
  leaveId: string
  staffId: string
  staffName: string
  username: string
  role: string
  startDate: string
  endDate: string
  durationDays: number
  reason: string
  supportDocument: string
  createdAt: string
  status: LeaveStatus | string
}

export type LeaveCreateRequest = {
  staffId: string
  startDate: string
  endDate: string
  reason: string
  supportDocument: File
}

export type LeaveStatusUpdateRequest = {
  leaveId: string
  status: LeaveStatus
}

async function unwrap<T>(result: ApiResponse<T>, fallback: string): Promise<T> {
  if (!result.isSuccess || result.data === null) {
    const details = formatApiErrorDetails(result.data)
    throw new Error([result.respMessage || fallback, details].filter(Boolean).join(': '))
  }

  return result.data
}

export const leaveApi = {
  async retrieveAll(): Promise<LeaveRecord[]> {
    try {
      const result = await request<ApiResponse<LeaveRecord[]>>('/api/Leave/Retrieve', {}, true)

      if (!result.isSuccess && result.respCode === 404) {
        return []
      }

      return unwrap(result, 'Unable to load leave requests.')
    } catch (error) {
      if (error instanceof Error && error.message.toLowerCase().includes('no leave application')) {
        return []
      }

      throw error
    }
  },

  async retrieveByStaffId(staffId: string): Promise<LeaveRecord[]> {
    try {
      const result = await request<ApiResponse<LeaveRecord[]>>(
        `/api/Leave/RetrieveByStaffId/${encodeURIComponent(staffId)}`,
        {},
        true,
      )

      if (!result.isSuccess && result.respCode === 404) {
        return []
      }

      return unwrap(result, 'Unable to load your leave requests.')
    } catch (error) {
      if (error instanceof Error && error.message.toLowerCase().includes('no leave application')) {
        return []
      }

      throw error
    }
  },

  async create(payload: LeaveCreateRequest): Promise<LeaveRecord> {
    const body = new FormData()
    body.append('staffId', payload.staffId)
    body.append('startDate', payload.startDate)
    body.append('endDate', payload.endDate)
    body.append('reason', payload.reason)
    body.append('supportDocument', payload.supportDocument)

    const result = await request<ApiResponse<LeaveRecord>>('/api/Leave/Create', {
      method: 'POST',
      body,
    }, true)

    return unwrap(result, 'Unable to submit leave request.')
  },

  async updateStatus(payload: LeaveStatusUpdateRequest): Promise<LeaveRecord> {
    const result = await request<ApiResponse<LeaveRecord>>('/api/Leave/UpdateStatus', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }, true)

    return unwrap(result, 'Unable to update leave request.')
  },
}

export function leaveDocumentUrl(documentReference: string) {
  return `${baseUrl}/api/${documentReference.replace(/^\//, '')}`
}
