import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useTheme } from '@/components/theme/useTheme'
import { useAuth } from '@/providers/auth-provider'
import { queueApi, type QueueStatus, type StaffQueueEntry } from '@/services/queueApi'
import { StaffDialog } from '../components/StaffDialog'
import { StaffListSort } from '../components/StaffListControls'
import { StaffPageEyebrow } from '../components/StaffPageEyebrow'
import { Icon, type IconName } from '../navbar/StaffIcon'
import { StaffNavbar } from '../navbar/StaffNavbar'
import { getStaffRole, StaffSidebar } from '../navbar/StaffSidebar'
import '../StaffHomePage.css'
import './StaffQueuePage.css'

const clinicTime = new Intl.DateTimeFormat('en-MY', {
  timeZone: 'Asia/Kuala_Lumpur', hour: 'numeric', minute: '2-digit',
})

const statusLabels: Record<string, string> = {
  Waiting: 'Waiting',
  Called: 'Called',
  InConsultation: 'In consultation',
  Completed: 'Completed',
  Skipped: 'Missed',
  Cancelled: 'Cancelled',
}
const statusOptions = ['All statuses', ...Object.values(statusLabels)]

const metrics: { status: string; icon: IconName; tone: string }[] = [
  { status: 'Waiting', icon: 'clock', tone: 'amber' },
  { status: 'Called', icon: 'bell', tone: 'blue' },
  { status: 'InConsultation', icon: 'activity', tone: 'violet' },
  { status: 'Completed', icon: 'check', tone: 'teal' },
]

const nextActions: Record<string, { status: string; label: string } | undefined> = {
  Waiting: { status: 'Called', label: 'Call patient' },
  Called: { status: 'InConsultation', label: 'Start consultation' },
  InConsultation: { status: 'Completed', label: 'Complete' },
}

type QueueResult = { rows: StaffQueueEntry[]; error: string }

export function StaffQueuePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const canConsult = user?.role === 'Doctor' || user?.role === 'Admin'
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [searchTerm, setSearchTerm] = useState('')
  const [current, setCurrent] = useState<QueueResult>()
  const [reload, setReload] = useState(0)
  const [pendingId, setPendingId] = useState<string>()
  const [missedEntry, setMissedEntry] = useState<StaffQueueEntry>()
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    let timer: number | undefined

    const load = async () => {
      try {
        const rows = await queueApi.staffList(controller.signal)
        if (!controller.signal.aborted) setCurrent({ rows, error: '' })
      } catch (error) {
        if (!controller.signal.aborted) {
          const message = error instanceof Error ? error.message : 'Unable to load the appointment queue.'
          setCurrent((previous) => ({
            rows: previous?.rows ?? [],
            error: message,
          }))
        }
      } finally {
        if (!controller.signal.aborted) timer = window.setTimeout(load, 15_000)
      }
    }

    void load()
    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [reload])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 3200)
    return () => window.clearTimeout(timer)
  }, [notice])

  const rows = current?.rows ?? []
  const query = searchTerm.trim().toLowerCase()
  const visibleRows = rows.filter((row) => {
    const label = statusLabels[row.status] ?? row.status
    return (statusFilter === 'All statuses' || statusFilter === label)
      && (!query || [row.queueNumber, row.patientName, row.doctorName, row.appointmentId].some((value) => value.toLowerCase().includes(query)))
  })

  function applyQueueUpdate(updated: QueueStatus) {
    setCurrent((previous) => previous && {
      ...previous,
      rows: previous.rows.map((row) => row.queueId === updated.queueId
        ? { ...row, status: updated.status, roomName: updated.roomName }
        : row),
    })
  }

  async function updateStatus(entry: StaffQueueEntry, status: string) {
    setPendingId(entry.queueId)
    setActionError('')
    try {
      const updated = await queueApi.updateStatus(entry, status)
      applyQueueUpdate(updated)
      setMissedEntry(undefined)
      if (canConsult && updated.status === 'InConsultation') {
        navigate(`/staff/queue/${encodeURIComponent(entry.queueId)}/consultation`)
      } else {
        setNotice(`${entry.queueNumber} · ${statusLabels[updated.status] ?? updated.status}`)
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to update the queue.')
      setMissedEntry(undefined)
    } finally {
      setReload((value) => value + 1)
      setPendingId(undefined)
    }
  }

  return (
    <div className="staff-page staff-queue">
      <StaffSidebar activeNav="Queue" announce={setNotice} onClose={() => setSidebarOpen(false)} sidebarOpen={sidebarOpen} />
      <main className="staff-main">
        <StaffNavbar
          activeNav="Queue"
          notificationsOpen={notificationsOpen}
          onOpenSidebar={() => setSidebarOpen(true)}
          onSearchChange={setSearchTerm}
          onToggleNotifications={() => setNotificationsOpen((open) => !open)}
          searchTerm={searchTerm}
          selectedRole={getStaffRole(user?.role)}
          theme={theme}
          toggleTheme={toggleTheme}
        />

        <div className="staff-content">
          <StaffPageEyebrow label="Queue management" />

          <section aria-label="Queue totals" className="staff-metrics">
            {metrics.map(({ status, icon, tone }) => (
              <article className={`staff-metric-card staff-metric-card--${tone}`} key={status}>
                <span className="staff-metric-card__icon"><Icon name={icon} size={18} /></span>
                <div>
                  <span>{statusLabels[status]}</span>
                  <strong>{current && (!current.error || rows.length) ? rows.filter((row) => row.status === status).length : '—'}</strong>
                </div>
              </article>
            ))}
          </section>

          <section aria-label="Checked-in appointments" className="staff-card staff-queue__list">
            <div className="staff-queue__filters">
              <label className="staff-queue__search">
                <Icon name="search" size={16} />
                <span className="sr-only">Search the queue</span>
                <input placeholder="Search patient, doctor or queue number" type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
              </label>
              <StaffListSort label="Filter queue by status" options={statusOptions} value={statusFilter} onChange={setStatusFilter} />
            </div>
            {actionError ? <p className="staff-queue__error" role="alert">{actionError}</p> : null}
            {current?.error ? (
              <div className="staff-queue__error" role="alert">
                <span>{current.error}</span>
                <button className="staff-button staff-button--secondary" type="button" onClick={() => setReload((value) => value + 1)}>Try again</button>
              </div>
            ) : null}
            {!current ? (
              <div className="staff-queue__empty" role="status">Loading the appointment queue…</div>
            ) : visibleRows.length > 0 ? (
              <div className="staff-queue__table-wrap">
                <table aria-label="Appointment queue" className="staff-queue__table">
                  <thead><tr>
                    <th scope="col">Queue</th>
                    <th scope="col">Patient</th>
                    <th scope="col">Doctor</th>
                    <th scope="col">Checked in</th>
                    <th scope="col">Status</th>
                    <th scope="col">Actions</th>
                  </tr></thead>
                  <tbody>
                    {visibleRows.map((row) => {
                      const resumeConsultation = canConsult && row.status === 'InConsultation'
                      const next = nextActions[row.status]
                      return (
                        <tr key={row.queueId}>
                          <td><span className="staff-queue__ticket">{row.queueNumber}</span></td>
                          <td><strong>{row.patientName}</strong><small>{row.visitType}</small></td>
                          <td><strong>{row.doctorName}</strong><small>{row.roomName ?? '—'}</small></td>
                          <td><time dateTime={row.checkedInAt}>{clinicTime.format(new Date(row.checkedInAt))}</time></td>
                          <td><span className="staff-queue__status" data-status={row.status}>{statusLabels[row.status] ?? row.status}</span></td>
                          <td>
                            {next ? (
                              <div className="staff-queue__row-actions">
                                <button
                                  className={`staff-button staff-button--${canConsult && (resumeConsultation || next.status === 'InConsultation') ? 'primary' : 'secondary'}`}
                                  disabled={!!pendingId || !!current.error}
                                  type="button"
                                  onClick={() => resumeConsultation ? navigate(`/staff/queue/${encodeURIComponent(row.queueId)}/consultation`) : void updateStatus(row, next.status)}
                                >
                                  {pendingId === row.queueId ? 'Saving…' : resumeConsultation ? 'Resume consultation' : next.label}
                                </button>
                                {row.status === 'Called' ? <button className="staff-queue__missed" disabled={!!pendingId || !!current.error} type="button" onClick={() => setMissedEntry(row)}>Mark missed</button> : null}
                              </div>
                            ) : <span aria-hidden="true">—</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : !current.error ? (
              <div className="staff-queue__empty" role="status">
                <Icon name="clock" size={25} />
                <strong>{rows.length ? 'No matching queue entries' : 'No patients checked in'}</strong>
                <span>{rows.length ? 'Try a different search or status.' : 'Patients appear here once they check in for an appointment.'}</span>
              </div>
            ) : null}
          </section>
        </div>
      </main>

      {missedEntry ? (
        <StaffDialog
          closeDisabled={!!pendingId}
          closeOnBackdropClick={false}
          eyebrow="Appointment queue"
          title="Mark appointment as missed?"
          titleId="staff-queue-missed-title"
          onClose={() => setMissedEntry(undefined)}
        >
          <p className="staff-queue__dialog-copy">{missedEntry.patientName} will be removed from the active queue and the appointment will be marked as missed.</p>
          <div className="staff-queue__dialog-actions">
            <button className="staff-button staff-button--secondary" disabled={!!pendingId} type="button" onClick={() => setMissedEntry(undefined)}>Keep in queue</button>
            <button className="staff-button staff-button--primary" disabled={!!pendingId} type="button" onClick={() => void updateStatus(missedEntry, 'Skipped')}>{pendingId ? 'Saving…' : 'Mark missed'}</button>
          </div>
        </StaffDialog>
      ) : null}
      {notice ? <div className="staff-toast" role="status">{notice}</div> : null}
    </div>
  )
}
