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

export type BookingDoctor = {
  id: string
  name: string
  specialty: string
  bio: string
  qualification: string
  yearsOfExperience: number
}

export type BookingVisitType = {
  id: string
  name: string
  description: string
  price: number
}

export type BookingCatalog = {
  doctors: BookingDoctor[]
  types: BookingVisitType[]
  bookingClosed: boolean
  cancelsToday: number
  cancelLimit: number
  rescheduleLimit: number
}

export type TimeSlot = {
  startAt: string
  label: string
  booked: boolean
}

export type BookingSlots = {
  date: string
  doctorId: string
  morning: TimeSlot[]
  night: TimeSlot[]
}

export type Appointment = {
  id: string
  forName: string
  doctorId: string
  doctorName: string
  type: string
  notes: string | null
  startAt: string
  endAt: string
  status: string
  rescheduleCount: number
  rescheduleBlocked: boolean
}

export type AppointmentBookRequest = {
  doctorId: string
  startAt: string
  type: string
  patientId?: string
  forName?: string
  notes?: string
}

async function unwrap<T>(result: ApiResponse<T>, fallback: string): Promise<T> {
  if (!result.isSuccess || result.data === null) {
    const details = formatApiErrorDetails(result.data)
    throw new Error([result.respMessage || fallback, details].filter(Boolean).join(': '))
  }

  return result.data
}

export const appointmentApi = {
  async catalog(): Promise<BookingCatalog> {
    const result = await request<ApiResponse<BookingCatalog>>(
      '/api/Appointment/Catalog',
      {},
      true,
    )

    return unwrap(result, 'Unable to load booking options.')
  },

  async slots(date: string, doctorId: string): Promise<BookingSlots> {
    const query = `?date=${encodeURIComponent(date)}&doctorId=${encodeURIComponent(doctorId)}`
    const result = await request<ApiResponse<BookingSlots>>(
      `/api/Appointment/Slots${query}`,
      {},
      true,
    )

    return unwrap(result, 'Unable to load available times.')
  },

  async availableDates(doctorId: string, days = 90): Promise<string[]> {
    const query = `?doctorId=${encodeURIComponent(doctorId)}&days=${encodeURIComponent(String(days))}`
    const result = await request<ApiResponse<string[]>>(
      `/api/Appointment/AvailableDates${query}`,
      {},
      true,
    )

    return unwrap(result, 'Unable to load scheduled dates.')
  },

  async upcoming(): Promise<Appointment[]> {
    const result = await request<ApiResponse<Appointment[]>>(
      '/api/Appointment/Upcoming',
      {},
      true,
    )

    return unwrap(result, 'Unable to load upcoming visits.')
  },

  async book(payload: AppointmentBookRequest): Promise<Appointment> {
    const result = await request<ApiResponse<Appointment>>(
      '/api/Appointment',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      true,
    )

    return unwrap(result, 'Unable to book this visit.')
  },

  async cancel(appointmentId: string): Promise<Appointment> {
    const result = await request<ApiResponse<Appointment>>(
      `/api/Appointment/${encodeURIComponent(appointmentId)}/Cancel`,
      { method: 'POST' },
      true,
    )

    return unwrap(result, 'Unable to cancel this visit.')
  },

  async reschedule(appointmentId: string, startAt: string): Promise<Appointment> {
    const result = await request<ApiResponse<Appointment>>(
      `/api/Appointment/${encodeURIComponent(appointmentId)}/Reschedule`,
      {
        method: 'POST',
        body: JSON.stringify({ startAt }),
      },
      true,
    )

    return unwrap(result, 'Unable to reschedule this visit.')
  },

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
