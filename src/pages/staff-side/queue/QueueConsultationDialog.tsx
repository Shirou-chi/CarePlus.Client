import { useRef, useState, type FormEvent } from 'react'
import { medicineApi, type MedicineRecord } from '@/services/medicineApi'
import { queueApi, type QueuePrescriptionItem, type QueueStatus, type StaffQueueEntry } from '@/services/queueApi'
import { StaffDialog } from '../components/StaffDialog'
import { Icon } from '../navbar/StaffIcon'

type PrescriptionDraft = Omit<QueuePrescriptionItem, 'quantity'> & { id: number; quantity: string }

type QueueConsultationDialogProps = {
  entry: StaffQueueEntry
  onClose: () => void
  onCompleted: (result: QueueStatus) => void
}

export function QueueConsultationDialog({ entry, onClose, onCompleted }: QueueConsultationDialogProps) {
  const [diagnosis, setDiagnosis] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<PrescriptionDraft[]>([])
  const [medicines, setMedicines] = useState<MedicineRecord[]>([])
  const [loadingMedicines, setLoadingMedicines] = useState(false)
  const [medicineError, setMedicineError] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const nextItemId = useRef(0)

  async function addMedicine() {
    setMedicineError('')
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

  function updateItem(id: number, changes: Partial<Omit<PrescriptionDraft, 'id'>>) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...changes } : item))
  }

  function closeDraft() {
    if (saving || loadingMedicines) return
    if (diagnosis.trim() || notes.trim() || items.length > 0) {
      if (!window.confirm('Discard this draft? The patient will stay in consultation.')) return
    }
    onClose()
  }

  async function finishConsultation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving || loadingMedicines) return

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
    if (prescriptionItems.some((item) => !item.dosage || !item.instructions)) {
      setFormError('Enter the dosage and instructions for each medicine.')
      return
    }

    setSaving(true)
    setFormError('')
    try {
      const result = await queueApi.completeConsultation(entry.queueId, {
        diagnosis: diagnosisText,
        notes: notes.trim(),
        prescriptionItems,
      })
      onCompleted(result)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to end the consultation.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <StaffDialog
      className="queue-consultation"
      closeDisabled={saving || loadingMedicines}
      closeOnBackdropClick={false}
      eyebrow={entry.queueNumber}
      onClose={closeDraft}
      title={entry.patientName}
      titleId="queue-consultation-title"
    >
      <p className="queue-consultation__visit">{[entry.visitType, entry.roomName].filter(Boolean).join(' · ')}</p>
      <form className="queue-consultation__form" onSubmit={(event) => void finishConsultation(event)}>
        <fieldset className="queue-consultation__section" disabled={saving}>
          <legend>Medical record</legend>
          <label>
            Diagnosis
            <textarea autoFocus required minLength={2} maxLength={500} rows={2} value={diagnosis} onChange={(event) => setDiagnosis(event.target.value)} />
          </label>
          <label>
            <span>Clinical notes <small>(optional)</small></span>
            <textarea maxLength={2000} rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
          </label>
        </fieldset>

        <fieldset className="queue-consultation__section" disabled={saving}>
          <legend>Prescription <small>(optional)</small></legend>
          {items.map((item, index) => (
            <fieldset className="queue-consultation__medicine" key={item.id}>
              <legend>Medicine {index + 1}</legend>
              <div className="queue-consultation__medicine-fields">
                <label>
                  Medicine
                  <select required value={item.medicineId} onChange={(event) => updateItem(item.id, { medicineId: event.target.value })}>
                    <option value="">Choose a medicine</option>
                    {medicines.map((medicine) => <option key={medicine.medicineId} value={medicine.medicineId}>{medicine.medicineName}</option>)}
                  </select>
                </label>
                <label>
                  Quantity
                  <input min={1} max={2147483647} step={1} required type="number" value={item.quantity} onChange={(event) => updateItem(item.id, { quantity: event.target.value })} />
                </label>
              </div>
              <label>
                Dosage
                <input required value={item.dosage} onChange={(event) => updateItem(item.id, { dosage: event.target.value })} />
              </label>
              <label>
                Instructions
                <textarea required rows={2} value={item.instructions} onChange={(event) => updateItem(item.id, { instructions: event.target.value })} />
              </label>
              <button aria-label={`Remove medicine ${index + 1}`} className="staff-button staff-button--secondary" type="button" onClick={() => setItems((current) => current.filter((row) => row.id !== item.id))}>Remove</button>
            </fieldset>
          ))}
          <button className="staff-button staff-button--secondary" disabled={loadingMedicines} type="button" onClick={() => void addMedicine()}>
            <Icon name="plus" size={16} />{loadingMedicines ? 'Loading medicines…' : 'Add medicine'}
          </button>
          {medicineError ? <p className="queue-consultation__error" role="alert">{medicineError}</p> : null}
        </fieldset>

        {formError ? <p className="queue-consultation__error" role="alert">{formError}</p> : null}
        <div className="staff-queue__dialog-actions">
          <button className="staff-button staff-button--secondary" disabled={saving || loadingMedicines} type="button" onClick={closeDraft}>Back to queue</button>
          <button className="staff-button staff-button--primary" disabled={saving || loadingMedicines} type="submit">{saving ? 'Saving…' : 'End consultation'}</button>
        </div>
      </form>
    </StaffDialog>
  )
}
