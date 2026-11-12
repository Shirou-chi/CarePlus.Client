import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/providers/auth-provider'
import { medicineApi, type MedicineRecord } from '@/services/medicineApi'
import { useTheme } from '../../../components/theme/useTheme'
import { Icon } from '../navbar/StaffIcon'
import { StaffNavbar } from '../navbar/StaffNavbar'
import { getStaffRole, StaffSidebar } from '../navbar/StaffSidebar'
import { StaffDialog } from '../components/StaffDialog'
import { StaffListReset, StaffListSort } from '../components/StaffListControls'
import { StaffPageEyebrow } from '../components/StaffPageEyebrow'
import '../StaffHomePage.css'
import './MedicinePage.css'

const statusFilters = ['All statuses', 'Available', 'Unavailable'] as const
type StatusFilter = (typeof statusFilters)[number]
const sortOptions = ['Name A–Z', 'Name Z–A', 'Price low–high', 'Price high–low', 'Status'] as const
type SortOption = (typeof sortOptions)[number]
type DialogMode = 'create' | 'edit' | 'view' | null

const emptyForm = {
  medicineName: '',
  nameZh: '',
  description: '',
  descriptionZh: '',
  method: '',
  methodZh: '',
  price: '',
  status: 'Available',
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
  }).format(value)
}

function normalizeStatus(value: string | null | undefined) {
  if (!value) return 'Unknown'
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

function statusClass(value: string) {
  return value.toLowerCase().replace(/\s+/g, '-')
}

export function MedicinePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const currentRole = getStaffRole(user?.role)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All statuses')
  const [sortOption, setSortOption] = useState<SortOption>('Name A–Z')
  const [medicines, setMedicines] = useState<MedicineRecord[]>([])
  const [dialogMode, setDialogMode] = useState<DialogMode>(null)
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineRecord | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')

  const announce = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3200)
  }

  const loadMedicines = async () => {
    setLoading(true)
    setError('')

    try {
      setMedicines(await medicineApi.list())
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load medicines.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadMedicines()
  }, [])

  const filteredMedicines = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    const rows = medicines.filter((medicine) => {
      const status = normalizeStatus(medicine.status)
      const searchableText = [
        medicine.medicineId,
        medicine.medicineName,
        medicine.description,
        medicine.form,
        medicine.kind,
        medicine.pack,
        status,
      ].join(' ').toLowerCase()

      return (!query || searchableText.includes(query)) &&
        (statusFilter === 'All statuses' || status === statusFilter)
    })

    return rows.sort((left, right) => {
      switch (sortOption) {
        case 'Name Z–A':
          return right.medicineName.localeCompare(left.medicineName)
        case 'Price low–high':
          return left.price - right.price
        case 'Price high–low':
          return right.price - left.price
        case 'Status':
          return normalizeStatus(left.status).localeCompare(normalizeStatus(right.status))
        case 'Name A–Z':
        default:
          return left.medicineName.localeCompare(right.medicineName)
      }
    })
  }, [medicines, searchTerm, sortOption, statusFilter])

  const availableCount = medicines.filter((medicine) => normalizeStatus(medicine.status) === 'Available').length
  const unavailableCount = medicines.filter((medicine) => normalizeStatus(medicine.status) === 'Unavailable').length

  const resetListControls = () => {
    setSearchTerm('')
    setStatusFilter('All statuses')
    setSortOption('Name A–Z')
  }

  const closeDialog = () => {
    setDialogMode(null)
    setSelectedMedicine(null)
    setForm(emptyForm)
    setFormError('')
  }

  const openCreate = () => {
    setSelectedMedicine(null)
    setForm(emptyForm)
    setFormError('')
    setDialogMode('create')
  }

  const openView = (medicine: MedicineRecord) => {
    setSelectedMedicine(medicine)
    setFormError('')
    setDialogMode('view')
  }

  const openEdit = (medicine: MedicineRecord) => {
    setSelectedMedicine(medicine)
    setForm({
      medicineName: medicine.medicineName,
      nameZh: medicine.nameZh || '',
      description: medicine.description,
      descriptionZh: medicine.descriptionZh || '',
      method: medicine.method || '',
      methodZh: medicine.methodZh || '',
      price: String(medicine.price),
      status: normalizeStatus(medicine.status) === 'Available' ? 'Available' : 'Unavailable',
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

    const medicineName = form.medicineName.trim()
    const nameZh = form.nameZh.trim()
    const description = form.description.trim()
    const descriptionZh = form.descriptionZh.trim()
    const method = form.method.trim()
    const methodZh = form.methodZh.trim()
    const price = Number(form.price)

    if (!medicineName || !description || !Number.isFinite(price) || price <= 0) {
      setFormError('Enter a medicine name, description, and price greater than 0.')
      return
    }

    setSaving(true)
    setFormError('')

    try {
      if (dialogMode === 'create') {
        const created = await medicineApi.create({ medicineName, nameZh, description, descriptionZh, method, methodZh, price })
        setMedicines((current) => [created, ...current])
        closeDialog()
        announce('Medicine added successfully.')
      } else if (dialogMode === 'edit' && selectedMedicine) {
        await medicineApi.update({
          medicineId: selectedMedicine.medicineId,
          medicineName,
          nameZh,
          description,
          descriptionZh,
          method,
          methodZh,
          price,
          status: form.status,
        })
        setMedicines((current) => current.map((medicine) => medicine.medicineId === selectedMedicine.medicineId
          ? { ...medicine, medicineName, nameZh: nameZh || null, description, descriptionZh: descriptionZh || null, method, methodZh: methodZh || null, price, status: form.status }
          : medicine))
        closeDialog()
        announce('Medicine updated successfully.')
      }
    } catch (requestError) {
      setFormError(requestError instanceof Error ? requestError.message : 'Unable to save medicine.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="staff-page medicine-page">
      <StaffSidebar
        activeNav="Medicine"
        announce={announce}
        onClose={() => setSidebarOpen(false)}
        sidebarOpen={sidebarOpen}
      />

      <main className="staff-main">
        <StaffNavbar
          activeNav="Medicine"
          notificationsOpen={notificationsOpen}
          onOpenSidebar={() => setSidebarOpen(true)}
          onSearchChange={setSearchTerm}
          onToggleNotifications={() => setNotificationsOpen((current) => !current)}
          searchTerm={searchTerm}
          selectedRole={currentRole}
          theme={theme}
          toggleTheme={toggleTheme}
        />

        <div className="staff-content medicine-content">
          <section className="medicine-hero">
            <div>
              <p className="staff-eyebrow">Pharmacy inventory</p>
              <h1>Medicine</h1>
              <p className="medicine-hero__copy">Catalogue used by pharmacy and patient ordering.</p>
            </div>
            <button className="staff-button staff-button--primary" type="button" onClick={openCreate}><Icon name="plus" size={17} /> Add medicine</button>
          </header>

          <section aria-label="Medicine summary" className="medicine-summary">
            <article className="medicine-summary-card medicine-summary-card--teal"><span><Icon name="box" size={18} /></span><small>Total medicines</small><strong>{medicines.length}</strong><em>Catalogue records</em></article>
            <article className="medicine-summary-card medicine-summary-card--blue"><span><Icon name="check" size={18} /></span><small>Available</small><strong>{availableCount}</strong><em>Ready for dispensing</em></article>
            <article className="medicine-summary-card medicine-summary-card--amber"><span><Icon name="activity" size={18} /></span><small>Unavailable</small><strong>{unavailableCount}</strong><em>Needs attention</em></article>
          </section>

          <section className="staff-card medicine-list-card">
            <div className="staff-card__header medicine-list-card__header"><div><p className="staff-card__eyebrow">Medicine catalogue</p><div className="medicine-list-card__title-row"><h2>All medicines</h2><span className="medicine-result-count"><strong>{filteredMedicines.length}</strong> shown</span></div></div></div>
            <div className="medicine-toolbar">
              <label className="medicine-search"><Icon name="search" size={16} /><span className="sr-only">Search medicines</span><input placeholder="Search medicine, form, kind, or ID" type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} /></label>
              <label className="medicine-select"><span className="sr-only">Filter by medicine status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>{statusFilters.map((status) => <option key={status}>{status}</option>)}</select><Icon name="chevronDown" size={14} /></label>
              <StaffListSort label="Sort medicines" options={sortOptions} value={sortOption} onChange={(value) => setSortOption(value as SortOption)} />
              <StaffListReset onClick={resetListControls} />
            </div>
            {error ? <div className="medicine-error" role="alert"><strong>Unable to load medicines</strong><span>{error}</span><button type="button" onClick={() => void loadMedicines()}>Try again</button></div> : null}
            <div className="medicine-table-wrap">
              {loading ? <div className="medicine-empty"><Icon name="activity" size={25} /><strong>Loading medicine catalogue</strong><span>Getting the latest medicine records from the clinic API.</span></div> : null}
              {!loading && !error && filteredMedicines.length ? (
                <table className="medicine-table">
                  <thead><tr><th scope="col">Medicine</th><th scope="col">Details</th><th scope="col">Price</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
                  <tbody>{filteredMedicines.map((medicine) => {
                    const status = normalizeStatus(medicine.status)
                    return <tr key={medicine.medicineId}>
                      <td><span className="medicine-avatar"><Icon name="box" size={17} /></span><span><strong>{medicine.medicineName}</strong><small>{medicine.medicineId}</small></span></td>
                      <td><span className="medicine-details"><strong>{medicine.form || '—'} · {medicine.kind || '—'}</strong><small>{medicine.pack || medicine.method || medicine.description}</small></span></td>
                      <td><strong className="medicine-price">{formatPrice(medicine.price)}</strong></td>
                      <td><span className={`medicine-status medicine-status--${statusClass(status)}`}><i />{status}</span></td>
                      <td><div className="medicine-actions"><button aria-label={`View ${medicine.medicineName}`} className="medicine-view" type="button" onClick={() => openView(medicine)}><Icon name="eye" size={15} /> View</button><button aria-label={`Edit ${medicine.medicineName}`} className="medicine-edit" type="button" onClick={() => openEdit(medicine)}><Icon name="edit" size={15} /> Edit</button><button aria-label={`View batches for ${medicine.medicineName}`} className="medicine-batches-link" type="button" onClick={() => navigate(`/staff/medicine-batches?medicineId=${encodeURIComponent(medicine.medicineId)}`)}><Icon name="box" size={15} /> Batches</button></div></td>
                    </tr>
                  })}</tbody>
                </table>
              ) : null}
              {!loading && !error && !filteredMedicines.length ? <div className="medicine-empty"><Icon name="box" size={25} /><strong>{medicines.length ? 'No medicines found' : 'No medicine records available'}</strong><span>{medicines.length ? 'Try another search or status filter.' : 'Add a medicine to start the pharmacy catalogue.'}</span>{medicines.length ? <button type="button" onClick={resetListControls}>Clear filters</button> : null}</div> : null}
            </div>
            {!loading && !error && medicines.length ? <div className="medicine-pagination"><span>Showing {filteredMedicines.length} of {medicines.length} medicine records</span></div> : null}
          </section>
        </div>
      </main>

    {dialogMode && dialogMode !== 'view' ? <StaffDialog className="medicine-dialog" closeLabel="Close medicine form" closeOnBackdropClick={false} eyebrow={dialogMode === 'create' ? 'Pharmacy inventory' : 'Medicine catalogue'} onClose={closeDialog} title={dialogMode === 'create' ? 'Add medicine' : 'Edit medicine'} titleId="medicine-dialog-title">
        <form className="medicine-form" onSubmit={(event) => void submitForm(event)}>
          <label>Medicine name<input required maxLength={100} value={form.medicineName} onChange={(event) => updateForm('medicineName', event.target.value)} /></label>
          <label>Medicine name (中文)<input maxLength={100} value={form.nameZh} onChange={(event) => updateForm('nameZh', event.target.value)} /></label>
          <label>Description<textarea required maxLength={500} rows={4} value={form.description} onChange={(event) => updateForm('description', event.target.value)} /></label>
          <label>Description (中文)<textarea maxLength={500} rows={4} value={form.descriptionZh} onChange={(event) => updateForm('descriptionZh', event.target.value)} /></label>
          <label>Method / usage instructions<textarea maxLength={160} rows={2} value={form.method} onChange={(event) => updateForm('method', event.target.value)} /></label>
          <label>Method / usage instructions (中文)<textarea maxLength={160} rows={2} value={form.methodZh} onChange={(event) => updateForm('methodZh', event.target.value)} /></label>
          <div className="medicine-form-grid"><label>Price (MYR)<input required min="0.01" step="0.01" type="number" value={form.price} onChange={(event) => updateForm('price', event.target.value)} /></label>{dialogMode === 'edit' ? <label>Status<select value={form.status} onChange={(event) => updateForm('status', event.target.value)}><option>Available</option><option>Unavailable</option></select></label> : null}</div>
          {formError ? <p className="medicine-form-error" role="alert">{formError}</p> : null}
          <div className="medicine-dialog-actions"><button className="staff-button staff-button--secondary" disabled={saving} type="button" onClick={closeDialog}>Cancel</button><button className="staff-button staff-button--primary" disabled={saving} type="submit">{saving ? 'Saving…' : dialogMode === 'create' ? 'Add medicine' : 'Save changes'}</button></div>
        </form>
      </StaffDialog> : null}
      {dialogMode === 'view' && selectedMedicine ? <StaffDialog className="medicine-dialog medicine-view-dialog" closeLabel="Close medicine details" closeOnBackdropClick={false} eyebrow="Medicine details" onClose={closeDialog} title={selectedMedicine.medicineName} titleId="medicine-view-title">
        <div className="medicine-view-heading"><span className="medicine-avatar"><Icon name="box" size={19} /></span><span><strong>{selectedMedicine.medicineId}</strong><small>{normalizeStatus(selectedMedicine.status)} catalogue item</small></span></div>
        <dl className="staff-detail-grid">
          <div><dt>Medicine name</dt><dd>{selectedMedicine.medicineName || '—'}</dd></div>
          <div><dt>Medicine name (中文)</dt><dd>{selectedMedicine.nameZh || '—'}</dd></div>
          <div className="staff-detail-grid__wide"><dt>Description</dt><dd>{selectedMedicine.description || '—'}</dd></div>
          <div className="staff-detail-grid__wide"><dt>Description (中文)</dt><dd>{selectedMedicine.descriptionZh || '—'}</dd></div>
          <div><dt>Form</dt><dd>{selectedMedicine.form || '—'}</dd></div>
          <div><dt>Kind</dt><dd>{selectedMedicine.kind || '—'}</dd></div>
          <div><dt>Pack</dt><dd>{selectedMedicine.pack || '—'}</dd></div>
          <div><dt>Method</dt><dd>{selectedMedicine.method || '—'}</dd></div>
          <div><dt>Method (中文)</dt><dd>{selectedMedicine.methodZh || '—'}</dd></div>
          <div><dt>Price</dt><dd>{formatPrice(selectedMedicine.price)}</dd></div>
          <div><dt>Status</dt><dd>{normalizeStatus(selectedMedicine.status)}</dd></div>
        </dl>
        <div className="medicine-dialog-actions"><button className="staff-button staff-button--secondary" type="button" onClick={closeDialog}>Close</button><button className="staff-button staff-button--primary" type="button" onClick={() => openEdit(selectedMedicine)}><Icon name="edit" size={15} /> Edit medicine</button></div>
      </StaffDialog> : null}
      {notice ? <div aria-live="polite" className="staff-toast"><span><Icon name="check" size={17} /></span>{notice}</div> : null}
    </div>
  )
}
