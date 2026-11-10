import { useNavigate } from 'react-router'
import { useAuth } from '@/providers/auth-provider'
import { StaffAccountMenu } from '../components/StaffAccountMenu'
import { Icon, type IconName } from './StaffIcon'

export type StaffRole = 'Admin' | 'Doctor' | 'Pharmacist'

type NavItem = { label: string; icon: IconName; roles: StaffRole[]; badge?: string }

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: 'Workspace',
    items: [
      { label: 'Overview', icon: 'grid', roles: ['Admin', 'Doctor', 'Pharmacist'] },
      { label: 'Appointments', icon: 'calendar', roles: ['Admin', 'Doctor', 'Pharmacist'] },
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
      { label: 'Medicine', icon: 'box', roles: ['Pharmacist'] },
      { label: 'Medicine batches', icon: 'box', roles: ['Pharmacist'] },
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
      { label: 'Settings', icon: 'settings', roles: ['Admin', 'Doctor', 'Pharmacist'] },
    ],
  },
]

export function isStaffRole(value: string | undefined): value is StaffRole {
  return value === 'Admin' || value === 'Doctor' || value === 'Pharmacist'
}

export function getStaffRole(value: string | undefined): StaffRole {
  return isStaffRole(value) ? value : 'Admin'
}

type StaffSidebarProps = {
  activeNav: string
  announce: (message: string) => void
  onClose: () => void
  sidebarOpen: boolean
}

const staffRoutes: Record<string, string> = {
  Overview: '/staff',
  Appointments: '/staff/appointments',
  Patients: '/staff/patients',
  Staff: '/staff/staff',
  'Schedules & availability': '/staff/schedules',
  Leave: '/staff/leave',
  'Clinic rooms': '/staff/rooms',
  Medicine: '/staff/medicine',
  'Medicine batches': '/staff/medicine-batches',
  'Medical records': '/staff/medical-records',
  Notifications: '/staff/notifications',
  'Audit & logs': '/staff/audit-logs',
  Settings: '/staff/settings',
}

export function StaffSidebar({ activeNav, announce, onClose, sidebarOpen }: StaffSidebarProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const currentRole = getStaffRole(user?.role)
  const initials = (user?.name || 'Staff').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()

  const openAccountSettings = () => {
    navigate('/staff/settings')
    announce('Account settings selected.')
    onClose()
  }

  const handleNavigate = (label: string) => {
    const route = staffRoutes[label]

    if (route) {
      navigate(route)
      return
    }

    if (label !== activeNav) {
      announce(`${label} is ready to connect to your clinic workflow.`)
    }
  }

  const visibleNavGroups = navGroups
    .map((group) => ({ ...group, items: group.items.filter((item) => item.roles.includes(currentRole)) }))
    .filter((group) => group.items.length > 0)

  return (
    <>
      <div aria-hidden={!sidebarOpen} className={`staff-sidebar-backdrop${sidebarOpen ? ' is-visible' : ''}`} onClick={onClose} />
      <aside className={`staff-sidebar${sidebarOpen ? ' is-open' : ''}`}>
        <div className="staff-brand">
          <span className="staff-brand__mark"><img alt="CarePlus Clinic logo" src="/clinic-logo.png" /></span>
          <span className="staff-brand__copy"><strong>CarePlus</strong><small>CLINIC STAFF</small></span>
        </div>

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
                      handleNavigate(item.label)
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
            <span><strong>{user?.name || 'Staff user'}</strong><small>{user?.role || currentRole}</small></span>
            <StaffAccountMenu onClose={onClose} onSettings={openAccountSettings} triggerClassName="staff-user-card__menu-trigger" triggerLabel="Open account menu"><Icon name="more" size={19} /></StaffAccountMenu>
          </div>
        </div>
      </aside>
    </>
  )
}
