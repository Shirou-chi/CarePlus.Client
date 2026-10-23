import {
  messageFromBody,
  request,
  TOKEN_KEY,
} from './api'
import type { ApiResponse, LoginResponse } from './api'

export type PatientRegisterRequest = {
  username: string
  name: string
  email: string
  password: string
  phone?: string | null
  identityCardNumber: string
}

export type PatientRegisterResponse = {
  userId: number
  name: string
  patientId: string
}

export type CurrentUserResponse = {
  userId: number
  username: string
  name: string
  email: string
  phone: string
  status: string
  accountType: string
  role: string
  patientId?: string
  staffId?: string
  identityCardNumber?: string | null
  gender?: string | null
  address?: string | null
  profilePicture?: string | null
}

export type LoginActivityResponse = {
  id: number
  device: string
  ipAddress: string
  createdAt: string
}

async function unwrap<T>(result: ApiResponse<T>, failureMessage: string): Promise<T> {
  if (!result.isSuccess || !result.data) {
    throw new Error(messageFromBody(result, failureMessage))
  }

  return result.data
}

export const authApi = {
  async staffLogin(identifier: string, password: string): Promise<LoginResponse> {
    const result = await request<ApiResponse<LoginResponse>>('/api/Staff/Login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    })

    return unwrap(result, 'Staff login failed.')
  },

  async patientLogin(identifier: string, password: string): Promise<LoginResponse> {
    const result = await request<ApiResponse<LoginResponse>>('/api/Patient/Login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    })

    return unwrap(result, 'Patient login failed.')
  },

  async patientRegister(
    requestBody: PatientRegisterRequest,
  ): Promise<PatientRegisterResponse> {
    const result = await request<ApiResponse<PatientRegisterResponse>>('/api/Patient/Register', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    })

    return unwrap(result, 'Patient registration failed.')
  },

  async getLoginActivity(): Promise<LoginActivityResponse[]> {
    const result = await request<ApiResponse<LoginActivityResponse[]>>('/api/User/Activity', {
      method: 'GET',
    }, true)

    if (!result.isSuccess || !result.data) {
      return []
    }

    return result.data
  },

  async getCurrentUser(): Promise<CurrentUserResponse> {
    const result = await request<ApiResponse<CurrentUserResponse>>('/api/User/Me', {
      method: 'GET',
    }, true)

    return unwrap(result, 'Unable to retrieve current user.')
  },

  saveToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token)
  },

  clearToken(): void {
    localStorage.removeItem(TOKEN_KEY)
  },
}
