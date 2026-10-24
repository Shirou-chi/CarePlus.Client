import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useTheme } from '../../../components/theme/useTheme'
import { Icon, type IconName } from '../navbar/StaffIcon'
import { StaffNavbar } from '../navbar/StaffNavbar'
import { StaffSidebar, type StaffRole } from '../navbar/StaffSidebar'
import '../StaffHomePage.css'
import './NotificationsPage.css'

type NotificationCategory = 'Appointments' | 'Inventory' | 'Leave' | 'Security' | 'System'
type NotificationTone = 'teal' | 'blue' | 'amber' | 'violet' | 'red'
type NotificationItem = {
  id: string
  title: string
  message: string
  time: string
  category: NotificationCategory
  icon: IconName
  tone: NotificationTone
  unread: boolean
}

const categoryFilters = ['All categories', 'Appointments', 'Inventory', 'Leave', 'Security', 'System'] as const
const notificationItems: NotificationItem[] = [
  { id: 'NT-001', title: 'Appointment rescheduled', message: 'Sofia Tan’s follow-up has moved to 21 August at 11:00 AM.', time: '8 minutes ago', category: 'Appointments', icon: 'calendar', tone: 'teal', unread: true },
  { id: 'NT-002', title: 'Inventory threshold reached', message: 'Paracetamol 500mg is below the minimum stock level.', time: '24 minutes ago', category: 'Inventory', icon: 'box', tone: 'amber', unread: true },
  { id: 'NT-003', title: 'Leave request needs review', message: 'Priya Nair submitted an annual leave request for 28 August.', time: '42 minutes ago', category: 'Leave', icon: 'calendar', tone: 'violet', unread: true },
  { id: 'NT-004', title: 'New patient profile created', message: 'Nadia Ismail’s patient profile is ready for your review.', time: '1 hour ago', category: 'System', icon: 'users', tone: 'blue', unread: false },
  { id: 'NT-005', title: 'New sign-in detected', message: 'A new sign-in was recorded from Chrome on Windows.', time: '2 hours ago', category: 'Security', icon: 'shield', tone: 'red', unread: true },
  { id: 'NT-006', title: 'Schedule coverage updated', message: 'Dr. Aisha Rahman opened two additional consultation slots.', time: 'Yesterday', category: 'Appointments', icon: 'activity', tone: 'teal', unread: false },
  { id: 'NT-007', title: 'Prescription marked ready', message: 'RX-260819-018 is ready for pharmacy collection.', time: 'Yesterday', category: 'Inventory', icon: 'check', tone: 'blue', unread: false },
  { id: 'NT-008', title: 'Weekly audit archive completed', message: 'The clinic’s scheduled audit archive is available.', time: 'Tuesday', category: 'System', icon: 'download', tone: 'violet', unread: false },
]

export function NotificationsPage() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [activeNav, setActiveNav] = useState('Notifications')
  const [selectedRole, setSelectedRole] = useState<StaffRole>('Admin')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all')
  const [categoryFilter, setCategoryFilter] = useState<(typeof categoryFilters)[number]>('All categories')
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const [notice, setNotice] = useState('')

  const announce = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3200)
  }

  const handleRoleChange = (role: StaffRole) => {
    setSelectedRole(role)
    announce(`${role} notification centre is now displayed.`)
  }

  const handleNavigate = (label: string) => {
    const routes: Record<string, string> = {
      Overview: '/staff',
      Appointments: '/staff/appointments',
      Patients: '/staff/patients',
      Staff: '/staff/staff',
      'Schedules & availability': '/staff/schedules',
      Leave: '/staff/leave',
      'Audit & logs': '/staff/audit-logs',
    }
    const route = routes[label]
    if (route) {
      navigate(route)
      return
    }
    setActiveNav(label)
    if (label !== 'Notifications') announce(`${label} is ready to connect to your clinic workflow.`)
  }

  const unreadCount = notificationItems.filter((item) => item.unread && !readIds.has(item.id)).length
  const filteredNotifications = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return notificationItems.filter((item) => {
      const isUnread = item.unread && !readIds.has(item.id)
      const matchesTab = activeTab === 'all' || isUnread
      const matchesCategory = categoryFilter === 'All categories' || item.category === categoryFilter
      const matchesSearch = !query || `${item.title} ${item.message} ${item.category}`.toLowerCase().includes(query)
      return matchesTab && matchesCategory && matchesSearch
    })
  }, [activeTab, categoryFilter, readIds, searchTerm])

  const markRead = (id: string) => {
    setReadIds((current) => new Set(current).add(id))
    announce('Notification marked as read.')
  }

  const markAllRead = () => {
    setReadIds(new Set(notificationItems.map((item) => item.id)))
    announce('All notifications marked as read.')
  }

  return (
    <div className="staff-page notifications-page">
      <StaffSidebar activeNav={activeNav} announce={announce} onClose={() => setSidebarOpen(false)} onNavigate={handleNavigate} onRoleChange={handleRoleChange} role={selectedRole} sidebarOpen={sidebarOpen} />
      <main className="staff-main">
        <StaffNavbar activeNav={activeNav} announce={announce} notificationsOpen={notificationsOpen} onOpenSidebar={() => setSidebarOpen(true)} onSearchChange={setSearchTerm} onToggleNotifications={() => setNotificationsOpen((current) => !current)} searchTerm={searchTerm} selectedRole={selectedRole} theme={theme} toggleTheme={toggleTheme} />
        <div className="staff-content notifications-content">
          <section className="notifications-hero"><div><p className="staff-eyebrow">CarePlus Clinic · Activity centre</p><h1>Stay ahead of every update.</h1><p className="notifications-hero__copy">Keep important clinic activity visible without losing the signal in the noise.</p></div><button className="staff-button staff-button--secondary notifications-mark-button" type="button" onClick={markAllRead}><Icon name="check" size={16} /> Mark all as read</button></section>
          <section className="notifications-board">
            <div className="staff-card notifications-list-card">
              <div className="staff-card__header notifications-list-header"><div><p className="staff-card__eyebrow">Notification centre</p><h2>Your notifications</h2><span className="notifications-list-description">Updates from the modules you have access to.</span></div><span className="notifications-unread-count">{unreadCount} unread</span></div>
              <div className="notifications-tabs"><button aria-pressed={activeTab === 'all'} className={activeTab === 'all' ? 'is-selected' : ''} type="button" onClick={() => setActiveTab('all')}>All activity <span>{notificationItems.length}</span></button><button aria-pressed={activeTab === 'unread'} className={activeTab === 'unread' ? 'is-selected' : ''} type="button" onClick={() => setActiveTab('unread')}>Unread <span>{unreadCount}</span></button></div>
              <div className="notifications-toolbar"><label className="notifications-search"><Icon name="search" size={16} /><span className="sr-only">Search notifications</span><input placeholder="Search notifications" type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} /></label><label className="notifications-select"><span className="sr-only">Filter by category</span><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as (typeof categoryFilters)[number])}>{categoryFilters.map((category) => <option key={category}>{category}</option>)}</select><Icon name="chevronDown" size={14} /></label></div>
              <div className="notifications-list">{filteredNotifications.map((item) => { const isUnread = item.unread && !readIds.has(item.id); return <article className={`notification-item${isUnread ? ' is-unread' : ''}`} key={item.id}><span className={`notification-item__icon notification-item__icon--${item.tone}`}><Icon name={item.icon} size={18} /></span><div className="notification-item__copy"><div><strong>{item.title}</strong>{isUnread ? <span className="notification-unread-dot" /> : null}</div><p>{item.message}</p><small>{item.category} · {item.time}</small></div><button aria-label={isUnread ? `Mark ${item.title} as read` : `Open ${item.title}`} className="notification-item__action" type="button" onClick={() => markRead(item.id)}>{isUnread ? <Icon name="check" size={16} /> : <Icon name="chevronRight" size={17} />}</button></article> })}{!filteredNotifications.length ? <div className="notifications-empty"><Icon name="bell" size={25} /><strong>No notifications found</strong><span>Try another search or category.</span></div> : null}</div>
              <div className="notifications-footer"><span>Showing <strong>{filteredNotifications.length}</strong> notifications</span><button type="button" onClick={() => announce('Older notifications are ready to load.')}>Load older notifications <Icon name="arrowUpRight" size={15} /></button></div>
            </div>
            <aside className="notifications-side-column"><section className="staff-card notification-summary-card"><div className="staff-card__header"><div><p className="staff-card__eyebrow">This week</p><h2>Activity summary</h2></div><span className="staff-live-pill"><i /> Live</span></div><div className="notification-summary-list"><div><span className="notification-summary-icon notification-summary-icon--teal"><Icon name="calendar" size={15} /></span><span><strong>12</strong><small>Appointment updates</small></span></div><div><span className="notification-summary-icon notification-summary-icon--amber"><Icon name="box" size={15} /></span><span><strong>08</strong><small>Inventory alerts</small></span></div><div><span className="notification-summary-icon notification-summary-icon--violet"><Icon name="shield" size={15} /></span><span><strong>04</strong><small>Security events</small></span></div></div></section><section className="staff-card notification-access-card"><Icon name="shield" size={18} /><span><strong>{selectedRole} access</strong><small>{selectedRole === 'Admin' ? 'You receive all clinic-wide notifications.' : 'You receive notifications related to your workspace.'}</small></span></section></aside>
          </section>
        </div>
      </main>
      {notice ? <div aria-live="polite" className="staff-toast"><span><Icon name="check" size={17} /></span>{notice}</div> : null}
    </div>
  )
}
