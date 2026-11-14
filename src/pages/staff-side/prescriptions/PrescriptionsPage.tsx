import { useEffect, useState } from 'react'
import { useTheme } from '@/components/theme/useTheme'
import { useAuth } from '@/providers/auth-provider'
import { prescriptionApi, type PrescriptionItem, type PrescriptionSummary } from '@/services/prescriptionApi'
import { StaffDialog } from '../components/StaffDialog'
import { StaffPageEyebrow } from '../components/StaffPageEyebrow'
import { Icon } from '../navbar/StaffIcon'
import { StaffNavbar } from '../navbar/StaffNavbar'
import { getStaffRole, StaffSidebar } from '../navbar/StaffSidebar'
import '../StaffHomePage.css'
import './PrescriptionsPage.css'

const clinicDateTime = new Intl.DateTimeFormat('en-MY', {
  timeZone: 'Asia/Kuala_Lumpur', dateStyle: 'medium', timeStyle: 'short',
})

function PrescriptionDetails({ prescription, onClose }: { prescription: PrescriptionSummary; onClose: () => void }) {
  const { prescriptionId } = prescription
  const [items, setItems] = useState<PrescriptionItem[]>()
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

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
    <StaffDialog className="prescription-dialog" eyebrow="Prescription" onClose={onClose} title={prescription.patientName} titleId="prescription-detail-title">
      <dl className="staff-detail-grid">
        <div className="staff-detail-grid__wide"><dt>Prescription ID</dt><dd>{prescriptionId}</dd></div>
        <div><dt>Patient ID</dt><dd>{prescription.patientId}</dd></div>
        <div><dt>Doctor</dt><dd>{prescription.doctorName}</dd></div>
        <div><dt>Issued</dt><dd>{clinicDateTime.format(new Date(prescription.createdAt))}</dd></div>
        <div><dt>Status</dt><dd>{prescription.status}</dd></div>
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
    </StaffDialog>
  )
}

export function PrescriptionsPage() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [query, setQuery] = useState('')
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
  const visibleRows = rows?.filter((row) => [row.patientName, row.patientId, row.doctorName, row.prescriptionId]
    .some((value) => value.toLowerCase().includes(search))) ?? []

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
          <StaffPageEyebrow label="Prescriptions" />
          <section aria-label="Prescriptions" className="staff-card prescription-list">
            <div className="prescription-list__toolbar">
              <label className="prescription-list__search">
                <Icon name="search" size={16} />
                <span className="sr-only">Search prescriptions</span>
                <input placeholder="Search patient, doctor or prescription ID" type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
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
              <div className="prescription-feedback" role="status">{search ? 'No matching prescriptions.' : 'No prescriptions yet.'}</div>
            ) : (
              <div className="prescription-list__table-wrap">
                <table className="prescription-list__table">
                  <thead><tr>
                    <th scope="col">Patient</th>
                    <th scope="col">Doctor</th>
                    <th scope="col">Issued</th>
                    <th scope="col">Status</th>
                    <th scope="col"><span className="sr-only">Actions</span></th>
                  </tr></thead>
                  <tbody>
                    {visibleRows.map((row) => (
                      <tr key={row.prescriptionId}>
                        <td><strong>{row.patientName}</strong><small>{row.patientId}</small></td>
                        <td>{row.doctorName}</td>
                        <td><time dateTime={row.createdAt}>{clinicDateTime.format(new Date(row.createdAt))}</time></td>
                        <td><span className="prescription-status" data-status={row.status.toLowerCase()}>{row.status}</span></td>
                        <td><button aria-label={`View prescription for ${row.patientName}`} className="staff-button staff-button--secondary" type="button" onClick={() => setSelected(row)}><Icon name="eye" size={15} /> View</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
      {selected ? <PrescriptionDetails key={selected.prescriptionId} prescription={selected} onClose={() => setSelected(undefined)} /> : null}
      {notice ? <div className="staff-toast" role="status">{notice}</div> : null}
    </div>
  )
}
