import type { ReactNode } from 'react'
import { Icon } from '../navbar/StaffIcon'
import './StaffDialog.css'

type StaffDialogProps = {
  children: ReactNode
  closeLabel?: string
  className?: string
  closeOnBackdropClick?: boolean
  eyebrow: string
  onClose: () => void
  title: string
  titleId: string
}

export function StaffDialog({
  children,
  closeLabel = 'Close dialog',
  className = '',
  closeOnBackdropClick = true,
  eyebrow,
  onClose,
  title,
  titleId,
}: StaffDialogProps) {
  return (
    <div className="staff-dialog-backdrop" role="presentation" onClick={closeOnBackdropClick ? onClose : undefined}>
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className={`staff-dialog ${className}`.trim()}
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="staff-dialog__header">
          <div>
            <p className="staff-card__eyebrow">{eyebrow}</p>
            <h2 id={titleId}>{title}</h2>
          </div>
          <button aria-label={closeLabel} type="button" onClick={onClose}>
            <Icon name="close" size={19} />
          </button>
        </div>
        {children}
      </section>
    </div>
  )
}
