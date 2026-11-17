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

export type DispensedPrescription = {
  prescriptionId: string
  dispensedAt: string
  status: string
  items: PrescriptionItem[]
}

export function isClosedPrescriptionStatus(status: string) {
  const normalized = status.trim().toLowerCase().replace(/[\s-]+/g, '_')
  return ['completed', 'dispensed', 'picked_up', 'cancelled'].includes(normalized)
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
  complete: async (prescriptionId: string): Promise<PrescriptionSummary> => {
    const result = await request<ApiResponse<PrescriptionSummary>>(`/api/Prescription/${encodeURIComponent(prescriptionId)}/Complete`, {
      method: 'PATCH',
    }, true)
    return retrieveResult(result, 'Unable to complete prescription dispensing.')
  },
  prepare: async (prescriptionId: string): Promise<PrescriptionSummary> => {
    const result = await request<ApiResponse<PrescriptionSummary>>(`/api/Prescription/${encodeURIComponent(prescriptionId)}/Preparing`, {
      method: 'PATCH',
    }, true)
    return retrieveResult(result, 'Unable to mark this prescription as preparing.')
  },
  dispensed: (signal?: AbortSignal) =>
    retrieve<DispensedPrescription[]>('/api/Prescription/Dispensed', 'Unable to load dispensing history.', signal),
}

function retrieveResult<T>(result: ApiResponse<T>, fallback: string): T {
  if (!result.isSuccess || result.data == null) {
    throw new Error(result.respMessage || fallback)
  }
  return result.data
}
