import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { staffNotificationApi, type ApiNotification } from '@/services/notificationApi'
import { useTheme } from '../../../components/theme/useTheme'
import { Icon, type IconName } from '../navbar/StaffIcon'
import { StaffNavbar } from '../navbar/StaffNavbar'
import { getStaffRole, StaffSidebar } from '../navbar/StaffSidebar'
import { StaffListReset, StaffListSort } from '../components/StaffListControls'
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
const sortOptions = ['Newest first', 'Oldest first', 'Title A–Z', 'Unread first'] as const
type SortOption = (typeof sortOptions)[number]

const categoryForType = (type: string): NotificationCategory => {
  if (type === 'staff_appointment' || type === 'schedule_update') return 'Appointments'
  if (type === 'medicine_update') return 'Inventory'
  if (type === 'leave_review' || type === 'leave_update') return 'Leave'
  if (type === 'security') return 'Security'
  return 'System'
}

const iconForType = (type: string): IconName => {
  if (type === 'staff_appointment' || type === 'schedule_update') return 'calendar'
  if (type === 'medicine_update') return 'box'
  if (type === 'leave_review' || type === 'leave_update') return 'calendar'
  if (type === 'security') return 'shield'
  return 'download'
}

const toneForType = (type: string): NotificationTone => {
  if (type === 'staff_appointment' || type === 'schedule_update') return 'teal'
  if (type === 'medicine_update') return 'amber'
  if (type === 'leave_review' || type === 'leave_update') return 'violet'
  if (type === 'security') return 'red'
  return 'blue'
}

const relativeNotificationTime = (createdAt: string) => {
  const minutes = Math.max(0, Math.round((Date.now() - Date.parse(createdAt)) / 60_000))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} minutes ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

const mapStaffNotification = (item: ApiNotification): NotificationItem => ({
  id: item.id,
  title: item.title,
  message: item.message,
  time: relativeNotificationTime(item.createdAt),
  category: categoryForType(item.type),
  icon: iconForType(item.type),
  tone: toneForType(item.type),
  unread: item.unread,
})

export function NotificationsPage() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [activeNav] = useState('Notifications')
  const currentRole = getStaffRole(user?.role)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all')
  const [categoryFilter, setCategoryFilter] = useState<(typeof categoryFilters)[number]>('All categories')
  const [sortOption, setSortOption] = useState<SortOption>('Newest first')
  const [notificationItems, setNotificationItems] = useState<NotificationItem[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(true)
  const [notificationsError, setNotificationsError] = useState<string | null>(null)
  const [notificationActionLoading, setNotificationActionLoading] = useState(false)
  const [notice, setNotice] = useState('')

  const announce = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3200)
  }

  const loadNotifications = useCallback(async () => {
    if (!user?.userId) {
      setNotificationItems([])
      setNotificationsLoading(false)
      return
    }

    setNotificationsLoading(true)
    setNotificationsError(null)
    try {
      const rows = await staffNotificationApi.list()
      setNotificationItems(rows.map(mapStaffNotification))
    } catch (cause) {
      setNotificationsError(cause instanceof Error ? cause.message : 'Unable to load staff notifications.')
    } finally {
      setNotificationsLoading(false)
    }
  }, [user?.userId])

  useEffect(() => {
    void loadNotifications()
  }, [loadNotifications])

  const unreadCount = notificationItems.filter((item) => item.unread).length
  const filteredNotifications = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    const rows = notificationItems.filter((item) => {
      const matchesTab = activeTab === 'all' || item.unread
      const matchesCategory = categoryFilter === 'All categories' || item.category === categoryFilter
      const matchesSearch = !query || `${item.title} ${item.message} ${item.category}`.toLowerCase().includes(query)
      return matchesTab && matchesCategory && matchesSearch
    })

    return rows.sort((left, right) => {
      switch (sortOption) {
        case 'Oldest first':
          return notificationItems.indexOf(right) - notificationItems.indexOf(left)
        case 'Title A–Z':
          return left.title.localeCompare(right.title)
        case 'Unread first':
          return Number(right.unread) - Number(left.unread)
        case 'Newest first':
        default:
          return notificationItems.indexOf(left) - notificationItems.indexOf(right)
      }
    })
  }, [activeTab, categoryFilter, notificationItems, searchTerm, sortOption])

  const resetListControls = () => {
    setSearchTerm('')
    setActiveTab('all')
    setCategoryFilter('All categories')
    setSortOption('Newest first')
  }

  const markRead = async (id: string) => {
    setNotificationActionLoading(true)
    try {
      const rows = await staffNotificationApi.markRead(id)
      setNotificationItems(rows.map(mapStaffNotification))
      announce('Notification marked as read.')
    } catch (cause) {
      announce(cause instanceof Error ? cause.message : 'Unable to update notification.')
    } finally {
      setNotificationActionLoading(false)
    }
  }

  const markAllRead = async () => {
    setNotificationActionLoading(true)
    try {
      const rows = await staffNotificationApi.markAllRead()
      setNotificationItems(rows.map(mapStaffNotification))
      announce('All notifications marked as read.')
    } catch (cause) {
      announce(cause instanceof Error ? cause.message : 'Unable to update notifications.')
    } finally {
      setNotificationActionLoading(false)
    }
  }

  const appointmentCount = notificationItems.filter((item) => item.category === 'Appointments').length
  const inventoryCount = notificationItems.filter((item) => item.category === 'Inventory').length
  const leaveCount = notificationItems.filter((item) => item.category === 'Leave').length

  return (
    <div className="staff-page notifications-page">
      <StaffSidebar activeNav={activeNav} announce={announce} onClose={() => setSidebarOpen(false)} sidebarOpen={sidebarOpen} />
      <main className="staff-main">
      <StaffNavbar activeNav={activeNav} notificationsOpen={notificationsOpen} onOpenSidebar={() => setSidebarOpen(true)} onSearchChange={setSearchTerm} onToggleNotifications={() => setNotificationsOpen((current) => !current)} searchTerm={searchTerm} selectedRole={currentRole} theme={theme} toggleTheme={toggleTheme} />
        <div className="staff-content notifications-content">
          <section className="notifications-hero"><div><p className="staff-eyebrow">CarePlus Clinic · Activity centre</p><h1>Stay ahead of every update.</h1><p className="notifications-hero__copy">Keep important clinic activity visible without losing the signal in the noise.</p></div><button className="staff-button staff-button--secondary notifications-mark-button" type="button" onClick={() => void markAllRead()} disabled={notificationActionLoading || !unreadCount}><Icon name="check" size={16} /> Mark all as read</button></section>
          <section className="notifications-board">
            <div className="staff-card notifications-list-card">
              <div className="staff-card__header notifications-list-header"><div><p className="staff-card__eyebrow">Notification centre</p><h2>Your notifications</h2><span className="notifications-list-description">Updates from the modules you have access to.</span></div><span className="notifications-unread-count">{unreadCount} unread</span></div>
              <div className="notifications-tabs"><button aria-pressed={activeTab === 'all'} className={activeTab === 'all' ? 'is-selected' : ''} type="button" onClick={() => setActiveTab('all')}>All activity <span>{notificationItems.length}</span></button><button aria-pressed={activeTab === 'unread'} className={activeTab === 'unread' ? 'is-selected' : ''} type="button" onClick={() => setActiveTab('unread')}>Unread <span>{unreadCount}</span></button></div>
              <div className="notifications-toolbar"><label className="notifications-search"><Icon name="search" size={16} /><span className="sr-only">Search notifications</span><input placeholder="Search notifications" type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} /></label><label className="notifications-select"><span className="sr-only">Filter by category</span><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as (typeof categoryFilters)[number])}>{categoryFilters.map((category) => <option key={category}>{category}</option>)}</select><Icon name="chevronDown" size={14} /></label><StaffListSort label="Sort notifications" options={sortOptions} value={sortOption} onChange={(value) => setSortOption(value as SortOption)} /><StaffListReset onClick={resetListControls} /></div>
              {notificationsError ? <div className="notifications-error"><strong>Unable to load notifications</strong><span>{notificationsError}</span><button type="button" onClick={() => void loadNotifications()}>Try again</button></div> : null}
              <div className="notifications-list">{notificationsLoading ? <div className="notifications-empty"><Icon name="bell" size={25} /><strong>Loading notifications</strong><span>Checking your staff updates.</span></div> : null}{!notificationsLoading ? filteredNotifications.map((item) => { const isUnread = item.unread; return <article className={`notification-item${isUnread ? ' is-unread' : ''}`} key={item.id}><span className={`notification-item__icon notification-item__icon--${item.tone}`}><Icon name={item.icon} size={18} /></span><div className="notification-item__copy"><div><strong>{item.title}</strong>{isUnread ? <span className="notification-unread-dot" /> : null}</div><p>{item.message}</p><small>{item.category} · {item.time}</small></div><button aria-label={isUnread ? `Mark ${item.title} as read` : `Open ${item.title}`} className="notification-item__action" type="button" onClick={() => void markRead(item.id)} disabled={notificationActionLoading}>{isUnread ? <Icon name="check" size={16} /> : <Icon name="chevronRight" size={17} />}</button></article> }) : null}{!notificationsLoading && !filteredNotifications.length ? <div className="notifications-empty"><Icon name="bell" size={25} /><strong>No notifications found</strong><span>Try another search or category.</span></div> : null}</div>
              <div className="notifications-footer"><span>Showing <strong>{filteredNotifications.length}</strong> notifications</span><button type="button" onClick={() => announce('Older notifications are ready to load.')}>Load older notifications <Icon name="arrowUpRight" size={15} /></button></div>
            </div>
            <aside className="notifications-side-column"><section className="staff-card notification-summary-card"><div className="staff-card__header"><div><p className="staff-card__eyebrow">Current updates</p><h2>Activity summary</h2></div><span className="staff-live-pill"><i /> Live</span></div><div className="notification-summary-list"><div><span className="notification-summary-icon notification-summary-icon--teal"><Icon name="calendar" size={15} /></span><span><strong>{appointmentCount}</strong><small>Appointment updates</small></span></div><div><span className="notification-summary-icon notification-summary-icon--amber"><Icon name="box" size={15} /></span><span><strong>{inventoryCount}</strong><small>Inventory alerts</small></span></div><div><span className="notification-summary-icon notification-summary-icon--violet"><Icon name="shield" size={15} /></span><span><strong>{leaveCount}</strong><small>Leave updates</small></span></div></div></section><section className="staff-card notification-access-card"><Icon name="shield" size={18} /><span><strong>{currentRole} access</strong><small>{currentRole === 'Admin' ? 'You receive clinic-wide operational notifications.' : 'You receive notifications related to your workspace.'}</small></span></section></aside>
          </section>
        </div>
      </main>
      {notice ? <div aria-live="polite" className="staff-toast"><span><Icon name="check" size={17} /></span>{notice}</div> : null}
    </div>
  )
}
