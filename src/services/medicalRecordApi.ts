import { formatApiErrorDetails, request, type ApiResponse } from './api'

export type MedicalRecord = {
  medicalRecordId: string
  patientId: string
  patientName: string
  patientUsername: string
  doctorId: string
  doctorName: string
  consultationDate: string
  diagnosis: string
  notes: string
}

export type MedicalRecordCreateRequest = {
  patientId: string
  consultationDate: string
  diagnosis: string
  notes?: string
}

export type MedicalRecordUpdateRequest = {
  medicalRecordId: string
  consultationDate: string
  diagnosis: string
  notes?: string
}

async function unwrap<T>(result: ApiResponse<T>, fallback: string): Promise<T> {
  if (!result.isSuccess || result.data === null) {
    const details = formatApiErrorDetails(result.data)
    throw new Error([result.respMessage || fallback, details].filter(Boolean).join(': '))
  }

  return result.data
}

export const medicalRecordApi = {
  async retrieve(): Promise<MedicalRecord[]> {
    const result = await request<ApiResponse<MedicalRecord[]>>('/api/MedicalRecord/Retrieve', {}, true)
    return unwrap(result, 'Unable to load medical records.')
  },

  async create(payload: MedicalRecordCreateRequest): Promise<MedicalRecord> {
    const result = await request<ApiResponse<MedicalRecord>>('/api/MedicalRecord/Create', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, true)
    return unwrap(result, 'Unable to create medical record.')
  },

  async update(payload: MedicalRecordUpdateRequest): Promise<MedicalRecord> {
    const result = await request<ApiResponse<MedicalRecord>>('/api/MedicalRecord/Update', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }, true)
    return unwrap(result, 'Unable to update medical record.')
  },
}
