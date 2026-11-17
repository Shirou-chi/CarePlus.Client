import { useEffect, useState } from 'react'
import { Icon } from '../navbar/StaffIcon'
import './StaffListControls.css'

const staffPageSizes = [10, 25, 50]

export function useStaffPagination<T>(items: readonly T[], initialPageSize = 10) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const startIndex = (currentPage - 1) * pageSize

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount))
  }, [pageCount])

  return {
    page: currentPage,
    pageSize,
    pageCount,
    totalItems: items.length,
    startIndex,
    pageItems: items.slice(startIndex, startIndex + pageSize),
    setPage,
    setPageSize: (value: number) => {
      setPageSize(value)
      setPage(1)
    },
  }
}

type StaffPaginationProps = {
  currentPage: number
  pageSize: number
  pageCount: number
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

export function StaffPagination({
  currentPage,
  pageSize,
  pageCount,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: StaffPaginationProps) {
  const firstItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const lastItem = Math.min(currentPage * pageSize, totalItems)

  return (
    <nav aria-label="List pagination" className="staff-pagination">
      <span className="staff-pagination__summary">Showing {firstItem}–{lastItem} of {totalItems}</span>
      <label className="staff-pagination__size">
        <span>Rows per page</span>
        <select aria-label="Rows per page" value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
          {staffPageSizes.map((size) => <option key={size} value={size}>{size}</option>)}
        </select>
      </label>
      {pageCount > 1 ? <>
        <span aria-live="polite" className="staff-pagination__page">Page {currentPage} of {pageCount}</span>
        <div className="staff-pagination__actions">
          <button aria-label="Previous page" disabled={currentPage <= 1} type="button" onClick={() => onPageChange(currentPage - 1)}>
            <Icon name="arrowLeft" size={14} /> <span>Previous</span>
          </button>
          <button aria-label="Next page" disabled={currentPage >= pageCount} type="button" onClick={() => onPageChange(currentPage + 1)}>
            <span>Next</span> <Icon name="chevronRight" size={14} />
          </button>
        </div>
      </> : null}
    </nav>
  )
}

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
