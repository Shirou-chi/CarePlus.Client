import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../navbar/StaffIcon'
import './StaffWeekFilter.css'

type StaffWeekFilterProps = {
  value: string
  onChange: (weekStart: string) => void
  label?: string
  disabled?: boolean
}

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function toDateKey(value: Date) {
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
}

function fromDateKey(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function startOfWeek(value: Date) {
  const date = new Date(value)
  const day = date.getDay()
  const difference = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + difference)
  date.setHours(0, 0, 0, 0)
  return date
}

function formatWeek(value: string) {
  const start = fromDateKey(value)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)

  return `${start.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })} – ${end.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}`
}

function monthTitle(value: Date) {
  return value.toLocaleDateString([], { month: 'long' })
}

export function StaffWeekFilter({ value, onChange, label = 'Choose week', disabled = false }: StaffWeekFilterProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const selected = fromDateKey(value)
    return new Date(selected.getFullYear(), selected.getMonth(), 1)
  })

  useEffect(() => {
    if (disabled) setOpen(false)

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [disabled])

  const calendarDays = useMemo(() => {
    const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1)
    const calendarStart = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1 - (firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1))

    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(calendarStart)
      day.setDate(calendarStart.getDate() + index)
      return day
    })
  }, [visibleMonth])

  const selectedWeekStart = fromDateKey(value)
  const selectedWeekEnd = new Date(selectedWeekStart)
  selectedWeekEnd.setDate(selectedWeekStart.getDate() + 6)
  const todayKey = toDateKey(new Date())

  const selectDate = (date: Date) => {
    onChange(toDateKey(startOfWeek(date)))
    setOpen(false)
  }

  const selectToday = () => {
    onChange(toDateKey(startOfWeek(new Date())))
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="staff-week-filter">
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={label}
        className={`staff-week-filter__trigger${open ? ' is-open' : ''}`}
        disabled={disabled}
        type="button"
        onClick={() => setOpen((current) => !current)}
      >
        <Icon name="calendar" size={14} />
        <span>{formatWeek(value)}</span>
        <Icon name="chevronDown" size={13} />
      </button>

      {open ? (
        <div aria-label="Choose schedule week" className="staff-week-filter__popover" role="dialog">
          <div className="staff-week-filter__header">
            <div><strong>{visibleMonth.getFullYear()}</strong><span>{monthTitle(visibleMonth)}</span></div>
            <div className="staff-week-filter__month-actions">
              <button aria-label="Previous month" type="button" onClick={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}><Icon name="chevronRight" size={14} /></button>
              <button aria-label="Next month" type="button" onClick={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}><Icon name="chevronRight" size={14} /></button>
            </div>
          </div>

          <div className="staff-week-filter__weekdays">{weekDays.map((day) => <span key={day}>{day}</span>)}</div>

          <div className="staff-week-filter__days">
            {calendarDays.map((day) => {
              const dayKey = toDateKey(day)
              const isSelected = day >= selectedWeekStart && day <= selectedWeekEnd
              const isOutsideMonth = day.getMonth() !== visibleMonth.getMonth()

              return (
                <button
                  key={dayKey}
                  aria-label={`Week of ${formatWeek(toDateKey(startOfWeek(day)))}`}
                  className={[
                    'staff-week-filter__day',
                    isOutsideMonth ? 'is-outside' : '',
                    isSelected ? 'is-selected-week' : '',
                    dayKey === todayKey ? 'is-today' : '',
                    dayKey === toDateKey(selectedWeekStart) ? 'is-week-start' : '',
                    dayKey === toDateKey(selectedWeekEnd) ? 'is-week-end' : '',
                  ].filter(Boolean).join(' ')}
                  type="button"
                  onClick={() => selectDate(day)}
                >
                  <span>{day.getDate()}</span>
                </button>
              )
            })}
          </div>

          <div className="staff-week-filter__footer">
            <span>Choose a week</span>
            <button type="button" onClick={selectToday}>Today</button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
