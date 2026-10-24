import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useTheme } from '../../../components/theme/useTheme'
import { Icon, type IconName } from '../navbar/StaffIcon'
import { StaffNavbar } from '../navbar/StaffNavbar'
import { StaffSidebar, type StaffRole } from '../navbar/StaffSidebar'
import '../StaffHomePage.css'
import './AuditLogsPage.css'

type AuditAction = 'Created' | 'Updated' | 'Deleted' | 'Viewed' | 'Exported'
type AuditSeverity = 'Routine' | 'Important' | 'Critical'
type AuditEntry = {
  id: string
  dateGroup: 'Today' | 'Yesterday' | 'This week'
  time: string
  actor: string
  initials: string
  role: string
  action: AuditAction
  resource: string
  detail: string
  ip: string
  severity: AuditSeverity
  icon: IconName
  tone: 'teal' | 'blue' | 'amber' | 'violet' | 'red'
}

const actionFilters = ['All actions', 'Created', 'Updated', 'Deleted', 'Viewed', 'Exported'] as const
const dateFilters = ['All dates', 'Today', 'Yesterday', 'This week'] as const

const auditEntries: AuditEntry[] = [
  { id: 'AUD-260819-124', dateGroup: 'Today', time: '10:42 AM', actor: 'Aina Rahman', initials: 'AR', role: 'Administrator', action: 'Updated', resource: 'Clinic schedule', detail: 'Adjusted Dr. Maya Chen’s availability for 21 August 2026.', ip: '192.168.1.24', severity: 'Important', icon: 'calendar', tone: 'teal' },
  { id: 'AUD-260819-123', dateGroup: 'Today', time: '10:18 AM', actor: 'Daniel Wong', initials: 'DW', role: 'Doctor', action: 'Viewed', resource: 'Patient record', detail: 'Opened Sofia Tan’s clinical record and consultation history.', ip: '192.168.1.36', severity: 'Routine', icon: 'shield', tone: 'blue' },
  { id: 'AUD-260819-122', dateGroup: 'Today', time: '09:55 AM', actor: 'Aina Rahman', initials: 'AR', role: 'Administrator', action: 'Exported', resource: 'Revenue report', detail: 'Downloaded the July 2026 monthly revenue report as CSV.', ip: '192.168.1.24', severity: 'Important', icon: 'download', tone: 'violet' },
  { id: 'AUD-260819-121', dateGroup: 'Today', time: '09:41 AM', actor: 'Priya Nair', initials: 'PN', role: 'Pharmacist', action: 'Updated', resource: 'Medicine inventory', detail: 'Updated Paracetamol 500mg stock from 24 to 12 packs.', ip: '192.168.1.52', severity: 'Important', icon: 'box', tone: 'amber' },
  { id: 'AUD-260819-120', dateGroup: 'Today', time: '09:16 AM', actor: 'Aina Rahman', initials: 'AR', role: 'Administrator', action: 'Created', resource: 'Staff account', detail: 'Added a new pharmacist account for the dispensing team.', ip: '192.168.1.24', severity: 'Important', icon: 'staff', tone: 'teal' },
  { id: 'AUD-260819-119', dateGroup: 'Yesterday', time: '04:38 PM', actor: 'Maya Chen', initials: 'MC', role: 'Doctor', action: 'Updated', resource: 'Prescription', detail: 'Changed dosage instructions for prescription RX-260818-041.', ip: '192.168.1.48', severity: 'Routine', icon: 'check', tone: 'blue' },
  { id: 'AUD-260819-118', dateGroup: 'Yesterday', time: '03:12 PM', actor: 'Aina Rahman', initials: 'AR', role: 'Administrator', action: 'Deleted', resource: 'Clinic room', detail: 'Removed Room 05 from the available clinic room list.', ip: '192.168.1.24', severity: 'Critical', icon: 'close', tone: 'red' },
  { id: 'AUD-260819-117', dateGroup: 'Yesterday', time: '11:26 AM', actor: 'System', initials: 'SY', role: 'Automated process', action: 'Created', resource: 'Expiry alert', detail: 'Generated a 30-day expiry alert for 5 inventory items.', ip: 'Internal', severity: 'Routine', icon: 'clock', tone: 'amber' },
  { id: 'AUD-260819-116', dateGroup: 'This week', time: 'Tuesday, 05:48 PM', actor: 'Aina Rahman', initials: 'AR', role: 'Administrator', action: 'Updated', resource: 'Role permissions', detail: 'Reviewed module access for the Pharmacist role.', ip: '192.168.1.24', severity: 'Important', icon: 'shield', tone: 'violet' },
  { id: 'AUD-260819-115', dateGroup: 'This week', time: 'Tuesday, 02:34 PM', actor: 'System', initials: 'SY', role: 'Automated process', action: 'Exported', resource: 'Audit archive', detail: 'Completed the scheduled weekly audit archive.', ip: 'Internal', severity: 'Routine', icon: 'download', tone: 'teal' },
]

export function AuditLogsPage() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [activeNav, setActiveNav] = useState('Audit & logs')
  const [selectedRole, setSelectedRole] = useState<StaffRole>('Admin')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState<(typeof actionFilters)[number]>('All actions')
  const [dateFilter, setDateFilter] = useState<(typeof dateFilters)[number]>('All dates')
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null)
  const [notice, setNotice] = useState('')

  const announce = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3200)
  }

  const handleRoleChange = (role: StaffRole) => {
    if (role !== 'Admin') {
      navigate('/staff')
      return
    }
    setSelectedRole(role)
    announce('Administrator audit access is now displayed.')
  }

  const handleNavigate = (label: string) => {
    if (label === 'Staff') {
      navigate('/staff/staff')
      return
    }
    if (label === 'Overview') {
      navigate('/staff')
      return
    }
    if (label === 'Appointments') {
      navigate('/staff/appointments')
      return
    }
    if (label === 'Patients') {
      navigate('/staff/patients')
      return
    }
    if (label === 'Schedules & availability') {
      navigate('/staff/schedules')
      return
    }
    if (label === 'Leave') {
      navigate('/staff/leave')
      return
    }
    if (label === 'Notifications') {
      navigate('/staff/notifications')
      return
    }
    setActiveNav(label)
    if (label !== 'Audit & logs') announce(`${label} is ready to connect to your clinic workflow.`)
  }

  const filteredEntries = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return auditEntries.filter((entry) => {
      const matchesQuery = !query || `${entry.actor} ${entry.role} ${entry.action} ${entry.resource} ${entry.detail} ${entry.id}`.toLowerCase().includes(query)
      const matchesAction = actionFilter === 'All actions' || entry.action === actionFilter
      const matchesDate = dateFilter === 'All dates' || entry.dateGroup === dateFilter
      return matchesQuery && matchesAction && matchesDate
    })
  }, [actionFilter, dateFilter, searchTerm])

  const clearFilters = (event?: FormEvent) => {
    event?.preventDefault()
    setSearchTerm('')
    setActionFilter('All actions')
    setDateFilter('All dates')
    announce('Audit filters cleared.')
  }

  return (
    <div className="staff-page audit-page">
      <StaffSidebar
        activeNav={activeNav}
        announce={announce}
        onClose={() => setSidebarOpen(false)}
        onNavigate={handleNavigate}
        onRoleChange={handleRoleChange}
        role={selectedRole}
        sidebarOpen={sidebarOpen}
      />

      <main className="staff-main">
        <StaffNavbar
          activeNav={activeNav}
          announce={announce}
          notificationsOpen={notificationsOpen}
          onOpenSidebar={() => setSidebarOpen(true)}
          onSearchChange={setSearchTerm}
          onToggleNotifications={() => setNotificationsOpen((current) => !current)}
          searchTerm={searchTerm}
          selectedRole={selectedRole}
          theme={theme}
          toggleTheme={toggleTheme}
        />

        <div className="staff-content audit-content">
          <section className="audit-hero">
            <div>
              <p className="staff-eyebrow">CarePlus Clinic · Governance</p>
              <h1>Trace every change with confidence.</h1>
              <p className="audit-hero__copy">Review who changed what, when it happened, and where the action came from.</p>
            </div>
            <button className="staff-button staff-button--secondary audit-export-button" type="button" onClick={() => announce('Audit archive export has been queued.')}><Icon name="download" size={16} /> Export audit log</button>
          </section>

          <section aria-label="Audit summary" className="audit-summary">
            <article className="audit-summary-card audit-summary-card--teal"><span><Icon name="activity" size={18} /></span><small>Events this month</small><strong>1,284</strong><em>+8.4% vs last month</em></article>
            <article className="audit-summary-card audit-summary-card--blue"><span><Icon name="shield" size={18} /></span><small>Sensitive actions</small><strong>19</strong><em>Reviewed by Admin</em></article>
          </section>

          <section className="staff-card audit-log-card">
            <div className="staff-card__header audit-log-card__header">
              <div><p className="staff-card__eyebrow">Administrator workspace</p><h2>Audit activity</h2><span className="audit-log-card__description">A complete record of activity across your clinic modules.</span></div>
              <span className="staff-live-pill"><i /> Live log</span>
            </div>

            <div className="audit-toolbar">
              <label className="audit-search"><Icon name="search" size={16} /><span className="sr-only">Search audit activity</span><input placeholder="Search people, actions, or modules" type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} /></label>
              <label className="audit-select"><span className="sr-only">Filter by action</span><select value={actionFilter} onChange={(event) => setActionFilter(event.target.value as (typeof actionFilters)[number])}>{actionFilters.map((filter) => <option key={filter}>{filter}</option>)}</select><Icon name="chevronDown" size={14} /></label>
              <label className="audit-select"><span className="sr-only">Filter by date</span><select value={dateFilter} onChange={(event) => setDateFilter(event.target.value as (typeof dateFilters)[number])}>{dateFilters.map((filter) => <option key={filter}>{filter}</option>)}</select><Icon name="chevronDown" size={14} /></label>
              <button className="audit-clear-button" type="button" onClick={clearFilters}>Clear filters</button>
            </div>

            <div className="audit-results-bar"><span>Showing <strong>{filteredEntries.length}</strong> of 1,284 events</span><span>Last synced just now <i /></span></div>

            <div className="audit-table-wrap">
              <table className="audit-table">
                <thead><tr><th scope="col">Activity</th><th scope="col">Actor</th><th scope="col">Action</th><th scope="col">Date & time</th><th scope="col">Severity</th><th scope="col"><span className="sr-only">Details</span></th></tr></thead>
                <tbody>
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td><span className={`audit-entry-icon audit-entry-icon--${entry.tone}`}><Icon name={entry.icon} size={17} /></span><span><strong>{entry.resource}</strong><small>{entry.id}</small></span></td>
                      <td><span className="audit-actor"><span className={`audit-actor__avatar audit-actor__avatar--${entry.tone}`}>{entry.initials}</span><span><strong>{entry.actor}</strong><small>{entry.role}</small></span></span></td>
                      <td><span className={`audit-action audit-action--${entry.action.toLowerCase()}`}>{entry.action}</span></td>
                      <td><span className="audit-time"><strong>{entry.time}</strong><small>{entry.dateGroup}</small></span></td>
                      <td><span className={`audit-severity audit-severity--${entry.severity.toLowerCase()}`}><i />{entry.severity}</span></td>
                      <td><button aria-label={`View details for ${entry.resource}`} className="audit-row-action" type="button" onClick={() => setSelectedEntry(entry)}><Icon name="chevronRight" size={17} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filteredEntries.length ? <div className="audit-empty"><Icon name="search" size={25} /><strong>No audit events found</strong><span>Try changing your search or filters.</span><button type="button" onClick={clearFilters}>Clear filters</button></div> : null}
            </div>
            <div className="audit-pagination"><span>Showing 1–{filteredEntries.length} of 1,284 events</span><div><button aria-label="Previous page" disabled type="button"><Icon name="chevronRight" size={15} /></button><button aria-current="page" type="button">1</button><button type="button" onClick={() => announce('Page 2 is ready to load.')}>2</button><button type="button" onClick={() => announce('Page 3 is ready to load.')}>3</button><button aria-label="Next page" type="button" onClick={() => announce('Next audit page is ready to load.')}><Icon name="chevronRight" size={15} /></button></div></div>
          </section>
        </div>
      </main>

      {selectedEntry ? <div className="audit-detail-backdrop" role="presentation" onClick={() => setSelectedEntry(null)}><aside aria-labelledby="audit-detail-title" aria-modal="true" className="audit-detail-drawer" role="dialog" onClick={(event) => event.stopPropagation()}><div className="audit-detail-drawer__header"><div><p className="staff-card__eyebrow">Audit event</p><h2 id="audit-detail-title">Event details</h2></div><button aria-label="Close event details" type="button" onClick={() => setSelectedEntry(null)}><Icon name="close" size={19} /></button></div><div className="audit-detail-drawer__event"><span className={`audit-entry-icon audit-entry-icon--${selectedEntry.tone}`}><Icon name={selectedEntry.icon} size={20} /></span><div><strong>{selectedEntry.action} · {selectedEntry.resource}</strong><small>{selectedEntry.id}</small></div></div><dl className="audit-detail-list"><div><dt>Actor</dt><dd>{selectedEntry.actor}<small>{selectedEntry.role}</small></dd></div><div><dt>Date & time</dt><dd>{selectedEntry.dateGroup}, {selectedEntry.time}</dd></div><div><dt>Details</dt><dd>{selectedEntry.detail}</dd></div><div><dt>Source IP</dt><dd>{selectedEntry.ip}</dd></div><div><dt>Severity</dt><dd><span className={`audit-severity audit-severity--${selectedEntry.severity.toLowerCase()}`}><i />{selectedEntry.severity}</span></dd></div></dl><button className="staff-button staff-button--secondary audit-detail-drawer__close" type="button" onClick={() => setSelectedEntry(null)}>Close details</button></aside></div> : null}
      {notice ? <div aria-live="polite" className="staff-toast"><span><Icon name="check" size={17} /></span>{notice}</div> : null}
    </div>
  )
}
