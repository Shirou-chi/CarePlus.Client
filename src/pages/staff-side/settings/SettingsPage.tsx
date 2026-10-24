import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/providers/auth-provider'
import { useTheme } from '@/providers/theme-provider'
import { staffApi, type StaffRecord } from '@/services/staffApi'
import { Icon } from '../navbar/StaffIcon'
import { StaffNavbar } from '../navbar/StaffNavbar'
import { StaffSidebar, type StaffRole } from '../navbar/StaffSidebar'
import '../StaffHomePage.css'
import './SettingsPage.css'

type ThemeChoice = 'light' | 'dark'
type NotificationPreference = 'all' | 'reminders' | 'none'
type EditableProfileField = 'username' | 'name' | 'phone'

type StaffSettings = {
  notificationPreference: NotificationPreference
}

const SETTINGS_KEY = 'careplus-staff-settings'

const defaultSettings: StaffSettings = {
  notificationPreference: 'all',
}

const appearanceOptions: { value: ThemeChoice; label: string; description: string; icon: 'sun' | 'moon' }[] = [
  { value: 'light', label: 'Light', description: 'A bright workspace for daytime use.', icon: 'sun' },
  { value: 'dark', label: 'Dark', description: 'A softer interface for low-light work.', icon: 'moon' },
]

function readSettings(): StaffSettings {
  if (typeof window === 'undefined') return defaultSettings

  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings
  } catch {
    return defaultSettings
  }
}

export function SettingsPage() {
  const navigate = useNavigate()
  const { updateStaffProfile, user } = useAuth()
  const { theme, setTheme } = useTheme()
  const selectedTheme: ThemeChoice = theme === 'dark' || (theme === 'system' && document.documentElement.dataset.theme === 'dark') ? 'dark' : 'light'
  const initialRole: StaffRole = user?.role === 'Doctor' || user?.role === 'Pharmacist' ? user.role : 'Admin'
  const [selectedRole, setSelectedRole] = useState<StaffRole>(initialRole)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [settings, setSettings] = useState<StaffSettings>(readSettings)
  const [notice, setNotice] = useState('')
  const [editingField, setEditingField] = useState<EditableProfileField | null>(null)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileDraft, setProfileDraft] = useState('')
  const [roleDetails, setRoleDetails] = useState<StaffRecord | null>(null)
  const [roleDetailsLoading, setRoleDetailsLoading] = useState(false)
  const [roleDetailsError, setRoleDetailsError] = useState('')

  const announce = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2600)
  }

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  }, [settings])

  useEffect(() => {
    let cancelled = false

    if (!user?.role || !user.staffId) {
      setRoleDetails(null)
      setRoleDetailsError('')
      return () => { cancelled = true }
    }

    setRoleDetailsLoading(true)
    setRoleDetailsError('')

    void staffApi.retrieveByRole(user.role, user.staffId)
      .then((details) => {
        if (!cancelled) {
          setRoleDetails(details)
          if (details.username && details.username !== user.username) {
            updateStaffProfile({ username: details.username })
          }
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setRoleDetails(null)
          setRoleDetailsError(error instanceof Error ? error.message : 'Unable to load role details.')
        }
      })
      .finally(() => {
        if (!cancelled) setRoleDetailsLoading(false)
      })

    return () => { cancelled = true }
  }, [user?.role, user?.staffId])

  const handleNavigate = (label: string) => {
    const routes: Record<string, string> = {
      Overview: '/staff',
      Appointments: '/staff/appointments',
      Patients: '/staff/patients',
      Staff: '/staff/staff',
      'Schedules & availability': '/staff/schedules',
      Leave: '/staff/leave',
      Notifications: '/staff/notifications',
      'Audit & logs': '/staff/audit-logs',
      Settings: '/staff/settings',
    }

    const route = routes[label]
    if (route) {
      navigate(route)
      return
    }

    announce(`${label} is ready to connect to your clinic workflow.`)
  }

  const updateSetting = <K extends keyof StaffSettings>(key: K, value: StaffSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }))
    announce('Settings saved automatically.')
  }

  const initials = (user?.name || 'Staff')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  const handleProfileSave = async () => {
    if (!user?.staffId || !editingField) {
      setProfileError('Staff account details are unavailable. Please sign in again.')
      return
    }

    const value = profileDraft.trim()
    if (!value) {
      setProfileError(editingField === 'username' ? 'Username is required.' : editingField === 'name' ? 'Full name is required.' : 'Phone number is required.')
      return
    }

    const phoneValue = value.replace(/[\s()-]/g, '')
    if (editingField === 'phone' && !/^(?:\+?[1-9]\d{7,14}|0\d{8,10})$/.test(phoneValue)) {
      setProfileError('Enter a valid phone number, for example 0123456789 or +60123456789.')
      return
    }

    setProfileSaving(true)
    setProfileError('')

    try {
      if (editingField === 'username') {
        await staffApi.update({ staffId: user.staffId, username: value })
        updateStaffProfile({ username: value })
      } else if (editingField === 'name') {
        await staffApi.update({ staffId: user.staffId, name: value })
        updateStaffProfile({ name: value })
      } else {
        await staffApi.update({ staffId: user.staffId, phone: phoneValue })
        updateStaffProfile({ phone: phoneValue })
      }
      setEditingField(null)
      setProfileDraft('')
      announce(`${editingField === 'username' ? 'Username' : editingField === 'name' ? 'Full name' : 'Phone number'} saved successfully.`)
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Unable to save your profile.')
    } finally {
      setProfileSaving(false)
    }
  }

  const cancelProfileEdit = () => {
    setProfileDraft('')
    setProfileError('')
    setEditingField(null)
  }

  const openProfileEdit = (field: EditableProfileField) => {
    setProfileError('')
    setEditingField(field)
    setProfileDraft(field === 'username' ? user?.username || roleDetails?.username || '' : field === 'name' ? user?.name ?? '' : user?.phone ?? '')
  }

  const displayValue = (value: string | number | null | undefined) => value === null || value === undefined || value === '' ? '-' : String(value)

  const roleDetailValue = (value: string | number | null | undefined) => {
    if (roleDetailsLoading) return 'Loading…'
    if (roleDetailsError) return '-'
    return displayValue(value)
  }

  return (
    <div className="staff-page staff-settings-page">
      <StaffSidebar activeNav="Settings" announce={announce} onClose={() => setSidebarOpen(false)} onNavigate={handleNavigate} onRoleChange={(role) => { setSelectedRole(role); announce(`${role} workspace selected.`) }} role={selectedRole} sidebarOpen={sidebarOpen} />
      <main className="staff-main">
        <StaffNavbar activeNav="Settings" announce={announce} notificationsOpen={notificationsOpen} onOpenSidebar={() => setSidebarOpen(true)} onSearchChange={setSearchTerm} onToggleNotifications={() => setNotificationsOpen((current) => !current)} searchTerm={searchTerm} selectedRole={selectedRole} theme={theme === 'dark' ? 'dark' : 'light'} toggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />

        <div className="staff-content staff-settings-content">
          <section className="staff-card staff-settings-profile-card">
              <div className="staff-settings-profile-card__header">
                <div className="staff-settings-profile-identity">
                  <span className="staff-settings-profile-avatar">{initials}</span>
                  <div><p className="staff-card__eyebrow">Account profile</p></div>
                </div>
              </div>

              <div className="staff-settings-profile-details">
                <div><span>Full name</span>{editingField === 'name' ? <><div className="staff-settings-profile-inline-edit"><input aria-label="Full name" className="staff-settings-profile-inline-input" value={profileDraft} onChange={(event) => setProfileDraft(event.target.value)} /><button aria-label="Save full name" className="staff-settings-profile-inline-action staff-settings-profile-inline-action--save" disabled={profileSaving} type="button" onClick={() => void handleProfileSave()}><Icon name="check" size={13} /></button><button aria-label="Cancel full name edit" className="staff-settings-profile-inline-action" disabled={profileSaving} type="button" onClick={cancelProfileEdit}><Icon name="close" size={13} /></button></div>{profileError ? <p className="staff-settings-profile-error">{profileError}</p> : null}</> : <div className="staff-settings-profile-detail-value"><strong>{displayValue(user?.name)}</strong><button aria-label="Edit full name" className="staff-settings-profile-field-edit" type="button" onClick={() => openProfileEdit('name')}><Icon name="edit" size={13} /></button></div>}</div>
                <div><span>Phone</span>{editingField === 'phone' ? <><div className="staff-settings-profile-inline-edit"><input aria-label="Phone number" className="staff-settings-profile-inline-input" inputMode="tel" type="tel" value={profileDraft} onChange={(event) => setProfileDraft(event.target.value)} /><button aria-label="Save phone number" className="staff-settings-profile-inline-action staff-settings-profile-inline-action--save" disabled={profileSaving} type="button" onClick={() => void handleProfileSave()}><Icon name="check" size={13} /></button><button aria-label="Cancel phone edit" className="staff-settings-profile-inline-action" disabled={profileSaving} type="button" onClick={cancelProfileEdit}><Icon name="close" size={13} /></button></div>{profileError ? <p className="staff-settings-profile-error">{profileError}</p> : null}</> : <div className="staff-settings-profile-detail-value"><strong>{displayValue(user?.phone)}</strong><button aria-label="Edit phone number" className="staff-settings-profile-field-edit" type="button" onClick={() => openProfileEdit('phone')}><Icon name="edit" size={13} /></button></div>}</div>
                <div><span>Staff ID</span><strong>{displayValue(user?.staffId)}</strong></div>
                <div><span>User ID</span><strong>{displayValue(user?.userId)}</strong></div>
                <div><span>Username</span>{editingField === 'username' ? <><div className="staff-settings-profile-inline-edit"><input aria-label="Username" className="staff-settings-profile-inline-input" value={profileDraft} onChange={(event) => setProfileDraft(event.target.value)} /><button aria-label="Save username" className="staff-settings-profile-inline-action staff-settings-profile-inline-action--save" disabled={profileSaving} type="button" onClick={() => void handleProfileSave()}><Icon name="check" size={13} /></button><button aria-label="Cancel username edit" className="staff-settings-profile-inline-action" disabled={profileSaving} type="button" onClick={cancelProfileEdit}><Icon name="close" size={13} /></button></div>{profileError ? <p className="staff-settings-profile-error">{profileError}</p> : null}</> : <div className="staff-settings-profile-detail-value"><strong>{displayValue(user?.username || roleDetails?.username)}</strong><button aria-label="Edit username" className="staff-settings-profile-field-edit" type="button" onClick={() => openProfileEdit('username')}><Icon name="edit" size={13} /></button></div>}</div>
                <div><span>Email</span><strong>{displayValue(user?.email)}</strong></div>
                <div><span>Role</span><strong>{displayValue(user?.role)}</strong></div>
                <div><span>Account type</span><strong>{displayValue(user?.accountType)}</strong></div>
                <div><span>Status</span><strong className={`staff-settings-profile-status staff-settings-profile-status--${(user?.status || '').toLowerCase()}`}>{displayValue(user?.status)}</strong></div>
                {user?.role === 'Admin' ? <>
                  <div><span>Access level</span><strong>{roleDetailValue(roleDetails?.accessLevel)}</strong></div>
                  <div><span>Department</span><strong>{roleDetailValue(roleDetails?.department)}</strong></div>
                </> : null}
                {user?.role === 'Doctor' ? <>
                  <div><span>License number</span><strong>{roleDetailValue(roleDetails?.licenseNumber)}</strong></div>
                  <div><span>Specialization</span><strong>{roleDetailValue(roleDetails?.specialization)}</strong></div>
                  <div><span>Qualification</span><strong>{roleDetailValue(roleDetails?.qualification)}</strong></div>
                  <div><span>Years of experience</span><strong>{roleDetailValue(roleDetails?.yearsOfExperience !== undefined ? `${roleDetails.yearsOfExperience} years` : undefined)}</strong></div>
                </> : null}
                {user?.role === 'Pharmacist' ? <>
                  <div><span>License number</span><strong>{roleDetailValue(roleDetails?.licenseNumber)}</strong></div>
                  <div><span>Qualification</span><strong>{roleDetailValue(roleDetails?.qualification)}</strong></div>
                  <div><span>Certification</span><strong>{roleDetailValue(roleDetails?.certification)}</strong></div>
                  <div><span>Years of experience</span><strong>{roleDetailValue(roleDetails?.yearsOfExperience !== undefined ? `${roleDetails.yearsOfExperience} years` : undefined)}</strong></div>
                </> : null}
              </div>
          </section>

          <section className="staff-settings-group">
            <p className="staff-eyebrow staff-settings-group__label">Preferences</p>
            <div className="staff-settings-layout">
              <section className="staff-card staff-settings-card">
                <div className="staff-settings-card__header"><span className="staff-settings-card__icon staff-settings-card__icon--teal"><Icon name="sun" size={18} /></span><div><p className="staff-card__eyebrow">Appearance</p></div></div>
                <div className="staff-settings-theme-grid">
                  {appearanceOptions.map((option) => <button aria-pressed={selectedTheme === option.value} className={`staff-settings-theme-option${selectedTheme === option.value ? ' is-selected' : ''}`} key={option.value} type="button" onClick={() => setTheme(option.value)}><span className="staff-settings-theme-option__icon"><Icon name={option.icon} size={18} /></span><span><strong>{option.label}</strong><small>{option.description}</small></span>{selectedTheme === option.value ? <Icon name="check" size={16} /> : null}</button>)}
                </div>
              </section>

              <section className="staff-card staff-settings-card staff-settings-card--wide">
                <div className="staff-settings-card__header"><span className="staff-settings-card__icon staff-settings-card__icon--violet"><Icon name="bell" size={18} /></span><div><p className="staff-card__eyebrow">Notifications</p></div></div>
                <div className="staff-settings-radio-list">
                  <label className={`staff-settings-radio-option${settings.notificationPreference === 'all' ? ' is-selected' : ''}`}>
                    <input checked={settings.notificationPreference === 'all'} name="notificationPreference" type="radio" value="all" onChange={() => updateSetting('notificationPreference', 'all')} />
                    <span aria-hidden="true" className="staff-settings-radio-control" />
                    <span><strong>All clinic notices</strong><small>Visits, medicine, records, and account updates.</small></span>
                  </label>
                  <label className={`staff-settings-radio-option${settings.notificationPreference === 'reminders' ? ' is-selected' : ''}`}>
                    <input checked={settings.notificationPreference === 'reminders'} name="notificationPreference" type="radio" value="reminders" onChange={() => updateSetting('notificationPreference', 'reminders')} />
                    <span aria-hidden="true" className="staff-settings-radio-control" />
                    <span><strong>Reminders only</strong><small>Only visit reminders and time-sensitive notices.</small></span>
                  </label>
                  <label className={`staff-settings-radio-option${settings.notificationPreference === 'none' ? ' is-selected' : ''}`}>
                    <input checked={settings.notificationPreference === 'none'} name="notificationPreference" type="radio" value="none" onChange={() => updateSetting('notificationPreference', 'none')} />
                    <span aria-hidden="true" className="staff-settings-radio-control" />
                    <span><strong>No notifications</strong><small>You will not receive clinic notices on this login.</small></span>
                  </label>
                </div>
              </section>
            </div>
          </section>
        </div>
      </main>
      {notice ? <div aria-live="polite" className="staff-toast"><span><Icon name="check" size={17} /></span>{notice}</div> : null}
    </div>
  )
}
