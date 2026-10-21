import {
  request,
  TOKEN_KEY,
} from './api'
import type { ApiResponse, LoginResponse } from './api'

export type PatientRegisterRequest = {
  username: string
  name: string
  email: string
  password: string
  gender: string
}

export type UserRegisterResponse = {
  userId: number
  name: string
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
}

async function unwrap<T>(result: ApiResponse<T>, failureMessage: string): Promise<T> {
  if (!result.isSuccess || !result.data) {
    throw new Error(result.respMessage || failureMessage)
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
  ): Promise<UserRegisterResponse> {
    const result = await request<ApiResponse<UserRegisterResponse>>('/api/Patient/Register', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    })

    return unwrap(result, 'Patient registration failed.')
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
