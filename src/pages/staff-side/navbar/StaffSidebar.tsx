import { useState } from 'react'
import { useAuth } from '../../../components/auth'
import { Icon, type IconName } from './StaffIcon'

export type StaffRole = 'Admin' | 'Doctor' | 'Pharmacist'

type NavItem = { label: string; icon: IconName; roles: StaffRole[]; badge?: string }

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: 'Workspace',
    items: [
      { label: 'Overview', icon: 'grid', roles: ['Admin', 'Doctor', 'Pharmacist'] },
      { label: 'Appointments', icon: 'calendar', roles: ['Admin', 'Doctor', 'Pharmacist'], badge: '8' },
      { label: 'Patients', icon: 'users', roles: ['Admin'] },
      { label: 'Queue', icon: 'clock', roles: ['Admin', 'Doctor', 'Pharmacist'] },
    ],
  },
  {
    label: 'Clinical operations',
    items: [
      { label: 'Staff', icon: 'staff', roles: ['Admin'] },
      { label: 'Schedules & availability', icon: 'calendar', roles: ['Admin', 'Doctor', 'Pharmacist'] },
      { label: 'Leave', icon: 'calendar', roles: ['Admin', 'Doctor', 'Pharmacist'] },
      { label: 'Clinic rooms', icon: 'activity', roles: ['Admin'] },
      { label: 'Inventory', icon: 'box', roles: ['Pharmacist'] },
      { label: 'Prescriptions', icon: 'check', roles: ['Doctor', 'Pharmacist'] },
      { label: 'Medical records', icon: 'shield', roles: ['Doctor'] },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Notifications', icon: 'bell', roles: ['Admin', 'Doctor', 'Pharmacist'] },
      { label: 'Reports & analytics', icon: 'chart', roles: ['Admin'] },
      { label: 'Audit & logs', icon: 'activity', roles: ['Admin'] },
      { label: 'Settings', icon: 'settings', roles: ['Admin'] },
    ],
  },
]

const roleDetails: Record<StaffRole, { initials: string; description: string }> = {
  Admin: { initials: 'AD', description: 'Full clinic management' },
  Doctor: { initials: 'DR', description: 'Clinical care workspace' },
  Pharmacist: { initials: 'PH', description: 'Medicine & dispensing' },
}

const roleModules: Record<StaffRole, string[]> = {
  Admin: ['Overview', 'Appointments', 'Patients', 'Queue', 'Staff', 'Schedules & availability', 'Leave', 'Clinic rooms', 'Notifications', 'Reports & analytics', 'Audit & logs', 'Settings'],
  Doctor: ['Overview', 'Appointments', 'Queue', 'Schedules & availability', 'Leave', 'Notifications', 'Prescriptions', 'Medical records'],
  Pharmacist: ['Overview', 'Appointments', 'Queue', 'Schedules & availability', 'Leave', 'Notifications', 'Inventory', 'Prescriptions'],
}

function isStaffRole(value: string | undefined): value is StaffRole {
  return value === 'Admin' || value === 'Doctor' || value === 'Pharmacist'
}

type StaffSidebarProps = {
  activeNav: string
  announce: (message: string) => void
  onClose: () => void
  onNavigate: (label: string) => void
  onRoleChange: (role: StaffRole) => void
  role: StaffRole
  sidebarOpen: boolean
}

export function StaffSidebar({ activeNav, announce, onClose, onNavigate, onRoleChange, role, sidebarOpen }: StaffSidebarProps) {
  const { user } = useAuth()
  const claimRole = isStaffRole(user?.role) ? user.role : undefined
  const effectiveRole = claimRole ?? role
  const [rolePanelOpen, setRolePanelOpen] = useState(false)
  const initials = (user?.name || 'Staff').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()

  const visibleNavGroups = navGroups
    .map((group) => ({ ...group, items: group.items.filter((item) => item.roles.includes(effectiveRole)) }))
    .filter((group) => group.items.length > 0)

  return (
    <>
      <div aria-hidden={!sidebarOpen} className={`staff-sidebar-backdrop${sidebarOpen ? ' is-visible' : ''}`} onClick={onClose} />
      <aside className={`staff-sidebar${sidebarOpen ? ' is-open' : ''}`}>
        <div className="staff-brand">
          <span className="staff-brand__mark"><img alt="" src="/Care+.png" /></span>
          <span className="staff-brand__copy"><strong>CarePlus</strong><small>CLINIC STAFF</small></span>
        </div>

        <div className="staff-role-preview">
          {claimRole ? (
            <div aria-label={`Signed-in role: ${effectiveRole}`} className="staff-role-preview__button" role="status">
              <span className="staff-role-preview__avatar">{roleDetails[effectiveRole].initials}</span>
              <span><small>Signed-in role</small><strong>{effectiveRole}</strong></span>
              <Icon name="shield" size={16} />
            </div>
          ) : (
            <button aria-expanded={rolePanelOpen} className="staff-role-preview__button" type="button" onClick={() => setRolePanelOpen((current) => !current)}>
              <span className="staff-role-preview__avatar">{roleDetails[effectiveRole].initials}</span>
              <span><small>Role preview</small><strong>{effectiveRole}</strong></span>
              <Icon name="chevronDown" size={16} />
            </button>
          )}
          {!claimRole && rolePanelOpen ? (
            <div className="staff-role-panel">
              <div className="staff-role-panel__heading"><strong>View as role</strong><small>Preview module access</small></div>
              <div className="staff-role-options">
                {(Object.keys(roleDetails) as StaffRole[]).map((nextRole) => (
                  <button className={`staff-role-option${role === nextRole ? ' is-selected' : ''}`} key={nextRole} type="button" onClick={() => {
                    onRoleChange(nextRole)
                    setRolePanelOpen(false)
                    onClose()
                  }}>
                    <span className={`staff-role-option__avatar staff-role-option__avatar--${nextRole.toLowerCase()}`}>{roleDetails[nextRole].initials}</span>
                    <span><strong>{nextRole}</strong><small>{roleDetails[nextRole].description}</small></span>
                    <small className="staff-role-option__count">{roleModules[nextRole].length} modules</small>
                    {effectiveRole === nextRole ? <Icon name="check" size={15} /> : null}
                  </button>
                ))}
              </div>
              <div className="staff-role-panel__modules"><small>{effectiveRole} can access</small><div>{roleModules[effectiveRole].map((module) => <span key={module}>{module}</span>)}</div></div>
            </div>
          ) : null}
        </div>

        <div className="staff-role-access-note"><Icon name="shield" size={14} /><span>Menu shows modules available to <strong>{effectiveRole}</strong>.</span></div>

        <div className="staff-nav-groups">
          {visibleNavGroups.map((group, groupIndex) => (
            <section className="staff-nav-group" key={group.label}>
              <div className={`staff-sidebar__label${groupIndex > 0 ? ' staff-sidebar__label--secondary' : ''}`}>{group.label}</div>
              <nav aria-label={`${group.label} navigation`} className="staff-nav">
                {group.items.map((item) => (
                  <button
                    aria-current={activeNav === item.label ? 'page' : undefined}
                    className={`staff-nav__item${activeNav === item.label ? ' is-active' : ''}`}
                    key={item.label}
                    type="button"
                    onClick={() => {
                      onNavigate(item.label)
                      onClose()
                    }}
                  >
                    <span className="staff-nav__icon"><Icon name={item.icon} size={19} /></span>
                    <span>{item.label}</span>
                    {item.badge ? <span className="staff-nav__count">{item.badge}</span> : null}
                  </button>
                ))}
              </nav>
            </section>
          ))}
        </div>

        <div className="staff-sidebar__bottom">
          <div className="staff-user-card">
            <span className="staff-avatar">{initials}</span>
            <span><strong>{user?.name || 'Staff user'}</strong><small>{user?.role || role}</small></span>
            <button aria-label="Open account menu" type="button" onClick={() => announce('Account menu is ready for your profile controls.')}><Icon name="more" size={19} /></button>
          </div>
        </div>
      </aside>
    </>
  )
}
