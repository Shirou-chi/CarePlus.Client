import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { adminBillingApi, type AdminBillingRecord } from '@/services/adminBillingApi'
import { appointmentApi, type StaffAppointmentRecord } from '@/services/appointmentApi'
import { medicineOrderApi, type StaffMedicineOrder } from '@/services/medicineOrderApi'
import { useAuth } from '@/providers/auth-provider'
import { useTheme } from '../../../components/theme/useTheme'
import { StaffPageEyebrow } from '../components/StaffPageEyebrow'
import { Icon, type IconName } from '../navbar/StaffIcon'
import { StaffNavbar } from '../navbar/StaffNavbar'
import { getStaffRole, StaffSidebar } from '../navbar/StaffSidebar'
import '../StaffHomePage.css'
import './ReportsPage.css'

const clinicDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit',
})
const displayMonth = new Intl.DateTimeFormat('en-MY', {
  timeZone: 'Asia/Kuala_Lumpur', month: 'long', year: 'numeric',
})

type ReportData = {
  appointments: StaffAppointmentRecord[]
  billing: AdminBillingRecord[]
  orders: StaffMedicineOrder[]
}

type BarItem = { label: string; value: number; tone: 'teal' | 'blue' | 'amber' | 'violet' | 'red' }
type DailyReportPoint = {
  date: string
  label: string
  appointments: number
  consultations: number
  cancellations: number
  billed: number
  collected: number
  outstanding: number
  units: number
  revenue: number
}
type TopMedicine = { id: string; name: string; units: number; orders: number; revenue: number }

const outcomeColors = ['var(--staff-teal)', 'var(--staff-violet)', 'var(--staff-blue)', '#df6d76']

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-MY', { currency: 'MYR', style: 'currency' }).format(value)
}

function reportRange(month: string) {
  const [year, monthNumber] = month.split('-').map(Number)
  const lastDay = new Date(year, monthNumber, 0).getDate()
  return {
    start: `${month}-01`,
    end: `${month}-${String(lastDay).padStart(2, '0')}`,
  }
}

function isInReportRange(value: string, start: string, end: string) {
  if (!start || !end) return false
  const day = value.slice(0, 10)
  return day >= start && day <= end
}

function dateKeysBetween(start: string, end: string) {
  if (!start || !end) return []
  const [startYear, startMonth, startDay] = start.split('-').map(Number)
  const [endYear, endMonth, endDay] = end.split('-').map(Number)
  const current = new Date(startYear, startMonth - 1, startDay)
  const last = new Date(endYear, endMonth - 1, endDay)
  const keys: string[] = []

  while (current <= last) {
    keys.push(`${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`)
    current.setDate(current.getDate() + 1)
  }

  return keys
}

function appointmentBucket(appointment: StaffAppointmentRecord) {
  if (appointment.status === 'Completed') return 'Completed'
  if (appointment.status === 'Cancelled') return 'Cancelled'
  if (appointment.checkInStatus === 'CheckedIn') return 'Checked in'
  return 'Scheduled'
}

type ReportTooltipProps = {
  active?: boolean
  label?: string | number
  payload?: Array<{ color?: string; dataKey?: string | number; name?: string | number; value?: string | number }>
}

function ReportTooltip({ active, label, payload }: ReportTooltipProps) {
  if (!active || !payload?.length) return null

  return <div className="reports-tooltip"><strong className="reports-tooltip__label">{label}</strong>{payload.map((item) => {
    const name = String(item.name ?? item.dataKey ?? 'Value')
    const numericValue = Number(item.value)
    const value = Number.isFinite(numericValue)
      ? /revenue|billed|collected|outstanding/i.test(name) ? formatCurrency(numericValue) : new Intl.NumberFormat('en-MY').format(numericValue)
      : String(item.value ?? '—')
    return <div className="reports-tooltip__row" key={`${name}-${String(item.value)}`}><span><i style={{ background: item.color ?? 'var(--staff-brand)' }} />{name}</span><b>{value}</b></div>
  })}</div>
}

function SummaryCard({ icon, label, value, detail, tone }: { icon: IconName; label: string; value: string; detail: string; tone: string }) {
  return <article className={`reports-summary-card reports-summary-card--${tone}`}><span className="reports-summary-card__icon"><Icon name={icon} size={18} /></span><span className="reports-summary-card__label">{label}</span><strong>{value}</strong><small>{detail}</small></article>
}

export function ReportsPage() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const currentRole = getStaffRole(user?.role)
  const today = clinicDate.format(new Date())
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(today.slice(0, 7))
  const [reportData, setReportData] = useState<ReportData>()
  const [reportPeriod, setReportPeriod] = useState({ start: '', end: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const announce = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3200)
  }

  const loadReports = async (month = selectedMonth) => {
    setLoading(true)
    setError('')
    const range = reportRange(month)

    try {
      const [appointments, billing, orders] = await Promise.all([
        appointmentApi.retrieveForStaffRange(range.start, range.end),
        adminBillingApi.list(),
        medicineOrderApi.listForStaff(),
      ])
      setReportData({ appointments, billing, orders })
      setReportPeriod(range)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load reports.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadReports(today.slice(0, 7)) }, [])

  const appointmentBreakdown = useMemo<BarItem[]>(() => {
    const counts = (reportData?.appointments ?? []).reduce<Record<string, number>>((result, appointment) => {
      const bucket = appointmentBucket(appointment)
      result[bucket] = (result[bucket] ?? 0) + 1
      return result
    }, {})
    return [
      { label: 'Completed', value: counts.Completed ?? 0, tone: 'teal' },
      { label: 'Checked in', value: counts['Checked in'] ?? 0, tone: 'violet' },
      { label: 'Scheduled', value: counts.Scheduled ?? 0, tone: 'blue' },
      { label: 'Cancelled', value: counts.Cancelled ?? 0, tone: 'red' },
    ]
  }, [reportData?.appointments])

  const periodBilling = reportData?.billing.filter((bill) => isInReportRange(bill.issuedAt, reportPeriod.start, reportPeriod.end)) ?? []
  const periodOrders = reportData?.orders.filter((order) => isInReportRange(order.placedAt, reportPeriod.start, reportPeriod.end)) ?? []
  const soldOrders = periodOrders.filter((order) => order.status.toLowerCase() !== 'awaiting_payment')
  const dispensedOrders = periodOrders.filter((order) => ['picked_up', 'delivered'].includes(order.status.toLowerCase()))
  const medicineUnitsSold = soldOrders.reduce((total, order) => total + order.lines.reduce((lineTotal, line) => lineTotal + line.qty, 0), 0)
  const medicineRevenue = soldOrders.reduce((total, order) => total + order.total, 0)
  const totalBilled = periodBilling.reduce((total, bill) => total + bill.total, 0)
  const totalCollected = periodBilling.reduce((total, bill) => total + bill.paidAmount, 0)
  const totalOutstanding = periodBilling.reduce((total, bill) => total + bill.amountOutstanding, 0)
  const unpaidBills = periodBilling.filter((bill) => bill.status !== 'Paid')

  const dailyReportData = useMemo<DailyReportPoint[]>(() => {
    const dates = dateKeysBetween(reportPeriod.start, reportPeriod.end)
    const appointments = reportData?.appointments ?? []
    const billing = reportData?.billing ?? []
    const orders = reportData?.orders ?? []

    return dates.map((date) => {
      const dayAppointments = appointments.filter((appointment) => appointment.startAt.slice(0, 10) === date)
      const dayBilling = billing.filter((bill) => bill.issuedAt.slice(0, 10) === date)
      const daySoldOrders = orders.filter((order) => order.placedAt.slice(0, 10) === date && order.status.toLowerCase() !== 'awaiting_payment')

      return {
        date,
        label: date.slice(8),
        appointments: dayAppointments.length,
        consultations: dayAppointments.filter((appointment) => appointment.status.toLowerCase() === 'completed').length,
        cancellations: dayAppointments.filter((appointment) => appointment.status.toLowerCase() === 'cancelled').length,
        billed: dayBilling.reduce((total, bill) => total + bill.total, 0),
        collected: dayBilling.reduce((total, bill) => total + bill.paidAmount, 0),
        outstanding: dayBilling.reduce((total, bill) => total + bill.amountOutstanding, 0),
        units: daySoldOrders.reduce((total, order) => total + order.lines.reduce((lineTotal, line) => lineTotal + line.qty, 0), 0),
        revenue: daySoldOrders.reduce((total, order) => total + order.total, 0),
      }
    })
  }, [reportData?.appointments, reportData?.billing, reportData?.orders, reportPeriod.end, reportPeriod.start])

  const billingComparison = [
    { label: 'Total billed', value: totalBilled, tone: 'var(--staff-blue)' },
    { label: 'Collected', value: totalCollected, tone: 'var(--staff-teal)' },
    { label: 'Outstanding', value: totalOutstanding, tone: 'var(--staff-amber)' },
  ]

  const topSellingMedicines = useMemo<TopMedicine[]>(() => {
    const totals = new Map<string, TopMedicine>()
    const orders = (reportData?.orders ?? []).filter((order) => isInReportRange(order.placedAt, reportPeriod.start, reportPeriod.end) && order.status.toLowerCase() !== 'awaiting_payment')

    orders.forEach((order) => order.lines.forEach((line) => {
      const id = line.id || line.name
      const current = totals.get(id) ?? { id, name: line.name, units: 0, orders: 0, revenue: 0 }
      current.units += line.qty
      current.orders += 1
      current.revenue += line.unitPrice * line.qty
      totals.set(id, current)
    }))

    return [...totals.values()].sort((left, right) => right.units - left.units || right.revenue - left.revenue).slice(0, 8)
  }, [reportData?.orders, reportPeriod.end, reportPeriod.start])

  const peakSalesDay = dailyReportData.reduce<DailyReportPoint | undefined>((peak, day) => !peak || day.units > peak.units ? day : peak, undefined)

  const periodLabel = reportPeriod.start
    ? displayMonth.format(new Date(reportPeriod.start + 'T12:00:00+08:00'))
    : 'No report generated'

  const exportReport = () => {
    if (!reportData || !reportPeriod.start) return

    const rows = [
      ['CarePlus Clinic report', periodLabel],
      ['Report type', 'Monthly'],
      ['Appointments', String(reportData.appointments.length)],
      ['Collected billing', formatCurrency(totalCollected)],
      ['Total billed', formatCurrency(totalBilled)],
      ['Outstanding bills', formatCurrency(totalOutstanding)],
      ['Unpaid or overdue invoices', String(unpaidBills.length)],
      ['Medicine orders sold', String(soldOrders.length)],
      ['Medicine units sold', String(medicineUnitsSold)],
      ['Dispensed orders', String(dispensedOrders.length)],
      ['Medicine revenue', formatCurrency(medicineRevenue)],
      [],
      ['Appointment status', 'Count'],
      ...appointmentBreakdown.map((item) => [item.label, String(item.value)]),
    ]
    const csv = rows.map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'careplus-monthly-report-' + reportPeriod.start + '.csv'
    document.body.append(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    announce('Report exported successfully.')
  }

  return (
    <div className="staff-page reports-page">
      <StaffSidebar activeNav="Reports & analysis" announce={announce} onClose={() => setSidebarOpen(false)} sidebarOpen={sidebarOpen} />
      <main className="staff-main">
        <StaffNavbar activeNav="Reports & analysis" notificationsOpen={notificationsOpen} onOpenSidebar={() => setSidebarOpen(true)} onSearchChange={() => undefined} onToggleNotifications={() => setNotificationsOpen((current) => !current)} searchTerm="" selectedRole={currentRole} theme={theme} toggleTheme={toggleTheme} />
        <div className="staff-content reports-content">
          <section className="reports-hero"><div><StaffPageEyebrow label="Reporting & analysis" /><h1>Reports and analysis</h1><p>Generate daily or monthly summaries for clinic activity, billing, and pharmacy sales.</p></div></section>
          <section aria-label="Report period controls" className="reports-controls">
            <label className="reports-period-field"><span>Choose month</span><input className="staff-date-input" type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} /></label>
            <button className="staff-button staff-button--primary" disabled={loading} type="button" onClick={() => void loadReports()}><Icon name="chart" size={16} /> {loading ? 'Generating…' : 'Generate report'}</button>
            <button className="staff-button staff-button--secondary" disabled={loading || !reportData || !reportPeriod.start} type="button" onClick={exportReport}><Icon name="download" size={16} /> Export CSV</button>
            <span className="reports-period-note">Showing: <strong>{periodLabel}</strong></span>
          </section>
          {error ? <div className="reports-error" role="alert"><Icon name="close" size={17} /><span>{error}</span><button type="button" onClick={() => void loadReports()}>Try again</button></div> : null}
          <section aria-label="Report summary" className="reports-summary">
            <SummaryCard icon="calendar" label="Monthly appointments" value={loading ? '—' : String(reportData?.appointments.length ?? 0)} detail={periodLabel} tone="teal" />
            <SummaryCard icon="check" label="Collected billing" value={loading ? '—' : formatCurrency(totalCollected)} detail={`of ${formatCurrency(totalBilled)} billed`} tone="blue" />
            <SummaryCard icon="check" label="Completed consultations" value={loading ? '—' : String(appointmentBreakdown.find((item) => item.label === 'Completed')?.value ?? 0)} detail={periodLabel} tone="amber" />
            <SummaryCard icon="box" label="Medicine units sold" value={loading ? '—' : String(medicineUnitsSold)} detail={String(soldOrders.length) + ' paid orders · ' + formatCurrency(medicineRevenue)} tone="violet" />
          </section>
          <div className="reports-grid">
            <section className="staff-card reports-panel reports-panel--wide"><div className="reports-panel__header"><div><p className="staff-card__eyebrow">Clinical activity</p><h2>Daily activity trend</h2><span>Appointments, completed consultations, and cancellations.</span></div><Icon name="activity" size={19} /></div><div className="reports-chart"><ResponsiveContainer height={280} width="100%"><LineChart data={dailyReportData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}><CartesianGrid stroke="var(--staff-line)" strokeDasharray="3 3" vertical={false} /><XAxis axisLine={false} dataKey="label" tick={{ fill: 'var(--staff-muted)', fontSize: 11 }} tickLine={false} /><YAxis allowDecimals={false} axisLine={false} tick={{ fill: 'var(--staff-muted)', fontSize: 11 }} tickLine={false} /><Tooltip content={<ReportTooltip />} /><Legend wrapperStyle={{ fontSize: 11, color: 'var(--staff-muted)' }} /><Line dataKey="appointments" dot={{ r: 3 }} name="Appointments" stroke="var(--staff-teal)" strokeWidth={2.4} type="monotone" /><Line dataKey="consultations" dot={{ r: 3 }} name="Consultations" stroke="var(--staff-violet)" strokeWidth={2.4} type="monotone" /><Line dataKey="cancellations" dot={{ r: 3 }} name="Cancellations" stroke="#df6d76" strokeWidth={2.4} type="monotone" /></LineChart></ResponsiveContainer></div></section>
            <section className="staff-card reports-panel"><div className="reports-panel__header"><div><p className="staff-card__eyebrow">Appointment outcomes</p><h2>Outcome breakdown</h2><span>How appointments ended or are progressing.</span></div><Icon name="calendar" size={19} /></div><div className="reports-outcome-layout"><div className="reports-chart reports-chart--donut"><ResponsiveContainer height={205} width="100%"><PieChart><Pie data={appointmentBreakdown} dataKey="value" innerRadius="56%" nameKey="label" outerRadius="78%" paddingAngle={3} stroke="none">{appointmentBreakdown.map((item, index) => <Cell fill={outcomeColors[index]} key={item.label} />)}</Pie><Tooltip content={<ReportTooltip />} /></PieChart></ResponsiveContainer><strong className="reports-donut-total">{reportData?.appointments.length ?? 0}<small>Total</small></strong></div><div className="reports-outcome-legend">{appointmentBreakdown.map((item, index) => <div key={item.label}><span style={{ background: outcomeColors[index] }} /> <span>{item.label}</span><strong>{item.value}</strong></div>)}</div></div></section>
            <section className="staff-card reports-panel"><div className="reports-panel__header"><div><p className="staff-card__eyebrow">Financial position</p><h2>Billing comparison</h2><span>Total billed, collected, and still outstanding.</span></div><Icon name="file" size={19} /></div><div className="reports-chart reports-chart--billing"><ResponsiveContainer height={245} width="100%"><BarChart data={billingComparison} layout="vertical" margin={{ top: 5, right: 12, left: 8, bottom: 5 }}><CartesianGrid stroke="var(--staff-line)" strokeDasharray="3 3" horizontal={false} /><XAxis axisLine={false} tick={{ fill: 'var(--staff-muted)', fontSize: 10 }} tickFormatter={(value) => formatCurrency(Number(value))} tickLine={false} type="number" /><YAxis axisLine={false} dataKey="label" tick={{ fill: 'var(--staff-muted)', fontSize: 11 }} tickLine={false} type="category" width={78} /><Tooltip content={<ReportTooltip />} /><Bar dataKey="value" fill="var(--staff-blue)" radius={[0, 5, 5, 0]}>{billingComparison.map((item) => <Cell fill={item.tone} key={item.label} />)}</Bar></BarChart></ResponsiveContainer></div><div className="reports-finance-list reports-finance-list--compact"><div><span>Collection rate</span><strong>{totalBilled ? String(Math.round((totalCollected / totalBilled) * 100)) + '%' : '0%'}</strong></div><div><span>Unpaid / overdue invoices</span><strong>{unpaidBills.length}</strong></div></div></section>
            <section className="staff-card reports-panel reports-panel--wide"><div className="reports-panel__header"><div><p className="staff-card__eyebrow">Pharmacy sales</p><h2>Medicine sales by day</h2><span>Units sold and medicine revenue across the selected month.</span></div><Icon name="box" size={19} /></div><div className="reports-medicine-sales-summary"><div><span>Total units sold</span><strong>{medicineUnitsSold}</strong><small>{soldOrders.length} paid orders</small></div><div><span>Medicine revenue</span><strong>{formatCurrency(medicineRevenue)}</strong><small>Excluding unpaid orders</small></div><div><span>Peak sales day</span><strong>{peakSalesDay?.units ?? 0} units</strong><small>{peakSalesDay?.label ?? 'No sales yet'}</small></div></div><div className="reports-medicine-sales-charts"><div className="reports-mini-chart"><div className="reports-mini-chart__header"><span>Units sold</span><strong>{medicineUnitsSold}</strong></div><ResponsiveContainer height={230} width="100%"><BarChart data={dailyReportData} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}><CartesianGrid stroke="var(--staff-line)" strokeDasharray="3 3" vertical={false} /><XAxis axisLine={false} dataKey="label" tick={{ fill: 'var(--staff-muted)', fontSize: 10 }} tickLine={false} /><YAxis allowDecimals={false} axisLine={false} tick={{ fill: 'var(--staff-muted)', fontSize: 10 }} tickLine={false} /><Tooltip content={<ReportTooltip />} /><Bar dataKey="units" fill="var(--staff-violet)" name="Units sold" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div><div className="reports-mini-chart"><div className="reports-mini-chart__header"><span>Revenue by day</span><strong>{formatCurrency(medicineRevenue)}</strong></div><ResponsiveContainer height={230} width="100%"><LineChart data={dailyReportData} margin={{ top: 12, right: 8, left: -8, bottom: 0 }}><CartesianGrid stroke="var(--staff-line)" strokeDasharray="3 3" vertical={false} /><XAxis axisLine={false} dataKey="label" tick={{ fill: 'var(--staff-muted)', fontSize: 10 }} tickLine={false} /><YAxis axisLine={false} tick={{ fill: 'var(--staff-muted)', fontSize: 10 }} tickFormatter={(value) => formatCurrency(Number(value))} tickLine={false} /><Tooltip content={<ReportTooltip />} /><Line dataKey="revenue" dot={{ fill: 'var(--staff-teal)', r: 3 }} name="Revenue" stroke="var(--staff-teal)" strokeWidth={2.5} type="monotone" /></LineChart></ResponsiveContainer></div></div></section>
            <section className="staff-card reports-panel reports-panel--wide"><div className="reports-panel__header"><div><p className="staff-card__eyebrow">Product performance</p><h2>Top-selling medicines</h2><span>Ranked by units sold during the selected period.</span></div><Icon name="chart" size={19} /></div><div className="reports-top-table-wrap"><table className="reports-top-table"><thead><tr><th>Medicine</th><th>Units sold</th><th>Orders</th><th>Revenue</th></tr></thead><tbody>{topSellingMedicines.map((medicine) => <tr key={medicine.id}><td><strong>{medicine.name}</strong><small>{medicine.id}</small></td><td>{medicine.units}</td><td>{medicine.orders}</td><td><strong>{formatCurrency(medicine.revenue)}</strong></td></tr>)}</tbody></table>{!loading && !topSellingMedicines.length ? <p className="reports-empty">No medicine sales found for this period.</p> : null}</div></section>
          </div>
        </div>
      </main>
      {notice ? <div aria-live="polite" className="staff-toast"><span><Icon name="check" size={17} /></span>{notice}</div> : null}
    </div>
  )
}
