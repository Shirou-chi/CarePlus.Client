import {
  clearAuthToken,
  messageFromBody,
  request,
  saveAuthToken,
} from './api'
import type { ApiResponse, LoginResponse } from './api'

export type PatientRegisterRequest = {
  username: string
  name: string
  email: string
  password: string
  phone?: string | null
  identityCardNumber: string
  emailVerificationChallengeId: string
  emailVerificationToken: string
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

export type PasswordResetCodeSentResponse = {
  challengeId: string
  maskedEmail: string
  expiresInSeconds: number
}

export type LoginTwoFactorRequired = {
  requiresTwoFactor: true
  challengeId: string
  maskedEmail: string
  expiresInSeconds: number
}

/** Token login vs 2FA challenge. Discriminate with `"token" in result`. */
export type PatientLoginResult = LoginResponse | LoginTwoFactorRequired

export type PasswordResetCodeVerifiedResponse = {
  challengeId: string
  resetToken: string
  expiresInSeconds: number
}

export type PasswordResetCompletedResponse = {
  reset: boolean
}

export type RegistrationEmailCodeSentResponse = {
  challengeId: string
  maskedEmail: string
  expiresInSeconds: number
}

export type RegistrationEmailCodeVerifiedResponse = {
  challengeId: string
  verificationToken: string
  expiresInSeconds: number
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
  dateOfBirth?: string | null
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

  async patientLogin(identifier: string, password: string, rememberMe = false): Promise<PatientLoginResult> {
    const result = await request<ApiResponse<PatientLoginResult>>('/api/Patient/Login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password, rememberMe }),
    })

    return unwrap(result, 'Patient login failed.')
  },

  async verifyPatientLoginTwoFactor(challengeId: string, code: string, rememberMe = false): Promise<LoginResponse> {
    const result = await request<ApiResponse<LoginResponse>>('/api/Patient/Login/VerifyTwoFactor', {
      method: 'POST',
      body: JSON.stringify({ challengeId, code, rememberMe }),
    })

    return unwrap(result, 'Unable to verify the code.')
  },

  async resendPatientLoginTwoFactor(challengeId: string): Promise<LoginTwoFactorRequired> {
    const result = await request<ApiResponse<LoginTwoFactorRequired>>('/api/Patient/Login/ResendTwoFactor', {
      method: 'POST',
      body: JSON.stringify({ challengeId }),
    })

    return unwrap(result, 'Unable to resend the verification code.')
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

  async requestRegistrationEmailCode(email: string): Promise<RegistrationEmailCodeSentResponse> {
    const result = await request<ApiResponse<RegistrationEmailCodeSentResponse>>('/api/Patient/RegistrationEmail/Request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })

    return unwrap(result, 'Unable to send the verification code.')
  },

  async verifyRegistrationEmailCode(
    challengeId: string,
    code: string,
  ): Promise<RegistrationEmailCodeVerifiedResponse> {
    const result = await request<ApiResponse<RegistrationEmailCodeVerifiedResponse>>('/api/Patient/RegistrationEmail/Verify', {
      method: 'POST',
      body: JSON.stringify({ challengeId, code }),
    })

    return unwrap(result, 'Unable to verify the email address.')
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

  async requestPasswordReset(email: string): Promise<PasswordResetCodeSentResponse> {
    const result = await request<ApiResponse<PasswordResetCodeSentResponse>>('/api/Patient/ForgotPassword/Request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })

    return unwrap(result, 'Unable to send the password reset code.')
  },

  async verifyPasswordResetCode(challengeId: string, code: string): Promise<PasswordResetCodeVerifiedResponse> {
    const result = await request<ApiResponse<PasswordResetCodeVerifiedResponse>>('/api/Patient/ForgotPassword/Verify', {
      method: 'POST',
      body: JSON.stringify({ challengeId, code }),
    })

    return unwrap(result, 'Unable to verify the password reset code.')
  },

  async completePasswordReset(
    challengeId: string,
    resetToken: string,
    newPassword: string,
  ): Promise<PasswordResetCompletedResponse> {
    const result = await request<ApiResponse<PasswordResetCompletedResponse>>('/api/Patient/ForgotPassword/Reset', {
      method: 'POST',
      body: JSON.stringify({ challengeId, resetToken, newPassword }),
    })

    return unwrap(result, 'Unable to reset the password.')
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

  saveToken(token: string, rememberMe = true): void {
    saveAuthToken(token, rememberMe)
  },

  clearToken(): void {
    clearAuthToken()
  },
}
