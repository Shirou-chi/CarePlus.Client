import type { Theme } from '../../../components/theme/useTheme'
import { useAuth } from '../../../components/auth'
import type { StaffRole } from './StaffSidebar'
import { Icon } from './StaffIcon'

type StaffNavbarProps = {
  activeNav: string
  announce: (message: string) => void
  notificationsOpen: boolean
  onOpenSidebar: () => void
  onSearchChange: (value: string) => void
  onToggleNotifications: () => void
  searchTerm: string
  selectedRole: StaffRole
  theme: Theme
  toggleTheme: () => void
}

export function StaffNavbar({ activeNav, announce, notificationsOpen, onOpenSidebar, onSearchChange, onToggleNotifications, searchTerm, selectedRole, theme, toggleTheme }: StaffNavbarProps) {
  const { user } = useAuth()
  const initials = (user?.name || 'Staff').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()

  return (
    <header className="staff-topbar">
      <div className="staff-topbar__left">
        <button aria-label="Open navigation" className="staff-mobile-toggle" type="button" onClick={onOpenSidebar}><Icon name="menu" size={22} /></button>
        <div className="staff-breadcrumb"><span>Workspace</span><Icon name="chevronRight" size={15} /><strong>{activeNav}</strong></div>
        <span className="staff-role-context"><i /> {selectedRole} access</span>
      </div>
      <div className="staff-topbar__actions">
        <label className="staff-search">
          <Icon name="search" size={19} />
          <span className="sr-only">Search dashboard</span>
          <input placeholder="Search anything..." type="search" value={searchTerm} onChange={(event) => onSearchChange(event.target.value)} />
          <kbd>⌘ K</kbd>
        </label>
        <div className="staff-notification-wrap">
          <button aria-expanded={notificationsOpen} aria-label="Open notifications" className="staff-icon-button" type="button" onClick={onToggleNotifications}>
            <Icon name="bell" size={20} />
            <span className="staff-notification-dot" />
          </button>
          {notificationsOpen ? (
            <div className="staff-notifications" role="status">
              <div className="staff-notifications__header"><strong>Notifications</strong><button type="button" onClick={onToggleNotifications}>Mark all read</button></div>
              <div className="staff-notification"><span className="staff-notification__bullet staff-notification__bullet--teal" /><span><strong>Inventory alert</strong><small>Paracetamol stock is below threshold.</small></span><time>12m</time></div>
              <div className="staff-notification"><span className="staff-notification__bullet staff-notification__bullet--amber" /><span><strong>Schedule change</strong><small>Dr. Aisha has opened 2 more slots.</small></span><time>34m</time></div>
            </div>
          ) : null}
        </div>
        <button aria-checked={theme === 'dark'} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} className={`staff-theme-toggle staff-theme-toggle--topbar${theme === 'dark' ? ' is-dark' : ''}`} role="switch" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} type="button" onClick={toggleTheme}>
          <span aria-hidden="true" className="staff-theme-toggle__track"><span className="staff-theme-toggle__thumb"><Icon name={theme === 'dark' ? 'moon' : 'sun'} size={13} /></span></span>
          <span className="sr-only">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>
        <button aria-label="Open profile" className="staff-topbar__avatar" type="button" onClick={() => announce('Profile controls are ready.')}><span className="staff-avatar">{initials}</span><Icon name="chevronDown" size={16} /></button>
      </div>
    </header>
  )
}
