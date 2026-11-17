import { useEffect, useState } from 'react'
import { useTheme } from '@/components/theme/useTheme'
import { useAuth } from '@/providers/auth-provider'
import { ApiRequestError } from '@/services/api'
import { displayPrescriptionStatus, isClosedPrescriptionStatus, isCompletedPrescriptionStatus, normalizePrescriptionStatus, prescriptionApi, type PrescriptionItem, type PrescriptionSummary } from '@/services/prescriptionApi'
import { StaffDialog } from '../components/StaffDialog'
import { StaffPageEyebrow } from '../components/StaffPageEyebrow'
import { StaffPagination, useStaffPagination } from '../components/StaffListControls'
import { Icon } from '../navbar/StaffIcon'
import { StaffNavbar } from '../navbar/StaffNavbar'
import { getStaffRole, StaffSidebar } from '../navbar/StaffSidebar'
import '../StaffHomePage.css'
import './PrescriptionsPage.css'

const clinicDateTime = new Intl.DateTimeFormat('en-MY', {
  timeZone: 'Asia/Kuala_Lumpur', dateStyle: 'medium', timeStyle: 'short',
})

type PrescriptionRecordFilter = 'all' | 'active' | 'pending' | 'preparing' | 'ready_for_pickup' | 'completed'

const pickupActions = {
  pending: { label: 'Start preparing', message: 'Prescription marked as preparing.', update: prescriptionApi.prepare },
  preparing: { label: 'Mark ready for pickup', message: 'Prescription is ready for pickup. The patient will see a pickup notification.', update: prescriptionApi.readyForPickup },
  ready_for_pickup: { label: 'Complete pickup', message: 'Pickup completed. The invoice is available in Outstanding invoices.', update: prescriptionApi.complete },
}

function PrescriptionDetails({ prescription, canDispense, onClose, onChanged, onRefresh }: {
  prescription: PrescriptionSummary
  canDispense: boolean
  onClose: () => void
  onChanged: (updated: PrescriptionSummary, message: string) => void
  onRefresh: () => void
}) {
  const { prescriptionId } = prescription
  const status = normalizePrescriptionStatus(prescription.status)
  const action = status === 'pending' || status === 'preparing' || status === 'ready_for_pickup'
    ? pickupActions[status]
    : null
  const [items, setItems] = useState<PrescriptionItem[]>()
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [statusConflict, setStatusConflict] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [saving, setSaving] = useState(false)

  const updateStatus = async () => {
    if (!action || saving) return
    setActionError('')
    setStatusConflict(false)
    setSaving(true)
    try {
      const updated = await action.update(prescriptionId)
      onChanged(updated, action.message)
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : 'Unable to update the prescription.')
      setStatusConflict(reason instanceof ApiRequestError && reason.status === 409)
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    prescriptionApi.items(prescriptionId, controller.signal).then((rows) => {
      if (!controller.signal.aborted) setItems(rows)
    }).catch((reason) => {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Unable to load prescription items.')
    })
    return () => controller.abort()
  }, [prescriptionId, attempt])

  return (
    <StaffDialog className="prescription-dialog" closeDisabled={saving} closeOnBackdropClick={false} eyebrow="Prescription" onClose={onClose} title={prescription.patientName} titleId="prescription-detail-title">
      <dl className="staff-detail-grid">
        <div className="staff-detail-grid__wide"><dt>Prescription ID</dt><dd>{prescriptionId}</dd></div>
        <div><dt>Patient ID</dt><dd>{prescription.patientId}</dd></div>
        <div><dt>Doctor</dt><dd>{prescription.doctorName}</dd></div>
        <div><dt>Issued</dt><dd>{clinicDateTime.format(new Date(prescription.createdAt))}</dd></div>
        <div><dt>Status</dt><dd>{displayPrescriptionStatus(prescription.status)}</dd></div>
      </dl>
      <section aria-labelledby="prescription-medicines-title" className="prescription-medicines">
        <h3 id="prescription-medicines-title">Prescribed medicines</h3>
        {error ? (
          <div className="prescription-feedback" role="alert">
            <span>{error}</span>
            <button className="staff-button staff-button--secondary" type="button" onClick={() => { setError(''); setAttempt((value) => value + 1) }}>Try again</button>
          </div>
        ) : !items ? (
          <p className="prescription-feedback" role="status">Loading medicines…</p>
        ) : items.length === 0 ? (
          <p className="prescription-feedback">No medicines are recorded for this prescription.</p>
        ) : (
          <ul className="prescription-medicines__list">
            {items.map((item) => (
              <li key={item.prescriptionItemId}>
                <strong>{item.medicineName}</strong>
                <dl>
                  <div><dt>Dosage</dt><dd>{item.dosage}</dd></div>
                  <div><dt>Quantity</dt><dd>{item.quantity}</dd></div>
                  <div className="prescription-medicines__instructions"><dt>Instructions</dt><dd>{item.instructions}</dd></div>
                </dl>
              </li>
            ))}
          </ul>
        )}
      </section>
      {canDispense && status === 'ready_for_pickup' ? (
        <p className="prescription-dialog__note">Complete pickup once the patient has collected the medicine. This issues the bill for the visit.</p>
      ) : null}
      {actionError ? <p className="prescription-dialog__error" role="alert">{actionError}</p> : null}
      <div className="prescription-dialog__actions">
        <button className="staff-button staff-button--secondary" disabled={saving} type="button" onClick={onClose}>Close</button>
        {statusConflict ? (
          <button className="staff-button staff-button--primary" type="button" onClick={onRefresh}>Refresh prescriptions</button>
        ) : canDispense && action ? (
          <button className="staff-button staff-button--primary" disabled={saving || !items?.length} type="button" onClick={() => void updateStatus()}>
            {saving ? 'Saving…' : action.label}
          </button>
        ) : null}
      </div>
    </StaffDialog>
  )
}

export function PrescriptionsPage() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [recordFilter, setRecordFilter] = useState<PrescriptionRecordFilter>('active')
  const [rows, setRows] = useState<PrescriptionSummary[]>()
  const [selected, setSelected] = useState<PrescriptionSummary>()
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    prescriptionApi.list(controller.signal).then((prescriptions) => {
      if (!controller.signal.aborted) setRows(prescriptions)
    }).catch((reason) => {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Unable to load prescriptions.')
    })
    return () => controller.abort()
  }, [attempt])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 3200)
    return () => window.clearTimeout(timer)
  }, [notice])

  const search = query.trim().toLowerCase()
  const visibleRows = (rows ?? []).filter((row) => {
    const matchesSearch = [row.patientName, row.patientId, row.doctorName, row.prescriptionId]
      .some((value) => value.toLowerCase().includes(search))
    if (!matchesSearch) return false
    if (recordFilter === 'all') return true
    if (recordFilter === 'active') return !isClosedPrescriptionStatus(row.status)
    if (recordFilter === 'completed') return isCompletedPrescriptionStatus(row.status)
    return normalizePrescriptionStatus(row.status) === recordFilter
  })
  const prescriptionPagination = useStaffPagination(visibleRows)

  return (
    <div className="staff-page prescriptions-page">
      <StaffSidebar activeNav="Prescriptions" announce={setNotice} onClose={() => setSidebarOpen(false)} sidebarOpen={sidebarOpen} />
      <main className="staff-main">
        <StaffNavbar
          activeNav="Prescriptions"
          notificationsOpen={notificationsOpen}
          onOpenSidebar={() => setSidebarOpen(true)}
          onSearchChange={setQuery}
          onToggleNotifications={() => setNotificationsOpen((current) => !current)}
          searchTerm={query}
          selectedRole={getStaffRole(user?.role)}
          theme={theme}
          toggleTheme={toggleTheme}
        />
        <div className="staff-content">
          <StaffPageEyebrow label="Prescription management" />
          <h1 className="staff-page-title">Prescriptions</h1>
          <p className="staff-page-title__copy">Review active prescriptions and previous dispensing records.</p>
          <section aria-label="Prescriptions" className="staff-card prescription-list">
            <div className="prescription-list__toolbar">
              <label className="prescription-list__search">
                <Icon name="search" size={16} />
                <span className="sr-only">Search prescriptions</span>
                <input placeholder="Search patient, doctor or prescription ID" type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
              </label>
              <label className="prescription-list__filter">
                <span className="sr-only">Filter prescription records</span>
                <select aria-label="Filter prescription records" value={recordFilter} onChange={(event) => setRecordFilter(event.target.value as PrescriptionRecordFilter)}>
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready_for_pickup">Ready for pickup</option>
                  <option value="completed">Completed</option>
                </select>
                <Icon name="chevronDown" size={14} />
              </label>
              {rows ? <span>{visibleRows.length} shown</span> : null}
            </div>
            {error ? (
              <div className="prescription-feedback" role="alert">
                <span>{error}</span>
                <button className="staff-button staff-button--secondary" type="button" onClick={() => { setError(''); setAttempt((value) => value + 1) }}>Try again</button>
              </div>
            ) : !rows ? (
              <div className="prescription-feedback" role="status">Loading prescriptions…</div>
            ) : visibleRows.length === 0 ? (
              <div className="prescription-feedback" role="status">No matching prescriptions.</div>
            ) : (
              <>
              <div className="prescription-list__table-wrap">
                <table role="table" className="prescription-list__table staff-responsive-table">
                  <thead role="rowgroup"><tr role="row">
                    <th role="columnheader" scope="col">Patient</th>
                    <th role="columnheader" scope="col">Doctor</th>
                    <th role="columnheader" scope="col">Issued</th>
                    <th role="columnheader" scope="col">Status</th>
                    <th role="columnheader" scope="col"><span className="sr-only">Actions</span></th>
                  </tr></thead>
                  <tbody role="rowgroup">
                    {prescriptionPagination.pageItems.map((row) => (
                      <tr role="row" key={row.prescriptionId}>
                        <td role="cell" data-row-title><strong>{row.patientName}</strong><small>{row.patientId}</small></td>
                        <td role="cell" data-label="Doctor">{row.doctorName}</td>
                        <td role="cell" data-label="Issued"><time dateTime={row.createdAt}>{clinicDateTime.format(new Date(row.createdAt))}</time></td>
                        <td role="cell" data-label="Status"><span className="prescription-status" data-status={normalizePrescriptionStatus(displayPrescriptionStatus(row.status))}>{displayPrescriptionStatus(row.status)}</span></td>
                        <td role="cell" data-row-actions><button aria-label={`View prescription for ${row.patientName}`} className="staff-button staff-button--secondary" type="button" onClick={() => setSelected(row)}><Icon name="eye" size={15} /> View</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <StaffPagination currentPage={prescriptionPagination.page} pageSize={prescriptionPagination.pageSize} pageCount={prescriptionPagination.pageCount} totalItems={prescriptionPagination.totalItems} onPageChange={prescriptionPagination.setPage} onPageSizeChange={prescriptionPagination.setPageSize} />
              </>
            )}
          </section>
        </div>
      </main>
      {selected ? (
        <PrescriptionDetails
          key={selected.prescriptionId}
          canDispense={user?.role === 'Pharmacist' || user?.role === 'Admin'}
          prescription={selected}
          onClose={() => setSelected(undefined)}
          onChanged={(updated, message) => {
            setRows((current) => current?.map((row) => row.prescriptionId === updated.prescriptionId ? updated : row))
            setSelected(undefined)
            setNotice(message)
          }}
          onRefresh={() => {
            setSelected(undefined)
            setAttempt((value) => value + 1)
          }}
        />
      ) : null}
      {notice ? <div className="staff-toast" role="status">{notice}</div> : null}
    </div>
  )
}
