import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { adminBillingApi, type AdminBillingRecord } from '@/services/adminBillingApi'
import { useTheme } from '../../../components/theme/useTheme'
import { Icon } from '../navbar/StaffIcon'
import { StaffNavbar } from '../navbar/StaffNavbar'
import { getStaffRole, StaffSidebar } from '../navbar/StaffSidebar'
import { StaffDialog } from '../components/StaffDialog'
import { StaffListReset } from '../components/StaffListControls'
import { StaffPageEyebrow } from '../components/StaffPageEyebrow'
import '../StaffHomePage.css'
import './BillingPage.css'

const statusFilters = ['All statuses', 'Paid', 'Pending', 'Overdue'] as const
type StatusFilter = (typeof statusFilters)[number]
const sourceFilters = ['All sources', 'Consultation', 'Medicine order'] as const
type SourceFilter = (typeof sourceFilters)[number]
function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-MY', { currency: 'MYR', style: 'currency' }).format(value)
}

function formatDate(value?: string | null) {
  if (!value) return 'Not set'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

function formatDateTime(value?: string | null) {
  if (!value) return 'Not paid'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date)
}

function getInitials(name: string, username: string) {
  const source = name.trim() || username.trim() || 'Patient'
  const parts = source.split(/\s+/).filter(Boolean)
  return parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase() : source.slice(0, 2).toUpperCase()
}

function statusClass(status: string) {
  return status.toLowerCase().replace(/\s+/g, '-')
}

export function BillingPage() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [activeNav] = useState('Billing')
  const currentRole = getStaffRole(user?.role)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All statuses')
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('All sources')
  const [records, setRecords] = useState<AdminBillingRecord[]>([])
  const [selectedRecord, setSelectedRecord] = useState<AdminBillingRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const announce = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3200)
  }

  const loadBilling = async () => {
    setLoading(true)
    setError('')

    try {
      setRecords(await adminBillingApi.list())
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load billing records.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadBilling()
  }, [])

  const filteredRecords = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    const rows = records.filter((record) => {
      const searchableText = [
        record.invoiceId,
        record.patientId,
        record.patientName,
        record.patientUsername,
        record.recordId,
        record.doctorName,
        record.visitType,
        record.source,
        record.status,
      ].join(' ').toLowerCase()

      return (!query || searchableText.includes(query))
        && (statusFilter === 'All statuses' || record.status === statusFilter)
        && (sourceFilter === 'All sources' || record.source === sourceFilter)
    })

    return rows.sort((left, right) => right.issuedAt.localeCompare(left.issuedAt))
  }, [records, searchTerm, sourceFilter, statusFilter])

  const totalBilled = records.reduce((sum, record) => sum + record.total, 0)
  const totalCollected = records.reduce((sum, record) => sum + record.paidAmount, 0)
  const totalOutstanding = records.reduce((sum, record) => sum + record.amountOutstanding, 0)
  const overdueCount = records.filter((record) => record.status === 'Overdue').length

  const resetFilters = () => {
    setSearchTerm('')
    setStatusFilter('All statuses')
    setSourceFilter('All sources')
  }

  return (
    <div className="staff-page billing-page">
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

        <div className="staff-content billing-content">
          <section className="billing-hero">
            <div>
              <StaffPageEyebrow label="Finance" />
              <h1>Billing tracking</h1>
              <p>Monitor consultation and medicine-order invoices across the clinic.</p>
            </div>
            <button className="staff-button staff-button--secondary" disabled={loading} type="button" onClick={() => void loadBilling()}>
              <Icon name="refresh" size={16} />
              {loading ? 'Refreshing…' : 'Refresh records'}
            </button>
          </section>

          <section aria-label="Billing summary" className="billing-summary">
            <article className="billing-summary-card billing-summary-card--teal"><span><Icon name="chart" size={19} /></span><small>Total billed</small><strong>{formatCurrency(totalBilled)}</strong><em>{records.length} invoices tracked</em></article>
            <article className="billing-summary-card billing-summary-card--blue"><span><Icon name="check" size={19} /></span><small>Collected</small><strong>{formatCurrency(totalCollected)}</strong><em>Paid invoice value</em></article>
            <article className="billing-summary-card billing-summary-card--amber"><span><Icon name="clock" size={19} /></span><small>Outstanding</small><strong>{formatCurrency(totalOutstanding)}</strong><em>Including applicable late fees</em></article>
            <article className="billing-summary-card billing-summary-card--violet"><span><Icon name="file" size={19} /></span><small>Overdue invoices</small><strong>{overdueCount}</strong><em>Needs follow-up</em></article>
          </section>

          <section className="staff-card billing-card">
            <div className="staff-card__header billing-card__header">
              <div><p className="staff-card__eyebrow">Administrator workspace</p><h2>Invoice activity</h2><span>Track payment status and outstanding balances without changing patient payments.</span></div>
            </div>

            <div className="billing-toolbar">
              <label className="billing-search"><Icon name="search" size={16} /><span className="sr-only">Search billing records</span><input placeholder="Search invoice, patient, or service" type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} /></label>
              <label className="billing-select"><span className="sr-only">Filter by payment status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>{statusFilters.map((filter) => <option key={filter}>{filter}</option>)}</select><Icon name="chevronDown" size={14} /></label>
              <label className="billing-select"><span className="sr-only">Filter by billing source</span><select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value as SourceFilter)}>{sourceFilters.map((filter) => <option key={filter}>{filter}</option>)}</select><Icon name="chevronDown" size={14} /></label>
              <StaffListReset onClick={resetFilters} />
            </div>

            <div className="billing-results-bar"><span>Showing <strong>{filteredRecords.length}</strong> of {records.length} invoices</span><span>{loading ? 'Loading billing records…' : error ? 'Sync failed' : 'Live from invoice records'} <i /></span></div>

            <div className="billing-table-wrap staff-scrollbar">
              <table role="table" className="billing-table staff-responsive-table">
                <thead role="rowgroup"><tr role="row"><th role="columnheader" scope="col">Invoice</th><th role="columnheader" scope="col">Patient</th><th role="columnheader" scope="col">Service</th><th role="columnheader" scope="col">Issued</th><th role="columnheader" scope="col">Amount</th><th role="columnheader" scope="col">Status</th><th role="columnheader" scope="col"><span className="sr-only">Details</span></th></tr></thead>
                <tbody role="rowgroup">
                  {loading ? <tr role="row"><td role="cell" colSpan={7}><div className="billing-empty"><Icon name="clock" size={25} /><strong>Loading billing records…</strong><span>Retrieving invoice activity from the clinic API.</span></div></td></tr> : null}
                  {!loading && error ? <tr role="row"><td role="cell" colSpan={7}><div className="billing-empty"><Icon name="close" size={25} /><strong>Unable to load billing records</strong><span>{error}</span><button type="button" onClick={() => void loadBilling()}>Try again</button></div></td></tr> : null}
                  {!loading && !error ? filteredRecords.map((record) => (
                    <tr role="row" key={record.invoiceId}>
                      <td role="cell" data-row-title><span className="billing-invoice"><strong>{record.invoiceId}</strong><small>{record.recordId || 'No linked record'}</small></span></td>
                      <td role="cell" data-label="Patient"><span className="billing-patient"><span aria-hidden="true">{getInitials(record.patientName, record.patientUsername)}</span><span><strong>{record.patientName}</strong><small>{record.patientUsername ? `@${record.patientUsername}` : record.patientId}</small></span></span></td>
                      <td role="cell" data-label="Service"><span className="billing-service"><strong>{record.source}</strong><small>{record.visitType || record.doctorName || 'Clinic billing'}{record.billedForName ? ` · ${record.billedForName}` : ''}</small></span></td>
                      <td role="cell" data-label="Issued"><span className="billing-date">{formatDate(record.issuedAt)}</span></td>
                      <td role="cell" data-label="Amount"><span className="billing-amount"><strong>{formatCurrency(record.total)}</strong>{record.status === 'Overdue' ? <small>+ {formatCurrency(record.lateFee)} late fee</small> : null}</span></td>
                      <td role="cell" data-label="Status"><span className={`billing-status billing-status--${statusClass(record.status)}`}>{record.status}</span></td>
                      <td role="cell" data-row-actions><button aria-label={`View ${record.invoiceId}`} className="billing-row-action" type="button" onClick={() => setSelectedRecord(record)}><Icon name="chevronRight" size={17} /><span className="staff-mobile-only">View details</span></button></td>
                    </tr>
                  )) : null}
                </tbody>
              </table>
              {!loading && !error && !filteredRecords.length ? <div className="billing-empty"><Icon name="search" size={25} /><strong>No billing records found</strong><span>Try changing your search or filters.</span><button type="button" onClick={resetFilters}>Clear filters</button></div> : null}
            </div>
          </section>
        </div>
      </main>

      {selectedRecord ? (
        <StaffDialog eyebrow="Invoice details" title={selectedRecord.invoiceId} titleId="billing-detail-title" className="billing-dialog" onClose={() => setSelectedRecord(null)}>
          <div className="billing-detail-status"><span className={`billing-status billing-status--${statusClass(selectedRecord.status)}`}>{selectedRecord.status}</span><strong>{formatCurrency(selectedRecord.amountOutstanding)} outstanding</strong></div>
          <dl className="billing-detail-list">
            <div><dt>Patient</dt><dd>{selectedRecord.patientName}<small>{selectedRecord.patientUsername ? `@${selectedRecord.patientUsername}` : selectedRecord.patientId}</small></dd></div>
            <div><dt>Billing source</dt><dd>{selectedRecord.source}<small>{selectedRecord.visitType || 'Clinic charge'}</small></dd></div>
            {selectedRecord.billedForName ? <div><dt>Family member</dt><dd>{selectedRecord.billedForName}</dd></div> : null}
            <div><dt>Issued</dt><dd>{formatDateTime(selectedRecord.issuedAt)}</dd></div>
            <div><dt>Due</dt><dd>{formatDate(selectedRecord.dueAt)}</dd></div>
            <div><dt>Base amount</dt><dd>{formatCurrency(selectedRecord.total)}</dd></div>
            <div><dt>Late fee</dt><dd>{formatCurrency(selectedRecord.lateFee)}{selectedRecord.daysOverdue ? <small>{selectedRecord.daysOverdue} days overdue</small> : null}</dd></div>
            <div><dt>Paid</dt><dd>{formatCurrency(selectedRecord.paidAmount)}<small>{selectedRecord.paidAt ? formatDateTime(selectedRecord.paidAt) : 'No payment recorded'}</small></dd></div>
            <div><dt>Payment method</dt><dd>{selectedRecord.paymentMethod || 'Not recorded'}</dd></div>
          </dl>
          <button className="staff-button staff-button--secondary billing-dialog__close" type="button" onClick={() => setSelectedRecord(null)}>Close details</button>
        </StaffDialog>
      ) : null}

      {notice ? <div aria-live="polite" className="staff-toast"><span><Icon name="check" size={17} /></span>{notice}</div> : null}
    </div>
  )
}
