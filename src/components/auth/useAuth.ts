import { createContext, useContext } from 'react'

export type AuthUser = {
  name: string
  email?: string
  userId?: string
  role?: string
  accountType?: string
  patientId?: string
  staffId?: string
}

export type AuthContextValue = {
  isAuthenticated: boolean
  signIn: (user: AuthUser) => void
  signOut: () => void
  user: AuthUser | null
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
