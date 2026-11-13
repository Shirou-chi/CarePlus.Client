import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useAuth } from '@/providers/auth-provider'
import { appointmentApi, type StaffAppointmentRecord } from '@/services/appointmentApi'
import { medicalRecordApi, type MedicalRecord } from '@/services/medicalRecordApi'
import { medicineApi, type MedicineRecord } from '@/services/medicineApi'
import { personalHealthRecordApi, type PersonalRecord } from '@/services/personalHealthRecordApi'
import { queueApi, type QueuePrescriptionItem, type StaffQueueEntry } from '@/services/queueApi'
import { useTheme } from '../../../components/theme/useTheme'
import { Icon } from '../navbar/StaffIcon'
import { StaffNavbar } from '../navbar/StaffNavbar'
import { getStaffRole, StaffSidebar } from '../navbar/StaffSidebar'
import { StaffPageEyebrow } from '../components/StaffPageEyebrow'
import '../StaffHomePage.css'
import '../queue/StaffQueuePage.css'
import './ConsultationPage.css'

type PrescriptionDraft = Omit<QueuePrescriptionItem, 'quantity'> & { id: number; quantity: string }

type ConsultationMedicinePickerProps = {
  medicines: MedicineRecord[]
  value: string
  onChange: (value: string) => void
}

function ConsultationMedicinePicker({ medicines, value, onChange }: ConsultationMedicinePickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const selectedMedicine = medicines.find((medicine) => medicine.medicineId === value)

  const options = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return medicines.filter((medicine) => !normalizedQuery || `${medicine.medicineName} ${medicine.medicineId}`.toLowerCase().includes(normalizedQuery))
  }, [medicines, query])

  useEffect(() => {
    if (!open) return

    const closeWhenClickedOutside = (event: PointerEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', closeWhenClickedOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeWhenClickedOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  const selectMedicine = (medicineId: string) => {
    onChange(medicineId)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className={`consultation-medicine-picker${open ? ' is-open' : ''}`} ref={pickerRef}>
      <button aria-expanded={open} aria-haspopup="listbox" className="consultation-medicine-picker__trigger" type="button" onClick={() => setOpen((current) => !current)}>
        <span>{selectedMedicine ? `${selectedMedicine.medicineName} · ${selectedMedicine.medicineId}` : 'Choose a medicine'}</span>
        <Icon name="chevronDown" size={15} />
      </button>
      {open ? <div className="consultation-medicine-picker__menu">
        <div className="consultation-medicine-picker__search"><Icon name="search" size={15} /><input autoFocus aria-label="Search medicines" placeholder="Search medicine name or ID" type="search" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        <div aria-label="Medicine options" className="consultation-medicine-picker__options staff-scrollbar" role="listbox">
          {options.map((medicine) => <button aria-selected={medicine.medicineId === value} className={medicine.medicineId === value ? 'is-selected' : ''} key={medicine.medicineId} role="option" type="button" onClick={() => selectMedicine(medicine.medicineId)}>{medicine.medicineName} · {medicine.medicineId}</button>)}
          {!options.length ? <span className="consultation-medicine-picker__empty">No matching medicines found.</span> : null}
        </div>
      </div> : null}
    </div>
  )
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-MY', {
    day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

function formatPersonalRecord(record: PersonalRecord) {
  if (record.type === 'bp' && record.systolic != null && record.diastolic != null) {
    return `${record.systolic}/${record.diastolic} mmHg`
  }
  return record.label || record.notes || 'No details recorded'
}

function personalRecordLabel(record: PersonalRecord) {
  return record.type === 'bp'
    ? 'Blood pressure'
    : record.type === 'allergy'
      ? 'Allergy'
      : record.type === 'condition'
        ? 'Health condition'
        : record.type === 'history'
          ? 'Medical history'
          : 'Uploaded health document'
}

export function ConsultationPage() {
  const { queueId = '' } = useParams<{ queueId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const currentRole = getStaffRole(user?.role)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [entry, setEntry] = useState<StaffQueueEntry>()
  const [appointment, setAppointment] = useState<StaffAppointmentRecord>()
  const [previousRecords, setPreviousRecords] = useState<MedicalRecord[]>([])
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [historyError, setHistoryError] = useState('')
  const [appointmentError, setAppointmentError] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<PrescriptionDraft[]>([])
  const [medicines, setMedicines] = useState<MedicineRecord[]>([])
  const [loadingMedicines, setLoadingMedicines] = useState(false)
  const [medicineError, setMedicineError] = useState('')
  const [medicineNotice, setMedicineNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const nextItemId = useRef(0)

  useEffect(() => {
    let cancelled = false

    async function loadContext() {
      setLoading(true)
      setLoadError('')
      setHistoryError('')
      setAppointmentError('')

      try {
        const queueRows = await queueApi.staffList()
        const currentEntry = queueRows.find((row) => row.queueId === queueId)
        if (!currentEntry) throw new Error('This consultation is no longer available in the queue.')

        let currentAppointment: StaffAppointmentRecord | undefined
        if (currentEntry.appointmentId) {
          try {
            const appointments = await appointmentApi.retrieveForStaff()
            currentAppointment = appointments.find((row) => row.id === currentEntry.appointmentId)
            if (!currentAppointment) setAppointmentError('Appointment details are unavailable for this queue entry.')
          } catch (error) {
            setAppointmentError(error instanceof Error ? error.message : 'Unable to load appointment details.')
          }
        }

        const patientId = currentEntry.patientId || currentAppointment?.patientId
        const [medicalResult, personalResult] = patientId
          ? await Promise.allSettled([
            medicalRecordApi.retrieveForPatient(patientId),
            personalHealthRecordApi.listForPatient(patientId),
          ])
          : []

        if (cancelled) return

        setEntry(currentEntry)
        setAppointment(currentAppointment)
        if (medicalResult && medicalResult.status === 'fulfilled') setPreviousRecords(medicalResult.value)
        if (personalResult && personalResult.status === 'fulfilled') setPersonalRecords(personalResult.value)
        if (medicalResult && medicalResult.status === 'rejected') {
          setHistoryError(medicalResult.reason instanceof Error ? medicalResult.reason.message : 'Unable to load previous medical records.')
        }
        if (personalResult && personalResult.status === 'rejected') {
          setHistoryError((current) => current || (personalResult.reason instanceof Error ? personalResult.reason.message : 'Unable to load personal health records.'))
        }
      } catch (error) {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : 'Unable to load the consultation.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadContext()
    return () => { cancelled = true }
  }, [queueId])

  function goBack() {
    if (!saving && (diagnosis.trim() || notes.trim() || items.length > 0)
      && !window.confirm('Discard this consultation draft? The patient will stay in consultation.')) return
    navigate('/staff/queue')
  }

  async function addMedicine() {
    setMedicineError('')
    setMedicineNotice('')
    if (medicines.length === 0) {
      setLoadingMedicines(true)
      try {
        const available = (await medicineApi.list())
          .filter((medicine) => medicine.status.toLowerCase() === 'available')
          .sort((left, right) => left.medicineName.localeCompare(right.medicineName))
        if (available.length === 0) {
          setMedicineError('There are no available medicines to prescribe.')
          return
        }
        setMedicines(available)
      } catch (error) {
        setMedicineError(error instanceof Error ? error.message : 'Unable to load medicines.')
        return
      } finally {
        setLoadingMedicines(false)
      }
    }

    const id = nextItemId.current++
    setItems((current) => [...current, { id, medicineId: '', dosage: '', quantity: '', instructions: '' }])
  }

  function selectMedicine(itemId: number, medicineId: string) {
    setMedicineError('')
    setMedicineNotice('')

    if (!medicineId) {
      setItems((current) => current.map((item) => item.id === itemId ? { ...item, medicineId } : item))
      return
    }

    const selected = items.find((item) => item.id === itemId)
    const existing = items.find((item) => item.id !== itemId && item.medicineId.toLowerCase() === medicineId.toLowerCase())
    if (!selected || !existing) {
      setItems((current) => current.map((item) => item.id === itemId ? { ...item, medicineId } : item))
      return
    }

    const selectedQuantity = Number(selected.quantity)
    const existingQuantity = Number(existing.quantity)
    const totalQuantity = (Number.isInteger(selectedQuantity) && selectedQuantity > 0 ? selectedQuantity : 0)
      + (Number.isInteger(existingQuantity) && existingQuantity > 0 ? existingQuantity : 0)

    setItems((current) => current
      .filter((item) => item.id !== itemId)
      .map((item) => item.id === existing.id
        ? {
          ...item,
          quantity: totalQuantity > 0 ? String(totalQuantity) : '',
          dosage: item.dosage || selected.dosage,
          instructions: item.instructions || selected.instructions,
        }
        : item))
    setMedicineNotice('This medicine was already added. The quantity was combined in the existing row.')
  }

  function updateItem(id: number, changes: Partial<Omit<PrescriptionDraft, 'id'>>) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...changes } : item))
  }

  async function finishConsultation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!entry || saving || loadingMedicines) return

    const diagnosisText = diagnosis.trim()
    if (diagnosisText.length < 2) {
      setFormError('Enter a diagnosis with at least two characters.')
      return
    }

    const prescriptionItems = items.map(({ medicineId, dosage, quantity, instructions }) => ({
      medicineId,
      dosage: dosage.trim(),
      quantity: Number(quantity),
      instructions: instructions.trim(),
    }))
    if (prescriptionItems.some((item) => !item.dosage || !item.instructions || !Number.isInteger(item.quantity) || item.quantity < 1)) {
      setFormError('Enter a valid quantity, dosage, and instructions for each medicine.')
      return
    }

    setSaving(true)
    setFormError('')
    try {
      await queueApi.completeConsultation(entry.queueId, {
        diagnosis: diagnosisText,
        notes: notes.trim(),
        prescriptionItems,
      })
      navigate('/staff/queue', { replace: true })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to end the consultation.')
    } finally {
      setSaving(false)
    }
  }

  const prescriptionQuantityTotal = items.reduce((total, item) => {
    const quantity = Number(item.quantity)
    return total + (Number.isInteger(quantity) && quantity > 0 ? quantity : 0)
  }, 0)

  return (
    <div className="staff-page consultation-page">
      <StaffSidebar activeNav="Queue" announce={() => undefined} onClose={() => setSidebarOpen(false)} sidebarOpen={sidebarOpen} />
      <main className="staff-main">
        <StaffNavbar activeNav="Queue" notificationsOpen={notificationsOpen} onOpenSidebar={() => setSidebarOpen(true)} onSearchChange={() => undefined} onToggleNotifications={() => setNotificationsOpen((current) => !current)} searchTerm="" selectedRole={currentRole} theme={theme} toggleTheme={toggleTheme} />

        <div className="staff-content consultation-content">
          <div className="consultation-page__topbar">
            <div>
              <StaffPageEyebrow label="Patient consultation" />
              <h1>Start consultation</h1>
              <p>Review the patient context before documenting today’s diagnosis and treatment.</p>
            </div>
            <button className="staff-button staff-button--secondary" type="button" onClick={goBack}><Icon name="arrowLeft" size={16} /> Back to queue</button>
          </div>

          {loading ? <div className="consultation-state"><Icon name="activity" size={28} /><strong>Loading consultation context</strong><span>Getting the appointment and patient history.</span></div> : null}
          {loadError ? <div className="consultation-state consultation-state--error" role="alert"><strong>Unable to open consultation</strong><span>{loadError}</span><button className="staff-button staff-button--secondary" type="button" onClick={() => window.location.reload()}>Try again</button></div> : null}

          {!loading && !loadError && entry ? <>
            <section className="consultation-patient-banner">
              <div className="consultation-patient-banner__identity">
                <span className="consultation-patient-banner__avatar"><Icon name="user" size={22} /></span>
                <div><span className="consultation-patient-banner__eyebrow">{entry.queueNumber} · {entry.visitType}</span><h2>{entry.patientName}</h2><p>Checked in {formatDateTime(entry.checkedInAt)}{entry.roomName ? ` · ${entry.roomName}` : ''}</p></div>
              </div>
              <span className="staff-queue__status" data-status={entry.status}>{entry.status === 'InConsultation' ? 'In consultation' : entry.status}</span>
            </section>

            <div className="consultation-layout">
              <aside className="consultation-context">
                <section className="staff-card consultation-context-card">
                  <div className="consultation-card-heading"><div><p className="staff-card__eyebrow">Visit context</p><h2>{appointment ? 'Appointment details' : 'Walk-in consultation'}</h2></div><Icon name="calendar" size={18} /></div>
                  {appointment ? <dl className="consultation-detail-list"><div><dt>Date and time</dt><dd>{formatDateTime(appointment.startAt)}</dd></div><div><dt>Visit type</dt><dd>{appointment.visitType}</dd></div><div><dt>Doctor</dt><dd>{appointment.doctorName}</dd></div><div><dt>Status</dt><dd>{appointment.status} · {appointment.checkInStatus}</dd></div>{appointment.notes ? <div><dt>Appointment notes</dt><dd>{appointment.notes}</dd></div> : null}</dl> : <p className="consultation-muted-copy">No appointment details are attached to this visit. Continue with the walk-in consultation using the patient records below.</p>}
                  {appointmentError ? <p className="consultation-inline-error">{appointmentError}</p> : null}
                </section>

                <section className="staff-card consultation-context-card">
                  <div className="consultation-card-heading"><div><p className="staff-card__eyebrow">Clinical history</p><h2>Previous medical records</h2></div><Icon name="file" size={18} /></div>
                  {historyError ? <p className="consultation-inline-error">{historyError}</p> : null}
                  {!historyError && !previousRecords.length ? <p className="consultation-muted-copy">No previous medical records were found for this patient.</p> : null}
                  <div className="consultation-history-list">{previousRecords.map((record) => <article className="consultation-history-item" key={record.medicalRecordId}><div><strong>{record.diagnosis}</strong><span>{formatDateTime(record.consultationDate)} · {record.doctorName}</span></div><p>{record.notes || 'No clinical notes recorded.'}</p></article>)}</div>
                </section>

                <section className="staff-card consultation-context-card">
                  <div className="consultation-card-heading"><div><p className="staff-card__eyebrow">Patient-provided information</p><h2>Personal health record</h2></div><Icon name="heart" size={18} /></div>
                  {!personalRecords.length ? <p className="consultation-muted-copy">No personal health records were provided by this patient.</p> : null}
                  <div className="consultation-personal-list">{personalRecords.map((record) => <article className="consultation-personal-item" key={record.id}><div><strong>{personalRecordLabel(record)}</strong><span>{formatDateTime(record.recordedAt)}</span></div><p>{formatPersonalRecord(record)}</p>{record.notes && record.label ? <small>{record.notes}</small> : null}</article>)}</div>
                </section>
              </aside>

              <section className="staff-card consultation-form-card">
                <div className="consultation-card-heading"><div><p className="staff-card__eyebrow">Consultation notes</p><h2>Document this visit</h2><span>Complete the medical record before ending the consultation.</span></div></div>
                <form className="consultation-form" onSubmit={(event) => void finishConsultation(event)}>
                  <fieldset disabled={saving}>
                    <legend>Medical record</legend>
                    <label>Diagnosis<textarea autoFocus required minLength={2} maxLength={500} rows={4} value={diagnosis} onChange={(event) => setDiagnosis(event.target.value)} /></label>
                    <label><span>Clinical notes <small>(optional)</small></span><textarea maxLength={2000} rows={5} value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
                  </fieldset>

                  <fieldset disabled={saving}>
                    <legend>Prescription <small>(optional)</small></legend>
                    <div className="consultation-prescription-toolbar"><span>{items.length ? `${items.length} medicine${items.length === 1 ? '' : 's'} added` : 'No medicines added yet'}</span>{items.length ? <strong>{prescriptionQuantityTotal} total unit{prescriptionQuantityTotal === 1 ? '' : 's'}</strong> : null}</div>
                    {items.length ? <div className="consultation-medicine-list staff-scrollbar">{items.map((item, index) => {
                      const medicine = medicines.find((option) => option.medicineId === item.medicineId)
                      return <article className="consultation-medicine" key={item.id}>
                        <div className="consultation-medicine__header"><div className="consultation-medicine__title"><span>#{index + 1}</span><strong>{medicine?.medicineName || (item.medicineId || 'Choose a medicine')}</strong></div><button aria-label={`Remove ${medicine?.medicineName || `medicine ${index + 1}`}`} className="consultation-medicine__remove" type="button" onClick={() => setItems((current) => current.filter((row) => row.id !== item.id))}><Icon name="close" size={14} /> Remove</button></div>
                        <div className="consultation-medicine__fields"><label>Medicine<ConsultationMedicinePicker medicines={medicines} value={item.medicineId} onChange={(medicineId) => selectMedicine(item.id, medicineId)} /></label><label>Quantity<input min={1} max={2147483647} step={1} required type="number" value={item.quantity} onChange={(event) => updateItem(item.id, { quantity: event.target.value })} /></label><label>Dosage<input required value={item.dosage} onChange={(event) => updateItem(item.id, { dosage: event.target.value })} /></label></div>
                        <label>Instructions<textarea required rows={2} value={item.instructions} onChange={(event) => updateItem(item.id, { instructions: event.target.value })} /></label>
                      </article>
                    })}</div> : <div className="consultation-prescription-empty">Add medicines prescribed during this consultation. Re-selecting the same medicine will combine its quantity.</div>}
                    <button className="staff-button staff-button--secondary" disabled={loadingMedicines} type="button" onClick={() => void addMedicine()}><Icon name="plus" size={16} />{loadingMedicines ? 'Loading medicines…' : 'Add medicine'}</button>
                    {medicineError ? <p className="consultation-inline-error" role="alert">{medicineError}</p> : null}
                    {medicineNotice ? <p className="consultation-inline-success" role="status">{medicineNotice}</p> : null}
                  </fieldset>

                  {formError ? <p className="consultation-inline-error" role="alert">{formError}</p> : null}
                  <div className="consultation-form__actions"><button className="staff-button staff-button--secondary" disabled={saving || loadingMedicines} type="button" onClick={goBack}>Back to queue</button><button className="staff-button staff-button--primary" disabled={saving || loadingMedicines} type="submit">{saving ? 'Saving…' : 'Complete consultation'}</button></div>
                </form>
              </section>
            </div>
          </> : null}
        </div>
      </main>
    </div>
  )
}
