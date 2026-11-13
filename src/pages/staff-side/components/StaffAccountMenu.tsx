import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { Icon } from '../navbar/StaffIcon'

type StaffAccountMenuProps = {
  children: ReactNode
  className?: string
  onClose?: () => void
  onSettings: () => void
  triggerClassName: string
  triggerLabel: string
}

export function StaffAccountMenu({ children, className = '', onClose, onSettings, triggerClassName, triggerLabel }: StaffAccountMenuProps) {
  const { logout, user } = useAuth()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false)
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  const handleSettings = () => {
    setOpen(false)
    onSettings()
  }

  const handleSignOut = async () => {
    setOpen(false)
    await logout()
    onClose?.()
  }

  return (
    <div className={`staff-account-menu-wrap ${className}`.trim()} ref={menuRef}>
      <button aria-expanded={open} aria-haspopup="menu" aria-label={triggerLabel} className={triggerClassName} type="button" onClick={() => setOpen((current) => !current)}>
        {children}
      </button>
      {open ? <div aria-label="Account menu" className="staff-account-menu" role="menu">
        <div className="staff-account-menu__heading"><small>Signed in as</small><strong>{user?.email || user?.username || 'Staff account'}</strong></div>
        <button role="menuitem" type="button" onClick={handleSettings}><Icon name="settings" size={16} /> Account settings</button>
        <button className="staff-account-menu__danger" role="menuitem" type="button" onClick={() => void handleSignOut()}><Icon name="logout" size={16} /> Sign out</button>
      </div> : null}
    </div>
  )
}
