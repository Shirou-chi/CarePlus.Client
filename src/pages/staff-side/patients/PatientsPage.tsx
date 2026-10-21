import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../../../components/theme/useTheme'
import { Icon } from '../../navbar/StaffIcon'
import { StaffNavbar } from '../../navbar/StaffNavbar'
import { StaffSidebar, type StaffRole } from '../../navbar/StaffSidebar'
import '../StaffHomePage.css'
import './PatientsPage.css'

type PatientStatus = 'Active' | 'Follow-up due' | 'Inactive'
type Patient = {
  id: string
  name: string
  initials: string
  age: number
  gender: string
  phone: string
  email: string
  lastVisit: string
  nextVisit: string
  visits: string
  condition: string
  status: PatientStatus
  tone: 'teal' | 'blue' | 'amber' | 'violet'
}

const statusFilters = ['All statuses', 'Active', 'Follow-up due', 'Inactive'] as const
const patients: Patient[] = [
  { id: 'PT-260819-42', name: 'Sofia Tan', initials: 'ST', age: 29, gender: 'Female', phone: '+60 12-482 8801', email: 'sofia.tan@email.com', lastVisit: '19 Aug 2026', nextVisit: '—', visits: '12 visits', condition: 'General wellness', status: 'Active', tone: 'teal' },
  { id: 'PT-260819-41', name: 'Ethan Wong', initials: 'EW', age: 42, gender: 'Male', phone: '+60 16-739 2104', email: 'ethan.wong@email.com', lastVisit: '19 Aug 2026', nextVisit: '26 Aug 2026', visits: '08 visits', condition: 'Blood pressure review', status: 'Active', tone: 'blue' },
  { id: 'PT-260819-40', name: 'Amir Hakim', initials: 'AH', age: 35, gender: 'Male', phone: '+60 11-220 4589', email: 'amir.hakim@email.com', lastVisit: '12 Aug 2026', nextVisit: '21 Aug 2026', visits: '06 visits', condition: 'Respiratory follow-up', status: 'Follow-up due', tone: 'amber' },
  { id: 'PT-260819-39', name: 'Nadia Ismail', initials: 'NI', age: 31, gender: 'Female', phone: '+60 17-623 9012', email: 'nadia.ismail@email.com', lastVisit: '19 Aug 2026', nextVisit: '—', visits: '15 visits', condition: 'Mental wellness review', status: 'Active', tone: 'violet' },
  { id: 'PT-260819-38', name: 'Hannah Lee', initials: 'HL', age: 8, gender: 'Female', phone: '+60 13-801 5520', email: 'hannah.lee@email.com', lastVisit: '02 Aug 2026', nextVisit: '28 Aug 2026', visits: '04 visits', condition: 'Paediatric care', status: 'Active', tone: 'teal' },
  { id: 'PT-260819-37', name: 'Marcus Lim', initials: 'ML', age: 54, gender: 'Male', phone: '+60 19-330 7714', email: 'marcus.lim@email.com', lastVisit: '15 Jul 2026', nextVisit: '—', visits: '21 visits', condition: 'Diabetes management', status: 'Follow-up due', tone: 'blue' },
  { id: 'PT-260819-36', name: 'Priya Nair', initials: 'PN', age: 27, gender: 'Female', phone: '+60 18-470 6021', email: 'priya.nair@email.com', lastVisit: '20 Jun 2026', nextVisit: '—', visits: '03 visits', condition: 'Physiotherapy', status: 'Inactive', tone: 'violet' },
]

export function PatientsPage() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [activeNav, setActiveNav] = useState('Patients')
  const [selectedRole, setSelectedRole] = useState<StaffRole>('Admin')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilters)[number]>('All statuses')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
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
    announce('Administrator patient access is now displayed.')
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
    if (label === 'Audit & logs') {
      navigate('/staff/audit-logs')
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
    if (label !== 'Patients') announce(`${label} is ready to connect to your clinic workflow.`)
  }

  const filteredPatients = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return patients.filter((patient) => {
      const matchesQuery = !query || `${patient.name} ${patient.id} ${patient.phone} ${patient.email} ${patient.condition}`.toLowerCase().includes(query)
      const matchesStatus = statusFilter === 'All statuses' || patient.status === statusFilter
      return matchesQuery && matchesStatus
    })
  }, [searchTerm, statusFilter])

  return (
    <div className="staff-page patients-page">
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

        <div className="staff-content patients-content">
          <section className="patients-hero">
            <div>
              <p className="staff-eyebrow">CarePlus Clinic · Patient records</p>
              <h1>Know every patient better.</h1>
              <p className="patients-hero__copy">Keep patient profiles, care history, and follow-up needs organized in one place.</p>
            </div>
            <button className="staff-button staff-button--primary patients-add-button" type="button" onClick={() => announce('New patient form is ready to open.')}><Icon name="plus" size={17} /> Add patient</button>
          </section>

          <section aria-label="Patient summary" className="patients-summary">
            <article className="patients-summary-card patients-summary-card--teal"><span><Icon name="users" size={18} /></span><small>Total patients</small><strong>2,846</strong><em>+5.2% this month</em></article>
            <article className="patients-summary-card patients-summary-card--blue"><span><Icon name="activity" size={18} /></span><small>Active patients</small><strong>2,314</strong><em>81% of patient base</em></article>
            <article className="patients-summary-card patients-summary-card--amber"><span><Icon name="calendar" size={18} /></span><small>Follow-ups due</small><strong>128</strong><em>24 due this week</em></article>
            <article className="patients-summary-card patients-summary-card--violet"><span><Icon name="clock" size={18} /></span><small>New this month</small><strong>64</strong><em>12 since last week</em></article>
          </section>

          <section className="staff-card patients-list-card">
            <div className="staff-card__header patients-list-card__header"><div><p className="staff-card__eyebrow">Patient directory</p><h2>All patients</h2><span className="patients-list-card__description">Search and review patient profiles across the clinic.</span></div><span className="staff-live-pill"><i /> Records synced</span></div>
            <div className="patients-toolbar">
              <label className="patients-search"><Icon name="search" size={16} /><span className="sr-only">Search patients</span><input placeholder="Search name, ID, phone, or condition" type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} /></label>
              <label className="patients-select"><span className="sr-only">Filter by patient status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as (typeof statusFilters)[number])}>{statusFilters.map((filter) => <option key={filter}>{filter}</option>)}</select><Icon name="chevronDown" size={14} /></label>
              <span className="patients-result-count"><strong>{filteredPatients.length}</strong> shown</span>
            </div>
            <div className="patients-table-wrap">
              <table className="patients-table">
                <thead><tr><th scope="col">Patient</th><th scope="col">Contact</th><th scope="col">Care summary</th><th scope="col">Last visit</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Details</span></th></tr></thead>
                <tbody>
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id}>
                      <td><span className={`patients-avatar patients-avatar--${patient.tone}`}>{patient.initials}</span><span><strong>{patient.name}</strong><small>{patient.id} · {patient.age} years · {patient.gender}</small></span></td>
                      <td><span className="patients-contact"><strong>{patient.phone}</strong><small>{patient.email}</small></span></td>
                      <td><span className="patients-care"><strong>{patient.condition}</strong><small>{patient.visits} · Next: {patient.nextVisit}</small></span></td>
                      <td><span className="patients-date"><strong>{patient.lastVisit}</strong><small>Most recent visit</small></span></td>
                      <td><span className={`patient-status patient-status--${patient.status.toLowerCase().replace(' ', '-')}`}><i />{patient.status}</span></td>
                      <td><button aria-label={`View ${patient.name}'s profile`} className="patients-row-action" type="button" onClick={() => setSelectedPatient(patient)}><Icon name="chevronRight" size={17} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filteredPatients.length ? <div className="patients-empty"><Icon name="users" size={25} /><strong>No patients found</strong><span>Try another search or status filter.</span><button type="button" onClick={() => { setSearchTerm(''); setStatusFilter('All statuses') }}>Clear filters</button></div> : null}
            </div>
            <div className="patients-pagination"><span>Showing 1–{filteredPatients.length} of 2,846 patients</span><div><button aria-label="Previous page" disabled type="button"><Icon name="chevronRight" size={15} /></button><button aria-current="page" type="button">1</button><button type="button" onClick={() => announce('Page 2 is ready to load.')}>2</button><button type="button" onClick={() => announce('Page 3 is ready to load.')}>3</button><button aria-label="Next page" type="button" onClick={() => announce('Next patient page is ready to load.')}><Icon name="chevronRight" size={15} /></button></div></div>
          </section>
        </div>
      </main>

      {selectedPatient ? <div className="patient-detail-backdrop" role="presentation" onClick={() => setSelectedPatient(null)}><aside aria-labelledby="patient-detail-title" aria-modal="true" className="patient-detail-drawer" role="dialog" onClick={(event) => event.stopPropagation()}><div className="patient-detail-drawer__header"><div><p className="staff-card__eyebrow">Patient profile</p><h2 id="patient-detail-title">Patient details</h2></div><button aria-label="Close patient details" type="button" onClick={() => setSelectedPatient(null)}><Icon name="close" size={19} /></button></div><div className="patient-profile"><span className={`patients-avatar patients-avatar--${selectedPatient.tone}`}>{selectedPatient.initials}</span><div><strong>{selectedPatient.name}</strong><small>{selectedPatient.id} · {selectedPatient.age} years · {selectedPatient.gender}</small><span className={`patient-status patient-status--${selectedPatient.status.toLowerCase().replace(' ', '-')}`}><i />{selectedPatient.status}</span></div></div><dl className="patient-detail-list"><div><dt>Contact</dt><dd>{selectedPatient.phone}<small>{selectedPatient.email}</small></dd></div><div><dt>Care summary</dt><dd>{selectedPatient.condition}<small>{selectedPatient.visits}</small></dd></div><div><dt>Last visit</dt><dd>{selectedPatient.lastVisit}</dd></div><div><dt>Next visit</dt><dd>{selectedPatient.nextVisit === '—' ? 'No visit scheduled' : selectedPatient.nextVisit}</dd></div></dl><div className="patient-detail-actions"><button className="staff-button staff-button--secondary" type="button" onClick={() => announce('Patient record editing is ready to connect.')}>Edit profile</button><button className="staff-button staff-button--primary" type="button" onClick={() => announce('New appointment form is ready to open.')}>Book appointment</button></div></aside></div> : null}
      {notice ? <div aria-live="polite" className="staff-toast"><span><Icon name="check" size={17} /></span>{notice}</div> : null}
    </div>
  )
}
