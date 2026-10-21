import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../../components/auth'
import { useTheme } from '../../../../components/theme/useTheme'
import { authApi } from '../../../../services/authApi'
import { staffRoutes } from '../../routes'
import { Icon } from '../../navbar/StaffIcon'
import './StaffLoginPage.css'

export function StaffLoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const { token } = await authApi.staffLogin(identifier, password)

      authApi.saveToken(token)
      const currentUser = await authApi.getCurrentUser()

      signIn({
        name: currentUser.username,
        userId: String(currentUser.userId),
        role: currentUser.role,
        accountType: currentUser.accountType,
        patientId: currentUser.patientId,
        staffId: currentUser.staffId,
      })
      navigate(staffRoutes.home, { replace: true })
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="staff-login-page">
      <div className="staff-login-page__topbar">
        <div className="staff-login-page__brand">
          <span className="staff-login-page__brand-mark"><img alt="" src="/Care+.png" /></span>
          <span className="staff-login-page__brand-copy"><strong>CarePlus</strong><small>CLINIC STAFF</small></span>
        </div>
        <button
          aria-checked={theme === 'dark'}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className={`staff-theme-toggle staff-theme-toggle--topbar${theme === 'dark' ? ' is-dark' : ''}`}
          role="switch"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          type="button"
          onClick={toggleTheme}
        >
          <span aria-hidden="true" className="staff-theme-toggle__track"><span className="staff-theme-toggle__thumb"><Icon name={theme === 'dark' ? 'moon' : 'sun'} size={13} /></span></span>
          <span className="sr-only">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>
      </div>

      <section className="staff-login-page__layout" aria-labelledby="staff-login-title">
        <div className="staff-login-page__intro">
          <p className="staff-login-page__eyebrow">CarePlus / Staff Portal</p>
          <h1 id="staff-login-title">Welcome back, CarePlus team.</h1>
          <p>
            Sign in with your staff username or email to access the clinic operations portal.
          </p>
          <div className="staff-login-page__note">
            <strong>Secure staff access</strong>
            <span>Your account must be active and registered as a staff account.</span>
          </div>
        </div>

        <form className="staff-login-card" onSubmit={handleSubmit}>
          <div>
            <p className="staff-login-card__eyebrow">Staff sign in</p>
            <h2>Access your workspace</h2>
            <p className="staff-login-card__copy">Use your username or email address.</p>
          </div>

          <label className="staff-login-card__field" htmlFor="staff-identifier">
            Username or email
            <input
              autoComplete="username"
              id="staff-identifier"
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="staff username or email"
              required
              type="text"
              value={identifier}
            />
          </label>

          <label className="staff-login-card__field" htmlFor="staff-password">
            Password
            <input
              autoComplete="current-password"
              id="staff-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
              type="password"
              value={password}
            />
          </label>

          {error ? <p className="staff-login-card__error" role="alert">{error}</p> : null}

          <button className="staff-login-card__submit" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Signing in…' : 'Sign in to staff portal'}
          </button>
        </form>
      </section>
    </main>
  )
}
