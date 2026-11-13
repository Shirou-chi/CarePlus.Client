import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../navbar/StaffIcon'
import './StaffDateFilter.css'

export type StaffDateRange = {
  start: string | null
  end: string | null
}

type StaffDateFilterProps = {
  value: StaffDateRange
  onChange: (value: StaffDateRange) => void
  label?: string
  emptyLabel?: string
  selectionMode?: 'single' | 'range'
  disabled?: boolean
  minDate?: string
}

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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

function formatDate(value: string) {
  return fromDateKey(value).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatRange(value: StaffDateRange, emptyLabel: string) {
  if (!value.start) return emptyLabel
  if (!value.end || value.start === value.end) return formatDate(value.start)

  const start = fromDateKey(value.start)
  const end = fromDateKey(value.end)
  const startText = start.toLocaleDateString([], { day: '2-digit', month: 'short' })
  const endText = end.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })
  return `${startText} – ${endText}`
}

function monthTitle(value: Date) {
  return value.toLocaleDateString([], { month: 'long', year: 'numeric' })
}

export function StaffDateFilter({
  value,
  onChange,
  label = 'Filter by date',
  emptyLabel = 'All dates',
  selectionMode = 'range',
  disabled = false,
  minDate,
}: StaffDateFilterProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const initialDate = value.start ? fromDateKey(value.start) : new Date()
    return new Date(initialDate.getFullYear(), initialDate.getMonth(), 1)
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
    const calendarStart = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1 - firstDay.getDay())

    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(calendarStart)
      day.setDate(calendarStart.getDate() + index)
      return day
    })
  }, [visibleMonth])

  const isBeforeMinDate = (value: string) => Boolean(minDate && value < minDate)

  const selectDate = (date: Date) => {
    const selectedDate = toDateKey(date)
    if (isBeforeMinDate(selectedDate)) return

    if (selectionMode === 'single') {
      onChange({ start: selectedDate, end: null })
      setOpen(false)
      return
    }

    if (!value.start || value.end) {
      onChange({ start: selectedDate, end: null })
      return
    }

    if (selectedDate === value.start) {
      setOpen(false)
      return
    }

    if (selectedDate < value.start) {
      onChange({ start: selectedDate, end: value.start })
    } else {
      onChange({ start: value.start, end: selectedDate })
    }
    setOpen(false)
  }

  const moveMonth = (offset: number) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1))
  }

  const clearDate = () => {
    onChange({ start: null, end: null })
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="staff-date-filter">
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={label}
        className={`staff-date-filter__trigger${value.start ? ' is-active' : ''}`}
        disabled={disabled}
        type="button"
        onClick={() => setOpen((current) => !current)}
      >
        <Icon name="calendar" size={14} />
        <span>{formatRange(value, emptyLabel)}</span>
        <Icon name="chevronDown" size={13} />
      </button>

      {open ? (
        <div aria-label="Choose audit date or date range" className="staff-date-filter__popover" role="dialog">
          <div className="staff-date-filter__header">
            <strong>{monthTitle(visibleMonth)}</strong>
            <div>
              <button aria-label="Previous month" type="button" onClick={() => moveMonth(-1)}><span aria-hidden="true">‹</span></button>
              <button aria-label="Next month" type="button" onClick={() => moveMonth(1)}><span aria-hidden="true">›</span></button>
            </div>
          </div>

          <div className="staff-date-filter__weekdays">
            {weekDays.map((day) => <span key={day}>{day}</span>)}
          </div>

          <div className="staff-date-filter__days">
            {calendarDays.map((day) => {
              const dayKey = toDateKey(day)
              const isOutsideMonth = day.getMonth() !== visibleMonth.getMonth()
              const isStart = dayKey === value.start
              const isEnd = dayKey === value.end
              const hasRange = Boolean(value.start && value.end)
              const isInRange = hasRange && dayKey > value.start! && dayKey < value.end!
              const isToday = dayKey === toDateKey(new Date())
              const isDisabled = isBeforeMinDate(dayKey)

              return (
                <button
                  key={dayKey}
                  aria-label={formatDate(dayKey)}
                  className={[
                    'staff-date-filter__day',
                    isOutsideMonth ? 'is-outside' : '',
                    isToday ? 'is-today' : '',
                    isStart ? 'is-start' : '',
                    isEnd ? 'is-end' : '',
                    isInRange ? 'is-in-range' : '',
                    isDisabled ? 'is-disabled' : '',
                  ].filter(Boolean).join(' ')}
                  disabled={disabled || isDisabled}
                  type="button"
                  onClick={() => selectDate(day)}
                >
                  <span>{day.getDate()}</span>
                </button>
              )
            })}
          </div>

          <div className="staff-date-filter__footer">
            <span>{value.start && !value.end ? 'Select another date for a range' : value.start ? 'Date range selected' : 'Choose a date or range'}</span>
            {value.start ? <button type="button" onClick={clearDate}>Clear</button> : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
