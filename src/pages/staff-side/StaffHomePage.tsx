import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/providers/auth-provider'
import { useTheme } from '../../components/theme/useTheme'
import { Icon, type IconName } from './navbar/StaffIcon'
import { StaffSidebar, type StaffRole } from './navbar/StaffSidebar'
import { StaffNavbar } from './navbar/StaffNavbar'
import './StaffHomePage.css'

type OverviewPeriod = 'This week' | 'Last week'
type MetricTone = 'teal' | 'blue' | 'amber' | 'violet'
type ScheduleTone = 'teal' | 'blue' | 'amber' | 'violet'
type ActivityTone = 'teal' | 'blue' | 'amber' | 'violet'

type OverviewMetric = {
  label: string
  value: string
  delta: string
  note: string
  icon: IconName
  tone: MetricTone
}

type ScheduleItem = {
  time: string
  meridiem: string
  patient: string
  detail: string
  doctor: string
  room: string
  tone: ScheduleTone
}

type ActivityItem = {
  title: string
  meta: string
  time: string
  icon: IconName
  tone: ActivityTone
}

type CapacityStat = {
  value: string
  label: string
  tone: 'teal' | 'amber' | 'muted'
}

type RoleOverview = {
  eyebrow: string
  greeting: string
  copy: string
  metrics: OverviewMetric[]
  chartTitle: string
  chartLegend: [string, string]
  chartSeries: Record<OverviewPeriod, number[]>
  chartTotals: Record<OverviewPeriod, string>
  chartChange: string
  scheduleEyebrow: string
  scheduleTitle: string
  schedule: ScheduleItem[]
  activityTitle: string
  activity: ActivityItem[]
  capacity: {
    eyebrow: string
    title: string
    percentage: number
    stats: CapacityStat[]
  }
}

const chartSeries: Record<OverviewPeriod, number[]> = {
  'This week': [84, 128, 102, 146, 119, 158, 138],
  'Last week': [68, 104, 96, 122, 108, 131, 114],
}

const chartLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const metrics: OverviewMetric[] = [
  { label: "Today's appointments", value: '28', delta: '+12.5%', note: 'vs last Wednesday', icon: 'calendar' as IconName, tone: 'teal' },
  { label: 'Expiry item alerts', value: '05', delta: '2 urgent', note: 'within 30 days', icon: 'clock' as IconName, tone: 'blue' },
  { label: 'Low stock alert', value: '07', delta: '3 critical', note: 'need attention', icon: 'box' as IconName, tone: 'amber' },
  { label: 'Monthly revenue', value: 'RM 84,620', delta: '+14.6%', note: 'vs last month', icon: 'chart' as IconName, tone: 'violet' },
]

const todaySchedule: ScheduleItem[] = [
  { time: '09:00', meridiem: 'AM', patient: 'Sofia Tan', detail: 'Follow-up consultation', doctor: 'Dr. Maya Chen', room: 'Room 02', tone: 'teal' },
  { time: '10:30', meridiem: 'AM', patient: 'Amir Hakim', detail: 'General consultation', doctor: 'Dr. Daniel Wong', room: 'Room 04', tone: 'blue' },
  { time: '01:00', meridiem: 'PM', patient: 'Hannah Lee', detail: 'Paediatric check-up', doctor: 'Dr. Maya Chen', room: 'Room 02', tone: 'amber' },
  { time: '02:30', meridiem: 'PM', patient: 'Marcus Lim', detail: 'Video consultation', doctor: 'Dr. Aisha Rahman', room: 'Online', tone: 'violet' },
]

const recentActivity: ActivityItem[] = [
  { title: 'New patient profile created', meta: 'Nadia Ismail · PT-260819-42', time: '8 min ago', icon: 'users' as IconName, tone: 'teal' },
  { title: 'Prescription marked ready', meta: 'RX-260819-018 · Pharmacy queue', time: '24 min ago', icon: 'check' as IconName, tone: 'blue' },
  { title: 'Appointment rescheduled', meta: 'Sofia Tan · Moved to 21 Aug, 11:00 AM', time: '42 min ago', icon: 'calendar' as IconName, tone: 'amber' },
  { title: 'Inventory threshold reached', meta: 'Paracetamol 500mg · 12 packs left', time: '1 hr ago', icon: 'box' as IconName, tone: 'violet' },
]

const roleOverviewData: Record<StaffRole, RoleOverview> = {
  Admin: {
    eyebrow: 'Wednesday, 19 August 2026',
    greeting: 'Good morning, Aina.',
    copy: 'Here’s what’s happening across your clinic today.',
    metrics,
    chartTitle: 'Appointments overview',
    chartLegend: ['Completed visits', 'Scheduled visits'],
    chartSeries,
    chartTotals: { 'This week': '875', 'Last week': '743' },
    chartChange: '17.8%',
    scheduleEyebrow: 'Today · 28 total',
    scheduleTitle: 'Upcoming schedule',
    schedule: todaySchedule,
    activityTitle: 'Recent activity',
    activity: recentActivity,
    capacity: {
      eyebrow: 'Live now',
      title: 'Clinic capacity',
      percentage: 72,
      stats: [
        { value: '12', label: 'In consultation', tone: 'teal' },
        { value: '08', label: 'Waiting', tone: 'amber' },
        { value: '03', label: 'Rooms free', tone: 'muted' },
      ],
    },
  },
  Doctor: {
    eyebrow: 'Wednesday, 19 August 2026',
    greeting: 'Good morning, Dr. Maya.',
    copy: 'Your clinical day is ready. Here is what needs your attention.',
    metrics: [
      { label: "Today's consultations", value: '14', delta: '+3', note: 'vs last Wednesday', icon: 'calendar', tone: 'teal' },
      { label: 'Patients in queue', value: '08', delta: '-2', note: 'since 8:00 AM', icon: 'users', tone: 'blue' },
      { label: 'Prescriptions to review', value: '09', delta: '4 urgent', note: 'before end of day', icon: 'check', tone: 'amber' },
      { label: 'Follow-ups due', value: '06', delta: '+20%', note: 'this week', icon: 'activity', tone: 'violet' },
    ],
    chartTitle: 'Patient load',
    chartLegend: ['Completed consultations', 'Scheduled consultations'],
    chartSeries: { 'This week': [42, 68, 54, 82, 71, 92, 78], 'Last week': [36, 58, 49, 65, 61, 74, 69] },
    chartTotals: { 'This week': '487', 'Last week': '412' },
    chartChange: '18.2%',
    scheduleEyebrow: 'Today · 14 consultations',
    scheduleTitle: 'My schedule',
    schedule: [
      { time: '09:00', meridiem: 'AM', patient: 'Sofia Tan', detail: 'Follow-up consultation', doctor: 'Room 02', room: 'In clinic', tone: 'teal' },
      { time: '10:30', meridiem: 'AM', patient: 'Amir Hakim', detail: 'General consultation', doctor: 'Room 02', room: 'In clinic', tone: 'blue' },
      { time: '01:00', meridiem: 'PM', patient: 'Hannah Lee', detail: 'Paediatric check-up', doctor: 'Room 02', room: 'In clinic', tone: 'amber' },
      { time: '02:30', meridiem: 'PM', patient: 'Marcus Lim', detail: 'Video consultation', doctor: 'Online', room: 'Video', tone: 'violet' },
    ],
    activityTitle: 'Recent clinical activity',
    activity: [
      { title: 'Medical record updated', meta: 'Sofia Tan · Follow-up summary saved', time: '8 min ago', icon: 'shield', tone: 'teal' },
      { title: 'Prescription ready for review', meta: 'RX-260819-018 · Amir Hakim', time: '24 min ago', icon: 'check', tone: 'blue' },
      { title: 'Patient checked in', meta: 'Hannah Lee · Queue Q-008', time: '42 min ago', icon: 'clock', tone: 'amber' },
      { title: 'Follow-up reminder due', meta: 'Marcus Lim · 21 August 2026', time: '1 hr ago', icon: 'calendar', tone: 'violet' },
    ],
    capacity: {
      eyebrow: 'My day',
      title: 'Clinical load',
      percentage: 78,
      stats: [
        { value: '06', label: 'Completed', tone: 'teal' },
        { value: '05', label: 'Upcoming', tone: 'amber' },
        { value: '03', label: 'Open slots', tone: 'muted' },
      ],
    },
  },
  Pharmacist: {
    eyebrow: 'Wednesday, 19 August 2026',
    greeting: 'Good morning, pharmacy team.',
    copy: 'Keep dispensing moving with stock and prescription updates in one place.',
    metrics: [
      { label: 'Prescriptions today', value: '34', delta: '+9', note: 'vs last Wednesday', icon: 'check', tone: 'teal' },
      { label: 'Orders to dispense', value: '22', delta: '6 urgent', note: 'in your queue', icon: 'box', tone: 'blue' },
      { label: 'Low stock items', value: '07', delta: '2 critical', note: 'need attention', icon: 'activity', tone: 'amber' },
      { label: 'Stock value', value: 'RM 42,860', delta: '+4.6%', note: 'this month', icon: 'chart', tone: 'violet' },
    ],
    chartTitle: 'Dispensing volume',
    chartLegend: ['Dispensed', 'Awaiting dispense'],
    chartSeries: { 'This week': [56, 78, 71, 96, 88, 112, 103], 'Last week': [48, 65, 59, 82, 75, 91, 84] },
    chartTotals: { 'This week': '642', 'Last week': '551' },
    chartChange: '16.5%',
    scheduleEyebrow: 'Today · 34 prescriptions',
    scheduleTitle: 'Pharmacy queue',
    schedule: [
      { time: '09:15', meridiem: 'AM', patient: 'Sofia Tan', detail: 'Repeat prescription', doctor: 'Counter 01', room: 'Pickup', tone: 'teal' },
      { time: '10:00', meridiem: 'AM', patient: 'Amir Hakim', detail: 'New prescription', doctor: 'Counter 02', room: 'Preparing', tone: 'blue' },
      { time: '11:30', meridiem: 'AM', patient: 'Nadia Ismail', detail: 'Prescription refill', doctor: 'Counter 01', room: 'Pickup', tone: 'amber' },
      { time: '01:45', meridiem: 'PM', patient: 'Marcus Lim', detail: 'Medicine collection', doctor: 'Counter 02', room: 'Ready', tone: 'violet' },
    ],
    activityTitle: 'Recent pharmacy activity',
    activity: [
      { title: 'Prescription marked ready', meta: 'RX-260819-018 · Pharmacy queue', time: '8 min ago', icon: 'check', tone: 'teal' },
      { title: 'Medicine stock updated', meta: 'Cetirizine 10mg · 48 packs available', time: '24 min ago', icon: 'box', tone: 'blue' },
      { title: 'Low stock threshold reached', meta: 'Paracetamol 500mg · 12 packs left', time: '42 min ago', icon: 'activity', tone: 'amber' },
      { title: 'Dispensing completed', meta: 'Sofia Tan · RX-260819-012', time: '1 hr ago', icon: 'users', tone: 'violet' },
    ],
    capacity: {
      eyebrow: 'Pharmacy floor',
      title: 'Dispensing load',
      percentage: 64,
      stats: [
        { value: '12', label: 'Processing', tone: 'teal' },
        { value: '06', label: 'Waiting pickup', tone: 'amber' },
        { value: '04', label: 'Counters free', tone: 'muted' },
      ],
    },
  },
}

function isStaffRole(value: string | undefined): value is StaffRole {
  return value === 'Admin' || value === 'Doctor' || value === 'Pharmacist'
}

export function StaffHomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [activeNav, setActiveNav] = useState('Overview')
  const [selectedRole, setSelectedRole] = useState<StaffRole>(
    isStaffRole(user?.role) ? user.role : 'Admin',
  )
  const [selectedPeriod, setSelectedPeriod] = useState<OverviewPeriod>('This week')
  const [searchTerm, setSearchTerm] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const overview = roleOverviewData[selectedRole]
  const displayName = user?.name || 'Staff member'

  console.log(user);
  const filteredActivity = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return overview.activity
    return overview.activity.filter((item) => `${item.title} ${item.meta}`.toLowerCase().includes(query))
  }, [overview.activity, searchTerm])

  const chartValues = overview.chartSeries[selectedPeriod]
  const chartPoints = chartValues.map((value, index) => ({
    x: 44 + index * 84,
    y: 194 - (value / 180) * 142,
  }))
  const chartPolyline = chartPoints.map(({ x, y }) => `${x},${y}`).join(' ')
  const chartArea = `M ${chartPoints[0].x} 194 L ${chartPoints.map(({ x, y }) => `${x} ${y}`).join(' L ')} L ${chartPoints[chartPoints.length - 1].x} 194 Z`

  const announce = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3200)
  }

  const handleRoleChange = (role: StaffRole) => {
    setSelectedRole(role)
    setActiveNav('Overview')
    setSearchTerm('')
    setSelectedPeriod('This week')
    announce(`${role} overview and module access are now displayed.`)
  }

  const handleNavigate = (label: string) => {
    if (label === 'Staff') {
      navigate('/staff/staff')
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
    if (label === 'Audit & logs') {
      navigate('/staff/audit-logs')
      return
    }
    if (label === 'Notifications') {
      navigate('/staff/notifications')
      return
    }
    setActiveNav(label)
    if (label !== 'Overview') announce(`${label} is ready to connect to your clinic workflow.`)
  }

  return (
    <div className="staff-page">
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

        <div className="staff-content">
          <section className="staff-hero">
            <div>
              <p className="staff-eyebrow">
                {overview.eyebrow} · {selectedRole}
                {user?.staffId ? ` · ${user.staffId}` : ''}
              </p>
              <h1>Welcome back, {displayName}<span>.</span></h1>
              <p className="staff-hero__copy">{overview.copy}</p>
            </div>
          </section>

          <section aria-label="Clinic metrics" className="staff-metrics">
            {overview.metrics.map((metric) => (
              <article className={`staff-metric-card staff-metric-card--${metric.tone}`} key={metric.label}>
                <div className="staff-metric-card__top"><span className="staff-metric-card__icon"><Icon name={metric.icon} size={19} /></span><button aria-label={`More options for ${metric.label}`} type="button" onClick={() => announce(`${metric.label} options are ready.`)}><Icon name="more" size={20} /></button></div>
                <p>{metric.label}</p>
                <strong>{metric.value}</strong>
                <span className="staff-metric-card__delta"><Icon name="arrowUpRight" size={14} /> {metric.delta} <small>{metric.note}</small></span>
              </article>
            ))}
          </section>

          <div className="staff-primary-grid">
            <section aria-labelledby="appointments-overview" className="staff-card staff-chart-card">
              <div className="staff-card__header">
                <div><p className="staff-card__eyebrow">{selectedRole} performance</p><h2 id="appointments-overview">{overview.chartTitle}</h2></div>
                <label className="staff-select"><span className="sr-only">Overview period</span><select value={selectedPeriod} onChange={(event) => setSelectedPeriod(event.target.value as OverviewPeriod)}><option>This week</option><option>Last week</option></select><Icon name="chevronDown" size={15} /></label>
              </div>
              <div className="staff-chart-summary"><strong>{overview.chartTotals[selectedPeriod]}</strong><span>{overview.chartTitle.toLowerCase()}</span><span className="staff-positive"><Icon name="arrowUpRight" size={14} /> {overview.chartChange}</span></div>
              <div className="staff-chart" role="img" aria-label={`${overview.chartTitle} trend for ${selectedPeriod}`}>
                <svg preserveAspectRatio="none" viewBox="0 0 590 220">
                  <defs><linearGradient id="staff-chart-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#38c7bd" stopOpacity="0.28" /><stop offset="1" stopColor="#38c7bd" stopOpacity="0" /></linearGradient></defs>
                  {[42, 88, 134, 180].map((y) => <line className="staff-chart__gridline" key={y} x1="44" x2="548" y1={y} y2={y} />)}
                  <path d={chartArea} fill="url(#staff-chart-fill)" />
                  <polyline className="staff-chart__line" fill="none" points={chartPolyline} />
                  {chartPoints.map(({ x, y }, index) => <circle className="staff-chart__point" cx={x} cy={y} key={chartLabels[index]} r="4.5" />)}
                  {[42, 88, 134, 180].map((y, index) => <text className="staff-chart__axis" key={y} x="6" y={y + 4}>{[180, 120, 60, 0][index]}</text>)}
                </svg>
                <div className="staff-chart__labels">{chartLabels.map((label) => <span key={label}>{label}</span>)}</div>
              </div>
              <div className="staff-chart__legend"><span><i className="staff-legend-dot staff-legend-dot--teal" />{overview.chartLegend[0]}</span><span><i className="staff-legend-dot staff-legend-dot--muted" />{overview.chartLegend[1]}</span></div>
            </section>

            <section aria-labelledby="today-schedule" className="staff-card staff-schedule-card">
              <div className="staff-card__header"><div><p className="staff-card__eyebrow">{overview.scheduleEyebrow}</p><h2 id="today-schedule">{overview.scheduleTitle}</h2></div><button className="staff-text-button" type="button" onClick={() => announce(`${overview.scheduleTitle} opened.`)}>View calendar <Icon name="arrowUpRight" size={15} /></button></div>
              <div className="staff-schedule-list">
                {overview.schedule.map((item) => (
                  <button className="staff-schedule-item" key={`${item.time}-${item.patient}`} type="button" onClick={() => announce(`${item.patient}'s appointment selected.`)}>
                    <span className="staff-schedule-item__time"><strong>{item.time}</strong><small>{item.meridiem}</small></span>
                    <span className={`staff-schedule-item__marker staff-schedule-item__marker--${item.tone}`} />
                    <span className="staff-schedule-item__details"><strong>{item.patient}</strong><small>{item.detail}</small><span>{item.doctor} · {item.room}</span></span>
                    <Icon name="chevronRight" size={17} />
                  </button>
                ))}
              </div>
            </section>
          </div>

          <div className="staff-bottom-grid">
            <section aria-labelledby="recent-activity" className="staff-card staff-activity-card">
              <div className="staff-card__header"><div><p className="staff-card__eyebrow">Live workspace</p><h2 id="recent-activity">{overview.activityTitle}</h2></div><button className="staff-text-button" type="button" onClick={() => announce('Activity history opened.')}>View all <Icon name="arrowUpRight" size={15} /></button></div>
              <div className="staff-activity-table" role="table">
                <div className="staff-activity-table__head" role="row"><span role="columnheader">Activity</span><span role="columnheader">Time</span><span role="columnheader">Action</span></div>
                {filteredActivity.length ? filteredActivity.map((item) => (
                  <div className="staff-activity-row" key={item.title} role="row">
                    <span className="staff-activity-row__event" role="cell"><i className={`staff-activity-row__icon staff-activity-row__icon--${item.tone}`}><Icon name={item.icon} size={16} /></i><span><strong>{item.title}</strong><small>{item.meta}</small></span></span>
                    <time role="cell">{item.time}</time>
                    <button aria-label={`Open ${item.title}`} role="cell" type="button" onClick={() => announce(`${item.title} details opened.`)}><Icon name="chevronRight" size={17} /></button>
                  </div>
                )) : <div className="staff-empty-state">No activity matches “{searchTerm}”.</div>}
              </div>
            </section>

            <div className="staff-side-stack">
              <section aria-labelledby="clinic-capacity" className="staff-card staff-capacity-card">
                <div className="staff-card__header"><div><p className="staff-card__eyebrow">{overview.capacity.eyebrow}</p><h2 id="clinic-capacity">{overview.capacity.title}</h2></div><span className="staff-live-pill"><i /> Live</span></div>
                <div className="staff-capacity-ring" style={{ background: `conic-gradient(var(--staff-teal) 0 ${overview.capacity.percentage}%, var(--staff-capacity-track) ${overview.capacity.percentage}% 100%)` }}><div><strong>{overview.capacity.percentage}%</strong><small>utilised</small></div></div>
                <div className="staff-capacity-stats">{overview.capacity.stats.map((stat) => <span key={stat.label}><i className={`staff-capacity-dot staff-capacity-dot--${stat.tone}`} /><strong>{stat.value}</strong> {stat.label}</span>)}</div>
              </section>

              <section aria-labelledby="quick-actions" className="staff-card staff-quick-card">
                <div className="staff-card__header"><div><p className="staff-card__eyebrow">Shortcuts</p><h2 id="quick-actions">Quick actions</h2></div></div>
                <div className="staff-quick-actions"><button type="button" onClick={() => announce('Patient registration opened.')}><span className="staff-quick-icon staff-quick-icon--teal"><Icon name="users" size={17} /></span><span><strong>Add patient</strong><small>Create a new profile</small></span><Icon name="chevronRight" size={16} /></button><button type="button" onClick={() => announce('Staff availability opened.')}><span className="staff-quick-icon staff-quick-icon--violet"><Icon name="staff" size={17} /></span><span><strong>Check availability</strong><small>View staff schedules</small></span><Icon name="chevronRight" size={16} /></button></div>
              </section>
            </div>
          </div>
        </div>
      </main>

      {notice ? <div aria-live="polite" className="staff-toast"><span><Icon name="check" size={17} /></span>{notice}</div> : null}
    </div>
  )
}
