import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { medicalRecordApi, type MedicalRecord } from '@/services/medicalRecordApi'
import { patientApi, type PatientRecord } from '@/services/patientApi'
import { useTheme } from '../../../components/theme/useTheme'
import { StaffDialog } from '../components/StaffDialog'
import { Icon } from '../navbar/StaffIcon'
import { StaffNavbar } from '../navbar/StaffNavbar'
import { StaffSidebar, getStaffRole } from '../navbar/StaffSidebar'
import { StaffPageEyebrow } from '../components/StaffPageEyebrow'
import '../StaffHomePage.css'
import './MedicalRecordsPage.css'

type DialogMode = 'view' | 'edit' | 'create' | null

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value || '-'

  return date.toLocaleString('en-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function localDateTimeValue(value = new Date()) {
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return (parts.length > 1 ? `${parts[0][0]}${parts.at(-1)?.[0]}` : name.slice(0, 2)).toUpperCase() || 'PT'
}

function patientLabel(patient: PatientRecord) {
  return `${patient.name || patient.username} · @${patient.username}`
}

export function MedicalRecordsPage() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const currentRole = getStaffRole(user?.role)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [patients, setPatients] = useState<PatientRecord[]>([])
  const [query, setQuery] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null)
  const [dialogMode, setDialogMode] = useState<DialogMode>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')

  const announce = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3200)
  }

  const loadData = async () => {
    setLoading(true)
    setError('')

    try {
      const [recordResult, patientResult] = await Promise.allSettled([
        medicalRecordApi.retrieve(),
        patientApi.retrieveAll(),
      ])

      if (recordResult.status === 'rejected') throw recordResult.reason

      setRecords(recordResult.value)
      setPatients(patientResult.status === 'fulfilled' ? patientResult.value : [])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load medical records.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const filteredRecords = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return records.filter((record) => !normalized || [
      record.medicalRecordId,
      record.patientName,
      record.patientUsername,
      record.diagnosis,
      record.notes,
    ].join(' ').toLowerCase().includes(normalized))
  }, [query, records])

  const thisMonthCount = records.filter((record) => {
    const date = new Date(record.consultationDate)
    const now = new Date()
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
  }).length

  const closeDialog = () => {
    setDialogMode(null)
    setSelectedRecord(null)
    setFormError('')
  }

  const openCreate = () => {
    setSelectedRecord(null)
    setFormError('')
    setDialogMode('create')
  }

  const openView = (record: MedicalRecord) => {
    setSelectedRecord(record)
    setFormError('')
    setDialogMode('view')
  }

  const openEdit = (record: MedicalRecord) => {
    setSelectedRecord(record)
    setFormError('')
    setDialogMode('edit')
  }

  const submitRecord = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const patientId = String(values.get('patientId') ?? '').trim()
    const consultationDate = String(values.get('consultationDate') ?? '').trim()
    const diagnosis = String(values.get('diagnosis') ?? '').trim()
    const notes = String(values.get('notes') ?? '').trim()

    setSaving(true)
    setFormError('')

    try {
      if (dialogMode === 'edit' && selectedRecord) {
        await medicalRecordApi.update({
          medicalRecordId: selectedRecord.medicalRecordId,
          consultationDate,
          diagnosis,
          notes,
        })
        announce('Medical record updated.')
      } else {
        await medicalRecordApi.create({ patientId, consultationDate, diagnosis, notes })
        announce('Medical record created.')
      }

      closeDialog()
      await loadData()
    } catch (requestError) {
      setFormError(requestError instanceof Error ? requestError.message : 'Unable to save medical record.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="staff-page medical-records-page">
      <StaffSidebar activeNav="Medical records" announce={announce} onClose={() => setSidebarOpen(false)} sidebarOpen={sidebarOpen} />

      <main className="staff-main">
        <StaffNavbar activeNav="Medical records" notificationsOpen={notificationsOpen} onOpenSidebar={() => setSidebarOpen(true)} onSearchChange={setQuery} onToggleNotifications={() => setNotificationsOpen((current) => !current)} searchTerm={query} selectedRole={currentRole} theme={theme} toggleTheme={toggleTheme} />

        <div className="staff-content medical-records-content">
          <header className="staff-page-heading">
            <StaffPageEyebrow label="Medical records" />
            <button className="staff-button staff-button--primary" type="button" onClick={openCreate}><Icon name="plus" size={17} /> Add medical record</button>
          </header>

          <section aria-label="Medical record summary" className="medical-records-summary">
            <article className="medical-records-summary-card medical-records-summary-card--teal"><span><Icon name="activity" size={18} /></span><small>Total records</small><strong>{records.length}</strong><em>Assigned to you</em></article>
            <article className="medical-records-summary-card medical-records-summary-card--blue"><span><Icon name="calendar" size={18} /></span><small>This month</small><strong>{thisMonthCount}</strong><em>Consultations documented</em></article>
            <article className="medical-records-summary-card medical-records-summary-card--violet"><span><Icon name="users" size={18} /></span><small>Patients</small><strong>{new Set(records.map((record) => record.patientId)).size}</strong><em>With a record from you</em></article>
          </section>

          <section className="staff-card medical-records-list-card">
            <div className="staff-card__header medical-records-list-card__header">
              <div><p className="staff-card__eyebrow">Patient history</p><h2>Medical records</h2><span className="medical-records-description">Review your consultation notes and keep patient history up to date.</span></div>
              <span className="medical-records-count">{filteredRecords.length} shown</span>
            </div>

            <div className="medical-records-toolbar">
              <label className="medical-records-search"><Icon name="search" size={16} /><span className="sr-only">Search medical records</span><input placeholder="Search patient, diagnosis, or record ID" type="search" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
              <button className="staff-button staff-button--secondary" type="button" onClick={() => { setQuery(''); void loadData() }}><Icon name="refresh" size={15} /> Refresh</button>
            </div>

            {error ? <div className="medical-records-error" role="alert"><strong>Unable to load medical records</strong><span>{error}</span><button type="button" onClick={() => void loadData()}>Try again</button></div> : null}
            {loading ? <div className="medical-records-empty"><Icon name="activity" size={25} /><strong>Loading medical records</strong><span>Getting your patient records from the clinic API.</span></div> : null}

            {!loading && !error && filteredRecords.length ? <div className="medical-records-table-wrap"><table className="medical-records-table"><thead><tr><th>Patient</th><th>Consultation</th><th>Diagnosis</th><th>Record ID</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{filteredRecords.map((record) => <tr key={record.medicalRecordId}><td><span className="medical-records-patient"><span className="medical-records-avatar">{initials(record.patientName)}</span><span><strong>{record.patientName || '-'}</strong><small>@{record.patientUsername || record.patientId}</small></span></span></td><td>{formatDateTime(record.consultationDate)}</td><td><strong>{record.diagnosis}</strong><small className="medical-records-notes">{record.notes || 'No additional notes'}</small></td><td><span className="medical-records-id">{record.medicalRecordId}</span></td><td><button className="medical-records-view" type="button" onClick={() => openView(record)}><Icon name="eye" size={15} /> View</button></td></tr>)}</tbody></table></div> : null}
            {!loading && !error && !filteredRecords.length ? <div className="medical-records-empty"><Icon name="activity" size={25} /><strong>{query ? 'No matching records' : 'No medical records yet'}</strong><span>{query ? 'Try another patient or diagnosis.' : 'Create a record after completing a patient consultation.'}</span>{!query ? <button className="staff-button staff-button--secondary" type="button" onClick={openCreate}><Icon name="plus" size={15} /> Add medical record</button> : null}</div> : null}
          </section>
        </div>
      </main>

      {dialogMode === 'view' && selectedRecord ? <StaffDialog className="medical-record-dialog" closeOnBackdropClick={false} eyebrow="Medical record" onClose={closeDialog} title="Record details" titleId="medical-record-details-title"><div className="medical-record-detail-card"><span className="medical-record-detail-card__avatar">{initials(selectedRecord.patientName)}</span><div><strong>{selectedRecord.patientName}</strong><small>@{selectedRecord.patientUsername || selectedRecord.patientId}</small></div></div><dl className="staff-detail-grid medical-record-detail-grid"><div><dt>Record ID</dt><dd>{selectedRecord.medicalRecordId}</dd></div><div><dt>Consultation</dt><dd>{formatDateTime(selectedRecord.consultationDate)}</dd></div><div className="staff-detail-grid__wide"><dt>Diagnosis</dt><dd>{selectedRecord.diagnosis}</dd></div><div className="staff-detail-grid__wide"><dt>Clinical notes</dt><dd>{selectedRecord.notes || '-'}</dd></div></dl><div className="medical-record-dialog__actions"><button className="staff-button staff-button--secondary" type="button" onClick={closeDialog}>Close</button><button className="staff-button staff-button--primary" type="button" onClick={() => openEdit(selectedRecord)}><Icon name="edit" size={15} /> Edit record</button></div></StaffDialog> : null}

      {dialogMode === 'create' || dialogMode === 'edit' ? <StaffDialog className="medical-record-dialog" closeOnBackdropClick={false} eyebrow="Medical record management" onClose={closeDialog} title={dialogMode === 'edit' ? 'Edit medical record' : 'Add medical record'} titleId="medical-record-form-title"><form className="medical-record-form" onSubmit={submitRecord}><label>Patient{dialogMode === 'edit' ? <input value={selectedRecord?.patientName ?? ''} readOnly /> : <select autoFocus defaultValue="" name="patientId" required><option disabled value="">Choose a patient</option>{patients.map((patient) => <option key={patient.patientId} value={patient.patientId}>{patientLabel(patient)}</option>)}</select>}</label><label>Consultation date and time<input defaultValue={dialogMode === 'edit' && selectedRecord ? localDateTimeValue(new Date(selectedRecord.consultationDate)) : localDateTimeValue()} max={localDateTimeValue()} name="consultationDate" required type="datetime-local" /></label><label>Diagnosis<textarea defaultValue={selectedRecord?.diagnosis ?? ''} maxLength={500} name="diagnosis" placeholder="Enter the consultation diagnosis" required rows={3} /></label><label>Clinical notes <span>(optional)</span><textarea defaultValue={selectedRecord?.notes ?? ''} maxLength={2000} name="notes" placeholder="Add treatment notes, observations, or follow-up details" rows={4} /></label>{formError ? <div className="medical-record-form-error" role="alert">{formError}</div> : null}<div className="medical-record-dialog__actions"><button className="staff-button staff-button--secondary" disabled={saving} type="button" onClick={closeDialog}>Cancel</button><button className="staff-button staff-button--primary" disabled={saving} type="submit">{saving ? 'Saving…' : dialogMode === 'edit' ? 'Save changes' : 'Create record'}</button></div></form></StaffDialog> : null}

      {notice ? <div aria-live="polite" className="staff-toast"><span><Icon name="check" size={17} /></span>{notice}</div> : null}
    </div>
  )
}
