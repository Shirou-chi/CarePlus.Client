import { useId } from 'react'
import type { Theme } from '../../../components/theme/useTheme'
import { useAuth } from '@/providers/auth-provider'
import { useNotices } from '@/providers/notification-provider'
import { Link, useNavigate } from 'react-router'
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
            {unread.length > 0 ? <span aria-hidden="true" className="staff-notification-dot" /> : null}
          </button>
          {notificationsOpen ? (
            <section aria-labelledby={`${notificationsId}-title`} className="staff-notifications" id={notificationsId}>
              <div className="staff-notifications__header">
                <h2 id={`${notificationsId}-title`}>Notifications</h2>
                {unread.length > 0 ? (
                  <button
                    className="staff-notifications__mark-read"
                    disabled={notificationsLoading}
                    type="button"
                    onClick={markAllRead}
                  >
                    <Icon name="check" size={14} />
                    Mark all as read
                  </button>
                ) : null}
              </div>
              <div className="staff-notifications__body">
                {notificationsError ? <p className="staff-notifications__status" role="alert">Unable to load notifications.</p> : null}
                {notificationsLoading ? <p className="staff-notifications__status" role="status">Loading notifications…</p> : null}
                {!notificationsLoading && !notificationsError && !unread.length ? (
                  <div className="staff-notification-empty" role="status">
                    <span className="staff-notification-empty__icon"><Icon name="check" size={20} /></span>
                    <p>No unread notifications</p>
                  </div>
                ) : null}
                {!notificationsLoading ? unread.slice(0, 3).map((item) => (
                  <button
                    className="staff-notification"
                    key={item.id}
                    type="button"
                    onClick={() => {
                      markRead(item.id)
                      navigate(item.href || '/staff/notifications')
                      onToggleNotifications()
                    }}
                  >
                    <span aria-hidden="true" className={`staff-notification__bullet staff-notification__bullet--${item.kind === 'medicine' ? 'amber' : 'teal'}`} />
                    <span className="staff-notification__text">
                      <strong>{item.title}</strong>
                      <small>{item.message}</small>
                    </span>
                    <time dateTime={item.createdAt}>{notificationAge(item.createdAt)}</time>
                  </button>
                )) : null}
              </div>
              <div className="staff-notifications__footer">
                <Link className="staff-notifications__view-all" to="/staff/notifications" onClick={onToggleNotifications}>
                  View all notifications
                  <Icon name="chevronRight" size={16} />
                </Link>
              </div>
            </section>
          ) : null}
        </div>
        <button aria-checked={theme === 'dark'} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} className={`staff-theme-toggle staff-theme-toggle--topbar${theme === 'dark' ? ' is-dark' : ''}`} role="switch" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} type="button" onClick={toggleTheme}>
          <span aria-hidden="true" className="staff-theme-toggle__track"><span className="staff-theme-toggle__thumb"><Icon name={theme === 'dark' ? 'moon' : 'sun'} size={13} /></span></span>
          <span className="sr-only">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>
        <StaffAccountMenu className="staff-account-menu-wrap--topbar" onSettings={() => navigate('/staff/settings')} triggerClassName="staff-topbar__avatar" triggerLabel="Open account menu"><span className="staff-avatar">{initials}</span><Icon name="chevronDown" size={16} /></StaffAccountMenu>
      </div>
    </header>
  )
}
