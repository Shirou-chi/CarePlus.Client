import { startTransition, useId } from 'react'
import type { Theme } from '../../../components/theme/useTheme'
import { useAuth } from '@/providers/auth-provider'
import { useNotices } from '@/providers/notification-provider'
import { useTheme as useAppTheme } from '@/providers/theme-provider'
import { useNavigate } from 'react-router'
import { StaffAccountMenu } from '../components/StaffAccountMenu'
import type { StaffRole } from './StaffSidebar'
import { Icon } from './StaffIcon'

function notificationAge(createdAt: string) {
  const minutes = Math.max(0, Math.round((Date.now() - Date.parse(createdAt)) / 60_000))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.round(hours / 24)}d`
}

type StaffNavbarProps = {
  activeNav: string
  notificationsOpen: boolean
  onOpenSidebar: () => void
  onSearchChange: (value: string) => void
  onToggleNotifications: () => void
  searchTerm: string
  selectedRole: StaffRole
  theme: Theme
  toggleTheme: () => void
}

export function StaffNavbar({ activeNav, notificationsOpen, onOpenSidebar, onToggleNotifications, selectedRole, theme, toggleTheme }: StaffNavbarProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { textSize, setTextSize } = useAppTheme()
  const { unread, loading: notificationsLoading, error: notificationsError, markRead, markAllRead } = useNotices()
  const notificationsId = useId()
  const initials = (user?.name || 'Staff').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()

  return (
    <header className="staff-topbar">
      <div className="staff-topbar__left">
        <button aria-label="Open navigation" className="staff-mobile-toggle" type="button" onClick={onOpenSidebar}><Icon name="menu" size={22} /></button>
        <div className="staff-breadcrumb"><span>Workspace</span><Icon name="chevronRight" size={15} /><strong>{activeNav}</strong></div>
        <span className="staff-role-context"><i /> {selectedRole} access</span>
      </div>
      <div className="staff-topbar__actions">
        <div className="staff-notification-wrap">
          <button
            aria-controls={notificationsOpen ? notificationsId : undefined}
            aria-expanded={notificationsOpen}
            aria-label="Notifications"
            className="staff-icon-button"
            type="button"
            onClick={onToggleNotifications}
          >
            <Icon name="bell" size={20} />
            {unread.length > 0 ? <span className="staff-notification-dot" aria-hidden /> : null}
          </button>
          {notificationsOpen ? (
            <div className="staff-notifications" role="status">
              <div className="staff-notifications__header"><strong>Notifications</strong><button type="button" onClick={() => void markAllRead()} disabled={!unread.length || notificationsLoading}>Mark all read</button></div>
              {notificationsError ? <div className="staff-notification-empty">Unable to load notifications.</div> : null}
              {notificationsLoading ? <div className="staff-notification-empty">Loading notifications…</div> : null}
              {!notificationsLoading && !notificationsError && !unread.length ? <div className="staff-notification-empty">No unread notifications.</div> : null}
              {!notificationsLoading ? unread.slice(0, 3).map((item) => {
                const tone = item.kind === 'medicine' ? 'amber' : 'teal'
                return (
                  <button className="staff-notification" key={item.id} type="button" onClick={() => { markRead(item.id); startTransition(() => navigate(item.href || '/staff/notifications')); onToggleNotifications() }}>
                    <span className={`staff-notification__bullet staff-notification__bullet--${tone}`} />
                    <span className="staff-notification__body">
                      <span className="staff-notification__top">
                        <strong>{item.title}</strong>
                        <time>{notificationAge(item.createdAt)}</time>
                      </span>
                      <small>{item.message}</small>
                    </span>
                  </button>
                )
              }) : null}
              <button className="staff-notifications__view-all" type="button" onClick={() => { startTransition(() => navigate('/staff/notifications')); onToggleNotifications() }}>
                View all notifications
                <Icon name="chevronRight" size={14} />
              </button>
            </div>
          ) : null}
        </div>
        <div className="staff-text-size-toggle" role="group" aria-label="Text size">
          <button
            aria-pressed={textSize === 'normal'}
            className={`staff-text-size-toggle__option${textSize === 'normal' ? ' is-selected' : ''}`}
            type="button"
            onClick={() => setTextSize('normal')}
          >
            A
            <span className="sr-only"> Normal text</span>
          </button>
          <button
            aria-pressed={textSize === 'large'}
            className={`staff-text-size-toggle__option${textSize === 'large' ? ' is-selected' : ''}`}
            type="button"
            onClick={() => setTextSize('large')}
          >
            A+
            <span className="sr-only"> Large text</span>
          </button>
        </div>
        <button aria-checked={theme === 'dark'} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} className={`staff-theme-toggle staff-theme-toggle--topbar${theme === 'dark' ? ' is-dark' : ''}`} role="switch" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} type="button" onClick={toggleTheme}>
          <span aria-hidden="true" className="staff-theme-toggle__track"><span className="staff-theme-toggle__thumb"><Icon name={theme === 'dark' ? 'moon' : 'sun'} size={13} /></span></span>
          <span className="sr-only">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>
        <StaffAccountMenu className="staff-account-menu-wrap--topbar" onSettings={() => startTransition(() => navigate('/staff/settings'))} triggerClassName="staff-topbar__avatar" triggerLabel="Open account menu"><span className="staff-avatar">{initials}</span><Icon name="chevronDown" size={16} /></StaffAccountMenu>
      </div>
    </header>
  )
}
