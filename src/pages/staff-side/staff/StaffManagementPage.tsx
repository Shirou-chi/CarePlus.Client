import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/providers/auth-provider'
import { staffApi, type StaffRecord } from '@/services/staffApi'
import { useTheme } from '../../../components/theme/useTheme'
import { Icon } from '../navbar/StaffIcon'
import { StaffNavbar } from '../navbar/StaffNavbar'
import { StaffSidebar, type StaffRole } from '../navbar/StaffSidebar'
import { StaffDialog } from '../components/StaffDialog'
import '../StaffHomePage.css'
import './StaffManagementPage.css'

type StaffRoleFilter = 'All roles' | StaffRole
type StaffStatusFilter = 'All statuses' | 'Active' | 'Inactive' | 'Suspended'
type ModalMode = 'create' | 'edit'

type StaffForm = {
  username: string
  name: string
  email: string
  password: string
  phone: string
  role: StaffRole
  status: 'Active' | 'Inactive' | 'Suspended'
  accessLevel: number
  department: string
  licenseNumber: string
  specialization: string
  qualification: string
  certification: string
  yearsOfExperience: number | ''
}

const roleFilters: StaffRoleFilter[] = ['All roles', 'Admin', 'Doctor', 'Pharmacist']
const statusFilters: StaffStatusFilter[] = ['All statuses', 'Active', 'Inactive', 'Suspended']

const emptyForm: StaffForm = {
  username: '',
  name: '',
  email: '',
  password: '',
  phone: '',
  role: 'Doctor',
  status: 'Active',
  accessLevel: 1,
  department: '',
  licenseNumber: '',
  specialization: '',
  qualification: '',
  certification: '',
  yearsOfExperience: '',
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

export function StaffManagementPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [staff, setStaff] = useState<StaffRecord[]>([])
  const [activeNav, setActiveNav] = useState('Staff')
  const [selectedRole, setSelectedRole] = useState<StaffRole>('Admin')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<StaffRoleFilter>('All roles')
  const [statusFilter, setStatusFilter] = useState<StaffStatusFilter>('All statuses')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [modalMode, setModalMode] = useState<ModalMode | null>(null)
  const [editingStaff, setEditingStaff] = useState<StaffRecord | null>(null)
  const [viewingStaff, setViewingStaff] = useState<StaffRecord | null>(null)
  const [form, setForm] = useState<StaffForm>(emptyForm)
  const [isSaving, setIsSaving] = useState(false)

  const announce = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3200)
  }

  const loadStaff = async () => {
    setLoading(true)
    setError('')

    try {
      setStaff(await staffApi.retrieveAll())
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unable to load staff records.'

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
    void loadStaff()
  }, [])

  const filteredStaff = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return staff.filter((member) => {
      const matchesQuery = !query || `${member.staffId} ${member.name} ${member.username} ${member.email} ${member.phone} ${member.role}`.toLowerCase().includes(query)
      const matchesRole = roleFilter === 'All roles' || member.role === roleFilter
      const matchesStatus = statusFilter === 'All statuses' || member.status === statusFilter
      return matchesQuery && matchesRole && matchesStatus
    })
  }, [roleFilter, searchTerm, staff, statusFilter])

  const activeCount = staff.filter((member) => member.status === 'Active').length
  const doctorCount = staff.filter((member) => member.role === 'Doctor').length
  const pharmacistCount = staff.filter((member) => member.role === 'Pharmacist').length

  const handleRoleChange = (role: StaffRole) => {
    if (role !== 'Admin') {
      navigate('/staff')
      return
    }

    setSelectedRole(role)
    announce('Administrator staff management is now displayed.')
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
  }

  const openCreate = () => {
    setEditingStaff(null)
    setForm(emptyForm)
    setError('')
    setModalMode('create')
  }

  const openEdit = (member: StaffRecord) => {
    setViewingStaff(null)
    setEditingStaff(member)
    setForm({
      username: member.username,
      name: member.name,
      email: member.email,
      password: '',
      phone: member.phone,
      role: member.role as StaffRole,
      status: member.status as StaffForm['status'],
      accessLevel: member.accessLevel ?? 1,
      department: member.department ?? '',
      licenseNumber: member.licenseNumber ?? '',
      specialization: member.specialization ?? '',
      qualification: member.qualification ?? '',
      certification: member.certification ?? '',
      yearsOfExperience: member.yearsOfExperience ?? '',
    })
    setError('')
    setModalMode('edit')
  }

  const openView = (member: StaffRecord) => {
    setError('')
    setViewingStaff(member)
  }

  const closeModal = () => {
    if (!isSaving) {
      setModalMode(null)
      setError('')
    }
  }

  const updateField = <K extends keyof StaffForm>(field: K, value: StaffForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSaving(true)

    try {
      if (modalMode === 'create') {
        await staffApi.register({
          username: form.username.trim(),
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
          ...(form.role === 'Admin' ? {
            accessLevel: form.accessLevel,
            department: form.department,
          } : {}),
          ...(form.role === 'Doctor' ? {
            licenseNumber: form.licenseNumber.trim(),
            specialization: form.specialization.trim(),
            qualification: form.qualification.trim(),
            yearsOfExperience: Number(form.yearsOfExperience),
          } : {}),
          ...(form.role === 'Pharmacist' ? {
            licenseNumber: form.licenseNumber.trim(),
            qualification: form.qualification.trim(),
            certification: form.certification.trim(),
            yearsOfExperience: Number(form.yearsOfExperience),
          } : {}),
        })
        announce('Staff account created.')
      } else if (editingStaff) {
        await staffApi.update({
          staffId: editingStaff.staffId,
          name: form.name.trim(),
          phone: form.phone.trim(),
          role: form.role,
          status: form.status,
        })
        announce('Staff account updated.')
      }

      setModalMode(null)
      await loadStaff()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save staff account.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="staff-page staff-management-page">
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

        <div className="staff-content staff-management-content">
          <section className="staff-management-hero">
            <div>
              <p className="staff-eyebrow">CarePlus Clinic · Administration</p>
              <h1>Manage your staff.</h1>
              <p className="staff-management-hero__copy">Create staff accounts, update roles, and keep access status current across the clinic.</p>
            </div>
            <button className="staff-button staff-button--primary" type="button" onClick={openCreate}><Icon name="plus" size={17} /> Add staff</button>
          </section>

          <section aria-label="Staff summary" className="staff-management-summary">
            <article className="staff-management-summary-card staff-management-summary-card--teal"><span><Icon name="staff" size={18} /></span><small>Total staff</small><strong>{staff.length}</strong><em>All clinic accounts</em></article>
            <article className="staff-management-summary-card staff-management-summary-card--blue"><span><Icon name="check" size={18} /></span><small>Active accounts</small><strong>{activeCount}</strong><em>Can access the portal</em></article>
            <article className="staff-management-summary-card staff-management-summary-card--violet"><span><Icon name="shield" size={18} /></span><small>Doctors</small><strong>{doctorCount}</strong><em>Clinical team</em></article>
            <article className="staff-management-summary-card staff-management-summary-card--amber"><span><Icon name="box" size={18} /></span><small>Pharmacists</small><strong>{pharmacistCount}</strong><em>Medicine team</em></article>
          </section>

          <section className="staff-card staff-management-list-card">
            <div className="staff-card__header staff-management-list-card__header">
              <div><p className="staff-card__eyebrow">Staff directory</p><h2>All staff members</h2><span className="staff-management-description">Search accounts and update their clinic access.</span></div>
            </div>

            <div className="staff-management-toolbar">
              <label className="staff-management-search"><Icon name="search" size={16} /><span className="sr-only">Search staff</span><input placeholder="Search name, ID, email, or role" type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} /></label>
              <label className="staff-management-select"><span className="sr-only">Filter by role</span><select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as StaffRoleFilter)}>{roleFilters.map((filter) => <option key={filter}>{filter}</option>)}</select><Icon name="chevronDown" size={14} /></label>
              <label className="staff-management-select"><span className="sr-only">Filter by status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StaffStatusFilter)}>{statusFilters.map((filter) => <option key={filter}>{filter}</option>)}</select><Icon name="chevronDown" size={14} /></label>
              <span className="staff-management-result-count"><strong>{filteredStaff.length}</strong> shown</span>
            </div>

            {error && !modalMode ? <p className="staff-management-alert" role="alert">{error}</p> : null}

            <div className="staff-management-table-wrap">
              {loading ? <div className="staff-management-empty"><Icon name="activity" size={24} /><strong>Loading staff records</strong><span>Fetching the latest clinic accounts.</span></div> : null}
              {!loading && filteredStaff.length > 0 ? (
                <table className="staff-management-table">
                  <thead><tr><th scope="col">Staff member</th><th scope="col">Role</th><th scope="col">Contact</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
                  <tbody>
                    {filteredStaff.map((member) => (
                      <tr key={member.staffId}>
                        <td><span className={`staff-management-avatar staff-management-avatar--${roleTone(member.role)}`}>{getInitials(member.name || member.username)}</span><span><strong>{member.name || member.username}</strong><small>{member.staffId} · @{member.username}</small></span></td>
                        <td><span className="staff-management-role">{member.role}</span></td>
                        <td><span className="staff-management-contact"><strong>{member.email}</strong><small>{member.phone || 'No phone number'}</small></span></td>
                        <td><span className={`staff-management-status staff-management-status--${member.status.toLowerCase()}`}><i />{member.status}</span></td>
                        <td><div className="staff-management-actions"><button aria-label={`View ${member.name || member.username}`} className="staff-management-view" type="button" onClick={() => openView(member)}><Icon name="eye" size={15} /> View</button><button aria-label={`Edit ${member.name || member.username}`} className="staff-management-edit" type="button" onClick={() => openEdit(member)}><Icon name="edit" size={15} /> Edit</button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}
              {!loading && filteredStaff.length === 0 ? <div className="staff-management-empty"><Icon name="staff" size={24} /><strong>{staff.length ? 'No staff found' : 'No staff records available'}</strong><span>{staff.length ? 'Try another search or filter.' : 'Create the first staff account to get started.'}</span>{staff.length ? <button type="button" onClick={() => { setSearchTerm(''); setRoleFilter('All roles'); setStatusFilter('All statuses') }}>Clear filters</button> : null}</div> : null}
            </div>
          </section>
        </div>
      </main>

      {viewingStaff ? (
        <StaffDialog
          className="staff-dialog--view"
          closeLabel="Close staff profile"
          eyebrow="Staff profile"
          onClose={() => setViewingStaff(null)}
          title={viewingStaff.name || viewingStaff.username}
          titleId="staff-management-view-title"
        >
            <div className="staff-management-profile-heading"><span className={`staff-management-avatar staff-management-avatar--${roleTone(viewingStaff.role)}`}>{getInitials(viewingStaff.name || viewingStaff.username)}</span><span><strong>{viewingStaff.role}</strong><small>{viewingStaff.status} account</small></span></div>
            <dl className="staff-management-profile-details">
              <div><dt>Staff ID</dt><dd>{viewingStaff.staffId}</dd></div>
              <div><dt>Username</dt><dd>@{viewingStaff.username}</dd></div>
              <div><dt>Email</dt><dd>{viewingStaff.email}</dd></div>
              <div><dt>Phone</dt><dd>{viewingStaff.phone || 'No phone number'}</dd></div>
              <div><dt>Role</dt><dd>{viewingStaff.role}</dd></div>
              <div><dt>Status</dt><dd>{viewingStaff.status}</dd></div>
              {viewingStaff.role === 'Admin' ? <>
                <div><dt>Access level</dt><dd>{viewingStaff.accessLevel ?? 'Not provided'}</dd></div>
                <div><dt>Department</dt><dd>{viewingStaff.department || 'Not provided'}</dd></div>
              </> : null}
              {viewingStaff.role === 'Doctor' ? <>
                <div><dt>License number</dt><dd>{viewingStaff.licenseNumber || 'Not provided'}</dd></div>
                <div><dt>Specialization</dt><dd>{viewingStaff.specialization || 'Not provided'}</dd></div>
                <div><dt>Qualification</dt><dd>{viewingStaff.qualification || 'Not provided'}</dd></div>
                <div><dt>Years of experience</dt><dd>{viewingStaff.yearsOfExperience ?? 'Not provided'}</dd></div>
              </> : null}
              {viewingStaff.role === 'Pharmacist' ? <>
                <div><dt>License number</dt><dd>{viewingStaff.licenseNumber || 'Not provided'}</dd></div>
                <div><dt>Qualification</dt><dd>{viewingStaff.qualification || 'Not provided'}</dd></div>
                <div><dt>Certification</dt><dd>{viewingStaff.certification || 'Not provided'}</dd></div>
                <div><dt>Years of experience</dt><dd>{viewingStaff.yearsOfExperience ?? 'Not provided'}</dd></div>
              </> : null}
            </dl>
            <div className="staff-management-dialog__actions"><button className="staff-button staff-button--secondary" type="button" onClick={() => setViewingStaff(null)}>Close</button><button className="staff-button staff-button--primary" type="button" onClick={() => openEdit(viewingStaff)}><Icon name="edit" size={15} /> Edit staff</button></div>
        </StaffDialog>
      ) : null}

      {modalMode ? (
        <StaffDialog
          closeOnBackdropClick={false}
          closeLabel="Close staff form"
          eyebrow={modalMode === 'create' ? 'New account' : 'Staff account'}
          onClose={closeModal}
          title={modalMode === 'create' ? 'Add staff member' : 'Edit staff member'}
          titleId="staff-management-dialog-title"
        >
            <form className="staff-management-form" onSubmit={submitForm}>
              {modalMode === 'create' ? <>
                <label>Username<input autoComplete="username" minLength={3} required value={form.username} onChange={(event) => updateField('username', event.target.value)} /></label>
                <label>Full name<input autoComplete="name" minLength={3} required value={form.name} onChange={(event) => updateField('name', event.target.value)} /></label>
                <label>Email<input autoComplete="email" required type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} /></label>
                <label>Password<input autoComplete="new-password" minLength={8} required type="password" value={form.password} onChange={(event) => updateField('password', event.target.value)} /></label>
              </> : <>
                <div className="staff-management-readonly"><span>Username</span><strong>{form.username}</strong><small>{form.email}</small></div>
                <label>Full name<input minLength={3} required value={form.name} onChange={(event) => updateField('name', event.target.value)} /></label>
                <label>Phone<input value={form.phone} onChange={(event) => updateField('phone', event.target.value)} /></label>
              </>}
              <div className="staff-management-form-grid">
                <label>Role<select value={form.role} onChange={(event) => updateField('role', event.target.value as StaffRole)}><option>Admin</option><option>Doctor</option><option>Pharmacist</option></select></label>
                {modalMode === 'edit' ? <label>Status<select value={form.status} onChange={(event) => updateField('status', event.target.value as StaffForm['status'])}><option>Active</option><option>Inactive</option><option>Suspended</option></select></label> : null}
              </div>
              {modalMode === 'create' ? <section className="staff-management-related-fields" aria-label={`${form.role} details`}>
                <p className="staff-management-related-fields__title">{form.role} details</p>
                {form.role === 'Admin' ? <div className="staff-management-form-grid">
                  <label>Access level<input max={3} min={1} required type="number" value={form.accessLevel} onChange={(event) => updateField('accessLevel', Number(event.target.value))} /></label>
                  <label>Department<select required value={form.department} onChange={(event) => updateField('department', event.target.value)}><option value="">Select department</option><option>Human Resources</option><option>Clinic Operations</option><option>IT</option><option>Administration</option></select></label>
                </div> : null}
                {form.role === 'Doctor' ? <>
                  <div className="staff-management-form-grid"><label>License number<input required value={form.licenseNumber} onChange={(event) => updateField('licenseNumber', event.target.value)} /></label><label>Specialization<input required value={form.specialization} onChange={(event) => updateField('specialization', event.target.value)} /></label></div>
                  <div className="staff-management-form-grid"><label>Qualification<input required value={form.qualification} onChange={(event) => updateField('qualification', event.target.value)} /></label><label>Years of experience<input max={80} min={0} required type="number" value={form.yearsOfExperience} onChange={(event) => updateField('yearsOfExperience', event.target.value === '' ? '' : Number(event.target.value))} /></label></div>
                </> : null}
                {form.role === 'Pharmacist' ? <>
                  <div className="staff-management-form-grid"><label>License number<input required value={form.licenseNumber} onChange={(event) => updateField('licenseNumber', event.target.value)} /></label><label>Qualification<input required value={form.qualification} onChange={(event) => updateField('qualification', event.target.value)} /></label></div>
                  <div className="staff-management-form-grid"><label>Certification<input value={form.certification} onChange={(event) => updateField('certification', event.target.value)} /></label><label>Years of experience<input max={80} min={0} required type="number" value={form.yearsOfExperience} onChange={(event) => updateField('yearsOfExperience', event.target.value === '' ? '' : Number(event.target.value))} /></label></div>
                </> : null}
              </section> : null}
              {error ? <p className="staff-management-alert" role="alert">{error}</p> : null}
              <div className="staff-management-dialog__actions"><button className="staff-button staff-button--secondary" type="button" onClick={closeModal} disabled={isSaving}>Cancel</button><button className="staff-button staff-button--primary" type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : modalMode === 'create' ? 'Create account' : 'Save changes'}</button></div>
            </form>
        </StaffDialog>
      ) : null}

      {notice ? <div aria-live="polite" className="staff-toast"><span><Icon name="check" size={17} /></span>{notice}</div> : null}
    </div>
  )
}
