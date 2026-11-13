import { Icon } from '../navbar/StaffIcon'
import './StaffListControls.css'

type StaffListSortProps = {
  label: string
  options: readonly string[]
  value: string
  onChange: (value: string) => void
}

export function StaffListSort({ label, options, value, onChange }: StaffListSortProps) {
  return (
    <label className="staff-list-sort">
      <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
      <Icon name="chevronDown" size={14} />
    </label>
  )
}

export function StaffListReset({ label = 'Reset filters', onClick }: { label?: string; onClick: () => void }) {
  return (
    <button aria-label={label} className="staff-list-reset" type="button" onClick={onClick}>
      <Icon name="refresh" size={14} />
      Reset
    </button>
  )
}
