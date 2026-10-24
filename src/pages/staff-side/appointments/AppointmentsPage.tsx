import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useTheme } from '../../../components/theme/useTheme'
import { Icon } from '../navbar/StaffIcon'
import { StaffNavbar } from '../navbar/StaffNavbar'
import { StaffSidebar, type StaffRole } from '../navbar/StaffSidebar'
import '../StaffHomePage.css'
import './AppointmentsPage.css'

type AppointmentStatus = 'Confirmed' | 'Checked in' | 'Waiting' | 'Completed'

type Appointment = {
  id: string
  time: string
  meridiem: string
  patient: string
  initials: string
  treatment: string
  provider: string
  room: string
  mode: string
  status: AppointmentStatus
  tone: 'teal' | 'blue' | 'amber' | 'violet'
}

const dayTabs = [
  { label: 'Mon', date: '17', count: '22' },
  { label: 'Tue', date: '18', count: '25' },
  { label: 'Wed', date: '19', count: '28' },
  { label: 'Thu', date: '20', count: '19' },
  { label: 'Fri', date: '21', count: '31' },
  { label: 'Sat', date: '22', count: '16' },
  { label: 'Sun', date: '23', count: '—' },
]

const dateLabels: Record<string, string> = {
  Mon: 'Monday, 17 August 2026',
  Tue: 'Tuesday, 18 August 2026',
  Wed: 'Wednesday, 19 August 2026',
  Thu: 'Thursday, 20 August 2026',
  Fri: 'Friday, 21 August 2026',
  Sat: 'Saturday, 22 August 2026',
  Sun: 'Sunday, 23 August 2026',
}

const appointments: Appointment[] = [
  { id: 'APT-0831', time: '09:00', meridiem: 'AM', patient: 'Sofia Tan', initials: 'ST', treatment: 'Follow-up consultation', provider: 'Dr. Maya Chen', room: 'Room 02', mode: 'In clinic', status: 'Confirmed', tone: 'teal' },
  { id: 'APT-0832', time: '09:30', meridiem: 'AM', patient: 'Ethan Wong', initials: 'EW', treatment: 'General consultation', provider: 'Dr. Daniel Wong', room: 'Room 04', mode: 'In clinic', status: 'Checked in', tone: 'blue' },
  { id: 'APT-0833', time: '10:30', meridiem: 'AM', patient: 'Amir Hakim', initials: 'AH', treatment: 'General consultation', provider: 'Dr. Daniel Wong', room: 'Room 04', mode: 'In clinic', status: 'Waiting', tone: 'amber' },
  { id: 'APT-0834', time: '11:00', meridiem: 'AM', patient: 'Nadia Ismail', initials: 'NI', treatment: 'Mental wellness review', provider: 'Dr. Aisha Rahman', room: 'Room 01', mode: 'Video call', status: 'Confirmed', tone: 'violet' },
  { id: 'APT-0835', time: '01:00', meridiem: 'PM', patient: 'Hannah Lee', initials: 'HL', treatment: 'Paediatric check-up', provider: 'Dr. Maya Chen', room: 'Room 02', mode: 'In clinic', status: 'Confirmed', tone: 'teal' },
  { id: 'APT-0836', time: '02:30', meridiem: 'PM', patient: 'Marcus Lim', initials: 'ML', treatment: 'Video consultation', provider: 'Dr. Aisha Rahman', room: 'Online', mode: 'Video call', status: 'Completed', tone: 'violet' },
  { id: 'APT-0837', time: '03:00', meridiem: 'PM', patient: 'Priya Nair', initials: 'PN', treatment: 'Physiotherapy follow-up', provider: 'Dr. Daniel Wong', room: 'Room 03', mode: 'In clinic', status: 'Confirmed', tone: 'blue' },
]

const statusFilters = ['All statuses', 'Confirmed', 'Checked in', 'Waiting', 'Completed'] as const
const providers = ['All providers', 'Dr. Maya Chen', 'Dr. Daniel Wong', 'Dr. Aisha Rahman'] as const

export function AppointmentsPage() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [activeNav, setActiveNav] = useState('Appointments')
  const [selectedRole, setSelectedRole] = useState<StaffRole>('Admin')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDay, setSelectedDay] = useState('Wed')
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilters)[number]>('All statuses')
  const [providerFilter, setProviderFilter] = useState<(typeof providers)[number]>('All providers')
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [notice, setNotice] = useState('')

  const announce = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3200)
  }

  const handleRoleChange = (role: StaffRole) => {
    setSelectedRole(role)
    setActiveNav('Appointments')
    announce(`${role} appointment view is now displayed.`)
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
    if (label === 'Audit & logs') {
      navigate('/staff/audit-logs')
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
    if (label !== 'Appointments') announce(`${label} is ready to connect to your clinic workflow.`)
  }

  const filteredAppointments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return appointments.filter((appointment) => {
      const matchesDate = selectedDay === 'Wed'
      const matchesSearch = !query || `${appointment.patient} ${appointment.provider} ${appointment.treatment} ${appointment.id}`.toLowerCase().includes(query)
      const matchesStatus = statusFilter === 'All statuses' || appointment.status === statusFilter
      const matchesProvider = providerFilter === 'All providers' || appointment.provider === providerFilter
      return matchesDate && matchesSearch && matchesStatus && matchesProvider
    })
  }, [providerFilter, searchTerm, selectedDay, statusFilter])

  const checkedInCount = filteredAppointments.filter((appointment) => appointment.status === 'Checked in').length
  const waitingCount = filteredAppointments.filter((appointment) => appointment.status === 'Waiting').length
  const completedCount = filteredAppointments.filter((appointment) => appointment.status === 'Completed').length
  const canCreate = selectedRole === 'Admin'

  const submitAppointment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setDialogOpen(false)
    announce('New appointment saved to the schedule preview.')
  }

  return (
    <div className="staff-page appointments-page">
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

        <div className="staff-content appointments-content">
          <section className="appointments-hero">
            <div>
              <p className="staff-eyebrow">CarePlus Clinic · Appointment management</p>
              <h1>Keep every visit moving.</h1>
              <p className="appointments-hero__copy">View today’s schedule, manage check-ins, and keep the care team aligned.</p>
            </div>
            {canCreate ? <button className="staff-button staff-button--primary" type="button" onClick={() => setDialogOpen(true)}><Icon name="plus" size={17} /> New appointment</button> : <span className="appointments-role-note"><Icon name="shield" size={15} /> {selectedRole} view</span>}
          </section>

          <section aria-label="Appointment summary" className="appointments-summary">
            <article className="appointments-summary-card appointments-summary-card--teal"><span><Icon name="calendar" size={18} /></span><small>Total today</small><strong>28</strong><em>+12.5% vs last Wednesday</em></article>
            <article className="appointments-summary-card appointments-summary-card--blue"><span><Icon name="check" size={18} /></span><small>Checked in</small><strong>{checkedInCount || '12'}</strong><em>Patients ready for care</em></article>
            <article className="appointments-summary-card appointments-summary-card--amber"><span><Icon name="clock" size={18} /></span><small>Waiting</small><strong>{waitingCount || '08'}</strong><em>Across 3 consultation rooms</em></article>
            <article className="appointments-summary-card appointments-summary-card--violet"><span><Icon name="activity" size={18} /></span><small>Completed</small><strong>{completedCount || '06'}</strong><em>Today’s care delivered</em></article>
          </section>

          <section aria-label="Choose appointment date" className="appointments-date-strip">
            <div className="appointments-date-strip__heading"><div><p className="staff-card__eyebrow">Schedule</p><strong>{dateLabels[selectedDay]}</strong></div><span>{selectedDay === 'Wed' ? 'Today' : 'Preview date'}</span></div>
            <div className="appointments-day-tabs">
              {dayTabs.map((day) => <button aria-pressed={selectedDay === day.label} className={selectedDay === day.label ? 'is-selected' : ''} key={day.label} type="button" onClick={() => setSelectedDay(day.label)}><small>{day.label}</small><strong>{day.date}</strong><span>{day.count}</span></button>)}
            </div>
          </section>

          <section className="appointments-board">
            <div className="staff-card appointments-list-card">
              <div className="staff-card__header appointments-list-card__header"><div><p className="staff-card__eyebrow">{selectedRole} workspace</p><h2>Appointments</h2></div><div className="appointments-view-toggle"><button aria-pressed={view === 'list'} className={view === 'list' ? 'is-selected' : ''} type="button" onClick={() => setView('list')}><Icon name="activity" size={15} /> List</button><button aria-pressed={view === 'calendar'} className={view === 'calendar' ? 'is-selected' : ''} type="button" onClick={() => setView('calendar')}><Icon name="calendar" size={15} /> Calendar</button></div></div>

              <div className="appointments-filters">
                <label><span className="sr-only">Filter by status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as (typeof statusFilters)[number])}>{statusFilters.map((status) => <option key={status}>{status}</option>)}</select><Icon name="chevronDown" size={14} /></label>
                <label><span className="sr-only">Filter by provider</span><select value={providerFilter} onChange={(event) => setProviderFilter(event.target.value as (typeof providers)[number])}>{providers.map((provider) => <option key={provider}>{provider}</option>)}</select><Icon name="chevronDown" size={14} /></label>
                <span className="appointments-result-count">{filteredAppointments.length} shown</span>
              </div>

              {view === 'calendar' ? (
                <div className="appointments-calendar-preview"><div className="appointments-calendar-preview__grid">{Array.from({ length: 10 }, (_, index) => <span key={index}>{`${String(index + 8).padStart(2, '0')}:00`}</span>)}</div><div className="appointments-calendar-preview__events">{filteredAppointments.slice(0, 4).map((appointment) => <button key={appointment.id} className={`appointments-calendar-event appointments-calendar-event--${appointment.tone}`} type="button" onClick={() => announce(`${appointment.patient}'s appointment selected.`)}><strong>{appointment.time}</strong><span>{appointment.patient}</span><small>{appointment.treatment}</small></button>)}{!filteredAppointments.length ? <p>No appointments scheduled for this date.</p> : null}</div></div>
              ) : (
                <div className="appointments-table-wrap">
                  <table className="appointments-table"><thead><tr><th scope="col">Time</th><th scope="col">Patient</th><th scope="col">Visit</th><th scope="col">Provider</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead><tbody>{filteredAppointments.map((appointment) => <tr key={appointment.id}><td><strong>{appointment.time}</strong><small>{appointment.meridiem}</small></td><td><span className={`appointments-patient-avatar appointments-patient-avatar--${appointment.tone}`}>{appointment.initials}</span><span><strong>{appointment.patient}</strong><small>{appointment.id}</small></span></td><td><strong>{appointment.treatment}</strong><small>{appointment.mode} · {appointment.room}</small></td><td>{appointment.provider}</td><td><span className={`appointment-status appointment-status--${appointment.status.toLowerCase().replace(' ', '-')}`}><i />{appointment.status}</span></td><td><button aria-label={`Open ${appointment.patient}'s appointment`} className="appointments-row-action" type="button" onClick={() => announce(`${appointment.patient}'s appointment details opened.`)}><Icon name="chevronRight" size={17} /></button></td></tr>)}</tbody></table>{!filteredAppointments.length ? <div className="appointments-empty"><Icon name="calendar" size={25} /><strong>No appointments found</strong><span>Try another date or clear your filters.</span></div> : null}</div>
              )}
            </div>

            <aside className="appointments-side-column">
              <section className="staff-card appointments-side-card"><div className="staff-card__header"><div><p className="staff-card__eyebrow">Today at a glance</p><h2>Room availability</h2></div><span className="staff-live-pill"><i /> Live</span></div><div className="appointments-room-list"><div><span className="appointments-room-dot appointments-room-dot--busy" /><span><strong>Room 01</strong><small>Dr. Aisha Rahman</small></span><em>In use</em></div><div><span className="appointments-room-dot appointments-room-dot--busy" /><span><strong>Room 02</strong><small>Dr. Maya Chen</small></span><em>In use</em></div><div><span className="appointments-room-dot appointments-room-dot--free" /><span><strong>Room 03</strong><small>Available now</small></span><em>Free</em></div><div><span className="appointments-room-dot appointments-room-dot--busy" /><span><strong>Room 04</strong><small>Dr. Daniel Wong</small></span><em>In use</em></div></div></section>
              <section className="staff-card appointments-side-card appointments-next-card"><div className="staff-card__header"><div><p className="staff-card__eyebrow">Next up</p><h2>Prepare for arrival</h2></div><Icon name="clock" size={19} /></div><div className="appointments-next-card__patient"><span className="appointments-patient-avatar appointments-patient-avatar--amber">AH</span><span><strong>Amir Hakim</strong><small>General consultation · 10:30 AM</small></span></div><div className="appointments-progress"><span><i style={{ width: '62%' }} /></span><small>2 of 3 pre-visit checks complete</small></div><button className="staff-text-button" type="button" onClick={() => announce('Pre-visit checklist opened.')}>Open checklist <Icon name="arrowUpRight" size={15} /></button></section>
              <section className="staff-card appointments-side-card appointments-permission-card"><Icon name="shield" size={17} /><span><strong>{selectedRole} access</strong><small>{canCreate ? 'You can create, reschedule, and cancel appointments.' : 'You can view the schedule and open appointment details.'}</small></span></section>
            </aside>
          </section>
        </div>
      </main>

      {dialogOpen ? <div className="appointments-dialog-backdrop" role="presentation" onClick={() => setDialogOpen(false)}><section aria-labelledby="new-appointment-title" aria-modal="true" className="appointments-dialog" role="dialog" onClick={(event) => event.stopPropagation()}><div className="appointments-dialog__header"><div><p className="staff-card__eyebrow">Appointment management</p><h2 id="new-appointment-title">New appointment</h2></div><button aria-label="Close new appointment dialog" type="button" onClick={() => setDialogOpen(false)}><Icon name="close" size={19} /></button></div><form onSubmit={submitAppointment}><label>Patient<input required placeholder="Search patient name or ID" /></label><div className="appointments-form-grid"><label>Date<input required type="date" defaultValue="2026-08-19" /></label><label>Time<input required type="time" defaultValue="09:00" /></label></div><div className="appointments-form-grid"><label>Provider<select defaultValue="Dr. Maya Chen">{providers.slice(1).map((provider) => <option key={provider}>{provider}</option>)}</select></label><label>Visit type<select defaultValue="General consultation"><option>General consultation</option><option>Follow-up consultation</option><option>Video consultation</option><option>Paediatric check-up</option></select></label></div><label>Notes<textarea placeholder="Add a short note for the care team" rows={3} /></label><div className="appointments-dialog__actions"><button className="staff-button staff-button--secondary" type="button" onClick={() => setDialogOpen(false)}>Cancel</button><button className="staff-button staff-button--primary" type="submit">Save appointment</button></div></form></section></div> : null}
      {notice ? <div aria-live="polite" className="staff-toast"><span><Icon name="check" size={17} /></span>{notice}</div> : null}
    </div>
  )
}
