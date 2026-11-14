import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '@/providers/auth-provider'
import { useNotices } from '@/providers/notification-provider'
import { appointmentApi, type StaffAppointmentRecord } from '@/services/appointmentApi'
import { leaveApi } from '@/services/leaveApi'
import { medicineBatchApi } from '@/services/medicineBatchApi'
import { prescriptionApi } from '@/services/prescriptionApi'
import { queueApi, type StaffQueueEntry } from '@/services/queueApi'
import { sortNotices } from '@/utils/notifications'
import { useTheme } from '../../components/theme/useTheme'
import { StaffPageEyebrow } from './components/StaffPageEyebrow'
import { getBatchStatus } from './medicine-batches/batch-status'
import { Icon, type IconName } from './navbar/StaffIcon'
import { StaffNavbar } from './navbar/StaffNavbar'
import { getStaffRole, StaffSidebar, type StaffRole } from './navbar/StaffSidebar'
import './StaffHomePage.css'
import './StaffOverview.css'

const clinicTimeZone = 'Asia/Kuala_Lumpur'
const dateKey = new Intl.DateTimeFormat('en-CA', {
  timeZone: clinicTimeZone, year: 'numeric', month: '2-digit', day: '2-digit',
})
const dateHeading = new Intl.DateTimeFormat('en-MY', {
  timeZone: clinicTimeZone, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
})
const shortDate = new Intl.DateTimeFormat('en-MY', {
  timeZone: clinicTimeZone, day: 'numeric', month: 'short',
})
const clinicTime = new Intl.DateTimeFormat('en-MY', {
  timeZone: clinicTimeZone, hour: 'numeric', minute: '2-digit',
})
const previewLimit = 5

function formatDate(formatter: Intl.DateTimeFormat, value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : formatter.format(date)
}

function calendarDate(value: string) {
  return value.slice(0, 10) + 'T12:00:00+08:00'
}

const links = {
  appointments: '/staff/appointments',
  queue: '/staff/queue',
  leave: '/staff/leave',
  schedules: '/staff/schedules',
  batches: '/staff/medicine-batches',
  prescriptions: '/staff/prescriptions',
  notifications: '/staff/notifications',
}

const shortcuts: Record<StaffRole, { label: string; to: string; icon: IconName }[]> = {
  Admin: [
    { label: 'Patient management', to: '/staff/patients', icon: 'users' },
    { label: 'Staff management', to: '/staff/staff', icon: 'staff' },
    { label: 'Staff scheduling', to: links.schedules, icon: 'calendar' },
    { label: 'Clinic rooms', to: '/staff/rooms', icon: 'activity' },
  ],
  Doctor: [
    { label: 'Medical records', to: '/staff/medical-records', icon: 'shield' },
    { label: 'My schedule', to: links.schedules, icon: 'calendar' },
    { label: 'My leave requests', to: links.leave, icon: 'clock' },
  ],
  Pharmacist: [
    { label: 'Medicine catalogue', to: '/staff/medicine', icon: 'box' },
    { label: 'My schedule', to: links.schedules, icon: 'calendar' },
    { label: 'My leave requests', to: links.leave, icon: 'clock' },
  ],
}

type Feed<T> = { rows?: T[]; failed?: true }

async function readFeed<T>(request: Promise<T[]>): Promise<Feed<T>> {
  try {
    return { rows: await request }
  } catch {
    return { failed: true }
  }
}

async function loadOverview(role: StaffRole, day: string, signal: AbortSignal) {
  if (role === 'Pharmacist') {
    const [batches, prescriptions] = await Promise.all([
      readFeed(medicineBatchApi.list()),
      readFeed(prescriptionApi.list()),
    ])
    return { kind: 'pharmacy' as const, batches, prescriptions }
  }

  const [appointments, queue, leave] = await Promise.all([
    readFeed(appointmentApi.retrieveForStaff(day)),
    readFeed(queueApi.staffList(signal)),
    role === 'Admin' ? readFeed(leaveApi.retrieveAll()) : undefined,
  ])
  return { kind: 'clinic' as const, appointments, queue, leave }
}

type OverviewData = Awaited<ReturnType<typeof loadOverview>>
type Tone = 'teal' | 'blue' | 'amber' | 'violet' | 'red'
type Metric = {
  label: string
  value?: number
  failed?: boolean
  icon: IconName
  tone: Exclude<Tone, 'red'>
  to: string
}
type OverviewRow = {
  id: string
  title: string
  detail: string
  lead: string
  status?: string
  tone?: Tone
  to?: string
}

const queueLabels: Record<string, string> = {
  InConsultation: 'In consultation',
  Skipped: 'Missed',
}

function queueStatusLabel(status: string) {
  return queueLabels[status] ?? status
}

function appointmentStatus(appointment: StaffAppointmentRecord, queueEntry?: StaffQueueEntry) {
  if (queueEntry) return queueStatusLabel(queueEntry.status)
  if (appointment.status !== 'Scheduled') return appointment.status
  if (appointment.checkInStatus === 'CheckedIn') return 'Checked in'
  if (appointment.checkInStatus && appointment.checkInStatus !== 'Pending') {
    return queueStatusLabel(appointment.checkInStatus)
  }
  return 'Scheduled'
}

function statusTone(status: string): Tone {
  if (status === 'Waiting' || status === 'Low stock') return 'amber'
  if (status === 'In consultation') return 'violet'
  if (status === 'Completed' || status === 'In stock') return 'teal'
  if (status === 'Ready for pickup') return 'blue'
  if (['Cancelled', 'Missed', 'Expired'].includes(status)) return 'red'
  return 'blue'
}

function OverviewMetrics({ metrics }: { metrics: Metric[] }) {
  return (
    <section aria-label="Overview totals" className="staff-metrics staff-overview__metrics">
      {metrics.map(({ label, value, failed, icon, tone, to }) => (
        <Link className={'staff-metric-card staff-metric-card--' + tone + ' staff-overview__metric'} key={label} to={to}>
          <span className="staff-overview__metric-top">
            <span className="staff-metric-card__icon"><Icon name={icon} size={18} /></span>
            <Icon name="arrowUpRight" size={15} />
          </span>
          <span className="staff-overview__metric-label">{label}</span>
          {failed ? <small>Unavailable</small> : <strong>{value ?? '—'}</strong>}
        </Link>
      ))}
    </section>
  )
}

type OverviewPanelProps = {
  id: string
  title: string
  to: string
  linkLabel: string
  rows?: OverviewRow[]
  failed?: boolean
  empty: string
}

function OverviewPanel({ id, title, to, linkLabel, rows, failed, empty }: OverviewPanelProps) {
  return (
    <section aria-labelledby={id} className="staff-card staff-overview__panel">
      <header className="staff-card__header staff-overview__panel-header">
        <h2 id={id}>{title}</h2>
        <Link className="staff-overview__panel-link" to={to}>{linkLabel}<Icon name="chevronRight" size={15} /></Link>
      </header>
      {failed ? (
        <p className="staff-overview__empty" role="status">Could not load {title.toLowerCase()}.</p>
      ) : !rows ? (
        <p className="staff-overview__empty" role="status">Loading…</p>
      ) : rows.length ? (
        <ul className="staff-overview__list">
          {rows.map((row) => (
            <li className="staff-overview__row" key={row.id}>
              <span className="staff-overview__lead">{row.lead}</span>
              <span className="staff-overview__row-copy">
                {row.to ? <Link to={row.to}>{row.title}</Link> : <strong>{row.title}</strong>}
                <small>{row.detail}</small>
              </span>
              {row.status ? <span className="staff-overview__status" data-tone={row.tone}>{row.status}</span> : null}
            </li>
          ))}
        </ul>
      ) : <p className="staff-overview__empty">{empty}</p>}
    </section>
  )
}

function ClinicalOverview({ data, isAdmin }: { data?: Extract<OverviewData, { kind: 'clinic' }>; isAdmin: boolean }) {
  const appointments = data?.appointments.rows
  const queue = data?.queue.rows
  const leave = data?.leave?.rows
  const queueByAppointment = new Map(queue?.map((entry) => [entry.appointmentId, entry]))
  const activeQueue = queue?.filter((entry) => ['Waiting', 'Called', 'InConsultation'].includes(entry.status))

  const metrics: Metric[] = [
    { label: 'Appointments today', value: appointments?.length, failed: data?.appointments.failed, icon: 'calendar', tone: 'teal', to: links.appointments },
    { label: 'Waiting in queue', value: queue?.filter((entry) => entry.status === 'Waiting').length, failed: data?.queue.failed, icon: 'clock', tone: 'amber', to: links.queue },
    { label: 'In consultation', value: queue?.filter((entry) => entry.status === 'InConsultation').length, failed: data?.queue.failed, icon: 'activity', tone: 'violet', to: links.queue },
    isAdmin
      ? { label: 'Pending leave requests', value: leave?.filter((entry) => entry.status === 'Pending').length, failed: data?.leave?.failed, icon: 'staff', tone: 'blue', to: links.leave }
      : { label: 'Completed today', value: appointments?.filter((entry) => entry.status === 'Completed').length, failed: data?.appointments.failed, icon: 'check', tone: 'blue', to: links.appointments },
  ]

  const appointmentRows = appointments?.slice(0, previewLimit).map((appointment) => {
    const status = appointmentStatus(appointment, queueByAppointment.get(appointment.id))
    return {
      id: appointment.id,
      lead: formatDate(clinicTime, appointment.startAt),
      title: appointment.patientName,
      detail: isAdmin ? [appointment.visitType, appointment.doctorName].filter(Boolean).join(' · ') : appointment.visitType,
      status,
      tone: statusTone(status),
    }
  })
  const queueRows = activeQueue?.slice(0, previewLimit).map((entry) => {
    const status = queueStatusLabel(entry.status)
    return {
      id: entry.queueId,
      lead: entry.queueNumber,
      title: entry.patientName,
      detail: [isAdmin ? entry.doctorName : entry.visitType, entry.roomName].filter(Boolean).join(' · '),
      status,
      tone: statusTone(status),
    }
  })

  return (
    <>
      <OverviewMetrics metrics={metrics} />
      <div className="staff-overview__grid">
        <OverviewPanel id="overview-appointments" title="Today’s appointments" to={links.appointments}
          linkLabel="Open appointments" rows={appointmentRows} failed={data?.appointments.failed} empty="No appointments today." />
        <OverviewPanel id="overview-queue" title="Active queue" to={links.queue}
          linkLabel="Open queue" rows={queueRows} failed={data?.queue.failed} empty="No patients in the active queue." />
      </div>
    </>
  )
}

function PharmacyOverview({ data }: { data?: Extract<OverviewData, { kind: 'pharmacy' }> }) {
  const batches = data?.batches.rows?.map((batch) => ({ ...batch, status: getBatchStatus(batch) }))
  const counts = batches && {
    low: batches.filter((batch) => batch.status === 'Low stock').length,
    expired: batches.filter((batch) => batch.status === 'Expired').length,
    inStock: batches.filter((batch) => batch.status === 'In stock').length,
  }
  const failed = data?.batches.failed
  const metrics: Metric[] = [
    { label: 'Total batches', value: batches?.length, failed, icon: 'box', tone: 'blue', to: links.batches },
    { label: 'In stock', value: counts?.inStock, failed, icon: 'check', tone: 'teal', to: links.batches },
    { label: 'Low stock', value: counts?.low, failed, icon: 'activity', tone: 'amber', to: links.batches },
    { label: 'Expired batches', value: counts?.expired, failed, icon: 'clock', tone: 'violet', to: links.batches },
  ]
  const alerts = batches?.filter((batch) => batch.status !== 'In stock')
    .sort((left, right) => left.status.localeCompare(right.status) || left.expiryDate.localeCompare(right.expiryDate))
    .slice(0, previewLimit)
    .map((batch) => ({
      id: batch.batchId,
      lead: formatDate(shortDate, calendarDate(batch.expiryDate)),
      title: batch.medicineName,
      detail: batch.batchId + ' · ' + batch.stockQuantity + ' units',
      status: batch.status,
      tone: statusTone(batch.status),
      to: links.batches + '?medicineId=' + encodeURIComponent(batch.medicineId),
    }))
  const dispenseStatusOrder: Record<string, number> = { Pending: 0, 'Ready for pickup': 1, Completed: 2 }
  const dispenseRows = data?.prescriptions.rows
    ?.filter((prescription) => prescription.status !== 'Completed')
    ?.slice()
    .sort((left, right) => (dispenseStatusOrder[left.status] ?? 3) - (dispenseStatusOrder[right.status] ?? 3) || right.createdAt.localeCompare(left.createdAt))
    .slice(0, previewLimit)
    .map((prescription) => ({
      id: prescription.prescriptionId,
      lead: formatDate(shortDate, prescription.createdAt),
      title: prescription.patientName,
      detail: prescription.prescriptionId + ' · ' + prescription.doctorName,
      status: prescription.status,
      tone: statusTone(prescription.status),
      to: links.prescriptions,
    }))

  return (
    <>
      <OverviewMetrics metrics={metrics} />
      <div className="staff-overview__grid">
        <OverviewPanel id="overview-inventory" title="Stock alerts" to={links.batches}
          linkLabel="Open batches" rows={alerts} failed={failed} empty="No low stock or expired batches." />
        <OverviewPanel id="overview-prescriptions" title="Prescription dispensing" to={links.prescriptions}
          linkLabel="Open prescriptions" rows={dispenseRows} failed={data?.prescriptions.failed} empty="No prescriptions to dispense." />
      </div>
    </>
  )
}

export function StaffHomePage() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { items: notices, loading: noticesLoading, error: noticeError } = useNotices()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const role = getStaffRole(user?.role)
  const accountKey = user?.userId
  const [snapshot, setSnapshot] = useState<{ accountKey: string; role: StaffRole; day: string; data: OverviewData }>()

  useEffect(() => {
    if (!accountKey) return
    const controller = new AbortController()
    let timer: number | undefined

    async function refresh() {
      if (document.visibilityState === 'visible' && accountKey) {
        const day = dateKey.format(new Date())
        const data = await loadOverview(role, day, controller.signal)
        if (!controller.signal.aborted) setSnapshot({ accountKey, role, day, data })
      }
      if (!controller.signal.aborted) timer = window.setTimeout(refresh, 30_000)
    }

    void refresh()
    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [accountKey, role])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 3200)
    return () => window.clearTimeout(timer)
  }, [notice])

  const current = snapshot?.accountKey === accountKey && snapshot?.role === role ? snapshot : undefined
  const day = current?.day ?? dateKey.format(new Date())
  const noticeRows = noticesLoading ? undefined : sortNotices(notices).slice(0, previewLimit).map((item) => ({
    id: item.id,
    lead: formatDate(shortDate, item.createdAt),
    title: item.title,
    detail: item.message,
    status: item.unread ? 'Unread' : undefined,
    tone: 'teal' as const,
  }))

  return (
    <div className="staff-page staff-overview">
      <StaffSidebar activeNav="Overview" announce={setNotice} onClose={() => setSidebarOpen(false)} sidebarOpen={sidebarOpen} />
      <main className="staff-main">
        <StaffNavbar
          activeNav="Overview"
          notificationsOpen={notificationsOpen}
          onOpenSidebar={() => setSidebarOpen(true)}
          onSearchChange={() => undefined}
          onToggleNotifications={() => setNotificationsOpen((open) => !open)}
          searchTerm=""
          selectedRole={role}
          theme={theme}
          toggleTheme={toggleTheme}
        />
        <div className="staff-content">
          <header className="staff-page-heading staff-overview__heading">
            <StaffPageEyebrow label="Staff overview" />
            <time dateTime={day}>{formatDate(dateHeading, calendarDate(day))}</time>
          </header>

          {role === 'Pharmacist'
            ? <PharmacyOverview data={current?.data.kind === 'pharmacy' ? current.data : undefined} />
            : <ClinicalOverview data={current?.data.kind === 'clinic' ? current.data : undefined} isAdmin={role === 'Admin'} />}

          <div className="staff-overview__grid">
            <OverviewPanel id="overview-notifications" title="Recent notifications" to={links.notifications}
              linkLabel="View all" rows={noticeRows} failed={Boolean(noticeError)} empty="No notifications yet." />
            <section aria-labelledby="overview-shortcuts" className="staff-card staff-overview__panel">
              <header className="staff-card__header staff-overview__panel-header"><h2 id="overview-shortcuts">Quick links</h2></header>
              <ul className="staff-overview__shortcuts">
                {shortcuts[role].map(({ label, icon, to }) => (
                  <li key={to}>
                    <Link to={to}><span className="staff-overview__shortcut-icon"><Icon name={icon} size={17} /></span>{label}<Icon name="chevronRight" size={16} /></Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </main>
      {notice ? <div aria-live="polite" className="staff-toast"><span><Icon name="check" size={17} /></span>{notice}</div> : null}
    </div>
  )
}
