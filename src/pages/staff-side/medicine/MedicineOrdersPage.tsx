import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { useTheme } from '@/components/theme/useTheme'
import { medicineOrderApi, type MedicineOrderStatus, type StaffMedicineOrder } from '@/services/medicineOrderApi'
import { StaffDialog } from '../components/StaffDialog'
import { StaffPagination, useStaffPagination } from '../components/StaffListControls'
import { StaffPageEyebrow } from '../components/StaffPageEyebrow'
import { Icon } from '../navbar/StaffIcon'
import { StaffNavbar } from '../navbar/StaffNavbar'
import { getStaffRole, StaffSidebar } from '../navbar/StaffSidebar'
import '../StaffHomePage.css'
import './MedicineOrdersPage.css'

const pickupStatuses: MedicineOrderStatus[] = ['awaiting_payment', 'paid', 'preparing', 'ready_pickup', 'picked_up']
const deliveryStatuses: MedicineOrderStatus[] = ['awaiting_payment', 'paid', 'preparing', 'shipped', 'delivered']
const statusFilters = ['All statuses', ...pickupStatuses, 'shipped', 'delivered'] as const
type StatusFilter = (typeof statusFilters)[number]

const statusLabels: Record<MedicineOrderStatus, string> = {
  awaiting_payment: 'Awaiting payment',
  paid: 'Paid',
  preparing: 'Preparing',
  ready_pickup: 'Ready for pickup',
  picked_up: 'Picked up',
  shipped: 'Shipped',
  delivered: 'Delivered',
}

const statusRanks: Record<MedicineOrderStatus, number> = {
  awaiting_payment: 0,
  paid: 0,
  preparing: 1,
  ready_pickup: 2,
  picked_up: 3,
  shipped: 2,
  delivered: 3,
}

function normalizeStatus(status: string): MedicineOrderStatus {
  const value = status.trim().toLowerCase().replace(/[\s-]+/g, '_')
  if (value === 'completed' || value === 'dispensed') return 'picked_up'
  return statusLabels[value as MedicineOrderStatus] ? value as MedicineOrderStatus : 'preparing'
}

function statusClass(status: string) {
  return status.replace(/_/g, '-').toLowerCase()
}

function isCashPayment(payment: string) {
  const value = payment.trim().toLowerCase()
  return value === 'cod' || value.includes('cash') || value.includes('货到付款')
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(value)
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-MY', { timeZone: 'Asia/Kuala_Lumpur', dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function nextStatusOptions(order: StaffMedicineOrder) {
  const current = normalizeStatus(order.status)
  const statuses = order.fulfilment === 'pickup' ? pickupStatuses : deliveryStatuses
  if (current === 'awaiting_payment' && !isCashPayment(order.payment)) return [current]
  const currentRank = statusRanks[current]
  return statuses.filter((status) => status === current || (status !== 'paid' && statusRanks[status] === currentRank + 1))
}

export function MedicineOrdersPage() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const currentRole = getStaffRole(user?.role)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All statuses')
  const [orders, setOrders] = useState<StaffMedicineOrder[]>()
  const [selected, setSelected] = useState<StaffMedicineOrder | null>(null)
  const [statusDraft, setStatusDraft] = useState<MedicineOrderStatus>('preparing')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const announce = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3200)
  }

  const loadOrders = async () => {
    setLoading(true)
    setError('')
    try {
      setOrders(await medicineOrderApi.listForStaff())
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load medicine orders.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadOrders()
  }, [currentRole])

  const visibleOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return (orders ?? []).filter((order) => {
      const status = normalizeStatus(order.status)
      const searchable = [order.id, order.patientId, order.patientName, order.payment, ...order.lines.map((line) => line.name)].join(' ').toLowerCase()
      return (!normalizedQuery || searchable.includes(normalizedQuery)) &&
        (statusFilter === 'All statuses' || status === statusFilter)
    })
  }, [orders, query, statusFilter])
  const orderPagination = useStaffPagination(visibleOrders)

  const pendingCount = (orders ?? []).filter((order) => normalizeStatus(order.status) === 'awaiting_payment').length
  const preparingCount = (orders ?? []).filter((order) => normalizeStatus(order.status) === 'preparing').length
  const readyCount = (orders ?? []).filter((order) => ['ready_pickup', 'shipped'].includes(normalizeStatus(order.status))).length
  const completedCount = (orders ?? []).filter((order) => ['picked_up', 'delivered'].includes(normalizeStatus(order.status))).length

  const openOrder = (order: StaffMedicineOrder) => {
    setSelected(order)
    setStatusDraft(normalizeStatus(order.status))
  }

  const closeOrder = () => {
    if (saving) return
    setSelected(null)
  }

  const saveStatus = async () => {
    if (!selected || statusDraft === normalizeStatus(selected.status)) return
    setSaving(true)
    setError('')
    try {
      const updated = await medicineOrderApi.updateStatus(selected.id, statusDraft)
      setOrders((current) => current?.map((order) => order.id === updated.id ? updated : order))
      setSelected(updated)
      setStatusDraft(normalizeStatus(updated.status))
      announce(`Order ${updated.id} is now ${statusLabels[normalizeStatus(updated.status)].toLowerCase()}.`)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update medicine order status.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="staff-page medicine-orders-page">
      <StaffSidebar activeNav="Medicine orders" announce={announce} onClose={() => setSidebarOpen(false)} sidebarOpen={sidebarOpen} />
      <main className="staff-main">
        <StaffNavbar activeNav="Medicine orders" notificationsOpen={notificationsOpen} onOpenSidebar={() => setSidebarOpen(true)} onSearchChange={setQuery} onToggleNotifications={() => setNotificationsOpen((current) => !current)} searchTerm={query} selectedRole={currentRole} theme={theme} toggleTheme={toggleTheme} />
        <div className="staff-content medicine-orders-content">
          <StaffPageEyebrow label="Medicine orders" />
          <section className="medicine-orders-hero">
            <div>
              <StaffPageEyebrow label="Pharmacy fulfilment" />
              <h1>Medicine orders</h1>
              <p>Review direct medicine purchases and move each order through fulfilment.</p>
            </div>
            <button className="staff-button staff-button--secondary" type="button" onClick={() => void loadOrders()}><Icon name="refresh" size={16} /> Refresh</button>
          </section>

          <section aria-label="Medicine order summary" className="medicine-orders-summary">
            <article><span className="medicine-orders-summary__icon medicine-orders-summary__icon--amber"><Icon name="clock" size={18} /></span><small>Awaiting payment</small><strong>{pendingCount}</strong><em>Payment not completed</em></article>
            <article><span className="medicine-orders-summary__icon medicine-orders-summary__icon--blue"><Icon name="activity" size={18} /></span><small>Preparing</small><strong>{preparingCount}</strong><em>Being fulfilled</em></article>
            <article><span className="medicine-orders-summary__icon medicine-orders-summary__icon--teal"><Icon name="box" size={18} /></span><small>Ready / shipped</small><strong>{readyCount}</strong><em>Awaiting patient or delivery</em></article>
            <article><span className="medicine-orders-summary__icon medicine-orders-summary__icon--violet"><Icon name="check" size={18} /></span><small>Completed</small><strong>{completedCount}</strong><em>Picked up or delivered</em></article>
          </section>

          <section aria-label="Medicine orders" className="staff-card medicine-orders-list">
            <div className="medicine-orders-list__header">
              <div><p className="staff-card__eyebrow">Order queue</p><h2>All medicine orders <span>{visibleOrders.length} shown</span></h2></div>
            </div>
            <div className="medicine-orders-toolbar">
              <label className="medicine-orders-search"><Icon name="search" size={16} /><span className="sr-only">Search medicine orders</span><input placeholder="Search order, patient, or medicine" type="search" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
              <label className="medicine-orders-select"><span className="sr-only">Filter by order status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>{statusFilters.map((status) => <option key={status} value={status}>{status === 'All statuses' ? status : statusLabels[status as MedicineOrderStatus]}</option>)}</select><Icon name="chevronDown" size={14} /></label>
            </div>
            {error ? <div className="medicine-orders-feedback medicine-orders-feedback--error" role="alert"><span>{error}</span><button type="button" onClick={() => void loadOrders()}>Try again</button></div> : null}
            {loading ? <div className="medicine-orders-feedback" role="status">Loading medicine orders…</div> : null}
            {!loading && !error && visibleOrders.length === 0 ? <div className="medicine-orders-feedback" role="status">{orders?.length ? 'No matching medicine orders.' : 'No medicine orders yet.'}</div> : null}
            {!loading && !error && visibleOrders.length ? <div className="medicine-orders-table-wrap"><table role="table" className="medicine-orders-table staff-responsive-table"><thead role="rowgroup"><tr role="row"><th role="columnheader">Order</th><th role="columnheader">Patient</th><th role="columnheader">Fulfilment</th><th role="columnheader">Items</th><th role="columnheader">Total</th><th role="columnheader">Status</th><th role="columnheader"><span className="sr-only">Actions</span></th></tr></thead><tbody role="rowgroup">{orderPagination.pageItems.map((order) => {
              const status = normalizeStatus(order.status)
              return <tr role="row" key={order.id}>
                <td role="cell" data-row-title><strong>{order.id}</strong><small>{formatDate(order.placedAt)}</small></td>
                <td role="cell" data-label="Patient"><strong>{order.patientName || order.patientId}</strong><small>{order.patientId}</small></td>
                <td role="cell" data-label="Fulfilment"><span className="medicine-orders-fulfilment">{order.fulfilment === 'pickup' ? 'Pickup' : 'Delivery'}</span></td>
                <td role="cell" data-label="Items"><strong>{order.lines.reduce((total, line) => total + line.qty, 0)}</strong><small>{order.lines.length} medicine{order.lines.length === 1 ? '' : 's'}</small></td>
                <td role="cell" data-label="Total"><strong className="medicine-orders-price">{formatPrice(order.total)}</strong><small>{order.payment || '—'}</small></td>
                <td role="cell" data-label="Status"><span className={`medicine-orders-status medicine-orders-status--${statusClass(status)}`}><i />{statusLabels[status]}</span></td>
                <td role="cell" data-row-actions><button className="staff-button staff-button--secondary" type="button" onClick={() => openOrder(order)}><Icon name="edit" size={15} /> Update</button></td>
              </tr>
            })}</tbody></table><StaffPagination currentPage={orderPagination.page} pageSize={orderPagination.pageSize} pageCount={orderPagination.pageCount} totalItems={orderPagination.totalItems} onPageChange={orderPagination.setPage} onPageSizeChange={orderPagination.setPageSize} /></div> : null}
          </section>
        </div>
      </main>

      {selected ? <StaffDialog className="medicine-order-dialog" closeLabel="Close medicine order" closeOnBackdropClick={false} closeDisabled={saving} eyebrow="Medicine order" onClose={closeOrder} title={selected.id} titleId="medicine-order-dialog-title">
        <div className="medicine-order-dialog__summary"><div><span>Patient</span><strong>{selected.patientName || selected.patientId}</strong><small>{selected.patientId}</small></div><div><span>Placed</span><strong>{formatDate(selected.placedAt)}</strong></div><div><span>Total</span><strong>{formatPrice(selected.total)}</strong></div></div>
        <div className="medicine-order-dialog__status"><label>Update status<select disabled={saving} value={statusDraft} onChange={(event) => setStatusDraft(event.target.value as MedicineOrderStatus)}>{nextStatusOptions(selected).map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></label><p>{isCashPayment(selected.payment) ? 'Cash orders can be prepared before payment; payment is settled at pickup or delivery.' : statusDraft === 'awaiting_payment' ? 'Online payment is required before this order can be prepared.' : 'Payment is complete. Move the order through the next fulfilment step.'} Pickup orders finish at <strong>Picked up</strong>. Delivery orders finish at <strong>Delivered</strong>.</p></div>
        <div className="medicine-order-dialog__items"><h3>Order items</h3><ul>{selected.lines.map((line) => <li key={line.id}><span><strong>{line.name}</strong><small>{line.detail}</small></span><span>{line.qty} × {formatPrice(line.unitPrice)}</span></li>)}</ul></div>
        {selected.address ? <div className="medicine-order-dialog__address"><span>Delivery address</span><strong>{selected.address}</strong></div> : null}
        <div className="medicine-order-dialog__actions"><button className="staff-button staff-button--secondary" disabled={saving} type="button" onClick={closeOrder}>Close</button><button className="staff-button staff-button--primary" disabled={saving || statusDraft === normalizeStatus(selected.status)} type="button" onClick={() => void saveStatus()}>{saving ? 'Saving…' : 'Save status'}</button></div>
      </StaffDialog> : null}
      {notice ? <div aria-live="polite" className="staff-toast"><span><Icon name="check" size={17} /></span>{notice}</div> : null}
    </div>
  )
}
