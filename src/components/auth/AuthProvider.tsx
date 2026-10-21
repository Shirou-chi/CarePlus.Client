import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AuthContext } from './useAuth'
import type { AuthUser } from './useAuth'

const STORAGE_KEY = 'careplus-session'

function readStoredUser(): AuthUser | null {
  try {
    const storedUser = localStorage.getItem(STORAGE_KEY)
    if (!storedUser) return null

    const parsedUser = JSON.parse(storedUser) as Partial<AuthUser>
    return typeof parsedUser.name === 'string'
      ? {
          name: parsedUser.name,
          email: parsedUser.email,
          userId: parsedUser.userId,
          role: parsedUser.role,
          accountType: parsedUser.accountType,
          patientId: parsedUser.patientId,
          staffId: parsedUser.staffId,
        }
      : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser)

  const value = useMemo(() => ({
    isAuthenticated: Boolean(user),
    signIn: (nextUser: AuthUser) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser))
      setUser(nextUser)
    },
    signOut: () => {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem('careplus-token')
      setUser(null)
    },
    user,
  }), [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
