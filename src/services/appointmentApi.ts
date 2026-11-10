import { formatApiErrorDetails, request, type ApiResponse } from './api'

export type StaffAppointmentRecord = {
  id: string
  patientId: string
  patientName: string
  patientUsername: string
  doctorId: string
  doctorName: string
  visitTypeId: string
  visitType: string
  notes: string | null
  startAt: string
  endAt: string
  status: string
  checkInStatus: string
}

export type AvailableDoctorRecord = {
  id: string
  name: string
  specialty: string
  bio: string
  qualification: string
  yearsOfExperience: number
}

export type StaffAppointmentCreateRequest = {
  patientId: string
  doctorId: string
  startAt: string
  type: string
  notes?: string | null
}

export type AppointmentRescheduleRequest = {
  startAt: string
}

async function unwrap<T>(result: ApiResponse<T>, fallback: string): Promise<T> {
  if (!result.isSuccess || result.data === null) {
    const details = formatApiErrorDetails(result.data)
    throw new Error([result.respMessage || fallback, details].filter(Boolean).join(': '))
  }

  return result.data
}

export const appointmentApi = {
  async createForStaff(payload: StaffAppointmentCreateRequest): Promise<void> {
    const result = await request<ApiResponse<unknown>>(
      '/api/Appointment/Staff',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      true,
    )

    await unwrap(result, 'Unable to create appointment.')
  },

  async cancelForStaff(appointmentId: string): Promise<void> {
    const result = await request<ApiResponse<unknown>>(
      `/api/Appointment/Staff/${encodeURIComponent(appointmentId)}/Cancel`,
      { method: 'POST' },
      true,
    )

    await unwrap(result, 'Unable to cancel appointment.')
  },

  async rescheduleForStaff(appointmentId: string, payload: AppointmentRescheduleRequest): Promise<void> {
    const result = await request<ApiResponse<unknown>>(
      `/api/Appointment/Staff/${encodeURIComponent(appointmentId)}/Reschedule`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      true,
    )

    await unwrap(result, 'Unable to reschedule appointment.')
  },

  async retrieveAvailableDoctors(date: string, time: string): Promise<AvailableDoctorRecord[]> {
    const query = `?date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}`
    const result = await request<ApiResponse<AvailableDoctorRecord[]>>(
      `/api/Appointment/AvailableDoctors${query}`,
      {},
      true,
    )

    return unwrap(result, 'Unable to load available doctors.')
  },

  async retrieveForStaff(date?: string): Promise<StaffAppointmentRecord[]> {
    const query = date ? `?date=${encodeURIComponent(date)}` : ''
    const result = await request<ApiResponse<StaffAppointmentRecord[]>>(
      `/api/Appointment/Staff${query}`,
      {},
      true,
    )

    return unwrap(result, 'Unable to load appointments.')
  },
}
