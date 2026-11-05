import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/providers/auth-provider'
import { leaveApi, leaveDocumentUrl, type LeaveRecord, type LeaveStatus } from '@/services/leaveApi'
import { staffApi, type StaffRecord } from '@/services/staffApi'
import { useTheme } from '../../../components/theme/useTheme'
import { Icon } from '../navbar/StaffIcon'
import { StaffNavbar } from '../navbar/StaffNavbar'
import { getStaffRole, StaffSidebar } from '../navbar/StaffSidebar'
import { StaffDateFilter, type StaffDateRange } from '../components/StaffDateFilter'
import { StaffListReset } from '../components/StaffListControls'
import '../StaffHomePage.css'
import './LeavePage.css'

const statusFilters = ['All statuses', 'Pending', 'Approved', 'Declined'] as const
type StatusFilter = (typeof statusFilters)[number]

type LeaveForm = {
  staffId: string
  startDate: string
  endDate: string
  reason: string
  supportDocument: File | null
}

const todayInput = () => {
  const date = new Date()
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10)
}

function dateKey(value: string | Date) {
  if (typeof value === 'string') return value.slice(0, 10)

  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function dateFromKey(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatDate(value: string, includeYear = true) {
  const date = dateFromKey(dateKey(value))
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    ...(includeYear ? { year: 'numeric' } : {}),
  }).format(date)
}

function formatDateRange(request: LeaveRecord) {
  const start = dateKey(request.startDate)
  const end = dateKey(request.endDate)

  return start === end
    ? formatDate(start)
    : `${formatDate(start, false)} – ${formatDate(end)}`
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function roleTone(role: string) {
  if (role === 'Doctor') return 'blue'
  if (role === 'Pharmacist') return 'amber'
  return 'violet'
}

function statusClass(status: string) {
  return status.toLowerCase().replace(/\s+/g, '-')
}

function statusLabel(status: string) {
  return status === 'Declined' ? 'Declined' : status
}

function displayDocumentName(reference: string) {
  const fileName = reference.split('/').pop() || reference
  return fileName.replace(/^[a-f0-9]{32}-/i, '')
}

function isVisibleOnDate(request: LeaveRecord, value: string) {
  return request.status !== 'Declined'
    && dateKey(request.startDate) <= value
    && dateKey(request.endDate) >= value
}

function createCalendarDays(cursor: Date) {
  const firstOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  const mondayOffset = (firstOfMonth.getDay() + 6) % 7
  const firstCell = new Date(cursor.getFullYear(), cursor.getMonth(), 1 - mondayOffset)

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(firstCell)
    day.setDate(firstCell.getDate() + index)
    return day
  })
}

function emptyForm(staffId = ''): LeaveForm {
  const today = todayInput()
  return { staffId, startDate: today, endDate: today, reason: '', supportDocument: null }
}

type AdminLeaveReviewModalProps = {
  request: LeaveRecord
  actionBusy: boolean
  onClose: () => void
  onStatus: (status: LeaveStatus) => void
}

function AdminLeaveReviewModal({ request, actionBusy, onClose, onStatus }: AdminLeaveReviewModalProps) {
  const fileName = displayDocumentName(request.supportDocument)
  const extension = fileName.split('.').pop()?.toLowerCase()
  const isPdf = extension === 'pdf'
  const isImage = extension === 'jpg' || extension === 'jpeg' || extension === 'png'
  const hasStoredFile = request.supportDocument.startsWith('leave-documents/')
  const documentUrl = hasStoredFile ? leaveDocumentUrl(request.supportDocument) : ''

  return (
    <div className="leave-review-backdrop" role="presentation">
      <section aria-labelledby="leave-review-title" aria-modal="true" className="leave-review-modal" role="dialog" onClick={(event) => event.stopPropagation()}>
        <div className="leave-review-header">
          <div><p className="staff-card__eyebrow">Administrator review</p><h2 id="leave-review-title">Review leave request</h2><span>Check the supporting document before updating the request.</span></div>
          <button aria-label="Close leave review" type="button" onClick={onClose}><Icon name="close" size={19} /></button>
        </div>
        <div className="leave-review-layout">
          <div className="leave-review-preview">
            <div className="leave-review-section-heading"><div><p className="staff-card__eyebrow">Supporting document</p><h3>Attached file</h3></div><span>{extension?.toUpperCase() || 'FILE'}</span></div>
            <div className="leave-review-preview-frame">
              {isPdf && documentUrl ? <iframe title={`Preview of ${fileName}`} src={documentUrl} /> : isImage && documentUrl ? <img alt={`Preview of ${fileName}`} src={documentUrl} /> : <div className="leave-review-file-card"><Icon name="box" size={30} /><strong>{fileName || 'Support document'}</strong><small>Preview is available after opening the document.</small></div>}
            </div>
            {documentUrl ? <a className="leave-review-open-link" href={documentUrl} rel="noreferrer" target="_blank"><Icon name="arrowUpRight" size={15} />Open full document</a> : null}
          </div>
          <div className="leave-review-details">
            <div className="leave-review-profile"><span className={`leave-avatar leave-avatar--${roleTone(request.role)}`}>{getInitials(request.staffName || request.username)}</span><span><strong>{request.staffName || request.username}</strong><small>{request.role} · {request.leaveId}</small></span><span className={`leave-status leave-status--${statusClass(request.status)}`}><i />{statusLabel(request.status)}</span></div>
            <dl className="leave-review-list"><div><dt>Leave ID</dt><dd>{request.leaveId}</dd></div><div><dt>Submitted date</dt><dd>{formatDate(request.createdAt)}</dd></div><div><dt>Start date</dt><dd>{formatDate(request.startDate)}</dd></div><div><dt>End date</dt><dd>{formatDate(request.endDate)}</dd></div><div><dt>Duration</dt><dd>{request.durationDays} {request.durationDays === 1 ? 'day' : 'days'}</dd></div><div><dt>Reason</dt><dd>{request.reason}</dd></div></dl>
            <div className="leave-review-actions">{request.status === 'Pending' ? <><button className="staff-button staff-button--secondary" disabled={actionBusy} type="button" onClick={() => onStatus('Declined')}>Reject</button><button className="staff-button staff-button--primary" disabled={actionBusy} type="button" onClick={() => onStatus('Approved')}>{actionBusy ? 'Saving…' : 'Approve'}</button></> : <button className="staff-button staff-button--secondary" type="button" onClick={onClose}>Close details</button>}</div>
          </div>
        </div>
      </section>
    </div>
  )
}

export function LeavePage() {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const currentRole = getStaffRole(user?.role)
  const isAdmin = currentRole === 'Admin'
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All statuses')
  const [dateRange, setDateRange] = useState<StaffDateRange>({ start: null, end: null })
  const [view, setView] = useState<'requests' | 'calendar'>('requests')
  const [leaves, setLeaves] = useState<LeaveRecord[]>([])
  const [staff, setStaff] = useState<StaffRecord[]>([])
  const [selectedRequest, setSelectedRequest] = useState<LeaveRecord | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [calendarCursor, setCalendarCursor] = useState(() => new Date())
  const [form, setForm] = useState<LeaveForm>(emptyForm(user?.staffId))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [actionBusy, setActionBusy] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')

  const announce = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3200)
  }

  const loadLeaves = async () => {
    setLoading(true)
    setError('')

    try {
      const [records, staffRecords] = await Promise.all([
        isAdmin
          ? leaveApi.retrieveAll()
          : user?.staffId
            ? leaveApi.retrieveByStaffId(user.staffId)
            : Promise.reject(new Error('Unable to identify the signed-in staff member.')),
        isAdmin ? staffApi.retrieveAll() : Promise.resolve([] as StaffRecord[]),
      ])

      setLeaves(records)
      setStaff(staffRecords)
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unable to load leave requests.'

      if (message.includes('401') || message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('login first')) {
        await logout()
        navigate('/staff/login', { replace: true })
        return
      }

      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadLeaves()
  }, [currentRole, user?.staffId])

  const filteredRequests = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    const rows = leaves.filter((request) => {
      const searchable = `${request.leaveId} ${request.staffName} ${request.username} ${request.role} ${request.reason}`.toLowerCase()
      const matchesQuery = !query || searchable.includes(query)
      const matchesStatus = statusFilter === 'All statuses' || request.status === statusFilter
      const selectedEnd = dateRange.end ?? dateRange.start
      const matchesDate = !dateRange.start
        || (dateKey(request.endDate) >= dateRange.start && dateKey(request.startDate) <= selectedEnd!)
      return matchesQuery && matchesStatus && matchesDate
    })

    return rows
  }, [dateRange, leaves, searchTerm, statusFilter])

  const summary = useMemo(() => {
    const pending = leaves.filter((request) => request.status === 'Pending').length
    const approved = leaves.filter((request) => request.status === 'Approved').length
    const activeDays = leaves
      .filter((request) => request.status !== 'Declined')
      .reduce((total, request) => total + request.durationDays, 0)

    return { total: leaves.length, pending, approved, activeDays }
  }, [leaves])

  const calendarDays = useMemo(() => createCalendarDays(calendarCursor), [calendarCursor])
  const calendarMonthLabel = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(calendarCursor)

  const resetListControls = () => {
    setSearchTerm('')
    setStatusFilter('All statuses')
    setDateRange({ start: null, end: null })
    setView('requests')
  }

  const openRequestDialog = () => {
    setForm(emptyForm(isAdmin ? staff[0]?.staffId ?? '' : user?.staffId ?? ''))
    setFormError('')
    setDialogOpen(true)
  }

  const submitRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')

    if (!form.staffId) {
      setFormError('Choose a staff member before submitting the request.')
      return
    }

    if (form.startDate > form.endDate) {
      setFormError('End date must be the same as or later than the start date.')
      return
    }

    if (!form.reason.trim()) {
      setFormError('Reason is required.')
      return
    }

    if (!form.supportDocument) {
      setFormError('Support document is required.')
      return
    }

    setSaving(true)

    try {
      const created = await leaveApi.create({
        ...form,
        reason: form.reason.trim(),
        supportDocument: form.supportDocument,
      })
      setLeaves((current) => [created, ...current])
      setDialogOpen(false)
      announce('Leave request submitted for approval.')
    } catch (submitError) {
      setFormError(submitError instanceof Error ? submitError.message : 'Unable to submit leave request.')
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (status: LeaveStatus) => {
    if (!selectedRequest || !isAdmin) return

    setActionBusy(true)

    try {
      const updated = await leaveApi.updateStatus({ leaveId: selectedRequest.leaveId, status })
      setLeaves((current) => current.map((request) => request.leaveId === updated.leaveId ? updated : request))
      setSelectedRequest(null)
      announce(`Leave request ${status.toLowerCase()}.`)
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update leave request.')
    } finally {
      setActionBusy(false)
    }
  }

  const changeMonth = (amount: number) => {
    setCalendarCursor((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1))
  }

  return (
    <div className={`staff-page leave-page${isAdmin ? ' leave-page--admin' : ''}`}>
      <StaffSidebar activeNav="Leave" announce={announce} onClose={() => setSidebarOpen(false)} sidebarOpen={sidebarOpen} />

      <main className="staff-main">
        <StaffNavbar
          activeNav="Leave"
          notificationsOpen={notificationsOpen}
          onOpenSidebar={() => setSidebarOpen(true)}
          onSearchChange={setSearchTerm}
          onToggleNotifications={() => setNotificationsOpen((current) => !current)}
          searchTerm={searchTerm}
          selectedRole={currentRole}
          theme={theme}
          toggleTheme={toggleTheme}
        />

        <div className="staff-content leave-content">
          <section className="leave-hero">
            <div>
              <p className="staff-eyebrow">CarePlus Clinic · People operations</p>
              <h1>Leave that works for everyone.</h1>
              <p className="leave-hero__copy">{isAdmin ? 'Review requests, protect team coverage, and keep time away transparent across the clinic.' : 'Submit time away requests and keep your upcoming availability in one place.'}</p>
            </div>
            {!isAdmin ? <button className="staff-button staff-button--primary leave-request-button" type="button" onClick={openRequestDialog}><Icon name="plus" size={17} />Request leave</button> : null}
          </section>

          <section aria-label="Leave summary" className="leave-summary">
            <div className="leave-summary-card leave-summary-card--teal"><span><Icon name="calendar" size={17} /></span><small>Total requests</small><strong>{summary.total}</strong><em>All statuses</em></div>
            <div className="leave-summary-card leave-summary-card--amber"><span><Icon name="clock" size={17} /></span><small>Pending review</small><strong>{summary.pending}</strong><em>Waiting for action</em></div>
            <div className="leave-summary-card leave-summary-card--blue"><span><Icon name="check" size={17} /></span><small>Approved</small><strong>{summary.approved}</strong><em>Confirmed leave</em></div>
          </section>

          {error ? <div className="staff-alert leave-page-alert" role="alert"><span>{error}</span><button className="staff-text-button" type="button" onClick={() => void loadLeaves()}>Try again</button></div> : null}

          <section className="leave-board">
            <div className="staff-card leave-requests-card">
              <div className="staff-card__header leave-card-header"><div><p className="staff-card__eyebrow">{isAdmin ? 'Clinic leave queue' : 'My leave requests'}</p><h2>{isAdmin ? 'Leave requests' : 'Your requests'}</h2><span className="leave-card-description">{isAdmin ? 'Review time away and keep clinic coverage in balance.' : 'Track the status of your submitted leave.'}</span></div></div>

              <div className="leave-toolbar"><label className="leave-search"><Icon name="search" size={16} /><span className="sr-only">Search leave requests</span><input placeholder={isAdmin ? 'Search people, reason, or ID' : 'Search your leave requests'} type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} /></label><label className="leave-select"><span className="sr-only">Filter by leave status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>{statusFilters.map((status) => <option key={status}>{status}</option>)}</select><Icon name="chevronDown" size={14} /></label><StaffDateFilter label="Filter leave requests by date" value={dateRange} onChange={setDateRange} /><StaffListReset onClick={resetListControls} /></div>

              {loading ? <div className="leave-empty"><span className="leave-spinner" /><strong>Loading leave records</strong><span>Getting the latest clinic data.</span></div> : view === 'requests' ? <div className="leave-table-wrap"><table className={`leave-table${isAdmin ? '' : ' leave-table--personal'}`}><thead><tr>{isAdmin ? <th scope="col">Team member</th> : null}{isAdmin ? <th scope="col">Dates</th> : <><th scope="col">Start date</th><th scope="col">End date</th></>}<th scope="col">Duration</th><th scope="col">Status</th>{!isAdmin ? <th scope="col">Created at</th> : null}<th scope="col"><span className="sr-only">Details</span></th></tr></thead><tbody>{filteredRequests.map((request) => <tr key={request.leaveId}>{isAdmin ? <td><span className={`leave-avatar leave-avatar--${roleTone(request.role)}`}>{getInitials(request.staffName || request.username)}</span><span><strong>{request.staffName || request.username}</strong><small>{request.role} · {request.leaveId}</small></span></td> : null}{isAdmin ? <td><span className="leave-dates"><strong>{formatDateRange(request)}</strong><small>{dateKey(request.startDate) === dateKey(request.endDate) ? 'Single day' : 'Date range'}</small></span></td> : <><td>{formatDate(request.startDate)}</td><td>{formatDate(request.endDate)}</td></>}<td>{request.durationDays} {request.durationDays === 1 ? 'day' : 'days'}</td><td><span className={`leave-status leave-status--${statusClass(request.status)}`}><i />{statusLabel(request.status)}</span></td>{!isAdmin ? <td>{formatDate(request.createdAt)}</td> : null}<td><button aria-label={`View ${request.staffName || request.username}'s leave request`} className="leave-row-action" type="button" onClick={() => setSelectedRequest(request)}><Icon name="chevronRight" size={17} /></button></td></tr>)}</tbody></table>{!filteredRequests.length ? <div className="leave-empty"><Icon name="calendar" size={25} /><strong>No leave requests found</strong><span>{leaves.length ? 'Try another search or status filter.' : 'Submit a request to see it here.'}</span></div> : null}</div> : <div className="leave-calendar"><div className="leave-calendar__heading"><div><p>Team calendar</p><strong>{calendarMonthLabel}</strong></div><div className="leave-calendar__month-controls"><button aria-label="Previous month" type="button" onClick={() => changeMonth(-1)}><Icon name="chevronRight" size={15} /></button><button aria-label="Next month" type="button" onClick={() => changeMonth(1)}><Icon name="chevronRight" size={15} /></button></div></div><div className="leave-calendar__weekdays">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day}>{day}</span>)}</div><div className="leave-calendar__grid">{calendarDays.map((day) => { const key = dateKey(day); const dayRequests = leaves.filter((request) => isVisibleOnDate(request, key)); return <div className={`leave-calendar__day${day.getMonth() !== calendarCursor.getMonth() ? ' is-outside' : ''}${key === todayInput() ? ' is-today' : ''}`} key={key}><strong>{day.getDate()}</strong><div>{dayRequests.slice(0, 2).map((request) => <button className={`leave-calendar-event leave-calendar-event--${statusClass(request.status)}`} key={request.leaveId} type="button" onClick={() => setSelectedRequest(request)}>{request.staffName || request.username}</button>)}{dayRequests.length > 2 ? <small>+{dayRequests.length - 2} more</small> : null}</div></div> })}</div><div className="leave-calendar__legend"><span><i className="is-approved" />Approved</span><span><i className="is-pending" />Pending</span></div></div>}
              <div className="leave-pagination"><span>Showing <strong>{filteredRequests.length}</strong> of {leaves.length} request{leaves.length === 1 ? '' : 's'}</span>{view === 'calendar' ? <span>Click a leave entry to view details.</span> : null}</div>
            </div>

          </section>
        </div>
      </main>

      {isAdmin && selectedRequest ? <AdminLeaveReviewModal actionBusy={actionBusy} onClose={() => setSelectedRequest(null)} onStatus={(status) => void updateStatus(status)} request={selectedRequest} /> : null}
      {selectedRequest ? <div className="leave-detail-backdrop" role="presentation" onClick={() => setSelectedRequest(null)}><aside aria-labelledby="leave-detail-title" aria-modal="true" className="leave-detail-drawer" role="dialog" onClick={(event) => event.stopPropagation()}><div className="leave-detail-drawer__header"><div><p className="staff-card__eyebrow">Leave request</p><h2 id="leave-detail-title">Request details</h2></div><button aria-label="Close leave request details" type="button" onClick={() => setSelectedRequest(null)}><Icon name="close" size={19} /></button></div><div className="leave-detail-profile"><span className={`leave-avatar leave-avatar--${roleTone(selectedRequest.role)}`}>{getInitials(selectedRequest.staffName || selectedRequest.username)}</span><span><strong>{selectedRequest.staffName || selectedRequest.username}</strong><small>{selectedRequest.role} · {selectedRequest.leaveId}</small></span><span className={`leave-status leave-status--${statusClass(selectedRequest.status)}`}><i />{statusLabel(selectedRequest.status)}</span></div><dl className="leave-detail-list"><div><dt>Leave ID</dt><dd>{selectedRequest.leaveId}</dd></div><div><dt>Submitted date</dt><dd>{formatDate(selectedRequest.createdAt)}</dd></div><div><dt>Staff member</dt><dd>{selectedRequest.staffName || selectedRequest.username}</dd></div><div><dt>Date</dt><dd>{formatDateRange(selectedRequest)}<small>{selectedRequest.durationDays} {selectedRequest.durationDays === 1 ? 'day' : 'days'}</small></dd></div><div><dt>Reason</dt><dd>{selectedRequest.reason}</dd></div><div><dt>Support document</dt><dd><a className="leave-document-link" href={leaveDocumentUrl(selectedRequest.supportDocument)} rel="noreferrer" target="_blank">{displayDocumentName(selectedRequest.supportDocument)}</a></dd></div></dl><div className={`leave-detail-actions${isAdmin && selectedRequest.status === 'Pending' ? '' : ' leave-detail-actions--single'}`}>{isAdmin && selectedRequest.status === 'Pending' ? <><button className="staff-button staff-button--secondary" disabled={actionBusy} type="button" onClick={() => void updateStatus('Declined')}>Decline</button><button className="staff-button staff-button--primary" disabled={actionBusy} type="button" onClick={() => void updateStatus('Approved')}>{actionBusy ? 'Saving…' : 'Approve request'}</button></> : <button className="staff-button staff-button--secondary" type="button" onClick={() => setSelectedRequest(null)}>Close details</button>}</div></aside></div> : null}

      {dialogOpen ? <div className="leave-dialog-backdrop" role="presentation"><section aria-labelledby="leave-request-title" aria-modal="true" className="leave-dialog" role="dialog" onClick={(event) => event.stopPropagation()}><div className="leave-dialog__header"><div><p className="staff-card__eyebrow">People operations</p><h2 id="leave-request-title">Request leave</h2></div><button aria-label="Close leave request form" type="button" onClick={() => setDialogOpen(false)}><Icon name="close" size={19} /></button></div><form onSubmit={submitRequest}><label>Staff member<select disabled={!isAdmin} value={form.staffId} onChange={(event) => setForm((current) => ({ ...current, staffId: event.target.value }))}>{isAdmin ? staff.map((member) => <option key={member.staffId} value={member.staffId}>{member.name} · {member.role}</option>) : <option value={user?.staffId ?? ''}>{user?.name || 'Signed-in staff member'} · {currentRole}</option>}</select></label><div className="leave-form-grid"><label>Start date<input className="staff-date-input" required type="date" value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} /></label><label>End date<input className="staff-date-input" required type="date" value={form.endDate} min={form.startDate} onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))} /></label></div><label>Reason<textarea required maxLength={500} placeholder="Add a short reason for your request" rows={4} value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} /></label><label>Support document<input required accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" type="file" onChange={(event) => setForm((current) => ({ ...current, supportDocument: event.target.files?.[0] ?? null }))} />{form.supportDocument ? <small className="leave-selected-file">Selected: {form.supportDocument.name}</small> : null}</label>{formError ? <p className="leave-form-error" role="alert">{formError}</p> : null}<div className="leave-dialog__actions"><button className="staff-button staff-button--secondary" disabled={saving} type="button" onClick={() => setDialogOpen(false)}>Cancel</button><button className="staff-button staff-button--primary" disabled={saving} type="submit">{saving ? 'Submitting…' : 'Submit request'}</button></div></form></section></div> : null}
      {notice ? <div aria-live="polite" className="staff-toast"><span><Icon name="check" size={17} /></span>{notice}</div> : null}
    </div>
  )
}
