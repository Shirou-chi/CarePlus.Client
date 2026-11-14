import { request, type ApiResponse } from './api'

export type PrescriptionSummary = {
  prescriptionId: string
  patientId: string
  patientName: string
  doctorName: string
  createdAt: string
  status: string
}

export type PrescriptionItem = {
  prescriptionItemId: string
  medicineName: string
  dosage: string
  quantity: number
  instructions: string
}

async function retrieve<T>(path: string, fallback: string, signal?: AbortSignal): Promise<T> {
  const result = await request<ApiResponse<T>>(path, { cache: 'no-store', signal }, true)
  if (!result.isSuccess || result.data === null) {
    throw new Error(result.respMessage || fallback)
  }
  return result.data
}

export const prescriptionApi = {
  list: (signal?: AbortSignal) =>
    retrieve<PrescriptionSummary[]>('/api/Prescription/Retrieve', 'Unable to load prescriptions.', signal),
  items: (prescriptionId: string, signal?: AbortSignal) =>
    retrieve<PrescriptionItem[]>(`/api/Prescription/${encodeURIComponent(prescriptionId)}/Items`, 'Unable to load prescription items.', signal),
}
