import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useTheme } from '../../../components/theme/useTheme'
import { Icon, type IconName } from '../navbar/StaffIcon'
import { StaffNavbar } from '../navbar/StaffNavbar'
import { StaffSidebar, type StaffRole } from '../navbar/StaffSidebar'
import '../StaffHomePage.css'
import './SchedulePage.css'

type ScheduleTone = 'teal' | 'blue' | 'amber' | 'violet'
type ScheduleBlock = {
  id: string
  day: string
  start: string
  end: string
  title: string
  provider: string
  room: string
  type: string
  tone: ScheduleTone
  top: number
  height: number
  icon: IconName
}

const weekOptions = ['17–23 Aug 2026', '24–30 Aug 2026', '31 Aug–06 Sep 2026']
const days = [
  { label: 'Mon', date: '17' },
  { label: 'Tue', date: '18' },
  { label: 'Wed', date: '19', today: true },
  { label: 'Thu', date: '20' },
  { label: 'Fri', date: '21' },
  { label: 'Sat', date: '22' },
  { label: 'Sun', date: '23' },
]
const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '01:00', '02:00', '03:00', '04:00', '05:00']
const providers = ['All providers', 'Dr. Maya Chen', 'Dr. Daniel Wong', 'Dr. Aisha Rahman', 'Pharmacy team'] as const

const scheduleBlocks: ScheduleBlock[] = [
  { id: 'SCH-001', day: 'Mon', start: '09:00 AM', end: '12:00 PM', title: 'Consultation hours', provider: 'Dr. Maya Chen', room: 'Room 02', type: 'Appointments', tone: 'teal', top: 58, height: 128, icon: 'calendar' },
  { id: 'SCH-002', day: 'Mon', start: '01:00 PM', end: '04:00 PM', title: 'Follow-up clinic', provider: 'Dr. Daniel Wong', room: 'Room 04', type: 'Appointments', tone: 'blue', top: 258, height: 128, icon: 'calendar' },
  { id: 'SCH-003', day: 'Tue', start: '08:00 AM', end: '11:00 AM', title: 'General consultation', provider: 'Dr. Aisha Rahman', room: 'Room 01', type: 'Appointments', tone: 'violet', top: 8, height: 128, icon: 'calendar' },
  { id: 'SCH-004', day: 'Tue', start: '02:00 PM', end: '05:00 PM', title: 'Open availability', provider: 'Dr. Maya Chen', room: 'Room 02', type: 'Available', tone: 'teal', top: 308, height: 128, icon: 'activity' },
  { id: 'SCH-005', day: 'Wed', start: '09:00 AM', end: '12:00 PM', title: 'Consultation hours', provider: 'Dr. Daniel Wong', room: 'Room 04', type: 'Appointments', tone: 'blue', top: 58, height: 128, icon: 'calendar' },
  { id: 'SCH-006', day: 'Wed', start: '01:00 PM', end: '05:00 PM', title: 'Mental wellness clinic', provider: 'Dr. Aisha Rahman', room: 'Room 01', type: 'Appointments', tone: 'violet', top: 258, height: 178, icon: 'calendar' },
  { id: 'SCH-007', day: 'Thu', start: '09:00 AM', end: '01:00 PM', title: 'Consultation hours', provider: 'Dr. Maya Chen', room: 'Room 02', type: 'Appointments', tone: 'teal', top: 58, height: 178, icon: 'calendar' },
  { id: 'SCH-008', day: 'Thu', start: '02:00 PM', end: '05:00 PM', title: 'Open availability', provider: 'Dr. Daniel Wong', room: 'Room 04', type: 'Available', tone: 'blue', top: 308, height: 128, icon: 'activity' },
  { id: 'SCH-009', day: 'Fri', start: '08:00 AM', end: '12:00 PM', title: 'General consultation', provider: 'Dr. Aisha Rahman', room: 'Room 01', type: 'Appointments', tone: 'violet', top: 8, height: 178, icon: 'calendar' },
  { id: 'SCH-010', day: 'Fri', start: '01:00 PM', end: '04:00 PM', title: 'Follow-up clinic', provider: 'Dr. Maya Chen', room: 'Room 02', type: 'Appointments', tone: 'teal', top: 258, height: 128, icon: 'calendar' },
  { id: 'SCH-011', day: 'Sat', start: '09:00 AM', end: '01:00 PM', title: 'Pharmacy coverage', provider: 'Pharmacy team', room: 'Counter 01', type: 'Coverage', tone: 'amber', top: 58, height: 178, icon: 'box' },
]

const teamAvailability = [
  { name: 'Dr. Maya Chen', role: 'General practitioner', hours: '09:00 AM – 05:00 PM', status: 'Available', tone: 'teal' },
  { name: 'Dr. Daniel Wong', role: 'Family medicine', hours: '09:00 AM – 04:00 PM', status: 'In clinic', tone: 'blue' },
  { name: 'Dr. Aisha Rahman', role: 'Mental wellness', hours: '08:00 AM – 05:00 PM', status: 'Available', tone: 'violet' },
  { name: 'Pharmacy team', role: 'Dispensing counter', hours: '09:00 AM – 06:00 PM', status: 'Busy', tone: 'amber' },
]

export function SchedulePage() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [activeNav, setActiveNav] = useState('Schedules & availability')
  const [selectedRole, setSelectedRole] = useState<StaffRole>('Admin')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [providerFilter, setProviderFilter] = useState<(typeof providers)[number]>('All providers')
  const [weekIndex, setWeekIndex] = useState(0)
  const [view, setView] = useState<'week' | 'list'>('week')
  const [selectedBlock, setSelectedBlock] = useState<ScheduleBlock | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [notice, setNotice] = useState('')

  const announce = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3200)
  }

  const handleRoleChange = (role: StaffRole) => {
    setSelectedRole(role)
    announce(`${role} schedule and availability view is now displayed.`)
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
    if (label === 'Audit & logs') {
      navigate('/staff/audit-logs')
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
    if (label !== 'Schedules & availability') announce(`${label} is ready to connect to your clinic workflow.`)
  }

  const filteredBlocks = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return scheduleBlocks.filter((block) => {
      const matchesProvider = providerFilter === 'All providers' || block.provider === providerFilter
      const matchesSearch = !query || `${block.title} ${block.provider} ${block.room} ${block.type}`.toLowerCase().includes(query)
      return matchesProvider && matchesSearch
    })
  }, [providerFilter, searchTerm])

  const submitAvailability = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setDialogOpen(false)
    announce('Availability block saved to the schedule preview.')
  }

  return (
    <div className="staff-page schedule-page">
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

        <div className="staff-content schedule-content">
          <section className="schedule-hero">
            <div>
              <p className="staff-eyebrow">CarePlus Clinic · Operations</p>
              <h1>Make every hour count.</h1>
              <p className="schedule-hero__copy">Coordinate provider availability, consultation hours, and room coverage across the clinic.</p>
            </div>
            <button className="staff-button staff-button--primary schedule-add-button" type="button" onClick={() => setDialogOpen(true)}><Icon name="plus" size={17} /> Add availability</button>
          </section>

          <section aria-label="Schedule summary" className="schedule-summary">
            <article className="schedule-summary-card schedule-summary-card--teal"><span><Icon name="users" size={18} /></span><small>Available providers</small><strong>14</strong><em>3 more than last week</em></article>
            <article className="schedule-summary-card schedule-summary-card--blue"><span><Icon name="calendar" size={18} /></span><small>Open appointment slots</small><strong>36</strong><em>Across 4 providers</em></article>
            <article className="schedule-summary-card schedule-summary-card--amber"><span><Icon name="activity" size={18} /></span><small>Rooms in use</small><strong>08</strong><em>3 rooms available</em></article>
            <article className="schedule-summary-card schedule-summary-card--violet"><span><Icon name="clock" size={18} /></span><small>Coverage this week</small><strong>92%</strong><em>+4.5% vs last week</em></article>
          </section>

          <section className="schedule-board">
            <div className="staff-card schedule-calendar-card">
              <div className="staff-card__header schedule-calendar-header"><div><p className="staff-card__eyebrow">Weekly schedule</p><h2>Provider availability</h2></div><span className="staff-live-pill"><i /> Live schedule</span></div>
              <div className="schedule-toolbar">
                <div className="schedule-week-picker"><button aria-label="Previous week" type="button" onClick={() => setWeekIndex((current) => Math.max(0, current - 1))}><Icon name="chevronRight" size={16} /></button><strong>{weekOptions[weekIndex]}</strong><button aria-label="Next week" type="button" onClick={() => setWeekIndex((current) => Math.min(weekOptions.length - 1, current + 1))}><Icon name="chevronRight" size={16} /></button></div>
                <label className="schedule-provider-select"><span className="sr-only">Filter by provider</span><select value={providerFilter} onChange={(event) => setProviderFilter(event.target.value as (typeof providers)[number])}>{providers.map((provider) => <option key={provider}>{provider}</option>)}</select><Icon name="chevronDown" size={14} /></label>
                <div className="schedule-view-toggle"><button aria-pressed={view === 'week'} className={view === 'week' ? 'is-selected' : ''} type="button" onClick={() => setView('week')}><Icon name="calendar" size={15} /> Week</button><button aria-pressed={view === 'list'} className={view === 'list' ? 'is-selected' : ''} type="button" onClick={() => setView('list')}><Icon name="activity" size={15} /> List</button></div>
              </div>

              {view === 'week' ? <div className="schedule-calendar-wrap"><div className="schedule-week-head"><span /><div className="schedule-day-heads">{days.map((day) => <div className={day.today ? 'is-today' : ''} key={day.label}><small>{day.label}</small><strong>{day.date}</strong></div>)}</div></div><div className="schedule-week-body"><div className="schedule-time-axis">{timeSlots.map((time) => <span key={time}>{time}</span>)}</div><div className="schedule-day-columns">{days.map((day) => <div className={`schedule-day-column${day.today ? ' is-today' : ''}`} key={day.label}>{timeSlots.map((time) => <i key={time} />)}{filteredBlocks.filter((block) => block.day === day.label).map((block) => <button aria-label={`${block.title}, ${block.provider}, ${block.start} to ${block.end}`} className={`schedule-block schedule-block--${block.tone}`} key={block.id} style={{ height: `${block.height}px`, top: `${block.top}px` }} type="button" onClick={() => setSelectedBlock(block)}><strong>{block.title}</strong><small>{block.provider}</small><span>{block.start} · {block.room}</span></button>)}</div>)}</div></div></div> : <div className="schedule-list">{filteredBlocks.map((block) => <button className="schedule-list-item" key={block.id} type="button" onClick={() => setSelectedBlock(block)}><span className={`schedule-list-icon schedule-list-icon--${block.tone}`}><Icon name={block.icon} size={17} /></span><span><strong>{block.title}</strong><small>{block.provider} · {block.room}</small></span><span className="schedule-list-date"><strong>{block.day}, {block.start}</strong><small>{block.end}</small></span><Icon name="chevronRight" size={17} /></button>)}{!filteredBlocks.length ? <div className="schedule-empty"><Icon name="calendar" size={25} /><strong>No schedule blocks found</strong><span>Try another provider or search term.</span></div> : null}</div>}
            </div>

            <aside className="schedule-side-column">
              <section className="staff-card schedule-side-card"><div className="staff-card__header"><div><p className="staff-card__eyebrow">This week</p><h2>Team availability</h2></div><span className="schedule-side-count">4</span></div><div className="schedule-team-list">{teamAvailability.map((member) => <div className="schedule-team-item" key={member.name}><span className={`schedule-team-avatar schedule-team-avatar--${member.tone}`}>{member.name === 'Pharmacy team' ? 'PH' : member.name.split(' ').map((part) => part[0]).slice(-2).join('')}</span><span><strong>{member.name}</strong><small>{member.role}</small><em>{member.hours}</em></span><i className={`schedule-status-dot schedule-status-dot--${member.status.toLowerCase().replace(' ', '-')}`} title={member.status} /></div>)}</div><button className="staff-text-button schedule-side-link" type="button" onClick={() => announce('Staff availability details opened.')}>View team details <Icon name="arrowUpRight" size={15} /></button></section>
              <section className="staff-card schedule-side-card schedule-room-card"><div className="staff-card__header"><div><p className="staff-card__eyebrow">Today at a glance</p><h2>Room coverage</h2></div><Icon name="activity" size={19} /></div><div className="schedule-room-list"><div><span><strong>Room 01</strong><small>Dr. Aisha Rahman</small></span><em className="is-busy">In use</em></div><div><span><strong>Room 02</strong><small>Dr. Maya Chen</small></span><em className="is-busy">In use</em></div><div><span><strong>Room 03</strong><small>Available now</small></span><em className="is-free">Free</em></div><div><span><strong>Room 04</strong><small>Dr. Daniel Wong</small></span><em className="is-busy">In use</em></div></div></section>
              <section className="staff-card schedule-access-card"><Icon name="shield" size={18} /><span><strong>{selectedRole} access</strong><small>{selectedRole === 'Admin' ? 'You can create and update schedules for the whole clinic.' : 'You can view availability and manage your own working hours.'}</small></span></section>
            </aside>
          </section>
        </div>
      </main>

      {selectedBlock ? <div className="schedule-detail-backdrop" role="presentation" onClick={() => setSelectedBlock(null)}><aside aria-labelledby="schedule-detail-title" aria-modal="true" className="schedule-detail-drawer" role="dialog" onClick={(event) => event.stopPropagation()}><div className="schedule-detail-drawer__header"><div><p className="staff-card__eyebrow">Schedule block</p><h2 id="schedule-detail-title">Availability details</h2></div><button aria-label="Close availability details" type="button" onClick={() => setSelectedBlock(null)}><Icon name="close" size={19} /></button></div><div className={`schedule-detail-banner schedule-detail-banner--${selectedBlock.tone}`}><Icon name={selectedBlock.icon} size={21} /><span><strong>{selectedBlock.title}</strong><small>{selectedBlock.id}</small></span></div><dl className="schedule-detail-list"><div><dt>Provider</dt><dd>{selectedBlock.provider}</dd></div><div><dt>Date</dt><dd>{selectedBlock.day}, {weekOptions[weekIndex]}</dd></div><div><dt>Hours</dt><dd>{selectedBlock.start} – {selectedBlock.end}</dd></div><div><dt>Location</dt><dd>{selectedBlock.room}</dd></div><div><dt>Type</dt><dd>{selectedBlock.type}</dd></div></dl><button className="staff-button staff-button--secondary schedule-detail-close" type="button" onClick={() => setSelectedBlock(null)}>Close details</button></aside></div> : null}
      {dialogOpen ? <div className="schedule-dialog-backdrop" role="presentation" onClick={() => setDialogOpen(false)}><section aria-labelledby="new-availability-title" aria-modal="true" className="schedule-dialog" role="dialog" onClick={(event) => event.stopPropagation()}><div className="schedule-dialog__header"><div><p className="staff-card__eyebrow">Schedule management</p><h2 id="new-availability-title">Add availability</h2></div><button aria-label="Close availability form" type="button" onClick={() => setDialogOpen(false)}><Icon name="close" size={19} /></button></div><form onSubmit={submitAvailability}><label>Provider<select defaultValue="Dr. Maya Chen">{providers.slice(1).map((provider) => <option key={provider}>{provider}</option>)}</select></label><div className="schedule-form-grid"><label>Day<select defaultValue="Wednesday">{days.map((day) => <option key={day.label}>{day.label === 'Wed' ? 'Wednesday' : day.label}</option>)}</select></label><label>Room<select defaultValue="Room 02"><option>Room 01</option><option>Room 02</option><option>Room 03</option><option>Room 04</option></select></label></div><div className="schedule-form-grid"><label>Start time<input required type="time" defaultValue="09:00" /></label><label>End time<input required type="time" defaultValue="12:00" /></label></div><label>Availability type<select defaultValue="Open availability"><option>Open availability</option><option>Consultation hours</option><option>Follow-up clinic</option><option>Blocked time</option></select></label><div className="schedule-dialog__actions"><button className="staff-button staff-button--secondary" type="button" onClick={() => setDialogOpen(false)}>Cancel</button><button className="staff-button staff-button--primary" type="submit">Save availability</button></div></form></section></div> : null}
      {notice ? <div aria-live="polite" className="staff-toast"><span><Icon name="check" size={17} /></span>{notice}</div> : null}
    </div>
  )
}
