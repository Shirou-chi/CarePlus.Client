import type { AuthUser } from './useAuth'

export const DEMO_ACCOUNT = {
  email: 'patient.demo@careplus.test',
  password: 'CarePlus123!',
  user: {
    email: 'patient.demo@careplus.test',
    name: 'Alicia Tan',
  } satisfies AuthUser,
} as const

export function authenticateDemoAccount(email: string, password: string): AuthUser | null {
  const normalizedEmail = email.trim().toLowerCase()

  return normalizedEmail === DEMO_ACCOUNT.email && password === DEMO_ACCOUNT.password
    ? { ...DEMO_ACCOUNT.user }
    : null
}
