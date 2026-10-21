import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../../../components/theme/useTheme'
import { Icon } from '../../navbar/StaffIcon'
import { StaffNavbar } from '../../navbar/StaffNavbar'
import { StaffSidebar, type StaffRole } from '../../navbar/StaffSidebar'
import '../StaffHomePage.css'
import './LeavePage.css'

type LeaveStatus = 'Pending' | 'Approved' | 'Declined'
type LeaveType = 'Annual leave' | 'Medical leave' | 'Emergency leave' | 'Unpaid leave'
type LeaveRequest = {
  id: string
  employee: string
  initials: string
  role: string
  type: LeaveType
  start: string
  end: string
  days: string
  reason: string
  status: LeaveStatus
  tone: 'teal' | 'blue' | 'amber' | 'violet'
}

const statusFilters = ['All statuses', 'Pending', 'Approved', 'Declined'] as const
const leaveRequests: LeaveRequest[] = [
  { id: 'LV-260821-014', employee: 'Aina Rahman', initials: 'AR', role: 'Administrator', type: 'Annual leave', start: '24 Aug 2026', end: '26 Aug 2026', days: '3 days', reason: 'Family trip', status: 'Pending', tone: 'teal' },
  { id: 'LV-260821-013', employee: 'Daniel Wong', initials: 'DW', role: 'Doctor', type: 'Medical leave', start: '21 Aug 2026', end: '21 Aug 2026', days: '1 day', reason: 'Medical appointment', status: 'Approved', tone: 'blue' },
  { id: 'LV-260821-012', employee: 'Priya Nair', initials: 'PN', role: 'Pharmacist', type: 'Annual leave', start: '28 Aug 2026', end: '01 Sep 2026', days: '3 days', reason: 'Personal time', status: 'Pending', tone: 'amber' },
  { id: 'LV-260821-011', employee: 'Maya Chen', initials: 'MC', role: 'Doctor', type: 'Annual leave', start: '07 Sep 2026', end: '09 Sep 2026', days: '3 days', reason: 'Rest and travel', status: 'Approved', tone: 'violet' },
  { id: 'LV-260821-010', employee: 'Aisha Rahman', initials: 'AH', role: 'Doctor', type: 'Emergency leave', start: '18 Aug 2026', end: '18 Aug 2026', days: '1 day', reason: 'Family emergency', status: 'Approved', tone: 'teal' },
  { id: 'LV-260821-009', employee: 'Marcus Lim', initials: 'ML', role: 'Pharmacist', type: 'Unpaid leave', start: '11 Aug 2026', end: '12 Aug 2026', days: '2 days', reason: 'Personal matters', status: 'Declined', tone: 'blue' },
]

const teamAway = [
  { name: 'Daniel Wong', detail: 'Medical leave · Today', tone: 'blue' },
  { name: 'Priya Nair', detail: 'Annual leave · 28 Aug – 01 Sep', tone: 'amber' },
  { name: 'Maya Chen', detail: 'Annual leave · 07 – 09 Sep', tone: 'violet' },
]

export function LeavePage() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [activeNav, setActiveNav] = useState('Leave')
  const [selectedRole, setSelectedRole] = useState<StaffRole>('Admin')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilters)[number]>('All statuses')
  const [view, setView] = useState<'requests' | 'calendar'>('requests')
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [notice, setNotice] = useState('')

  const announce = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3200)
  }

  const handleRoleChange = (role: StaffRole) => {
    setSelectedRole(role)
    announce(`${role} leave workspace is now displayed.`)
  }

  const handleNavigate = (label: string) => {
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
    if (label === 'Audit & logs') {
      navigate('/staff/audit-logs')
      return
    }
    if (label === 'Notifications') {
      navigate('/staff/notifications')
      return
    }
    setActiveNav(label)
    if (label !== 'Leave') announce(`${label} is ready to connect to your clinic workflow.`)
  }

  const filteredRequests = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return leaveRequests.filter((request) => {
      const matchesQuery = !query || `${request.employee} ${request.role} ${request.type} ${request.reason} ${request.id}`.toLowerCase().includes(query)
      const matchesStatus = statusFilter === 'All statuses' || request.status === statusFilter
      return matchesQuery && matchesStatus
    })
  }, [searchTerm, statusFilter])

  const submitRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setDialogOpen(false)
    announce('Leave request submitted for approval.')
  }

  return (
    <div className="staff-page leave-page">
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

        <div className="staff-content leave-content">
          <section className="leave-hero">
            <div>
              <p className="staff-eyebrow">CarePlus Clinic · People operations</p>
              <h1>Take time that works for everyone.</h1>
              <p className="leave-hero__copy">Manage leave requests, protect team coverage, and keep time away transparent for the whole clinic.</p>
            </div>
            <button className="staff-button staff-button--primary leave-request-button" type="button" onClick={() => setDialogOpen(true)}><Icon name="plus" size={17} /> Request leave</button>
          </section>

          <section className="leave-board">
            <div className="staff-card leave-requests-card">
              <div className="staff-card__header leave-card-header"><div><p className="staff-card__eyebrow">Leave workspace</p><h2>Leave requests</h2><span className="leave-card-description">Review time away and keep clinic coverage in balance.</span></div><span className="staff-live-pill"><i /> Synced</span></div>
              <div className="leave-toolbar"><label className="leave-search"><Icon name="search" size={16} /><span className="sr-only">Search leave requests</span><input placeholder="Search people or leave type" type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} /></label><label className="leave-select"><span className="sr-only">Filter by leave status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as (typeof statusFilters)[number])}>{statusFilters.map((status) => <option key={status}>{status}</option>)}</select><Icon name="chevronDown" size={14} /></label><div className="leave-view-toggle"><button aria-pressed={view === 'requests'} className={view === 'requests' ? 'is-selected' : ''} type="button" onClick={() => setView('requests')}><Icon name="activity" size={15} /> Requests</button><button aria-pressed={view === 'calendar'} className={view === 'calendar' ? 'is-selected' : ''} type="button" onClick={() => setView('calendar')}><Icon name="calendar" size={15} /> Calendar</button></div></div>

              {view === 'requests' ? <div className="leave-table-wrap"><table className="leave-table"><thead><tr><th scope="col">Team member</th><th scope="col">Leave type</th><th scope="col">Dates</th><th scope="col">Duration</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Details</span></th></tr></thead><tbody>{filteredRequests.map((request) => <tr key={request.id}><td><span className={`leave-avatar leave-avatar--${request.tone}`}>{request.initials}</span><span><strong>{request.employee}</strong><small>{request.role} · {request.id}</small></span></td><td><span className="leave-type"><strong>{request.type}</strong><small>{request.reason}</small></span></td><td><span className="leave-dates"><strong>{request.start}</strong><small>to {request.end}</small></span></td><td>{request.days}</td><td><span className={`leave-status leave-status--${request.status.toLowerCase()}`}><i />{request.status}</span></td><td><button aria-label={`View ${request.employee}'s leave request`} className="leave-row-action" type="button" onClick={() => setSelectedRequest(request)}><Icon name="chevronRight" size={17} /></button></td></tr>)}</tbody></table>{!filteredRequests.length ? <div className="leave-empty"><Icon name="calendar" size={25} /><strong>No leave requests found</strong><span>Try another search or status filter.</span></div> : null}</div> : <div className="leave-calendar"><div className="leave-calendar__heading"><div><p>Team calendar</p><strong>August 2026</strong></div><span>4 people away this month</span></div><div className="leave-calendar__week">{['Mon 17', 'Tue 18', 'Wed 19', 'Thu 20', 'Fri 21', 'Sat 22', 'Sun 23'].map((day) => <div key={day}><small>{day.split(' ')[0]}</small><strong>{day.split(' ')[1]}</strong>{day === 'Fri 21' ? <span className="leave-calendar-event leave-calendar-event--blue">Daniel · medical</span> : null}{day === 'Thu 20' ? <span className="leave-calendar-event leave-calendar-event--amber">Priya · annual</span> : null}{day === 'Sat 22' ? <span className="leave-calendar-event leave-calendar-event--violet">Maya · annual</span> : null}</div>)}</div><div className="leave-calendar__legend"><span><i className="is-approved" /> Approved leave</span><span><i className="is-pending" /> Pending review</span></div></div>}
              <div className="leave-pagination"><span>Showing <strong>{filteredRequests.length}</strong> of 24 requests</span><div><button aria-label="Previous page" disabled type="button"><Icon name="chevronRight" size={15} /></button><button aria-current="page" type="button">1</button><button type="button" onClick={() => announce('Page 2 is ready to load.')}>2</button><button type="button" onClick={() => announce('Page 3 is ready to load.')}>3</button><button aria-label="Next page" type="button" onClick={() => announce('Next leave page is ready to load.')}><Icon name="chevronRight" size={15} /></button></div></div>
            </div>

            <aside className="leave-side-column"><section className="staff-card leave-side-card"><div className="staff-card__header"><div><p className="staff-card__eyebrow">Team coverage</p><h2>Upcoming time away</h2></div><span className="leave-side-count">3</span></div><div className="leave-team-list">{teamAway.map((person) => <div className="leave-team-item" key={person.name}><span className={`leave-avatar leave-avatar--${person.tone}`}>{person.name.split(' ').map((part) => part[0]).join('')}</span><span><strong>{person.name}</strong><small>{person.detail}</small></span></div>)}</div><button className="staff-text-button leave-side-link" type="button" onClick={() => setView('calendar')}>Open team calendar <Icon name="arrowUpRight" size={15} /></button></section><section className="staff-card leave-balance-card"><div className="staff-card__header"><div><p className="staff-card__eyebrow">My balance</p><h2>Annual leave</h2></div><strong>14 <small>days left</small></strong></div><div className="leave-balance-track"><span style={{ width: '67%' }} /></div><div className="leave-balance-meta"><span>7 days used</span><span>21 days total</span></div><div className="leave-balance-types"><div><span><i className="is-annual" />Annual leave</span><strong>14 days</strong></div><div><span><i className="is-medical" />Medical leave</span><strong>10 days</strong></div><div><span><i className="is-emergency" />Emergency leave</span><strong>5 days</strong></div></div></section><section className="staff-card leave-access-card"><Icon name="shield" size={18} /><span><strong>{selectedRole} access</strong><small>{selectedRole === 'Admin' ? 'You can review, approve, and manage team leave requests.' : 'You can submit requests and view team coverage.'}</small></span></section></aside>
          </section>
        </div>
      </main>

      {selectedRequest ? <div className="leave-detail-backdrop" role="presentation" onClick={() => setSelectedRequest(null)}><aside aria-labelledby="leave-detail-title" aria-modal="true" className="leave-detail-drawer" role="dialog" onClick={(event) => event.stopPropagation()}><div className="leave-detail-drawer__header"><div><p className="staff-card__eyebrow">Leave request</p><h2 id="leave-detail-title">Request details</h2></div><button aria-label="Close leave request details" type="button" onClick={() => setSelectedRequest(null)}><Icon name="close" size={19} /></button></div><div className="leave-detail-profile"><span className={`leave-avatar leave-avatar--${selectedRequest.tone}`}>{selectedRequest.initials}</span><span><strong>{selectedRequest.employee}</strong><small>{selectedRequest.role} · {selectedRequest.id}</small></span><span className={`leave-status leave-status--${selectedRequest.status.toLowerCase()}`}><i />{selectedRequest.status}</span></div><dl className="leave-detail-list"><div><dt>Leave type</dt><dd>{selectedRequest.type}</dd></div><div><dt>Dates</dt><dd>{selectedRequest.start} – {selectedRequest.end}<small>{selectedRequest.days}</small></dd></div><div><dt>Reason</dt><dd>{selectedRequest.reason}</dd></div></dl><div className="leave-detail-actions">{selectedRequest.status === 'Pending' && selectedRole === 'Admin' ? <><button className="staff-button staff-button--secondary" type="button" onClick={() => announce('Leave request declined.')}>Decline</button><button className="staff-button staff-button--primary" type="button" onClick={() => announce('Leave request approved.')}>Approve request</button></> : <button className="staff-button staff-button--secondary" type="button" onClick={() => setSelectedRequest(null)}>Close details</button>}</div></aside></div> : null}
      {dialogOpen ? <div className="leave-dialog-backdrop" role="presentation" onClick={() => setDialogOpen(false)}><section aria-labelledby="leave-request-title" aria-modal="true" className="leave-dialog" role="dialog" onClick={(event) => event.stopPropagation()}><div className="leave-dialog__header"><div><p className="staff-card__eyebrow">People operations</p><h2 id="leave-request-title">Request leave</h2></div><button aria-label="Close leave request form" type="button" onClick={() => setDialogOpen(false)}><Icon name="close" size={19} /></button></div><form onSubmit={submitRequest}><label>Leave type<select defaultValue="Annual leave"><option>Annual leave</option><option>Medical leave</option><option>Emergency leave</option><option>Unpaid leave</option></select></label><div className="leave-form-grid"><label>Start date<input required type="date" defaultValue="2026-08-24" /></label><label>End date<input required type="date" defaultValue="2026-08-26" /></label></div><label>Reason<textarea required placeholder="Add a short reason for your request" rows={3} /></label><div className="leave-dialog__actions"><button className="staff-button staff-button--secondary" type="button" onClick={() => setDialogOpen(false)}>Cancel</button><button className="staff-button staff-button--primary" type="submit">Submit request</button></div></form></section></div> : null}
      {notice ? <div aria-live="polite" className="staff-toast"><span><Icon name="check" size={17} /></span>{notice}</div> : null}
    </div>
  )
}
