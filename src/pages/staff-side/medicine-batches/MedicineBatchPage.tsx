import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router'
import { useAuth } from '@/providers/auth-provider'
import { medicineApi, type MedicineRecord } from '@/services/medicineApi'
import { medicineBatchApi, type MedicineBatchRecord } from '@/services/medicineBatchApi'
import { useTheme } from '../../../components/theme/useTheme'
import { Icon } from '../navbar/StaffIcon'
import { StaffNavbar } from '../navbar/StaffNavbar'
import { getStaffRole, StaffSidebar } from '../navbar/StaffSidebar'
import { StaffDialog } from '../components/StaffDialog'
import { StaffListReset, StaffListSort } from '../components/StaffListControls'
import { StaffPageEyebrow } from '../components/StaffPageEyebrow'
import { getBatchStatus, LOW_STOCK_THRESHOLD } from './batch-status'
import '../StaffHomePage.css'
import './MedicineBatchPage.css'

const statusFilters = ['All batches', 'In stock', 'Low stock', 'Expired'] as const
type StatusFilter = (typeof statusFilters)[number]
const sortOptions = ['Expiry soonest', 'Expiry latest', 'Medicine A–Z', 'Stock low–high', 'Stock high–low'] as const
type SortOption = (typeof sortOptions)[number]
type DialogMode = 'create' | 'edit' | 'view' | null

const emptyForm = {
  medicineId: '',
  stockQuantity: '',
  expiryDate: '',
}

type MedicinePickerProps = {
  medicines: MedicineRecord[]
  value: string
  onChange: (value: string) => void
}

function MedicinePicker({ medicines, value, onChange }: MedicinePickerProps) {
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
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', closeWhenClickedOutside)
    return () => document.removeEventListener('pointerdown', closeWhenClickedOutside)
  }, [open])

  const selectMedicine = (medicineId: string) => {
    onChange(medicineId)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className={`medicine-batch-picker${open ? ' is-open' : ''}`} ref={pickerRef}>
      <button aria-expanded={open} aria-haspopup="listbox" className="medicine-batch-picker__trigger" type="button" onClick={() => setOpen((current) => !current)}>
        <span>{selectedMedicine ? `${selectedMedicine.medicineName} · ${selectedMedicine.medicineId}` : 'Select medicine'}</span>
        <Icon name="chevronDown" size={15} />
      </button>
      {open ? <div className="medicine-batch-picker__menu">
        <div className="medicine-batch-picker__search"><Icon name="search" size={15} /><input autoFocus aria-label="Search medicines" placeholder="Search medicine name or ID" type="search" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        <div aria-label="Medicine options" className="medicine-batch-picker__options" role="listbox">
          {options.map((medicine) => <button aria-selected={medicine.medicineId === value} className={medicine.medicineId === value ? 'is-selected' : ''} key={medicine.medicineId} role="option" type="button" onClick={() => selectMedicine(medicine.medicineId)}>{medicine.medicineName} · {medicine.medicineId}</button>)}
          {!options.length ? <span className="medicine-batch-picker__empty">No matching medicines found.</span> : null}
        </div>
      </div> : null}
    </div>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function toDateInput(value: string) {
  return value ? value.slice(0, 10) : ''
}

function statusClass(value: string) {
  return value.toLowerCase().replace(/\s+/g, '-')
}

export function MedicineBatchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const currentRole = getStaffRole(user?.role)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All batches')
  const [sortOption, setSortOption] = useState<SortOption>('Expiry soonest')
  const [batches, setBatches] = useState<MedicineBatchRecord[]>([])
  const [medicines, setMedicines] = useState<MedicineRecord[]>([])
  const [dialogMode, setDialogMode] = useState<DialogMode>(null)
  const [selectedBatch, setSelectedBatch] = useState<MedicineBatchRecord | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')
  const medicineIdFilter = searchParams.get('medicineId') ?? ''

  const announce = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3200)
  }

  const loadData = async () => {
    setLoading(true)
    setError('')

    try {
      const [batchRows, medicineRows] = await Promise.all([medicineBatchApi.list(), medicineApi.list()])
      setMedicines(medicineRows)
      setBatches(batchRows.map((batch) => ({
        ...batch,
        medicineName: batch.medicineName || medicineRows.find((medicine) => medicine.medicineId === batch.medicineId)?.medicineName || batch.medicineId,
      })))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load medicine batches.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const filteredBatches = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    const rows = batches.filter((batch) => {
      const status = getBatchStatus(batch)
      const searchableText = `${batch.batchId} ${batch.medicineId} ${batch.medicineName}`.toLowerCase()
      return (!medicineIdFilter || batch.medicineId === medicineIdFilter) &&
        (!query || searchableText.includes(query)) &&
        (statusFilter === 'All batches' || status === statusFilter)
    })

    return rows.sort((left, right) => {
      switch (sortOption) {
        case 'Expiry latest':
          return new Date(right.expiryDate).getTime() - new Date(left.expiryDate).getTime()
        case 'Medicine A–Z':
          return left.medicineName.localeCompare(right.medicineName)
        case 'Stock low–high':
          return left.stockQuantity - right.stockQuantity
        case 'Stock high–low':
          return right.stockQuantity - left.stockQuantity
        case 'Expiry soonest':
        default:
          return new Date(left.expiryDate).getTime() - new Date(right.expiryDate).getTime()
      }
    })
  }, [batches, medicineIdFilter, searchTerm, sortOption, statusFilter])

  const inStockCount = batches.filter((batch) => getBatchStatus(batch) === 'In stock').length
  const lowStockCount = batches.filter((batch) => getBatchStatus(batch) === 'Low stock').length
  const expiredCount = batches.filter((batch) => getBatchStatus(batch) === 'Expired').length

  const resetListControls = () => {
    setSearchTerm('')
    setStatusFilter('All batches')
    setSortOption('Expiry soonest')
    setSearchParams({})
  }

  const closeDialog = () => {
    setDialogMode(null)
    setSelectedBatch(null)
    setForm(emptyForm)
    setFormError('')
  }

  const openCreate = () => {
    setSelectedBatch(null)
    setForm({ ...emptyForm, medicineId: medicineIdFilter || medicines[0]?.medicineId || '' })
    setFormError('')
    setDialogMode('create')
  }

  const openView = (batch: MedicineBatchRecord) => {
    setSelectedBatch(batch)
    setFormError('')
    setDialogMode('view')
  }

  const openEdit = (batch: MedicineBatchRecord) => {
    setSelectedBatch(batch)
    setForm({
      medicineId: batch.medicineId,
      stockQuantity: String(batch.stockQuantity),
      expiryDate: toDateInput(batch.expiryDate),
    })
    setFormError('')
    setDialogMode('edit')
  }

  const updateForm = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    setFormError('')
  }

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const stockQuantity = Number(form.stockQuantity)
    if (!form.medicineId || !Number.isInteger(stockQuantity) || stockQuantity < 0 || !form.expiryDate) {
      setFormError('Select a medicine, enter a valid stock quantity, and choose an expiry date.')
      return
    }

    setSaving(true)
    setFormError('')

    try {
      if (dialogMode === 'create') {
        await medicineBatchApi.create({ medicineId: form.medicineId, stockQuantity, expiryDate: form.expiryDate })
        announce('Medicine batch added successfully.')
      } else if (dialogMode === 'edit' && selectedBatch) {
        await medicineBatchApi.update({ batchId: selectedBatch.batchId, stockQuantity, expiryDate: form.expiryDate })
        announce('Medicine batch updated successfully.')
      }

      closeDialog()
      await loadData()
    } catch (requestError) {
      setFormError(requestError instanceof Error ? requestError.message : 'Unable to save medicine batch.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="staff-page medicine-batch-page">
      <StaffSidebar activeNav="Medicine batches" announce={announce} onClose={() => setSidebarOpen(false)} sidebarOpen={sidebarOpen} />

      <main className="staff-main">
        <StaffNavbar activeNav="Medicine batches" notificationsOpen={notificationsOpen} onOpenSidebar={() => setSidebarOpen(true)} onSearchChange={setSearchTerm} onToggleNotifications={() => setNotificationsOpen((current) => !current)} searchTerm={searchTerm} selectedRole={currentRole} theme={theme} toggleTheme={toggleTheme} />

        <div className="staff-content medicine-batch-content">
          <header className="staff-page-heading">
            <StaffPageEyebrow label="Medicine batch tracking" />
            <button className="staff-button staff-button--primary" type="button" onClick={openCreate}><Icon name="plus" size={17} /> Add batch</button>
          </header>

          <section aria-label="Medicine batch summary" className="medicine-batch-summary">
            <article className="medicine-batch-summary-card medicine-batch-summary-card--teal"><span><Icon name="box" size={18} /></span><small>Total batches</small><strong>{batches.length}</strong><em>All stock lots</em></article>
            <article className="medicine-batch-summary-card medicine-batch-summary-card--blue"><span><Icon name="check" size={18} /></span><small>In stock</small><strong>{inStockCount}</strong><em>Ready for dispensing</em></article>
            <article className="medicine-batch-summary-card medicine-batch-summary-card--amber"><span><Icon name="activity" size={18} /></span><small>Low stock</small><strong>{lowStockCount}</strong><em>Needs replenishment</em></article>
            <article className="medicine-batch-summary-card medicine-batch-summary-card--violet"><span><Icon name="clock" size={18} /></span><small>Expired</small><strong>{expiredCount}</strong><em>Needs review</em></article>
          </section>

          <div className="medicine-batch-stock-reminder" role="note"><span><Icon name="bell" size={16} /></span><p><strong>Low stock reminder</strong>Batches with {LOW_STOCK_THRESHOLD} units or fewer are marked as Low stock.</p></div>

          <section className="staff-card medicine-batch-list-card">
            <div className="staff-card__header medicine-batch-list-card__header"><div><p className="staff-card__eyebrow">Batch catalogue</p><div className="medicine-batch-title-row"><h2>{medicineIdFilter ? `${medicines.find((medicine) => medicine.medicineId === medicineIdFilter)?.medicineName || 'Selected medicine'} batches` : 'All medicine batches'}</h2><span className="medicine-batch-result-count"><strong>{filteredBatches.length}</strong> shown</span></div></div></div>
            <div className="medicine-batch-toolbar">
              <label className="medicine-batch-search"><Icon name="search" size={16} /><span className="sr-only">Search medicine batches</span><input placeholder="Search batch, medicine, or ID" type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} /></label>
              <label className="medicine-batch-select"><span className="sr-only">Filter by batch status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>{statusFilters.map((status) => <option key={status}>{status}</option>)}</select><Icon name="chevronDown" size={14} /></label>
              <StaffListSort label="Sort medicine batches" options={sortOptions} value={sortOption} onChange={(value) => setSortOption(value as SortOption)} />
              <StaffListReset onClick={resetListControls} />
            </div>
            {error ? <div className="medicine-batch-error" role="alert"><strong>Unable to load medicine batches</strong><span>{error}</span><button type="button" onClick={() => void loadData()}>Try again</button></div> : null}
            <div className="medicine-batch-table-wrap">
              {loading ? <div className="medicine-batch-empty"><Icon name="activity" size={25} /><strong>Loading medicine batches</strong><span>Getting the latest stock lots from the clinic API.</span></div> : null}
              {!loading && !error && filteredBatches.length ? (
                <table className="medicine-batch-table">
                  <thead><tr><th scope="col">Batch</th><th scope="col">Medicine</th><th scope="col">Stock</th><th scope="col">Expiry date</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
                  <tbody>{filteredBatches.map((batch) => {
                    const status = getBatchStatus(batch)
                    return <tr key={batch.batchId}>
                      <td><span className="medicine-batch-avatar"><Icon name="box" size={16} /></span><span><strong>{batch.batchId}</strong><small>{batch.medicineId}</small></span></td>
                      <td><strong>{batch.medicineName}</strong></td>
                      <td><strong className="medicine-batch-stock">{batch.stockQuantity}</strong><small>units</small></td>
                      <td>{formatDate(batch.expiryDate)}</td>
                      <td><span className={`medicine-batch-status medicine-batch-status--${statusClass(status)}`}><i />{status}</span></td>
                      <td><div className="medicine-batch-actions"><button className="medicine-batch-view" type="button" onClick={() => openView(batch)}><Icon name="eye" size={15} /> View</button><button className="medicine-batch-edit" type="button" onClick={() => openEdit(batch)}><Icon name="edit" size={15} /> Edit</button></div></td>
                    </tr>
                  })}</tbody>
                </table>
              ) : null}
              {!loading && !error && !filteredBatches.length ? <div className="medicine-batch-empty"><Icon name="box" size={25} /><strong>{batches.length ? 'No medicine batches found' : 'No medicine batches available'}</strong><span>{batches.length ? 'Try another search or status filter.' : 'Add a batch to start tracking pharmacy stock.'}</span>{batches.length ? <button type="button" onClick={resetListControls}>Clear filters</button> : null}</div> : null}
            </div>
            {!loading && !error && batches.length ? <div className="medicine-batch-pagination"><span>Showing {filteredBatches.length} of {batches.length} medicine batches</span></div> : null}
          </section>
        </div>
      </main>

    {dialogMode && dialogMode !== 'view' ? <StaffDialog className="medicine-batch-dialog" closeLabel="Close medicine batch form" closeOnBackdropClick={false} eyebrow={dialogMode === 'create' ? 'Pharmacy inventory' : 'Medicine batch'} onClose={closeDialog} title={dialogMode === 'create' ? 'Add medicine batch' : 'Edit medicine batch'} titleId="medicine-batch-dialog-title">
        <form className="medicine-batch-form" onSubmit={(event) => void submitForm(event)}>
          {dialogMode === 'create' ? <label>Medicine<MedicinePicker medicines={medicines} value={form.medicineId} onChange={(value) => updateForm('medicineId', value)} /></label> : <div className="medicine-batch-reference"><span>Medicine</span><strong>{selectedBatch?.medicineName || selectedBatch?.medicineId}</strong><small>{selectedBatch?.medicineId}</small></div>}
          <div className="medicine-batch-form-grid"><label>Stock quantity<input required min="0" step="1" type="number" value={form.stockQuantity} onChange={(event) => updateForm('stockQuantity', event.target.value)} /></label><label>Expiry date<input className="staff-date-input" required type="date" value={form.expiryDate} onChange={(event) => updateForm('expiryDate', event.target.value)} /></label></div>
          {formError ? <p className="medicine-batch-form-error" role="alert">{formError}</p> : null}
          <div className="medicine-batch-dialog-actions"><button className="staff-button staff-button--secondary" disabled={saving} type="button" onClick={closeDialog}>Cancel</button><button className="staff-button staff-button--primary" disabled={saving} type="submit">{saving ? 'Saving…' : dialogMode === 'create' ? 'Add batch' : 'Save changes'}</button></div>
        </form>
      </StaffDialog> : null}

      {dialogMode === 'view' && selectedBatch ? <StaffDialog className="medicine-batch-dialog medicine-batch-view-dialog" closeLabel="Close medicine batch details" closeOnBackdropClick={false} eyebrow="Medicine batch details" onClose={closeDialog} title={selectedBatch.batchId} titleId="medicine-batch-view-title">
        <div className="medicine-batch-view-heading"><span className="medicine-batch-avatar"><Icon name="box" size={18} /></span><span><strong>{selectedBatch.medicineName}</strong><small>{selectedBatch.medicineId}</small></span></div>
        <dl className="staff-detail-grid"><div><dt>Batch ID</dt><dd>{selectedBatch.batchId}</dd></div><div><dt>Medicine</dt><dd>{selectedBatch.medicineName}</dd></div><div><dt>Medicine ID</dt><dd>{selectedBatch.medicineId}</dd></div><div><dt>Stock quantity</dt><dd>{selectedBatch.stockQuantity} units</dd></div><div><dt>Expiry date</dt><dd>{formatDate(selectedBatch.expiryDate)}</dd></div><div><dt>Status</dt><dd>{getBatchStatus(selectedBatch)}</dd></div></dl>
        <div className="medicine-batch-dialog-actions"><button className="staff-button staff-button--secondary" type="button" onClick={closeDialog}>Close</button><button className="staff-button staff-button--primary" type="button" onClick={() => openEdit(selectedBatch)}><Icon name="edit" size={15} /> Edit batch</button></div>
      </StaffDialog> : null}

      {notice ? <div aria-live="polite" className="staff-toast"><span><Icon name="check" size={17} /></span>{notice}</div> : null}
    </div>
  )
}
