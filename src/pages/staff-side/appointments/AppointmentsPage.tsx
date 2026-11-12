import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/providers/auth-provider'
import { appointmentApi, type AvailableDoctorRecord, type StaffAppointmentRecord } from '@/services/appointmentApi'
import { patientApi, type PatientRecord } from '@/services/patientApi'
import { useTheme } from '../../../components/theme/useTheme'
import { Icon } from '../navbar/StaffIcon'
import { StaffNavbar } from '../navbar/StaffNavbar'
import { getStaffRole, StaffSidebar } from '../navbar/StaffSidebar'
import { StaffDateFilter } from '../components/StaffDateFilter'
import { StaffDialog } from '../components/StaffDialog'
import { StaffListReset } from '../components/StaffListControls'
import { StaffWeekFilter } from '../components/StaffWeekFilter'
import { StaffPageEyebrow } from '../components/StaffPageEyebrow'
import '../StaffHomePage.css'
import './AppointmentsPage.css'

type AppointmentStatus = 'Confirmed' | 'Checked in' | 'Waiting' | 'Completed' | 'Cancelled'

type Appointment = {
  id: string
  dateKey: string
  time: string
  meridiem: string
  patient: string
  patientUsername: string
  initials: string
  treatment: string
  provider: string
  doctorId: string
  room: string
  mode: string
  startAt: string
  endAt: string
  notes: string | null
  status: AppointmentStatus
  checkInStatus: string
  tone: 'teal' | 'blue' | 'amber' | 'violet' | 'red'
}

type ProviderOption = {
  id: string
  name: string
  role: string
}

type PatientOption = {
  id: string
  name: string
  username: string
}

const statusFilters = ['All statuses', 'Confirmed', 'Checked in', 'Waiting', 'Completed', 'Cancelled'] as const
type AppointmentShift = 'morning' | 'night'
const appointmentVisitTypes = ['General consultation', 'Body check', 'Mental wellness'] as const

function buildAppointmentTimeSlots(startHour: number, endHour: number) {
  const slots: Array<{ value: string; label: string }> = []

  for (let minutes = startHour * 60; minutes + 30 <= endHour * 60; minutes += 30) {
    const hour = Math.floor(minutes / 60)
    const minute = minutes % 60
    const value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    const displayHour = hour % 12 || 12
    const meridiem = hour >= 12 ? 'PM' : 'AM'
    slots.push({ value, label: `${displayHour}:${String(minute).padStart(2, '0')} ${meridiem}` })
  }

  return slots
}

const appointmentTimeSlots: Record<AppointmentShift, Array<{ value: string; label: string }>> = {
  morning: buildAppointmentTimeSlots(6, 18),
  night: [...buildAppointmentTimeSlots(18, 24), ...buildAppointmentTimeSlots(0, 6)],
}

const appointmentShiftRanges: Record<AppointmentShift, string> = {
  morning: '06:00 AM – 05:30 PM',
  night: '06:00 PM – 05:30 AM',
}

function appointmentTimeLabel(value: string) {
  return Object.values(appointmentTimeSlots)
    .flat()
    .find((slot) => slot.value === value)?.label ?? ''
}

function dateKey(value: Date) {
  return [value.getFullYear(), String(value.getMonth() + 1).padStart(2, '0'), String(value.getDate()).padStart(2, '0')].join('-')
}

function isBookingSlotTooSoon(date: string, time: string) {
  if (!date) return true
  return new Date(`${date}T${time}:00`).getTime() < Date.now() + 30 * 60 * 1000
}

function startOfWeek(value: Date) {
  const result = new Date(value)
  const day = result.getDay()
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1))
  result.setHours(0, 0, 0, 0)
  return result
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'PT'
}

function displayStatus(record: StaffAppointmentRecord): AppointmentStatus {
  if (record.status.toLowerCase() === 'cancelled') return 'Cancelled'
  if (record.status.toLowerCase() === 'completed') return 'Completed'
  if (record.checkInStatus.toLowerCase().replace(/[_-]/g, ' ') === 'checked in') return 'Checked in'
  if (record.checkInStatus.toLowerCase() === 'waiting') return 'Waiting'
  return 'Confirmed'
}

function mapAppointment(record: StaffAppointmentRecord): Appointment {
  const start = new Date(record.startAt)
  const status = displayStatus(record)
  const tone = status === 'Cancelled' ? 'red' : status === 'Completed' ? 'violet' : status === 'Waiting' ? 'amber' : status === 'Checked in' ? 'blue' : 'teal'

  return {
    id: record.id,
    dateKey: dateKey(start),
    time: start.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', hour12: true }).replace(/\s?[AP]M$/, ''),
    meridiem: start.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', hour12: true }).slice(-2),
    patient: record.patientName,
    patientUsername: record.patientUsername,
    initials: initials(record.patientName),
    treatment: record.visitType,
    provider: record.doctorName,
    doctorId: record.doctorId,
    room: 'Clinic',
    mode: 'In clinic',
    startAt: record.startAt,
    endAt: record.endAt,
    notes: record.notes,
    status,
    checkInStatus: record.checkInStatus,
    tone,
  }
}

function formatAppointmentDate(value: string) {
  return new Date(value).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatAppointmentTime(value: string) {
  return new Date(value).toLocaleTimeString('en-MY', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function formatCheckInStatus(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[_-]/g, ' ')
  return normalized ? normalized.replace(/\b\w/g, (character) => character.toUpperCase()) : '—'
}

function timeKey(value: string) {
  const date = new Date(value)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function shiftForTime(value: string): AppointmentShift {
  const hour = new Date(value).getHours()
  return hour >= 6 && hour < 18 ? 'morning' : 'night'
}

type AppointmentTimePickerProps = {
  date: string
  dateSelected: boolean
  shift: AppointmentShift
  value: string
  onChange: (value: string) => void
  onShiftChange: (shift: AppointmentShift) => void
}

function AppointmentTimePicker({ date, dateSelected, shift, value, onChange, onShiftChange }: AppointmentTimePickerProps) {
  return (
    <div className="appointments-time-picker">
      <div aria-label="Booking shift" className="appointments-shift-options" role="group">
        {(['morning', 'night'] as const).map((option) => (
          <button
            aria-pressed={shift === option}
            className={shift === option ? 'is-active' : ''}
            disabled={!dateSelected}
            key={option}
            type="button"
            onClick={() => {
              onShiftChange(option)
            }}
          >
            <strong>{option === 'morning' ? 'Morning' : 'Night'}</strong>
            <small>{appointmentShiftRanges[option]}</small>
          </button>
        ))}
      </div>
      <div aria-label={`${shift} booking times`} className="appointments-time-options" role="group">
        {appointmentTimeSlots[shift].map((slot) => (
          <button
            aria-pressed={value === slot.value}
            className={value === slot.value ? 'is-selected' : ''}
            disabled={!dateSelected || isBookingSlotTooSoon(date, slot.value)}
            key={slot.value}
            type="button"
            onClick={() => onChange(slot.value)}
          >
            {slot.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function AppointmentsPage() {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [activeNav] = useState('Appointments')
  const currentRole = getStaffRole(user?.role)
  const canCreate = currentRole === 'Admin'
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()))
  const [weekStartKey, setWeekStartKey] = useState(() => dateKey(startOfWeek(new Date())))
  const weekStart = useMemo(() => new Date(`${weekStartKey}T00:00:00`), [weekStartKey])
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('')
  const [rescheduleShift, setRescheduleShift] = useState<AppointmentShift>('morning')
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null)
  const [appointmentActionLoading, setAppointmentActionLoading] = useState(false)
  const [appointmentActionError, setAppointmentActionError] = useState('')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilters)[number]>('All statuses')
  const [providerFilter, setProviderFilter] = useState('All doctors')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [availableDoctors, setAvailableDoctors] = useState<AvailableDoctorRecord[]>([])
  const [appointmentDate, setAppointmentDate] = useState('')
  const [appointmentTime, setAppointmentTime] = useState('')
  const [appointmentShift, setAppointmentShift] = useState<AppointmentShift>('morning')
  const [bookingTimeDialogOpen, setBookingTimeDialogOpen] = useState(false)
  const [patientDirectory, setPatientDirectory] = useState<PatientRecord[]>([])
  const [patientSearch, setPatientSearch] = useState('')
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [patientDropdownOpen, setPatientDropdownOpen] = useState(false)
  const [selectedProviderId, setSelectedProviderId] = useState('')
  const [appointmentVisitType, setAppointmentVisitType] = useState('General consultation')
  const [visitTypeDialogOpen, setVisitTypeDialogOpen] = useState(false)
  const [appointmentNotes, setAppointmentNotes] = useState('')
  const [savingAppointment, setSavingAppointment] = useState(false)
  const [providerAvailabilityLoading, setProviderAvailabilityLoading] = useState(false)
  const [providerAvailabilityError, setProviderAvailabilityError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const dayTabs = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart)
    day.setDate(weekStart.getDate() + index)
    const key = dateKey(day)
    return {
      key,
      label: day.toLocaleDateString('en-MY', { weekday: 'short' }),
      date: String(day.getDate()).padStart(2, '0'),
      count: appointments.filter((appointment) => appointment.dateKey === key).length,
    }
  }), [appointments, weekStart])

  const providerOptions = useMemo(() => [
    'All doctors',
    ...Array.from(new Set(appointments.map((appointment) => appointment.provider).filter(Boolean))).sort(),
  ], [appointments])

  const providerDirectory = useMemo<ProviderOption[]>(() => {
    return availableDoctors
      .map((doctor) => ({
        id: doctor.id,
        name: doctor.name,
        role: 'Doctor',
      }))
      .sort((first, second) => first.name.localeCompare(second.name))
  }, [availableDoctors])

  const patientMatches = useMemo<PatientOption[]>(() => {
    const query = patientSearch.trim().toLowerCase()
    if (!query || !patientDropdownOpen) return []

    return patientDirectory
      .filter((patient) => `${patient.name} ${patient.username} ${patient.patientId} ${patient.email}`.toLowerCase().includes(query))
      .slice(0, 6)
      .map((patient) => ({
        id: patient.patientId,
        name: patient.name,
        username: patient.username,
      }))
  }, [patientDirectory, patientDropdownOpen, patientSearch])

  const selectedPatient = useMemo(
    () => patientDirectory.find((patient) => patient.patientId === selectedPatientId),
    [patientDirectory, selectedPatientId],
  )

  const selectedProvider = useMemo(
    () => providerDirectory.find((provider) => provider.id === selectedProviderId),
    [providerDirectory, selectedProviderId],
  )

  const selectedDateLabel = useMemo(() => new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-MY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }), [selectedDate])

  const handleWeekChange = (nextWeekStart: string) => {
    setWeekStartKey(nextWeekStart)
    setSelectedDate((currentDateKey) => {
      const nextStart = new Date(`${nextWeekStart}T00:00:00`)
      const nextEnd = new Date(nextStart)
      nextEnd.setDate(nextStart.getDate() + 6)
      const currentDate = new Date(`${currentDateKey}T00:00:00`)

      return currentDate >= nextStart && currentDate <= nextEnd ? currentDateKey : nextWeekStart
    })
  }

  const announce = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3200)
  }

  useEffect(() => {
    let cancelled = false

    const loadAppointments = async () => {
      setLoading(true)
      setError('')

      try {
        const records = await appointmentApi.retrieveForStaff()
        if (!cancelled) {
          setAppointments(records.map(mapAppointment))
        }
      } catch (loadError) {
        if (cancelled) return

        const message = loadError instanceof Error ? loadError.message : 'Unable to load appointments.'
        if (message.includes('401') || message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('login first')) {
          await logout()
          navigate('/staff/login', { replace: true })
          return
        }

        setError(message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadAppointments()

    return () => {
      cancelled = true
    }
  }, [logout, navigate])

  useEffect(() => {
    if (!canCreate || !dialogOpen) return

    if (!appointmentDate || !appointmentTime) {
      setAvailableDoctors([])
      setSelectedProviderId('')
      setProviderAvailabilityError('')
      setProviderAvailabilityLoading(false)
      return
    }

    let cancelled = false
    setProviderAvailabilityLoading(true)
    setProviderAvailabilityError('')
    setAvailableDoctors([])
    setSelectedProviderId('')

    const loadAvailableDoctors = async () => {
      try {
        const doctors = await appointmentApi.retrieveAvailableDoctors(appointmentDate, appointmentTime)
        if (!cancelled) setAvailableDoctors(doctors)
      } catch (loadError) {
        if (!cancelled) {
          setAvailableDoctors([])
          setProviderAvailabilityError(loadError instanceof Error ? loadError.message : 'Unable to load available doctors.')
        }
      } finally {
        if (!cancelled) setProviderAvailabilityLoading(false)
      }
    }

    void loadAvailableDoctors()

    return () => {
      cancelled = true
    }
  }, [appointmentDate, appointmentTime, canCreate, dialogOpen])

  useEffect(() => {
    if (!canCreate) return

    let cancelled = false

    const loadPatientDirectory = async () => {
      try {
        const patients = await patientApi.retrieveAll()
        if (!cancelled) setPatientDirectory(patients.filter((patient) => patient.status.toLowerCase() === 'active'))
      } catch {
        if (!cancelled) setPatientDirectory([])
      }
    }

    void loadPatientDirectory()

    return () => {
      cancelled = true
    }
  }, [canCreate])

  const filteredAppointments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    const rows = appointments.filter((appointment) => {
      const matchesDate = appointment.dateKey === selectedDate
      const matchesSearch = !query || `${appointment.patient} ${appointment.provider} ${appointment.treatment} ${appointment.id}`.toLowerCase().includes(query)
      const matchesStatus = statusFilter === 'All statuses' || appointment.status === statusFilter
      const matchesProvider = providerFilter === 'All doctors' || appointment.provider === providerFilter
      return matchesDate && matchesSearch && matchesStatus && matchesProvider
    })

    return rows
  }, [appointments, providerFilter, searchTerm, selectedDate, statusFilter])

  const selectedDayAppointments = appointments.filter((appointment) => appointment.dateKey === selectedDate)
  const checkedInCount = filteredAppointments.filter((appointment) => appointment.status === 'Checked in').length
  const waitingCount = filteredAppointments.filter((appointment) => appointment.status === 'Waiting').length
  const completedCount = filteredAppointments.filter((appointment) => appointment.status === 'Completed').length

  const resetListControls = () => {
    const today = new Date()
    setSearchTerm('')
    setWeekStartKey(dateKey(startOfWeek(today)))
    setSelectedDate(dateKey(today))
    setStatusFilter('All statuses')
    setProviderFilter('All doctors')
  }

  const refreshAppointments = async () => {
    const records = await appointmentApi.retrieveForStaff()
    setAppointments(records.map(mapAppointment))
  }

  const openReschedule = (appointment: Appointment) => {
    setRescheduleTarget(appointment)
    setRescheduleDate(appointment.dateKey)
    setRescheduleTime(timeKey(appointment.startAt))
    setRescheduleShift(shiftForTime(appointment.startAt))
    setAppointmentActionError('')
    setSelectedAppointment(null)
  }

  const submitReschedule = async () => {
    if (!rescheduleTarget || !rescheduleDate || !rescheduleTime) {
      setAppointmentActionError('Choose a new date and time before saving.')
      return
    }

    setAppointmentActionLoading(true)
    setAppointmentActionError('')
    try {
      await appointmentApi.rescheduleForStaff(rescheduleTarget.id, {
        startAt: `${rescheduleDate}T${rescheduleTime}:00+08:00`,
      })
      await refreshAppointments()
      setRescheduleTarget(null)
      announce('Appointment rescheduled successfully.')
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : 'Unable to reschedule appointment.'
      if (message.toLowerCase().includes('session has expired')) {
        await logout()
        navigate('/staff/login', { replace: true })
        return
      }
      setAppointmentActionError(message)
    } finally {
      setAppointmentActionLoading(false)
    }
  }

  const confirmCancelAppointment = async () => {
    if (!cancelTarget) return

    setAppointmentActionLoading(true)
    setAppointmentActionError('')
    try {
      await appointmentApi.cancelForStaff(cancelTarget.id)
      await refreshAppointments()
      setCancelTarget(null)
      announce('Appointment cancelled successfully.')
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : 'Unable to cancel appointment.'
      if (message.toLowerCase().includes('session has expired')) {
        await logout()
        navigate('/staff/login', { replace: true })
        return
      }
      setAppointmentActionError(message)
    } finally {
      setAppointmentActionLoading(false)
    }
  }

  const submitAppointment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!appointmentDate || !appointmentTime) {
      announce('Choose an appointment date and time before saving.')
      return
    }

    if (!selectedPatientId) {
      announce('Choose a patient from the matching names before saving.')
      return
    }

    if (!selectedProviderId) {
      announce('Choose an available doctor before saving.')
      return
    }

    setSavingAppointment(true)
    try {
      await appointmentApi.createForStaff({
        patientId: selectedPatientId,
        doctorId: selectedProviderId,
        startAt: `${appointmentDate}T${appointmentTime}:00+08:00`,
        type: appointmentVisitType,
        notes: appointmentNotes.trim() || null,
      })

      const records = await appointmentApi.retrieveForStaff()
      setAppointments(records.map(mapAppointment))
      setDialogOpen(false)
      setBookingTimeDialogOpen(false)
      announce('Appointment created successfully.')
    } catch (saveError) {
      announce(saveError instanceof Error ? saveError.message : 'Unable to create appointment.')
    } finally {
      setSavingAppointment(false)
    }
  }

  return (
    <div className="staff-page appointments-page">
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

        <div className="staff-content appointments-content">
          <section className="appointments-hero">
            <div>
              <p className="staff-eyebrow">Appointment management</p>
              <h1>Appointments</h1>
            </div>
            {canCreate ? <button className="staff-button staff-button--primary" type="button" onClick={() => { setPatientSearch(''); setSelectedPatientId(''); setPatientDropdownOpen(false); setAppointmentDate(''); setAppointmentTime(''); setAppointmentShift('morning'); setBookingTimeDialogOpen(false); setAppointmentVisitType('General consultation'); setAppointmentNotes(''); setAvailableDoctors([]); setProviderAvailabilityError(''); setSelectedProviderId(''); setDialogOpen(true) }}><Icon name="plus" size={17} /> New appointment</button> : <span className="appointments-role-note"><Icon name="shield" size={15} /> {currentRole} view</span>}
          </header>

          <section aria-label="Appointment summary" className="appointments-summary">
            <article className="appointments-summary-card appointments-summary-card--teal"><span><Icon name="calendar" size={18} /></span><small>Appointments</small><strong>{selectedDayAppointments.length}</strong><em>Selected date</em></article>
            <article className="appointments-summary-card appointments-summary-card--blue"><span><Icon name="check" size={18} /></span><small>Checked in</small><strong>{checkedInCount}</strong><em>Patients ready for care</em></article>
            <article className="appointments-summary-card appointments-summary-card--amber"><span><Icon name="clock" size={18} /></span><small>Waiting</small><strong>{waitingCount}</strong><em>Awaiting care</em></article>
            <article className="appointments-summary-card appointments-summary-card--violet"><span><Icon name="activity" size={18} /></span><small>Completed</small><strong>{completedCount}</strong><em>Care delivered</em></article>
          </section>

          <section aria-label="Choose appointment date" className="appointments-date-strip">
            <div className="appointments-date-strip__heading"><div><p className="staff-card__eyebrow">Schedule</p><strong>{selectedDateLabel}</strong></div><div className="appointments-date-strip__controls"><StaffWeekFilter label="Choose appointment week" value={weekStartKey} onChange={handleWeekChange} /></div></div>
            <div className="appointments-day-tabs">
              {dayTabs.map((day) => <button aria-pressed={selectedDate === day.key} className={selectedDate === day.key ? 'is-selected' : ''} key={day.key} type="button" onClick={() => setSelectedDate(day.key)}><small>{day.label}</small><strong>{day.date}</strong><span>{day.count}</span></button>)}
            </div>
          </section>

          <section className="appointments-board">
            <div className="staff-card appointments-list-card">
              <div className="staff-card__header appointments-list-card__header"><div><p className="staff-card__eyebrow">{currentRole} workspace</p><h2>Appointments</h2></div></div>

              <div className="appointments-filters">
                <label><span className="sr-only">Filter by status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as (typeof statusFilters)[number])}>{statusFilters.map((status) => <option key={status}>{status}</option>)}</select><Icon name="chevronDown" size={14} /></label>
                <label><span className="sr-only">Filter by doctor</span><select value={providerFilter} onChange={(event) => setProviderFilter(event.target.value)}>{providerOptions.map((provider) => <option key={provider}>{provider}</option>)}</select><Icon name="chevronDown" size={14} /></label>
                <StaffListReset onClick={resetListControls} />
                <span className="appointments-result-count">{filteredAppointments.length} shown</span>
              </div>

              {error ? <p className="staff-management-alert" role="alert">{error}</p> : null}
              {loading ? <div className="appointments-empty"><strong>Loading appointments…</strong></div> : null}

              {!loading ? (
                <div className="appointments-table-wrap">
                  <table className="appointments-table"><thead><tr><th scope="col">Patient</th><th scope="col">Visit type</th><th scope="col">Doctor</th><th scope="col">Date</th><th scope="col">Time</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead><tbody>{filteredAppointments.map((appointment) => <tr key={appointment.id}><td className="appointments-patient-cell"><span className={`appointments-patient-avatar appointments-patient-avatar--${appointment.tone}`}>{appointment.initials}</span><span><strong>{appointment.patient}</strong><small>@{appointment.patientUsername} · {appointment.id}</small></span></td><td><strong>{appointment.treatment}</strong><small>{appointment.mode} · {appointment.room}</small></td><td><strong>{appointment.provider}</strong><small>{appointment.doctorId}</small></td><td className="appointments-date-cell"><strong>{formatAppointmentDate(appointment.startAt)}</strong><small>{appointment.dateKey}</small></td><td className="appointments-time-cell"><strong>{appointment.time}</strong><small>{appointment.meridiem}</small></td><td><span className={`appointment-status appointment-status--${appointment.status.toLowerCase().replace(' ', '-')}`}><i />{appointment.status}</span></td><td><button aria-label={`Review ${appointment.patient}'s appointment`} className="appointments-row-action" title="Review appointment" type="button" onClick={() => setSelectedAppointment(appointment)}><Icon name="chevronRight" size={17} /></button></td></tr>)}</tbody></table>{!filteredAppointments.length ? <div className="appointments-empty"><Icon name="calendar" size={25} /><strong>No appointments found</strong><span>Try another date or clear your filters.</span></div> : null}</div>
              ) : null}
            </div>

          </section>
        </div>
      </main>

      {dialogOpen ? (
        <StaffDialog
          className="appointments-dialog"
          closeLabel="Close new appointment form"
          closeOnBackdropClick={false}
          closeDisabled={savingAppointment}
          eyebrow="Appointment management"
          onClose={() => setDialogOpen(false)}
          title="New appointment"
          titleId="new-appointment-title"
        >
          <form onSubmit={submitAppointment}><label className="appointments-combobox-field">Patient<div className="appointments-combobox">{selectedPatient ? <div className="appointments-selected-person"><strong>{selectedPatient.name}</strong><small>@{selectedPatient.username} · {selectedPatient.patientId}</small><button type="button" onClick={() => { setSelectedPatientId(''); setPatientSearch(selectedPatient.name); setPatientDropdownOpen(true) }}>Change</button></div> : <input aria-autocomplete="list" aria-controls="appointment-patient-options" aria-expanded={patientMatches.length > 0} autoComplete="off" placeholder="Type patient name, username, or ID" required role="combobox" value={patientSearch} onChange={(event) => { setPatientSearch(event.target.value); setSelectedPatientId(''); setPatientDropdownOpen(true) }} />}{patientMatches.length > 0 ? <div className="appointments-combobox__options" id="appointment-patient-options" role="listbox">{patientMatches.map((patient) => <button key={patient.id} role="option" type="button" onClick={() => { setPatientSearch(patient.name); setSelectedPatientId(patient.id); setPatientDropdownOpen(false) }}><strong>{patient.name}</strong><small>@{patient.username} · {patient.id}</small></button>)}</div> : null}</div></label><div className="appointments-form-grid"><label className="appointments-date-picker-field">Date<StaffDateFilter emptyLabel="Select date" label="Appointment date" minDate={dateKey(new Date())} selectionMode="single" value={{ start: appointmentDate || null, end: null }} onChange={(value) => { setAppointmentDate(value.start ?? ''); setAppointmentTime(''); setBookingTimeDialogOpen(false); setSelectedProviderId('') }} /></label><label className="appointments-time-field">Booking time<button aria-expanded={bookingTimeDialogOpen} aria-haspopup="dialog" className="appointments-time-trigger" disabled={!appointmentDate} type="button" onClick={() => setBookingTimeDialogOpen(true)}><span>{appointmentTime ? `${appointmentShift === 'morning' ? 'Morning' : 'Night'} · ${appointmentTimeLabel(appointmentTime)}` : 'Select a booking time'}</span><Icon name="chevronDown" size={15} /></button></label></div><div className="appointments-form-grid"><label className="appointments-combobox-field">Doctor<div className="appointments-combobox">{selectedProvider ? <div className="appointments-selected-person"><strong>{selectedProvider.name}</strong><small>Doctor · {selectedProvider.id}</small><button type="button" onClick={() => setSelectedProviderId('')}>Change</button></div> : <select aria-label="Select doctor" disabled={!appointmentDate || !appointmentTime || providerAvailabilityLoading || providerAvailabilityError !== '' || providerDirectory.length === 0} required value={selectedProviderId} onChange={(event) => setSelectedProviderId(event.target.value)}><option value="">{providerAvailabilityLoading ? 'Loading available doctors…' : providerAvailabilityError ? 'Could not load doctors' : (!appointmentDate || !appointmentTime ? 'Choose date and time first' : (providerDirectory.length === 0 ? 'No doctors available' : 'Select an available doctor'))}</option>{providerDirectory.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name}</option>)}</select>}</div></label><label className="appointments-visit-type-field">Visit type<button aria-expanded={visitTypeDialogOpen} aria-haspopup="dialog" className="appointments-time-trigger" type="button" onClick={() => setVisitTypeDialogOpen(true)}><span>{appointmentVisitType || 'Select visit type'}</span><Icon name="chevronDown" size={15} /></button></label></div><label>Notes<textarea placeholder="Add a short note for the care team" rows={3} value={appointmentNotes} onChange={(event) => setAppointmentNotes(event.target.value)} /></label><div className="appointments-dialog__actions"><button className="staff-button staff-button--secondary" disabled={savingAppointment} type="button" onClick={() => setDialogOpen(false)}>Cancel</button><button className="staff-button staff-button--primary" disabled={savingAppointment} type="submit">{savingAppointment ? 'Saving…' : 'Save appointment'}</button></div></form>
        </StaffDialog>
      ) : null}
      {visitTypeDialogOpen ? (
        <StaffDialog
          backdropClassName="appointments-visit-type-backdrop"
          className="appointments-visit-type-dialog"
          closeLabel="Close visit type selector"
          closeOnBackdropClick={false}
          eyebrow="Appointment details"
          onClose={() => setVisitTypeDialogOpen(false)}
          title="Select visit type"
          titleId="appointment-visit-type-title"
        >
          <p className="appointments-action-copy">Choose the service for this appointment.</p>
          <div aria-label="Visit type options" className="appointments-visit-type-options" role="listbox">
            {appointmentVisitTypes.map((type) => <button aria-selected={appointmentVisitType === type} className={appointmentVisitType === type ? 'is-selected' : ''} key={type} role="option" type="button" onClick={() => { setAppointmentVisitType(type); setVisitTypeDialogOpen(false) }}><span><strong>{type}</strong><small>{type === 'General consultation' ? 'Routine care and common symptoms' : type === 'Body check' ? 'Health screening and routine checks' : 'Stress, sleep, mood, or a quiet talk'}</small></span><Icon name="check" size={17} /></button>)}
          </div>
        </StaffDialog>
      ) : null}
      {bookingTimeDialogOpen ? (
        <StaffDialog
          className="appointments-dialog appointments-booking-time-dialog"
          closeLabel="Close booking time picker"
          closeOnBackdropClick={false}
          eyebrow="Appointment timing"
          onClose={() => setBookingTimeDialogOpen(false)}
          title="Choose booking time"
          titleId="appointment-time-title"
        >
          <p className="appointments-time-dialog__date">{appointmentDate ? new Date(`${appointmentDate}T00:00:00`).toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Choose an appointment date first.'}</p>
          <AppointmentTimePicker
            date={appointmentDate}
            dateSelected={Boolean(appointmentDate)}
            shift={appointmentShift}
            value={appointmentTime}
            onChange={(value) => {
              setAppointmentTime(value)
              setSelectedProviderId('')
              setBookingTimeDialogOpen(false)
            }}
            onShiftChange={(shift) => {
              setAppointmentShift(shift)
              setAppointmentTime('')
              setSelectedProviderId('')
            }}
          />
        </StaffDialog>
      ) : null}
      {selectedAppointment ? (
        <StaffDialog
          className="appointments-review-dialog"
          closeLabel="Close appointment review"
          closeOnBackdropClick={false}
          eyebrow="Appointment review"
          onClose={() => setSelectedAppointment(null)}
          title="Appointment details"
          titleId="appointment-review-title"
        >
          <div className="appointments-review-heading">
            <span className={`appointments-patient-avatar appointments-patient-avatar--${selectedAppointment.tone}`}>{selectedAppointment.initials}</span>
            <span><strong>{selectedAppointment.patient}</strong><small>@{selectedAppointment.patientUsername} · {selectedAppointment.id}</small></span>
            <span className={`appointment-status appointment-status--${selectedAppointment.status.toLowerCase().replace(' ', '-')}`}><i />{selectedAppointment.status}</span>
          </div>
          <dl className="staff-detail-grid">
            <div><dt>Appointment ID</dt><dd>{selectedAppointment.id}</dd></div>
            <div><dt>Check-in</dt><dd>{formatCheckInStatus(selectedAppointment.checkInStatus)}</dd></div>
            <div><dt>Date</dt><dd>{formatAppointmentDate(selectedAppointment.startAt)}</dd></div>
            <div><dt>Time</dt><dd>{formatAppointmentTime(selectedAppointment.startAt)} – {formatAppointmentTime(selectedAppointment.endAt)}</dd></div>
            <div><dt>Doctor</dt><dd>{selectedAppointment.provider}</dd></div>
            <div><dt>Doctor ID</dt><dd>{selectedAppointment.doctorId}</dd></div>
            <div className="staff-detail-grid__wide"><dt>Visit type</dt><dd>{selectedAppointment.treatment}</dd></div>
            <div className="staff-detail-grid__wide"><dt>Notes</dt><dd>{selectedAppointment.notes || '—'}</dd></div>
          </dl>
          <div className="appointments-review-actions">
            {canCreate && selectedAppointment.status === 'Confirmed' ? <>
              <button className="staff-button staff-button--secondary" type="button" onClick={() => openReschedule(selectedAppointment)}>Reschedule</button>
              <button className="staff-button appointments-danger-button" type="button" onClick={() => { setCancelTarget(selectedAppointment); setAppointmentActionError(''); setSelectedAppointment(null) }}>Cancel appointment</button>
            </> : null}
            <button className="staff-button staff-button--secondary" type="button" onClick={() => setSelectedAppointment(null)}>Close details</button>
          </div>
        </StaffDialog>
      ) : null}
      {rescheduleTarget ? (
        <StaffDialog
          className="appointments-dialog appointments-reschedule-dialog"
          closeLabel="Close reschedule form"
          closeDisabled={appointmentActionLoading}
          closeOnBackdropClick={false}
          eyebrow="Appointment management"
          onClose={() => setRescheduleTarget(null)}
          title="Reschedule appointment"
          titleId="appointment-reschedule-title"
        >
          <p className="appointments-action-copy">Choose a new time for {rescheduleTarget.patient}. The existing doctor will be checked for availability.</p>
          <label className="appointments-date-picker-field">Date<StaffDateFilter emptyLabel="Select date" label="Rescheduled appointment date" minDate={dateKey(new Date())} selectionMode="single" value={{ start: rescheduleDate || null, end: null }} onChange={(value) => { setRescheduleDate(value.start ?? ''); setRescheduleTime(''); setAppointmentActionError('') }} /></label>
          <AppointmentTimePicker date={rescheduleDate} dateSelected={Boolean(rescheduleDate)} shift={rescheduleShift} value={rescheduleTime} onChange={(value) => { setRescheduleTime(value); setAppointmentActionError('') }} onShiftChange={(shift) => { setRescheduleShift(shift); setRescheduleTime(''); setAppointmentActionError('') }} />
          {appointmentActionError ? <p className="appointments-action-error" role="alert">{appointmentActionError}</p> : null}
          <div className="appointments-dialog__actions"><button className="staff-button staff-button--secondary" disabled={appointmentActionLoading} type="button" onClick={() => setRescheduleTarget(null)}>Keep current time</button><button className="staff-button staff-button--primary" disabled={appointmentActionLoading || !rescheduleDate || !rescheduleTime} type="button" onClick={() => void submitReschedule()}>{appointmentActionLoading ? 'Saving…' : 'Save new time'}</button></div>
        </StaffDialog>
      ) : null}
      {cancelTarget ? (
        <StaffDialog
          className="appointments-dialog appointments-confirm-dialog"
          closeLabel="Close cancellation confirmation"
          closeDisabled={appointmentActionLoading}
          closeOnBackdropClick={false}
          eyebrow="Appointment management"
          onClose={() => setCancelTarget(null)}
          title="Cancel appointment?"
          titleId="appointment-cancel-title"
        >
          <p className="appointments-action-copy">This will cancel {cancelTarget.patient}’s appointment on {formatAppointmentDate(cancelTarget.startAt)} at {formatAppointmentTime(cancelTarget.startAt)}.</p>
          {appointmentActionError ? <p className="appointments-action-error" role="alert">{appointmentActionError}</p> : null}
          <div className="appointments-dialog__actions"><button className="staff-button staff-button--secondary" disabled={appointmentActionLoading} type="button" onClick={() => setCancelTarget(null)}>Keep appointment</button><button className="staff-button appointments-danger-button" disabled={appointmentActionLoading} type="button" onClick={() => void confirmCancelAppointment()}>{appointmentActionLoading ? 'Cancelling…' : 'Cancel appointment'}</button></div>
        </StaffDialog>
      ) : null}
      {notice ? <div aria-live="polite" className="staff-toast"><span><Icon name="check" size={17} /></span>{notice}</div> : null}
    </div>
  )
}
