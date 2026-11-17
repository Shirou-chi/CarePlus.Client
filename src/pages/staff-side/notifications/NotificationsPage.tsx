import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { staffNotificationApi, type ApiNotification } from '@/services/notificationApi'
import { useTheme } from '../../../components/theme/useTheme'
import { Icon } from '../navbar/StaffIcon'
import { StaffNavbar } from '../navbar/StaffNavbar'
import { getStaffRole, StaffSidebar } from '../navbar/StaffSidebar'
import { StaffListReset } from '../components/StaffListControls'
import { StaffPageEyebrow } from '../components/StaffPageEyebrow'
import '../StaffHomePage.css'
import './NotificationsPage.css'

type NotificationCategory = 'Announcements' | 'Schedules' | 'Appointments' | 'Medicine' | 'Leave' | 'Billing' | 'Queue' | 'Medical records' | 'Family' | 'Security' | 'System'
type NotificationKind = 'Announcement' | 'Notification'
type NotificationItem = {
  id: string
  title: string
  message: string
  actor: string
  initials: string
  time: string
  category: NotificationCategory
  kind: NotificationKind
  unread: boolean
}

const categoryForType = (type: string): NotificationCategory => {
  switch (type) {
    case 'announcement':
      return 'Announcements'
    case 'schedule_update':
      return 'Schedules'
    case 'staff_appointment':
    case 'appointment_reminder':
    case 'appointment_cancelled':
      return 'Appointments'
    case 'medicine_update':
      return 'Medicine'
    case 'leave_review':
    case 'leave_update':
      return 'Leave'
    case 'payment_reminder':
      return 'Billing'
    case 'check_in_reminder':
    case 'queue_update':
      return 'Queue'
    case 'medical_record':
      return 'Medical records'
    case 'family_invitation':
    case 'family_invitation_declined':
    case 'family_access_request':
      return 'Family'
    case 'security':
      return 'Security'
    default:
      return 'System'
  }
}

const notificationFilters = ['All', 'Announcements', 'Notifications'] as const

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
  actor: item.actor,
  initials: item.initials,
  time: relativeNotificationTime(item.createdAt),
  category: categoryForType(item.type),
  kind: item.type === 'announcement' ? 'Announcement' : 'Notification',
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
  const [notificationFilter, setNotificationFilter] = useState<(typeof notificationFilters)[number]>('All')
  const [notificationItems, setNotificationItems] = useState<NotificationItem[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
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
      const matchesType = notificationFilter === 'All'
        || (notificationFilter === 'Announcements' ? item.kind === 'Announcement' : item.kind === 'Notification')
      const matchesSearch = !query || `${item.title} ${item.message} ${item.category}`.toLowerCase().includes(query)
      return matchesTab && matchesType && matchesSearch
    })

    return rows
  }, [activeTab, notificationFilter, notificationItems, searchTerm])

  const resetListControls = () => {
    setSearchTerm('')
    setActiveTab('all')
    setNotificationFilter('All')
  }

  const selectableNotifications = filteredNotifications.filter((item) => item.unread)
  const allVisibleSelected = selectableNotifications.length > 0 && selectableNotifications.every((item) => selectedIds.includes(item.id))

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id])
  }

  const toggleSelectAll = () => {
    setSelectedIds((current) => {
      if (allVisibleSelected) {
        const visibleIds = new Set(selectableNotifications.map((item) => item.id))
        return current.filter((id) => !visibleIds.has(id))
      }

      return [...new Set([...current, ...selectableNotifications.map((item) => item.id)])]
    })
  }

  const markRead = async (id: string) => {
    setNotificationActionLoading(true)
    try {
      const rows = await staffNotificationApi.markRead(id)
      setNotificationItems(rows.map(mapStaffNotification))
      setSelectedIds((current) => current.filter((selectedId) => selectedId !== id))
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
      setSelectedIds([])
      announce('All notifications marked as read.')
    } catch (cause) {
      announce(cause instanceof Error ? cause.message : 'Unable to update notifications.')
    } finally {
      setNotificationActionLoading(false)
    }
  }

  const markSelectedRead = async () => {
    const ids = selectedIds.filter((id) => notificationItems.some((item) => item.id === id && item.unread))
    if (!ids.length) return

    setNotificationActionLoading(true)
    try {
      const rows = await staffNotificationApi.markManyRead(ids)
      setNotificationItems(rows.map(mapStaffNotification))
      setSelectedIds([])
      announce('Selected notifications marked as read.')
    } catch (cause) {
      announce(cause instanceof Error ? cause.message : 'Unable to update notifications.')
    } finally {
      setNotificationActionLoading(false)
    }
  }

  return (
    <div className="staff-page notifications-page">
      <StaffSidebar activeNav={activeNav} announce={announce} onClose={() => setSidebarOpen(false)} sidebarOpen={sidebarOpen} />
      <main className="staff-main">
      <StaffNavbar activeNav={activeNav} notificationsOpen={notificationsOpen} onOpenSidebar={() => setSidebarOpen(true)} onSearchChange={setSearchTerm} onToggleNotifications={() => setNotificationsOpen((current) => !current)} searchTerm={searchTerm} selectedRole={currentRole} theme={theme} toggleTheme={toggleTheme} />
        <div className="staff-content notifications-content">
          <section className="notifications-hero"><div><StaffPageEyebrow label="Activity" /><h1>Notifications</h1><p className="notifications-hero__copy">Updates from the modules you can access.</p></div><button className="staff-button staff-button--secondary notifications-mark-button" type="button" onClick={() => void markAllRead()} disabled={notificationActionLoading || !unreadCount}><Icon name="check" size={16} /> Mark all as read</button></section>
          <section className="notifications-board">
            <div className="staff-card notifications-list-card">
              <div className="staff-card__header notifications-list-header">
                <div>
                  <h2>Notifications</h2>
                  <span className="notifications-list-description">Keep track of appointments, schedules, leave, and clinic updates.</span>
                </div>
                <span className="notifications-unread-count">{unreadCount} unread</span>
              </div>
              <div className="notifications-tabs"><button aria-pressed={activeTab === 'all'} className={activeTab === 'all' ? 'is-selected' : ''} type="button" onClick={() => setActiveTab('all')}>All <span>{notificationItems.length}</span></button><button aria-pressed={activeTab === 'unread'} className={activeTab === 'unread' ? 'is-selected' : ''} type="button" onClick={() => setActiveTab('unread')}>Unread <span>{unreadCount}</span></button></div>
              <div className="notifications-toolbar"><label className="notifications-search"><Icon name="search" size={15} /><span className="sr-only">Search notifications</span><input placeholder="Search notifications" type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} /></label><label className="notifications-select"><span className="sr-only">Filter by notification type</span><select value={notificationFilter} onChange={(event) => setNotificationFilter(event.target.value as (typeof notificationFilters)[number])}>{notificationFilters.map((filter) => <option key={filter} value={filter}>{filter}</option>)}</select><Icon name="chevronDown" size={13} /></label><StaffListReset onClick={resetListControls} /></div>
              <div className="notifications-actions"><button className="notifications-mark-button" type="button" onClick={() => void (selectedIds.length ? markSelectedRead() : markAllRead())} disabled={notificationActionLoading || !unreadCount}><Icon name="check" size={15} />{selectedIds.length ? 'Mark selected as read' : 'Mark all as read'}</button></div>
              {notificationsError ? <div className="notifications-error"><strong>Unable to load notifications</strong><span>{notificationsError}</span><button type="button" onClick={() => void loadNotifications()}>Try again</button></div> : null}
              <div className="notifications-table-wrap">
                {notificationsLoading ? (
                  <div className="notifications-empty">
                    <Icon name="bell" size={25} />
                    <strong>Loading notifications</strong>
                    <span>Checking your staff updates.</span>
                  </div>
                ) : (
                  <table role="table" aria-label="Staff notifications" className="notifications-table staff-responsive-table">
                    <thead role="rowgroup">
                      <tr role="row">
                        <th role="columnheader" className="notifications-table__select" scope="col">
                          <label className="notification-checkbox">
                            <input
                              aria-label="Select all unread notifications"
                              checked={allVisibleSelected}
                              disabled={!selectableNotifications.length}
                              type="checkbox"
                              onChange={toggleSelectAll}
                            />
                            <span />
                          </label>
                          <span className="staff-mobile-only">Select all unread</span>
                        </th>
                        <th role="columnheader" className="notifications-table__notice" scope="col">Notice</th>
                        <th role="columnheader" className="notifications-table__category" scope="col">Category</th>
                        <th role="columnheader" className="notifications-table__time" scope="col">When</th>
                        <th role="columnheader" className="notifications-table__status" scope="col">Status</th>
                        <th role="columnheader" className="notifications-table__actions" scope="col">Action</th>
                      </tr>
                    </thead>
                    <tbody role="rowgroup">
                      {filteredNotifications.map((item) => (
                        <tr role="row" className={`notification-row${item.unread ? ' is-unread' : ''}`} key={item.id}>
                          <td role="cell" data-row-select>
                            <label className="notification-checkbox">
                              <input
                                aria-label={`Select ${item.title}`}
                                checked={selectedIds.includes(item.id)}
                                disabled={!item.unread || notificationActionLoading}
                                type="checkbox"
                                onChange={() => toggleSelected(item.id)}
                              />
                              <span />
                            </label>
                          </td>
                          <td role="cell" data-row-title>
                            <div className="notification-row__notice">
                              <span className="notification-row__avatar">{item.initials || 'CC'}</span>
                              <span>
                                <strong>{item.message || item.title}</strong>
                                <small>{item.actor || item.title}</small>
                              </span>
                            </div>
                          </td>
                          <td role="cell" data-label="Category"><span className="notification-row__category">{item.category}</span></td>
                          <td role="cell" data-label="When"><span className="notification-row__time">{item.time}</span></td>
                          <td role="cell" data-label="Status">
                            <span className={`notification-row__status${item.unread ? ' is-unread' : ''}`}>
                              <i />
                              {item.unread ? 'Unread' : 'Read'}
                            </span>
                          </td>
                          <td role="cell" data-row-actions className="notifications-table__actions">
                            <button
                              aria-label={item.unread ? `Mark ${item.title} as read` : `${item.title} is already read`}
                              className="notification-row__action"
                              disabled={!item.unread || notificationActionLoading}
                              type="button"
                              onClick={() => void markRead(item.id)}
                            >
                              {item.unread ? 'Mark as read' : 'Read'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {!notificationsLoading && !filteredNotifications.length ? (
                  <div className="notifications-empty">
                    <Icon name="bell" size={25} />
                    <strong>No notifications found</strong>
                    <span>Try another search or switch tabs.</span>
                  </div>
                ) : null}
              </div>
              <div className="notifications-footer"><span>Showing <strong>{filteredNotifications.length}</strong> notifications</span></div>
            </div>
          </section>
        </div>
      </main>
      {notice ? <div aria-live="polite" className="staff-toast"><span><Icon name="check" size={17} /></span>{notice}</div> : null}
    </div>
  )
}
