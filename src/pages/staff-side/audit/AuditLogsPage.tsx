import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { auditLogApi, createAuditLogCsv, type AuditLogRecord } from '@/services/auditLogApi'
import { profileInitials } from '@/utils/profile-settings'
import { useTheme } from '../../../components/theme/useTheme'
import { Icon, type IconName } from '../navbar/StaffIcon'
import { StaffNavbar } from '../navbar/StaffNavbar'
import { getStaffRole, StaffSidebar } from '../navbar/StaffSidebar'
import { StaffListReset, StaffListSort } from '../components/StaffListControls'
import { StaffDateFilter, type StaffDateRange } from '../components/StaffDateFilter'
import { StaffPageEyebrow } from '../components/StaffPageEyebrow'
import '../StaffHomePage.css'
import './AuditLogsPage.css'

type AuditAction = 'Created' | 'Updated' | 'Deleted'
type AuditEntry = {
  log: AuditLogRecord
  id: string
  dateGroup: string
  dateTime: string
  time: string
  actor: string
  initials: string
  username: string
  role: string
  action: AuditAction
  resource: string
  detail: string
  ip: string
  icon: IconName
  tone: 'teal' | 'blue' | 'amber' | 'violet' | 'red'
}

const actionFilters = ['All actions', 'Created', 'Updated', 'Deleted'] as const
const sortOptions = ['Newest first', 'Oldest first', 'Actor A–Z'] as const
type SortOption = (typeof sortOptions)[number]

function toAuditEntry(log: AuditLogRecord): AuditEntry {
  const date = new Date(log.dateTime)
  const now = new Date()
  const dayDifference = Math.floor((startOfDay(now).getTime() - startOfDay(date).getTime()) / 86_400_000)
  const action = log.action === 'Create' ? 'Created' : log.action === 'Delete' ? 'Deleted' : 'Updated'
  const isSystem = log.userId === 'SYSTEM'
  const name = log.actorName?.trim() ?? ''
  const username = log.actorUsername?.trim() ?? ''
  const actor = isSystem ? 'System' : name || username || `User ${log.userId}`
  const initials = isSystem ? 'SY' : profileInitials(name || username) || 'U'
  const role = isSystem ? 'System process' : log.actorRole?.trim() || (name || username ? 'User account' : 'Account details unavailable')
  const tone = action === 'Deleted' ? 'red' : action === 'Updated' ? 'blue' : 'teal'
  const icon = action === 'Deleted' ? 'close' : action === 'Updated' ? 'activity' : 'check'

  return {
    log,
    id: log.logId,
    dateGroup: dayDifference === 0 ? 'Today' : dayDifference === 1 ? 'Yesterday' : dayDifference < 7 ? 'This week' : date.toLocaleDateString(),
    dateTime: log.dateTime,
    time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    actor,
    initials,
    username,
    role,
    action,
    resource: log.module,
    detail: `${action} operation on ${log.module} (${log.affectedRecord}).`,
    ip: 'Not recorded',
    icon,
    tone,
  }
}

function toDateKey(value: Date) {
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate())
}

export function AuditLogsPage() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [activeNav] = useState('Audit & logs')
  const currentRole = getStaffRole(user?.role)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState<(typeof actionFilters)[number]>('All actions')
  const [dateRange, setDateRange] = useState<StaffDateRange>({ start: null, end: null })
  const [sortOption, setSortOption] = useState<SortOption>('Newest first')
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null)
  const [notice, setNotice] = useState('')
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [lastSynced, setLastSynced] = useState<Date | null>(null)

  const announce = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3200)
  }

  const loadAuditLogs = async () => {
    setIsLoading(true)
    setLoadError('')

    try {
      const logs = await auditLogApi.retrieve()
      setAuditEntries(logs.map(toAuditEntry))
      setLastSynced(new Date())
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load audit logs.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadAuditLogs()
  }, [])

  const filteredEntries = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    const rows = auditEntries.filter((entry) => {
      const searchText = [entry.actor, entry.username && `@${entry.username}`, entry.role, entry.log.userId, entry.action, entry.resource, entry.detail, entry.id].join(' ')
      const matchesQuery = !query || searchText.toLowerCase().includes(query)
      const matchesAction = actionFilter === 'All actions' || entry.action === actionFilter
      const entryDateKey = toDateKey(new Date(entry.dateTime))
      const matchesDate = !dateRange.start || (entryDateKey >= dateRange.start && entryDateKey <= (dateRange.end ?? dateRange.start))
      return matchesQuery && matchesAction && matchesDate
    })

    return rows.sort((left, right) => {
      switch (sortOption) {
        case 'Oldest first':
          return left.dateTime.localeCompare(right.dateTime)
        case 'Actor A–Z':
          return left.actor.localeCompare(right.actor)
        case 'Newest first':
        default:
          return right.dateTime.localeCompare(left.dateTime)
      }
    })
  }, [actionFilter, auditEntries, dateRange, searchTerm, sortOption])

  const clearFilters = (event?: FormEvent) => {
    event?.preventDefault()
    setSearchTerm('')
    setActionFilter('All actions')
    setDateRange({ start: null, end: null })
    setSortOption('Newest first')
    announce('Audit filters cleared.')
  }

  const canExport = !isLoading && !loadError && filteredEntries.length > 0

  const exportAuditLogs = () => {
    if (!canExport) return

    try {
      const link = document.createElement('a')
      const blob = createAuditLogCsv(filteredEntries.map((entry) => entry.log))
      const url = URL.createObjectURL(blob)
      link.href = url
      link.download = 'audit-log.csv'
      try {
        document.body.append(link)
        link.click()
      } finally {
        link.remove()
        window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      }
      announce('Audit log downloaded.')
    } catch (error) {
      announce(error instanceof Error ? error.message : 'Unable to export audit logs.')
    }
  }

  return (
    <div className="staff-page audit-page">
      <StaffSidebar
        activeNav={activeNav}
        announce={announce}
        onClose={() => setSidebarOpen(false)}
        sidebarOpen={sidebarOpen}
      />

      <main className="staff-main">
        <StaffNavbar
          activeNav={activeNav}
          notificationsOpen={notificationsOpen}
          onOpenSidebar={() => setSidebarOpen(true)}
          onSearchChange={setSearchTerm}
          onToggleNotifications={() => setNotificationsOpen((current) => !current)}
          searchTerm={searchTerm}
          selectedRole={currentRole}
          theme={theme}
          toggleTheme={toggleTheme}
        />

        <div className="staff-content audit-content">
          <header className="staff-page-heading">
            <StaffPageEyebrow label="Audit logs" />
            <button className="staff-button staff-button--secondary audit-export-button" disabled={!canExport} type="button" onClick={exportAuditLogs}><Icon name="download" size={16} /> Export audit log</button>
          </header>

          <section aria-label="Audit summary" className="audit-summary">
            <article className="audit-summary-card audit-summary-card--teal"><span><Icon name="activity" size={18} /></span><small>Loaded events</small><strong>{auditEntries.length}</strong><em>Latest records from the API</em></article>
            <article className="audit-summary-card audit-summary-card--blue"><span><Icon name="shield" size={18} /></span><small>Delete actions</small><strong>{auditEntries.filter((entry) => entry.action === 'Deleted').length}</strong><em>Requires administrator review</em></article>
          </section>

          <section className="staff-card audit-log-card">
            <div className="staff-card__header audit-log-card__header">
              <div><p className="staff-card__eyebrow">Administrator workspace</p><h2>Audit activity</h2><span className="audit-log-card__description">A complete record of activity across your clinic modules.</span></div>
            </div>

            <div className="audit-toolbar">
              <label className="audit-search"><Icon name="search" size={16} /><span className="sr-only">Search audit activity</span><input placeholder="Search people, actions, or modules" type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} /></label>
              <label className="audit-select"><span className="sr-only">Filter by action</span><select value={actionFilter} onChange={(event) => setActionFilter(event.target.value as (typeof actionFilters)[number])}>{actionFilters.map((filter) => <option key={filter}>{filter}</option>)}</select><Icon name="chevronDown" size={14} /></label>
              <StaffDateFilter value={dateRange} onChange={setDateRange} />
              <StaffListSort label="Sort audit activity" options={sortOptions} value={sortOption} onChange={(value) => setSortOption(value as SortOption)} />
              <StaffListReset onClick={() => clearFilters()} />
            </div>

            <div className="audit-results-bar"><span>Showing <strong>{filteredEntries.length}</strong> of {auditEntries.length} loaded events</span><span>{isLoading ? 'Loading audit logs…' : loadError ? 'Sync failed' : lastSynced ? `Last synced ${lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Not synced'} <i /></span></div>

            <div className="audit-table-wrap">
              <table className="audit-table">
                <thead><tr><th scope="col">Activity</th><th scope="col">Actor</th><th scope="col">Action</th><th scope="col">Date & time</th><th scope="col"><span className="sr-only">Details</span></th></tr></thead>
                <tbody>
                  {isLoading ? <tr><td colSpan={5}><div className="audit-empty"><Icon name="clock" size={25} /><strong>Loading audit events…</strong><span>Retrieving the latest activity from the clinic API.</span></div></td></tr> : null}
                  {!isLoading && loadError ? <tr><td colSpan={5}><div className="audit-empty"><Icon name="close" size={25} /><strong>Unable to load audit events</strong><span>{loadError}</span><button type="button" onClick={() => void loadAuditLogs()}>Try again</button></div></td></tr> : null}
                  {!isLoading && !loadError ? filteredEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td><span className={`audit-entry-icon audit-entry-icon--${entry.tone}`}><Icon name={entry.icon} size={17} /></span><span><strong>{entry.resource}</strong><small>{entry.id}</small></span></td>
                      <td>
                        <span className="audit-actor">
                          <span aria-hidden="true" className={`audit-actor__avatar audit-actor__avatar--${entry.tone}`}>{entry.initials}</span>
                          <span>
                            <strong>{entry.actor}</strong>
                            <small>{entry.username ? `@${entry.username} · ` : ''}{entry.role}</small>
                          </span>
                        </span>
                      </td>
                      <td><span className={`audit-action audit-action--${entry.action.toLowerCase()}`}>{entry.action}</span></td>
                      <td><span className="audit-time"><strong>{entry.time}</strong><small>{entry.dateGroup}</small></span></td>
                      <td><button aria-label={`View details for ${entry.resource}`} className="audit-row-action" type="button" onClick={() => setSelectedEntry(entry)}><Icon name="chevronRight" size={17} /></button></td>
                    </tr>
                  )) : null}
                </tbody>
              </table>
              {!filteredEntries.length ? <div className="audit-empty"><Icon name="search" size={25} /><strong>No audit events found</strong><span>Try changing your search or filters.</span><button type="button" onClick={clearFilters}>Clear filters</button></div> : null}
            </div>
            <div className="audit-pagination"><span>{isLoading ? 'Loading audit events…' : `Showing ${filteredEntries.length} of ${auditEntries.length} loaded events`}</span></div>
          </section>
        </div>
      </main>

      {selectedEntry ? (
        <div className="audit-detail-backdrop" role="presentation" onClick={() => setSelectedEntry(null)}>
          <aside aria-labelledby="audit-detail-title" aria-modal="true" className="audit-detail-drawer" role="dialog" onClick={(event) => event.stopPropagation()}>
            <div className="audit-detail-drawer__header">
              <div>
                <p className="staff-card__eyebrow">Audit event</p>
                <h2 id="audit-detail-title">Event details</h2>
              </div>
              <button aria-label="Close event details" type="button" onClick={() => setSelectedEntry(null)}><Icon name="close" size={19} /></button>
            </div>
            <div className="audit-detail-drawer__event">
              <span className={`audit-entry-icon audit-entry-icon--${selectedEntry.tone}`}><Icon name={selectedEntry.icon} size={20} /></span>
              <div><strong>{selectedEntry.action} · {selectedEntry.resource}</strong><small>{selectedEntry.id}</small></div>
            </div>
            <dl className="audit-detail-list">
              <div><dt>Actor</dt><dd>{selectedEntry.actor}<small>{selectedEntry.role}</small></dd></div>
              {selectedEntry.username ? <div><dt>Username</dt><dd>@{selectedEntry.username}</dd></div> : null}
              {selectedEntry.log.userId !== 'SYSTEM' ? <div><dt>User ID</dt><dd>{selectedEntry.log.userId}</dd></div> : null}
              <div><dt>Date & time</dt><dd>{selectedEntry.dateGroup}, {selectedEntry.time}</dd></div>
              <div><dt>Details</dt><dd>{selectedEntry.detail}</dd></div>
              <div><dt>Source IP</dt><dd>{selectedEntry.ip}</dd></div>
            </dl>
            <button className="staff-button staff-button--secondary audit-detail-drawer__close" type="button" onClick={() => setSelectedEntry(null)}>Close details</button>
          </aside>
        </div>
      ) : null}
      {notice ? <div aria-live="polite" className="staff-toast"><span><Icon name="check" size={17} /></span>{notice}</div> : null}
    </div>
  )
}
