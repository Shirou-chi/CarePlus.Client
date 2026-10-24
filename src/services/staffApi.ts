import { formatApiErrorDetails, request, type ApiResponse } from './api'

export type StaffRecord = {
  staffId: string
  userId: number
  username: string
  name: string
  email: string
  phone: string
  status: 'Active' | 'Inactive' | 'Suspended' | string
  role: 'Admin' | 'Doctor' | 'Pharmacist' | string
  accessLevel?: number
  department?: string | null
  licenseNumber?: string
  specialization?: string
  qualification?: string
  certification?: string | null
  yearsOfExperience?: number
}

export type StaffRegisterRequest = {
  username: string
  name: string
  email: string
  password: string
  role: 'Admin' | 'Doctor' | 'Pharmacist'
  accessLevel?: number
  department?: string
  licenseNumber?: string
  specialization?: string
  qualification?: string
  certification?: string
  yearsOfExperience?: number
}

export type StaffUpdateRequest = {
  staffId: string
  username?: string
  name?: string
  phone?: string
  status?: 'Active' | 'Inactive' | 'Suspended'
  role?: 'Admin' | 'Doctor' | 'Pharmacist'
}

type StaffRegisterResponse = {
  staffId: string
  userId: number
  name: string
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

export const staffApi = {
  async retrieveAll(): Promise<StaffRecord[]> {
    const result = await request<ApiResponse<StaffRecord[]>>('/api/Staff/Retrieve', {}, true)
    const staff = await unwrap(result, 'Unable to load staff records.')

    const relatedStaff = await Promise.all([
      retrieveOptional('/api/Admin/Retrieve'),
      retrieveOptional('/api/Doctor/Retrieve'),
      retrieveOptional('/api/Pharmacist/Retrieve'),
    ])

    const relatedByStaffId = new Map(
      relatedStaff.flat().map((member) => [member.staffId, member]),
    )

    return staff.map((member) => ({
      ...member,
      ...relatedByStaffId.get(member.staffId),
    }))
  },

  async retrieveByRole(role: string, staffId: string): Promise<StaffRecord> {
    const endpoint = role === 'Doctor'
      ? '/api/Doctor/Retrieve'
      : role === 'Pharmacist'
        ? '/api/Pharmacist/Retrieve'
        : '/api/Admin/Retrieve'

    const result = await request<ApiResponse<StaffRecord[]>>(endpoint, {}, true)
    const staff = await unwrap(result, `Unable to load ${role.toLowerCase()} profile details.`)
    const currentStaff = staff.find((member) => member.staffId === staffId)

    if (!currentStaff) {
      throw new Error('Unable to find the signed-in staff profile.')
    }

    return currentStaff
  },

  async register(payload: StaffRegisterRequest): Promise<StaffRegisterResponse> {
    const endpoint = payload.role === 'Admin'
      ? '/api/Admin/Register'
      : payload.role === 'Doctor'
        ? '/api/Doctor/Register'
        : '/api/Pharmacist/Register'

    const result = await request<ApiResponse<StaffRegisterResponse>>(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, true)

    return unwrap(result, 'Unable to create staff account.')
  },

  async update(payload: StaffUpdateRequest): Promise<void> {
    const result = await request<ApiResponse<null>>('/api/Staff/UpdateStaff', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }, true)

    if (!result.isSuccess) {
      throw new Error(result.respMessage || 'Unable to update staff account.')
    }
  },
}

async function retrieveOptional(path: string): Promise<StaffRecord[]> {
  try {
    const result = await request<ApiResponse<StaffRecord[]>>(path, {}, true)

    if (!result.isSuccess && result.respCode === 404) {
      return []
    }

    return unwrap(result, `Unable to load related staff records from ${path}.`)
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return []
    }

    throw error
  }
}
