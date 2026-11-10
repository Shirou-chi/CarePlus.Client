import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { clinicRoomApi, type ClinicRoomRecord } from '@/services/clinicRoomApi'
import { staffApi, type StaffRecord } from '@/services/staffApi'
import { workScheduleApi, type WorkScheduleRecord, type WorkShift } from '@/services/workScheduleApi'
import { useTheme } from '../../../components/theme/useTheme'
import { StaffDialog } from '../components/StaffDialog'
import { Icon, type IconName } from '../navbar/StaffIcon'
import { StaffNavbar } from '../navbar/StaffNavbar'
import { getStaffRole, StaffSidebar } from '../navbar/StaffSidebar'
import { StaffDateFilter, type StaffDateRange } from '../components/StaffDateFilter'
import { StaffListReset } from '../components/StaffListControls'
import { StaffWeekFilter } from '../components/StaffWeekFilter'
import '../StaffHomePage.css'
import './SchedulePage.css'

type ScheduleTone = 'teal' | 'blue' | 'amber' | 'violet' | 'red'
type ScheduleBlock = {
  id: string
  staffId: string
  workingDate: string
  weekKey: string
  day: string
  title: string
  provider: string
  role: string
  shift: string
  room: string
  roomAssignmentId?: string | null
  roomId?: string | null
  type: string
  tone: ScheduleTone
  shiftTone: ScheduleTone
  startMinutes: number
  endMinutes: number
  top: number
  height: number
  icon: IconName
}

type PositionedScheduleBlock = ScheduleBlock & {
  column: number
  columnCount: number
}

type StaffScheduleRow = {
  staffId: string
  provider: string
  role: string
  tone: ScheduleTone
  schedules: ScheduleBlock[]
}

const timeSlots = Array.from({ length: 24 }, (_, index) => {
  const hour = 6 + index
  const displayHour = hour % 12 || 12
  const meridiem = hour < 12 || hour >= 24 ? 'AM' : 'PM'

  return `${String(displayHour).padStart(2, '0')} ${meridiem}`
})
const scheduleRoleOptions = ['All roles', 'Doctor', 'Pharmacist'] as const
type SchedulableRole = 'Doctor' | 'Pharmacist'

type ScheduleDay = { label: string; date: string; dateKey: string; today: boolean }
type ScheduleForm = { role: SchedulableRole | ''; staffIds: string[]; workingDate: string; shift: WorkShift }

const calendarStartMinutes = 6 * 60
const pixelsPerHour = 30

function dateKey(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function startOfWeek(value: Date) {
  const date = new Date(value)
  const day = date.getDay()
  const difference = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + difference)
  date.setHours(0, 0, 0, 0)
  return date
}

function getDays(weekStart: Date): ScheduleDay[] {
  const todayKey = dateKey(new Date())

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + index)

    return {
      label: date.toLocaleDateString('en-GB', { weekday: 'short' }),
      date: date.toLocaleDateString('en-GB', { day: '2-digit' }),
      dateKey: dateKey(date),
      today: dateKey(date) === todayKey,
    }
  })
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`)
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function getShiftLabel(schedule: WorkScheduleRecord) {
  return schedule.shift || 'Morning'
}

function formatShiftDisplay(shift: string) {
  const isNightShift = shift.toLowerCase() === 'night'
  return `${isNightShift ? 'Night' : 'Morning'} · ${isNightShift ? '06:00 PM – 05:30 AM' : '06:00 AM – 05:30 PM'}`
}

function roleTone(role: string): ScheduleTone {
  if (role === 'Doctor') return 'blue'
  if (role === 'Pharmacist') return 'amber'
  if (role === 'Admin') return 'violet'
  return 'teal'
}

function shiftTone(shift: string, status: string): ScheduleTone {
  if (status === 'Inactive') return 'red'
  return shift.toLowerCase() === 'night' ? 'violet' : 'teal'
}

function isSchedulableRole(role?: string | null) {
  const normalizedRole = role?.trim().toLowerCase()
  return normalizedRole === 'doctor' || normalizedRole === 'pharmacist'
}

function toScheduleBlock(schedule: WorkScheduleRecord): ScheduleBlock {
  const date = new Date(`${schedule.workingDate}T00:00:00`)
  const shift = getShiftLabel(schedule)
  const isNightShift = shift.toLowerCase() === 'night'
  const startMinutes = isNightShift ? 18 * 60 : 6 * 60
  const endMinutes = isNightShift ? 24 * 60 + 5 * 60 + 30 : 17 * 60 + 30
  const duration = Math.max(30, endMinutes - startMinutes)

  return {
    id: schedule.scheduleId,
    staffId: schedule.staffId,
    workingDate: schedule.workingDate,
    weekKey: dateKey(startOfWeek(date)),
    day: date.toLocaleDateString('en-GB', { weekday: 'short' }),
    title: `${schedule.role || 'Staff'} working hours`,
    provider: schedule.staffName || schedule.username || schedule.staffId,
    role: schedule.role || 'Staff',
    shift,
    room: schedule.roomName || 'No room assigned',
    roomAssignmentId: schedule.roomAssignmentId,
    roomId: schedule.roomId,
    type: schedule.status,
    tone: schedule.status === 'Inactive' ? 'red' : roleTone(schedule.role),
    shiftTone: shiftTone(shift, schedule.status),
    startMinutes,
    endMinutes,
    top: Math.max(8, ((startMinutes - calendarStartMinutes) / 60) * pixelsPerHour + 8),
    height: Math.max(42, (duration / 60) * pixelsPerHour - 8),
    icon: schedule.status === 'Active' ? 'calendar' : 'activity',
  }
}

function layoutOverlappingBlocks(blocks: ScheduleBlock[]): PositionedScheduleBlock[] {
  const sortedBlocks = [...blocks].sort((left, right) => (
    left.startMinutes - right.startMinutes || right.endMinutes - left.endMinutes
  ))
  const groups: ScheduleBlock[][] = []
  let currentGroup: ScheduleBlock[] = []
  let currentGroupEnd = -1

  sortedBlocks.forEach((block) => {
    if (currentGroup.length && block.startMinutes >= currentGroupEnd) {
      groups.push(currentGroup)
      currentGroup = []
      currentGroupEnd = -1
    }

    currentGroup.push(block)
    currentGroupEnd = Math.max(currentGroupEnd, block.endMinutes)
  })

  if (currentGroup.length) groups.push(currentGroup)

  return groups.flatMap((group) => {
    const columnEnds: number[] = []
    const positions = new Map<string, number>()

    group.forEach((block) => {
      let column = columnEnds.findIndex((columnEnd) => block.startMinutes >= columnEnd)

      if (column === -1) {
        column = columnEnds.length
        columnEnds.push(block.endMinutes)
      } else {
        columnEnds[column] = block.endMinutes
      }

      positions.set(block.id, column)
    })

    return group.map((block) => ({
      ...block,
      column: positions.get(block.id) ?? 0,
      columnCount: columnEnds.length,
    }))
  })
}

function getDateRange(range: StaffDateRange) {
  if (!range.start) return []

  const start = new Date(`${range.start}T00:00:00`)
  const end = new Date(`${range.end ?? range.start}T00:00:00`)
  const dates: string[] = []

  for (const date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    dates.push(dateKey(date))
  }

  return dates
}

function sortScheduleBlocks(blocks: ScheduleBlock[]) {
  return [...blocks].sort((left, right) => (
    left.workingDate.localeCompare(right.workingDate) || left.startMinutes - right.startMinutes
  ))
}

function StaffScheduleGrid({
  days,
  rows,
  onSelect,
}: {
  days: ScheduleDay[]
  rows: StaffScheduleRow[]
  onSelect: (block: ScheduleBlock) => void
}) {
  return <div className="schedule-staff-view"><div className="schedule-staff-grid"><div className="schedule-staff-row schedule-staff-row--header"><div className="schedule-staff-name">Staff member</div>{days.map((day) => <div className="schedule-staff-day" key={day.dateKey}><small>{day.label}</small><strong>{day.date}</strong></div>)}</div>{rows.map((row) => <div className="schedule-staff-row" key={row.staffId}><div className="schedule-staff-name"><span className={`schedule-team-avatar schedule-team-avatar--${row.tone}`}>{row.provider.split(' ').map((part) => part[0]).slice(-2).join('').toUpperCase()}</span><span><strong>{row.provider}</strong><small>{row.role}</small></span></div>{days.map((day) => { const daySchedules = row.schedules.filter((block) => block.workingDate === day.dateKey); return <div className="schedule-staff-cell" key={day.dateKey}>{daySchedules.length ? daySchedules.map((block) => <button aria-label={`${block.provider}, ${block.shift} shift, ${block.type}`} className={`schedule-staff-slot schedule-staff-slot--${block.shiftTone}`} key={block.id} type="button" onClick={() => onSelect(block)}><strong>{block.shift} shift</strong></button>) : <span className="schedule-staff-cell__empty">—</span>}</div> })}</div>)}{!rows.length ? <div className="schedule-empty"><Icon name="calendar" size={25} /><strong>No schedules found</strong><span>Try another staff member, week, or search term.</span></div> : null}</div></div>
}

export function SchedulePage() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [activeNav] = useState('Schedules & availability')
  const currentRole = getStaffRole(user?.role)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('All roles')
  const [selectedWeekKey, setSelectedWeekKey] = useState(() => dateKey(startOfWeek(new Date())))
  const view = currentRole.toLowerCase() === 'admin' ? 'staff' : 'week'
  const [selectedBlock, setSelectedBlock] = useState<ScheduleBlock | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [schedules, setSchedules] = useState<WorkScheduleRecord[]>([])
  const [staff, setStaff] = useState<StaffRecord[]>([])
  const [rooms, setRooms] = useState<ClinicRoomRecord[]>([])
  const [roomSelection, setRoomSelection] = useState('')
  const [scheduleRoomSelection, setScheduleRoomSelection] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [dialogError, setDialogError] = useState('')
  const [staffErrors, setStaffErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState<ScheduleForm>({ role: '', staffIds: [], workingDate: '', shift: 'Morning' })
  const [scheduleDateRange, setScheduleDateRange] = useState<StaffDateRange>({ start: null, end: null })
  const [notice, setNotice] = useState('')

  const announce = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3200)
  }

  const loadScheduleData = async () => {
    setLoading(true)
    setError('')

    try {
      const [scheduleResult, staffResult, roomResult] = await Promise.allSettled([
        workScheduleApi.retrieveAll(),
        currentRole === 'Admin'
          ? staffApi.retrieveAll()
          : Promise.resolve<StaffRecord[]>([]),
        currentRole === 'Admin'
          ? clinicRoomApi.retrieveAll()
          : Promise.resolve<ClinicRoomRecord[]>([]),
      ])

      if (scheduleResult.status === 'rejected') {
        throw scheduleResult.reason
      }

      setSchedules(scheduleResult.value)
      setStaff(staffResult.status === 'fulfilled' ? staffResult.value.filter((member) => member.status === 'Active' && isSchedulableRole(member.role)) : [])
      setRooms(roomResult.status === 'fulfilled' ? roomResult.value : [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load working schedules.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadScheduleData()
  }, [])

  useEffect(() => {
    setRoomSelection(selectedBlock?.roomId ?? '')
  }, [selectedBlock])

  const scheduleBlocks = useMemo(() => schedules.filter((schedule) => isSchedulableRole(schedule.role)).map(toScheduleBlock), [schedules])
  const currentWeekKey = dateKey(startOfWeek(new Date()))
  const selectedWeekStart = new Date(`${selectedWeekKey}T00:00:00`)
  const days = useMemo(() => getDays(selectedWeekStart), [selectedWeekKey])
  const roles = scheduleRoleOptions
  const selectedStaffMembers = useMemo(
    () => staff.filter((member) => form.role === member.role && form.staffIds.includes(member.staffId)),
    [form.role, form.staffIds, staff],
  )
  const selectedDoctorMembers = useMemo(
    () => form.role === 'Doctor' ? selectedStaffMembers : [],
    [form.role, selectedStaffMembers],
  )

  useEffect(() => {
    if (form.role !== 'Doctor' || selectedDoctorMembers.length !== 1) {
      setScheduleRoomSelection('')
    }
  }, [form.role, selectedDoctorMembers.length])

  const filteredBlocks = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    const rows = scheduleBlocks.filter((block) => {
      const matchesRole = roleFilter === 'All roles' || block.role === roleFilter
      const matchesSearch = !query || `${block.title} ${block.provider} ${block.type} ${block.workingDate}`.toLowerCase().includes(query)
      return block.weekKey === selectedWeekKey && matchesRole && matchesSearch
    })

    return sortScheduleBlocks(rows)
  }, [roleFilter, searchTerm, selectedWeekKey, scheduleBlocks])

  const allFilteredBlocks = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    const rows = scheduleBlocks.filter((block) => {
      const matchesRole = roleFilter === 'All roles' || block.role === roleFilter
      const matchesSearch = !query || `${block.title} ${block.provider} ${block.type} ${block.workingDate}`.toLowerCase().includes(query)
      return matchesRole && matchesSearch
    })

    return sortScheduleBlocks(rows)
  }, [roleFilter, searchTerm, scheduleBlocks])

  const staffScheduleRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    const rows = new Map<string, StaffScheduleRow>()

    staff.filter((member) => member.status === 'Active' && isSchedulableRole(member.role)).forEach((member) => {
      const matchesRole = roleFilter === 'All roles' || member.role === roleFilter
      const matchesSearch = !query || `${member.name} ${member.username} ${member.role}`.toLowerCase().includes(query)

      if (matchesRole && matchesSearch) {
        rows.set(member.staffId, {
          staffId: member.staffId,
          provider: member.name || member.username,
          role: member.role || 'Staff',
          tone: roleTone(member.role),
          schedules: [],
        })
      }
    })

    filteredBlocks.forEach((block) => {
      const row = rows.get(block.staffId)

      if (row) {
        row.schedules.push(block)
        return
      }

      rows.set(block.staffId, {
        staffId: block.staffId,
        provider: block.provider,
        role: block.role || 'Staff',
        tone: block.tone,
        schedules: [block],
      })
    })

    return Array.from(rows.values()).sort((left, right) => left.provider.localeCompare(right.provider))
  }, [filteredBlocks, roleFilter, searchTerm, staff])

  const positionedBlocks = useMemo(
    () => {
      const blocksByDate = new Map<string, ScheduleBlock[]>()

      filteredBlocks.forEach((block) => {
        const blocksForDate = blocksByDate.get(block.workingDate) ?? []
        blocksForDate.push(block)
        blocksByDate.set(block.workingDate, blocksForDate)
      })

      return Array.from(blocksByDate.values()).flatMap((blocks) => layoutOverlappingBlocks(blocks))
    },
    [filteredBlocks],
  )

  const selectedWeekBlocks = scheduleBlocks.filter((block) => block.weekKey === selectedWeekKey)
  const activeScheduleCount = selectedWeekBlocks.filter((block) => block.type === 'Active').length
  const inactiveScheduleCount = selectedWeekBlocks.filter((block) => block.type === 'Inactive').length
  const scheduledProviderCount = new Set(selectedWeekBlocks.map((block) => block.provider)).size
  const shiftAssignmentCount = selectedWeekBlocks.length

  const resetListControls = () => {
    setSearchTerm('')
    setRoleFilter('All roles')
    setSelectedWeekKey(currentWeekKey)
  }

  const openAvailabilityDialog = () => {
    if (currentRole !== 'Admin') {
      announce('Only Admin users can add working schedules.')
      return
    }

    setDialogError('')
    setStaffErrors({})
    setForm({ role: '', staffIds: [], workingDate: '', shift: 'Morning' })
    setScheduleRoomSelection('')
    setScheduleDateRange({ start: null, end: null })
    setDialogOpen(true)
  }

  const selectScheduleRole = (role: SchedulableRole | '') => {
    setForm((current) => ({ ...current, role, staffIds: [] }))
    setScheduleRoomSelection('')
    setStaffErrors({})
  }

  const toggleStaffSelection = (staffId: string) => {
    setStaffErrors((current) => {
      if (!current[staffId]) return current
      const next = { ...current }
      delete next[staffId]
      return next
    })
    setForm((current) => ({
      ...current,
      staffIds: current.role === 'Doctor'
        ? [staffId]
        : current.staffIds.includes(staffId)
          ? current.staffIds.filter((selectedId) => selectedId !== staffId)
          : [...current.staffIds, staffId],
    }))
  }

  const updateScheduleDateRange = (range: StaffDateRange) => {
    setScheduleDateRange(range)
    setForm((current) => ({ ...current, workingDate: range.start ?? '' }))
  }

  const formatStaffErrors = (messages: Record<string, string>) => Object.entries(messages)
    .map(([staffId, message]) => {
      const member = staff.find((item) => item.staffId === staffId)
      return `${member?.name || member?.username || staffId}: ${message}`
    })
    .join('\n')

  const submitAvailability = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setDialogError('')
    setStaffErrors({})

    const workingDates = getDateRange(scheduleDateRange)

    if (!workingDates.length) {
      setDialogError('Choose a working date or date range.')
      return
    }

    if (!form.role) {
      setDialogError('Choose Doctor or Pharmacist first.')
      return
    }

    if (!form.staffIds.length) {
      setDialogError('Select at least one staff member.')
      return
    }

    if (form.role === 'Doctor' && form.staffIds.length !== 1) {
      setDialogError('Select one doctor for a schedule.')
      return
    }

    setSaving(true)

    try {
      if (scheduleRoomSelection) {
        const assignmentsByDate = await Promise.all(
          workingDates.map(async (workingDate) => ({
            workingDate,
            assignments: await clinicRoomApi.retrieveAssignments({ date: workingDate }),
          })),
        )
        const roomConflict = assignmentsByDate.some(({ workingDate, assignments }) => assignments.some((assignment) => (
          assignment.roomId === scheduleRoomSelection
          && assignment.assignmentDate === workingDate
          && assignment.shift.toLowerCase() === form.shift.toLowerCase()
        )))

        if (roomConflict) {
          setDialogError('This room is already assigned for the selected doctor, date, and shift. Choose another room.')
          return
        }
      }

      const latestSchedules = await workScheduleApi.retrieveAll()
      const selectedStaffIdSet = new Set(form.staffIds)
      const activeScheduleDatesByStaff = new Map<string, Set<string>>()

      latestSchedules
        .filter((schedule) => selectedStaffIdSet.has(schedule.staffId) && schedule.status === 'Active')
        .forEach((schedule) => {
          const dates = activeScheduleDatesByStaff.get(schedule.staffId) ?? new Set<string>()
          dates.add(schedule.workingDate)
          activeScheduleDatesByStaff.set(schedule.staffId, dates)
        })

      const createJobs = form.staffIds.flatMap((staffId) => {
        const activeDates = activeScheduleDatesByStaff.get(staffId) ?? new Set<string>()
        return workingDates
          .filter((workingDate) => !activeDates.has(workingDate))
          .map((workingDate) => ({ staffId, workingDate }))
      })
      const requestedCount = form.staffIds.length * workingDates.length
      const skippedCount = requestedCount - createJobs.length
      const initialStaffErrors: Record<string, string> = {}

      form.staffIds.forEach((staffId) => {
        const activeDates = activeScheduleDatesByStaff.get(staffId) ?? new Set<string>()
        if (!workingDates.some((workingDate) => !activeDates.has(workingDate))) {
          initialStaffErrors[staffId] = 'All selected dates already have an active schedule.'
        }
      })

      if (!createJobs.length) {
        setStaffErrors(initialStaffErrors)
        setDialogError(formatStaffErrors(initialStaffErrors) || 'All selected staff already have an active schedule on the selected dates.')
        return
      }

      let roomAssigned = false
      let createdCount = 0
      const requestStaffErrors: Record<string, string> = {}
      for (const job of createJobs) {
        try {
          const createdSchedule = await workScheduleApi.create({
            staffId: job.staffId,
            workingDate: job.workingDate,
            shift: form.shift,
          })
          createdCount += 1

          if (scheduleRoomSelection && selectedDoctorMembers.length === 1 && job.staffId === selectedDoctorMembers[0].staffId) {
            await clinicRoomApi.assign({ scheduleId: createdSchedule.scheduleId, roomId: scheduleRoomSelection })
            roomAssigned = true
          }
        } catch (jobError) {
          const message = jobError instanceof Error ? jobError.message : 'Unable to create this schedule.'
          const dateMessage = `${formatDate(job.workingDate)}: ${message}`
          requestStaffErrors[job.staffId] = requestStaffErrors[job.staffId]
            ? `${requestStaffErrors[job.staffId]}\n${dateMessage}`
            : dateMessage
        }
      }

      const allStaffErrors = { ...initialStaffErrors, ...requestStaffErrors }
      if (Object.keys(allStaffErrors).length) {
        setStaffErrors(allStaffErrors)
        setDialogError(formatStaffErrors(allStaffErrors))
        await loadScheduleData()
        announce(`${createdCount} schedule${createdCount === 1 ? '' : 's'} created. Some staff could not be saved.`)
        return
      }

      setDialogOpen(false)
      await loadScheduleData()
      announce(`${createdCount} working schedule${createdCount === 1 ? '' : 's'} created${skippedCount ? `, ${skippedCount} already existed` : ''}${roomAssigned ? ' and room assigned' : ''}.`)
    } catch (saveError) {
      setDialogError(saveError instanceof Error ? saveError.message : 'Unable to create working schedule.')
    } finally {
      setSaving(false)
    }
  }

  const toggleScheduleStatus = async () => {
    if (!selectedBlock) return

    setSaving(true)

    try {
      await workScheduleApi.update({
        scheduleId: selectedBlock.id,
        status: selectedBlock.type === 'Active' ? 'Inactive' : 'Active',
      })
      setSelectedBlock(null)
      await loadScheduleData()
      announce(`Schedule marked ${selectedBlock.type === 'Active' ? 'inactive' : 'active'}.`)
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update working schedule.')
    } finally {
      setSaving(false)
    }
  }

  const saveRoomAssignment = async () => {
    if (!selectedBlock || selectedBlock.role !== 'Doctor' || currentRole !== 'Admin') return

    setSaving(true)
    setError('')

    try {
      if (!roomSelection && selectedBlock.roomAssignmentId) {
        await clinicRoomApi.removeAssignment(selectedBlock.roomAssignmentId)
        announce('Clinic room assignment removed.')
      } else if (roomSelection) {
        await clinicRoomApi.assign({ scheduleId: selectedBlock.id, roomId: roomSelection })
        announce('Clinic room assignment saved.')
      }

      setSelectedBlock(null)
      await loadScheduleData()
    } catch (assignmentError) {
      setError(assignmentError instanceof Error ? assignmentError.message : 'Unable to save clinic room assignment.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="staff-page schedule-page">
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

        <div className="staff-content schedule-content">
          <section className="schedule-hero">
            <div>
              <p className="staff-eyebrow">CarePlus Clinic · Operations</p>
              <h1>Make every hour count.</h1>
              <p className="schedule-hero__copy">Coordinate provider availability, consultation hours, and room coverage across the clinic.</p>
            </div>
            {currentRole === 'Admin' ? <button className="staff-button staff-button--primary schedule-add-button" type="button" onClick={openAvailabilityDialog}><Icon name="plus" size={17} /> Add availability</button> : null}
          </section>

          <section aria-label="Schedule summary" className="schedule-summary">
            <article className="schedule-summary-card schedule-summary-card--teal"><span><Icon name="users" size={18} /></span><small>Scheduled providers</small><strong>{scheduledProviderCount}</strong><em>From backend records</em></article>
            <article className="schedule-summary-card schedule-summary-card--blue"><span><Icon name="calendar" size={18} /></span><small>Active schedules</small><strong>{activeScheduleCount}</strong><em>For this week</em></article>
            <article className="schedule-summary-card schedule-summary-card--amber"><span><Icon name="activity" size={18} /></span><small>Inactive schedules</small><strong>{inactiveScheduleCount}</strong><em>For this week</em></article>
            <article className="schedule-summary-card schedule-summary-card--violet"><span><Icon name="clock" size={18} /></span><small>Shift assignments</small><strong>{shiftAssignmentCount}</strong><em>Across this week</em></article>
          </section>

          {error ? <div className="schedule-alert" role="alert"><strong>Unable to load working schedules</strong><span>{error}</span><button type="button" onClick={() => void loadScheduleData()}>Try again</button></div> : null}

          <section className="schedule-board">
            <div className="staff-card schedule-calendar-card">
              <div className="staff-card__header schedule-calendar-header"><div><p className="staff-card__eyebrow">Weekly schedule</p><h2>Provider availability</h2></div></div>
              <div className="schedule-toolbar">
                <StaffWeekFilter value={selectedWeekKey} onChange={setSelectedWeekKey} />
                {currentRole === 'Admin' ? <>
                  <label className="schedule-role-select"><span className="sr-only">Filter by role</span><select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>{roles.map((role) => <option key={role}>{role}</option>)}</select><Icon name="chevronDown" size={14} /></label>
                  <StaffListReset onClick={resetListControls} />
                </> : null}
              </div>

              {loading ? <div className="schedule-empty schedule-empty--compact"><Icon name="calendar" size={25} /><strong>Loading schedules…</strong></div> : view === 'staff' ? <StaffScheduleGrid days={days} rows={staffScheduleRows} onSelect={setSelectedBlock} /> : view === 'week' ? <div className="schedule-calendar-wrap"><div className="schedule-week-head"><span /><div className="schedule-day-heads">{days.map((day) => <div className={day.today ? 'is-today' : ''} key={day.label}><small>{day.label}</small><strong>{day.date}</strong></div>)}</div></div><div className="schedule-week-body"><div className="schedule-time-axis">{timeSlots.map((time) => <span key={time}>{time}</span>)}</div><div className="schedule-day-columns">{days.map((day) => <div className={`schedule-day-column${day.today ? ' is-today' : ''}`} key={day.label}>{timeSlots.map((time) => <i key={time} />)}{positionedBlocks.filter((block) => block.workingDate === day.dateKey).map((block) => <button aria-label={`${block.title}, ${block.provider}, ${block.shift} shift`} className={`schedule-block schedule-block--${block.shiftTone}`} key={block.id} style={{ height: `${block.height}px`, top: `${block.top}px`, left: `calc(${block.column} * (100% / ${block.columnCount}) + 4px)`, width: `calc(100% / ${block.columnCount} - 8px)`, right: 'auto' }} type="button" onClick={() => setSelectedBlock(block)}><strong>{block.title}</strong><small>{block.provider}</small><span>{block.shift} shift · {block.room}</span></button>)}</div>)}</div></div></div> : <div className="schedule-list"><div className="schedule-list__summary"><div><strong>All schedule records</strong><span>Every schedule returned by the clinic API</span></div><em>{allFilteredBlocks.length} shown</em></div>{allFilteredBlocks.map((block) => <button className="schedule-list-item" key={block.id} type="button" onClick={() => setSelectedBlock(block)}><span className={`schedule-list-icon schedule-list-icon--${block.tone}`}><Icon name={block.icon} size={17} /></span><span><strong>{block.provider}</strong><small>{block.role || 'Staff'} · {block.shift} shift</small></span><span className="schedule-list-date"><strong>{formatDate(block.workingDate)}</strong><small>{block.shift} shift</small></span><span className={`schedule-list-status schedule-list-status--${block.type.toLowerCase()}`}>{block.type}</span><Icon name="chevronRight" size={17} /></button>)}{!allFilteredBlocks.length ? <div className="schedule-empty"><Icon name="calendar" size={25} /><strong>No schedule blocks found</strong><span>Try another provider or search term.</span></div> : null}</div>}
            </div>

          </section>
        </div>
      </main>

      {selectedBlock ? (
        <div className="schedule-detail-backdrop" role="presentation" onClick={() => setSelectedBlock(null)}>
          <aside aria-labelledby="schedule-detail-title" aria-modal="true" className="schedule-detail-drawer" role="dialog" onClick={(event) => event.stopPropagation()}>
            <div className="schedule-detail-drawer__header">
              <div><p className="staff-card__eyebrow">Schedule record</p><h2 id="schedule-detail-title">Working hours</h2></div>
              <button aria-label="Close availability details" type="button" onClick={() => setSelectedBlock(null)} disabled={saving}><Icon name="close" size={19} /></button>
            </div>
            <div className={`schedule-detail-banner schedule-detail-banner--${selectedBlock.tone}`}><Icon name={selectedBlock.icon} size={21} /><span><strong>{selectedBlock.provider}</strong><small>{selectedBlock.id}</small></span></div>
            <dl className="schedule-detail-list">
              <div><dt>Staff member</dt><dd>{selectedBlock.provider}</dd></div>
              <div><dt>Date</dt><dd>{formatDate(selectedBlock.workingDate)}</dd></div>
              <div><dt>Working hours</dt><dd>{formatShiftDisplay(selectedBlock.shift)}</dd></div>
              <div><dt>Clinic room</dt><dd>{selectedBlock.room}</dd></div>
              <div><dt>Schedule ID</dt><dd>{selectedBlock.id}</dd></div>
              <div><dt>Status</dt><dd>{selectedBlock.type}</dd></div>
            </dl>
            {currentRole === 'Admin' && selectedBlock.role === 'Doctor' ? <div className="schedule-room-assignment"><label>Assign clinic room<select value={roomSelection} onChange={(event) => setRoomSelection(event.target.value)} disabled={saving}><option value="">No room assigned</option>{rooms.filter((room) => room.status.toLowerCase() === 'available' || room.roomId === selectedBlock.roomId).map((room) => <option key={room.roomId} value={room.roomId}>{room.roomName}{room.status.toLowerCase() === 'available' ? '' : ` · ${room.status}`}</option>)}</select></label><button className="staff-button staff-button--secondary" type="button" onClick={() => void saveRoomAssignment()} disabled={saving || roomSelection === (selectedBlock.roomId ?? '')}>{saving ? 'Saving…' : selectedBlock.roomAssignmentId && !roomSelection ? 'Remove room' : 'Save room'}</button></div> : null}
            <div className={`schedule-detail-actions${currentRole === 'Admin' ? '' : ' schedule-detail-actions--single'}`}>
              {currentRole === 'Admin' ? <button className="staff-button staff-button--secondary" type="button" onClick={() => void toggleScheduleStatus()} disabled={saving}>{saving ? 'Saving…' : selectedBlock.type === 'Active' ? 'Set inactive' : 'Set active'}</button> : null}
              <button className="staff-button staff-button--secondary schedule-detail-close" type="button" onClick={() => setSelectedBlock(null)} disabled={saving}>Close details</button>
            </div>
          </aside>
        </div>
      ) : null}
      {dialogOpen ? (
        <StaffDialog
          className="schedule-dialog"
          closeDisabled={saving}
          closeLabel="Close availability form"
          closeOnBackdropClick={false}
          eyebrow="Schedule management"
          onClose={() => setDialogOpen(false)}
          title="Add working schedule"
          titleId="new-availability-title"
        >
          {dialogError ? <p className="schedule-dialog-alert" role="alert">{dialogError}</p> : null}
          <form onSubmit={submitAvailability}>
            <label>Staff role<select required value={form.role} onChange={(event) => selectScheduleRole(event.target.value as SchedulableRole | '')} disabled={saving}>
              <option value="">Choose Doctor or Pharmacist</option>
              <option value="Doctor">Doctor</option>
              <option value="Pharmacist">Pharmacist</option>
            </select></label>
            {form.role ? <fieldset className="schedule-staff-picker" disabled={saving}>
              <legend>{form.role} {form.role === 'Doctor' ? 'member' : 'members'} <span>{form.staffIds.length} selected</span></legend>
              <div className="schedule-staff-picker__list">
                {staff.filter((member) => member.role === form.role).map((member) => {
                  const selected = form.staffIds.includes(member.staffId)
                  return <label className={`schedule-staff-picker__option${selected ? ' is-selected' : ''}`} key={member.staffId}>
                    <input checked={selected} name={form.role === 'Doctor' ? 'schedule-doctor' : undefined} onChange={() => toggleStaffSelection(member.staffId)} type={form.role === 'Doctor' ? 'radio' : 'checkbox'} />
                    <span><strong>{member.name || member.username}</strong><small>{member.role} · {member.staffId}</small></span>
                  </label>
                })}
              </div>
              <small className="schedule-staff-picker__hint">{form.role === 'Doctor' ? 'Select one doctor for this schedule.' : 'Select one or more pharmacists for the same date and shift.'}</small>
            </fieldset> : <p className="schedule-staff-picker__empty">Choose a role to show the available staff list.</p>}
            <div className="schedule-form-grid">
              <label>Working date or range<StaffDateFilter disabled={saving} label="Choose working date or date range" value={scheduleDateRange} onChange={updateScheduleDateRange} /></label>
              <label>Working hours<select required value={form.shift} onChange={(event) => setForm((current) => ({ ...current, shift: event.target.value as WorkShift }))} disabled={saving}><option value="Morning">Morning · 06:00 AM – 05:30 PM</option><option value="Night">Night · 06:00 PM – 05:30 AM</option></select></label>
            </div>
            {form.role === 'Doctor' && selectedDoctorMembers.length === 1 ? <div className="schedule-dialog-room-field">
              <label>Clinic room <select value={scheduleRoomSelection} onChange={(event) => setScheduleRoomSelection(event.target.value)} disabled={saving || selectedDoctorMembers.length !== 1}>
                <option value="">No room assigned</option>
                {rooms.filter((room) => room.status.toLowerCase() === 'available').map((room) => <option key={room.roomId} value={room.roomId}>{room.roomName} · {room.roomId}</option>)}
              </select></label>
              <small>Optional. The room is checked for date and shift conflicts before the schedule is saved.</small>
            </div> : null}
            <div className="schedule-dialog__actions"><button className="staff-button staff-button--secondary" type="button" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</button><button className="staff-button staff-button--primary" disabled={saving || !staff.length} type="submit">{saving ? 'Saving…' : 'Save schedule'}</button></div>
          </form>
        </StaffDialog>
      ) : null}
      {notice ? <div aria-live="polite" className="staff-toast"><span><Icon name="check" size={17} /></span>{notice}</div> : null}
    </div>
  )
}
