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
  emailVerificationRequired: boolean
  verificationChallengeId: string
  maskedEmail: string
  verificationExpiresInSeconds: number
}

export type EmailVerificationCodeSentResponse = {
  challengeId: string
  maskedEmail: string
  expiresInSeconds: number
}

export type EmailVerificationStatusResponse = {
  verified: boolean
}

export type UsernameAvailabilityResponse = {
  available: boolean
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

  async verifyEmail(challengeId: string, code: string): Promise<EmailVerificationStatusResponse> {
    const result = await request<ApiResponse<EmailVerificationStatusResponse>>('/api/Patient/VerifyEmail', {
      method: 'POST',
      body: JSON.stringify({ challengeId, code }),
    })

    return unwrap(result, 'Email verification failed.')
  },

  async resendEmailVerification(challengeId: string): Promise<EmailVerificationCodeSentResponse> {
    const result = await request<ApiResponse<EmailVerificationCodeSentResponse>>('/api/Patient/ResendEmailVerification', {
      method: 'POST',
      body: JSON.stringify({ challengeId }),
    })

    return unwrap(result, 'Unable to resend the verification code.')
  },

  async checkUsernameAvailability(username: string): Promise<boolean> {
    const result = await request<ApiResponse<UsernameAvailabilityResponse>>(
      `/api/Patient/UsernameAvailability?username=${encodeURIComponent(username)}`,
    )

    if (!result.isSuccess || !result.data) {
      throw new Error(messageFromBody(result, 'Unable to check username availability.'))
    }

    return result.data.available
  },

  async getLoginActivity(): Promise<LoginActivityResponse[]> {
    const result = await request<ApiResponse<LoginActivityResponse[]>>('/api/User/Activity', {
      method: 'GET',
    }, true)

    if (!result.isSuccess || !result.data) {
      throw new Error(messageFromBody(result, 'Unable to load account activity.'))
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
