import { request, type ApiResponse } from './api'

export type PatientRecord = {
  patientId: string
  userId: number
  username: string
  name: string
  email: string
  phone: string
  status: string
  gender: string
  dateOfBirth?: string | null
  address?: string | null
}

export const patientApi = {
  async retrieveAll(): Promise<PatientRecord[]> {
    const result = await request<ApiResponse<PatientRecord[]>>('/api/Patient/Retrieve', {}, true)

    if (!result.isSuccess || !Array.isArray(result.data)) {
      throw new Error(result.respMessage || 'Unable to load patient records.')
    }

    return result.data
  },
}
