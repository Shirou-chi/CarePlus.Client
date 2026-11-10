import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { patientApi, type PatientRecord } from '@/services/patientApi'
import { useTheme } from '../../../components/theme/useTheme'
import { Icon } from '../navbar/StaffIcon'
import { StaffNavbar } from '../navbar/StaffNavbar'
import { getStaffRole, StaffSidebar } from '../navbar/StaffSidebar'
import { StaffDialog } from '../components/StaffDialog'
import { StaffListReset, StaffListSort } from '../components/StaffListControls'
import '../StaffHomePage.css'
import './PatientsPage.css'

const statusFilters = ['All statuses', 'Active', 'Inactive', 'Suspended'] as const
type StatusFilter = (typeof statusFilters)[number]
const sortOptions = ['Name A–Z', 'Name Z–A', 'Patient ID', 'Date of birth'] as const
type SortOption = (typeof sortOptions)[number]
type AvatarTone = 'teal' | 'blue' | 'amber' | 'violet'

type PatientRow = PatientRecord & {
  age: number | null
  dateOfBirthLabel: string
  initials: string
  tone: AvatarTone
}

const avatarTones: AvatarTone[] = ['teal', 'blue', 'amber', 'violet']

function getInitials(name: string, username: string) {
  const source = name.trim() || username.trim() || 'Patient'
  const parts = source.split(/\s+/).filter(Boolean)

  return parts.length > 1
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : source.slice(0, 2).toUpperCase()
}

function formatDate(value?: string | null) {
  if (!value) return '-'

  const date = parseDateOnly(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function parseDateOnly(value: string) {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)

  if (year && month && day) {
    return new Date(year, month - 1, day)
  }

  return new Date(value)
}

function calculateAge(value?: string | null) {
  if (!value) return null

  const dateOfBirth = parseDateOnly(value)
  if (Number.isNaN(dateOfBirth.getTime())) return null

  const today = new Date()
  let age = today.getFullYear() - dateOfBirth.getFullYear()
  const monthDifference = today.getMonth() - dateOfBirth.getMonth()

  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < dateOfBirth.getDate())) {
    age -= 1
  }

  return age >= 0 ? age : null
}

function normalizeStatus(status: string | null | undefined): string {
  const value = status?.trim()
  if (!value) return 'Unknown'

  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

function statusClass(status: string) {
  return status.toLowerCase().replace(/\s+/g, '-')
}

function toPatientRow(patient: PatientRecord, index: number): PatientRow {
  return {
    ...patient,
    name: patient.name || '-',
    username: patient.username || '-',
    email: patient.email || '-',
    phone: patient.phone || '-',
    gender: patient.gender || '-',
    status: normalizeStatus(patient.status),
    age: calculateAge(patient.dateOfBirth),
    dateOfBirthLabel: formatDate(patient.dateOfBirth),
    initials: getInitials(patient.name, patient.username),
    tone: avatarTones[index % avatarTones.length],
  }
}

function matchesStatus(patientStatus: string, filter: StatusFilter) {
  return filter === 'All statuses' || patientStatus.toLowerCase() === filter.toLowerCase()
}

export function PatientsPage() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [activeNav] = useState('Patients')
  const currentRole = getStaffRole(user?.role)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All statuses')
  const [sortOption, setSortOption] = useState<SortOption>('Name A–Z')
  const [patients, setPatients] = useState<PatientRow[]>([])
  const [selectedPatient, setSelectedPatient] = useState<PatientRow | null>(null)
  const [modalMode, setModalMode] = useState<'view' | 'edit' | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const announce = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3200)
  }

  const openView = (patient: PatientRow) => {
    setSelectedPatient(patient)
    setModalMode('view')
  }

  const openEdit = (patient: PatientRow) => {
    setSelectedPatient(patient)
    setModalMode('edit')
  }

  const closePatientModal = () => {
    setModalMode(null)
    setSelectedPatient(null)
  }

  const loadPatients = async () => {
    setLoading(true)
    setError('')

    try {
      const records = await patientApi.retrieveAll()
      setPatients(records.map(toPatientRow))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load patient records.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPatients()
  }, [])

  const filteredPatients = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    const rows = patients.filter((patient) => {
      const searchableText = [
        patient.patientId,
        patient.username,
        patient.name,
        patient.email,
        patient.phone,
        patient.gender,
        patient.address,
        patient.status,
      ].join(' ').toLowerCase()

      return (!query || searchableText.includes(query)) && matchesStatus(patient.status, statusFilter)
    })

    return rows.sort((left, right) => {
      switch (sortOption) {
        case 'Name Z–A':
          return right.name.localeCompare(left.name)
        case 'Patient ID':
          return left.patientId.localeCompare(right.patientId)
        case 'Date of birth':
          return (left.dateOfBirth ?? '9999-12-31').localeCompare(right.dateOfBirth ?? '9999-12-31')
        case 'Name A–Z':
        default:
          return left.name.localeCompare(right.name)
      }
    })
  }, [patients, searchTerm, sortOption, statusFilter])

  const resetListControls = () => {
    setSearchTerm('')
    setStatusFilter('All statuses')
    setSortOption('Name A–Z')
  }

  const activeCount = patients.filter((patient) => patient.status.toLowerCase() === 'active').length
  const maleCount = patients.filter((patient) => patient.gender.toLowerCase() === 'male').length
  const femaleCount = patients.filter((patient) => patient.gender.toLowerCase() === 'female').length

  return (
    <div className="staff-page patients-page">
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

        <div className="staff-content patients-content">
          <section className="patients-hero">
            <div>
              <p className="staff-eyebrow">CarePlus Clinic · Patient management</p>
              <h1>Manage your patients.</h1>
              <p className="patients-hero__copy">Review patient accounts, contact details, demographics, and access status from one directory.</p>
            </div>
          </section>

          <section aria-label="Patient summary" className="patients-summary">
            <article className="patients-summary-card patients-summary-card--teal"><span><Icon name="users" size={18} /></span><small>Total patients</small><strong>{patients.length}</strong><em>Registered accounts</em></article>
            <article className="patients-summary-card patients-summary-card--blue"><span><Icon name="activity" size={18} /></span><small>Active patients</small><strong>{activeCount}</strong><em>Can access the portal</em></article>
            <article className="patients-summary-card patients-summary-card--amber"><span><Icon name="users" size={18} /></span><small>Male patients</small><strong>{maleCount}</strong><em>From profile details</em></article>
            <article className="patients-summary-card patients-summary-card--violet"><span><Icon name="users" size={18} /></span><small>Female patients</small><strong>{femaleCount}</strong><em>From profile details</em></article>
          </section>

          <section className="staff-card patients-list-card">
            <div className="staff-card__header patients-list-card__header"><div><p className="staff-card__eyebrow">Patient directory</p><h2>All patient accounts</h2></div></div>
            <div className="patients-toolbar">
              <label className="patients-search"><Icon name="search" size={16} /><span className="sr-only">Search patients</span><input placeholder="Search name, username, email, or phone" type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} /></label>
              <label className="patients-select"><span className="sr-only">Filter by patient status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>{statusFilters.map((filter) => <option key={filter}>{filter}</option>)}</select><Icon name="chevronDown" size={14} /></label>
              <StaffListSort label="Sort patients" options={sortOptions} value={sortOption} onChange={(value) => setSortOption(value as SortOption)} />
              <StaffListReset onClick={resetListControls} />
              <span className="patients-result-count"><strong>{filteredPatients.length}</strong> shown</span>
            </div>
            {error ? <div className="patients-error" role="alert"><strong>Unable to load patient records</strong><span>{error}</span><button type="button" onClick={() => void loadPatients()}>Try again</button></div> : null}
            <div className="patients-table-wrap">
              {loading ? <div className="patients-empty"><Icon name="activity" size={25} /><strong>Loading patient records</strong><span>Getting the latest profiles from the clinic API.</span></div> : null}
              {!loading && !error && filteredPatients.length ? (
                <table className="patients-table">
                  <thead><tr><th scope="col">Patient</th><th scope="col">Contact</th><th scope="col">Profile</th><th scope="col">Demographics</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Details</span></th></tr></thead>
                  <tbody>
                    {filteredPatients.map((patient) => (
                      <tr key={patient.patientId || patient.userId}>
                        <td><span className={`patients-avatar patients-avatar--${patient.tone}`}>{patient.initials}</span><span><strong>{patient.name}</strong><small>{patient.patientId || `User ${patient.userId}`}</small></span></td>
                        <td><span className="patients-contact"><strong>{patient.email}</strong><small>{patient.phone}</small></span></td>
                        <td><span className="patients-care"><strong>@{patient.username}</strong><small>User ID: {patient.userId}</small></span></td>
                        <td><span className="patients-date"><strong>{patient.gender}</strong><small>{patient.age === null ? 'Age -' : `${patient.age} years`} · DOB {patient.dateOfBirthLabel}</small></span></td>
                        <td><span className={`patient-status patient-status--${statusClass(patient.status)}`}><i />{patient.status}</span></td>
                        <td><div className="patients-actions"><button aria-label={`View ${patient.name}'s profile`} className="patients-view" type="button" onClick={() => openView(patient)}><Icon name="eye" size={15} /> View</button><button aria-label={`Edit ${patient.name}'s profile`} className="patients-edit" type="button" onClick={() => openEdit(patient)}><Icon name="edit" size={15} /> Edit</button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}
              {!loading && !error && !filteredPatients.length ? <div className="patients-empty"><Icon name="users" size={25} /><strong>{patients.length ? 'No patients found' : 'No patient records available'}</strong><span>{patients.length ? 'Try another search or status filter.' : 'Patient accounts will appear here after they are registered.'}</span>{patients.length ? <button type="button" onClick={resetListControls}>Clear filters</button> : null}</div> : null}
            </div>
            {!loading && !error && patients.length ? <div className="patients-pagination"><span>Showing {filteredPatients.length} of {patients.length} patient records</span></div> : null}
          </section>
        </div>
      </main>

      {selectedPatient && modalMode === 'view' ? <StaffDialog className="patient-dialog--view" closeLabel="Close patient profile" closeOnBackdropClick={false} eyebrow="Patient profile" onClose={closePatientModal} title={selectedPatient.name} titleId="patient-view-title"><div className="patient-dialog-profile-heading"><span className={`patients-avatar patients-avatar--${selectedPatient.tone}`}>{selectedPatient.initials}</span><span><strong>{selectedPatient.patientId || `User ${selectedPatient.userId}`}</strong><small>{selectedPatient.status} account</small></span></div><dl className="staff-detail-grid"><div><dt>Patient ID</dt><dd>{selectedPatient.patientId || '-'}</dd></div><div><dt>Username</dt><dd>@{selectedPatient.username}</dd></div><div><dt>Email</dt><dd>{selectedPatient.email}</dd></div><div><dt>Phone</dt><dd>{selectedPatient.phone}</dd></div><div><dt>Gender</dt><dd>{selectedPatient.gender}</dd></div><div><dt>Date of birth</dt><dd>{selectedPatient.dateOfBirthLabel}{selectedPatient.age === null ? '' : ` · ${selectedPatient.age} years old`}</dd></div><div className="staff-detail-grid__wide"><dt>Address</dt><dd>{selectedPatient.address || '-'}</dd></div></dl><div className="patient-dialog-actions"><button className="staff-button staff-button--secondary" type="button" onClick={closePatientModal}>Close</button><button className="staff-button staff-button--primary" type="button" onClick={() => openEdit(selectedPatient)}><Icon name="edit" size={15} /> Edit patient</button></div></StaffDialog> : null}
      {selectedPatient && modalMode === 'edit' ? <StaffDialog className="patient-dialog--edit" closeLabel="Close patient edit form" closeOnBackdropClick={false} eyebrow="Patient account" onClose={closePatientModal} title="Edit patient" titleId="patient-edit-title"><form className="patient-edit-form" onSubmit={(event) => { event.preventDefault(); announce('Patient editing is not available until the patient update API is implemented.') }}><div className="patient-edit-readonly"><span>Patient ID</span><strong>{selectedPatient.patientId || '-'}</strong><small>@{selectedPatient.username}</small></div><div className="patient-edit-form-grid"><label>Full name<input defaultValue={selectedPatient.name === '-' ? '' : selectedPatient.name} readOnly /></label><label>Email<input defaultValue={selectedPatient.email === '-' ? '' : selectedPatient.email} readOnly /></label><label>Phone<input defaultValue={selectedPatient.phone === '-' ? '' : selectedPatient.phone} readOnly /></label><label>Gender<input defaultValue={selectedPatient.gender === '-' ? '' : selectedPatient.gender} readOnly /></label><label>Date of birth<input defaultValue={selectedPatient.dateOfBirth ? selectedPatient.dateOfBirth.slice(0, 10) : ''} readOnly type="date" /></label><label>Address<textarea defaultValue={selectedPatient.address || ''} readOnly rows={3} /></label></div><p className="patient-edit-note">Patient updates are not available yet because the backend update endpoint has not been implemented.</p><div className="patient-dialog-actions"><button className="staff-button staff-button--secondary" type="button" onClick={closePatientModal}>Cancel</button><button className="staff-button staff-button--primary" disabled type="submit">Save changes</button></div></form></StaffDialog> : null}
      {notice ? <div aria-live="polite" className="staff-toast"><span><Icon name="check" size={17} /></span>{notice}</div> : null}
    </div>
  )
}
