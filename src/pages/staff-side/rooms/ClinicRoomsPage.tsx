import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { clinicRoomApi, type ClinicRoomRecord, type ClinicRoomStatus } from '@/services/clinicRoomApi'
import { useTheme } from '../../../components/theme/useTheme'
import { StaffDialog } from '../components/StaffDialog'
import { Icon } from '../navbar/StaffIcon'
import { StaffNavbar } from '../navbar/StaffNavbar'
import { getStaffRole, StaffSidebar } from '../navbar/StaffSidebar'
import { StaffPageEyebrow } from '../components/StaffPageEyebrow'
import '../StaffHomePage.css'
import './ClinicRoomsPage.css'

const roomStatuses: ClinicRoomStatus[] = ['Available', 'Occupied', 'Maintenance', 'Inactive']

function statusClass(status: string) {
  return status.toLowerCase().replace(/\s+/g, '-')
}

function normalizeStatus(status: string): ClinicRoomStatus {
  return roomStatuses.find((item) => item.toLowerCase() === status.toLowerCase()) ?? 'Inactive'
}

export function ClinicRoomsPage() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const currentRole = getStaffRole(user?.role)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [rooms, setRooms] = useState<ClinicRoomRecord[]>([])
  const [selectedRoom, setSelectedRoom] = useState<ClinicRoomRecord | null>(null)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  const announce = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3200)
  }

  const loadRooms = async () => {
    setLoading(true)
    setError('')

    try {
      setRooms(await clinicRoomApi.retrieveAll())
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load clinic rooms.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadRooms()
  }, [])

  const counts = useMemo(() => ({
    total: rooms.length,
    available: rooms.filter((room) => normalizeStatus(room.status) === 'Available').length,
    occupied: rooms.filter((room) => normalizeStatus(room.status) === 'Occupied').length,
    maintenance: rooms.filter((room) => normalizeStatus(room.status) === 'Maintenance').length,
  }), [rooms])

  const closeDialog = () => {
    setDialogMode(null)
    setSelectedRoom(null)
    setFormError('')
  }

  const openCreate = () => {
    setSelectedRoom(null)
    setFormError('')
    setDialogMode('create')
  }

  const openEdit = (room: ClinicRoomRecord) => {
    setSelectedRoom(room)
    setFormError('')
    setDialogMode('edit')
  }

  const submitRoom = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const values = new FormData(form)
    const roomName = String(values.get('roomName') ?? '').trim()
    const status = normalizeStatus(String(values.get('status') ?? 'Available'))

    setSaving(true)
    setFormError('')

    try {
      if (dialogMode === 'edit' && selectedRoom) {
        await clinicRoomApi.update({ roomId: selectedRoom.roomId, roomName, status })
        announce('Clinic room updated.')
      } else {
        await clinicRoomApi.create({ roomName, status })
        announce('Clinic room created.')
      }

      closeDialog()
      await loadRooms()
    } catch (requestError) {
      setFormError(requestError instanceof Error ? requestError.message : 'Unable to save clinic room.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="staff-page clinic-rooms-page">
      <StaffSidebar activeNav="Clinic rooms" announce={announce} onClose={() => setSidebarOpen(false)} sidebarOpen={sidebarOpen} />

      <main className="staff-main">
        <StaffNavbar activeNav="Clinic rooms" notificationsOpen={notificationsOpen} onOpenSidebar={() => setSidebarOpen(true)} onSearchChange={() => undefined} onToggleNotifications={() => setNotificationsOpen((current) => !current)} searchTerm="" selectedRole={currentRole} theme={theme} toggleTheme={toggleTheme} />

        <div className="staff-content clinic-rooms-content">
          <section className="clinic-rooms-hero">
            <div>
              <p className="staff-eyebrow">Clinical operations</p>
              <h1>Clinic rooms</h1>
              <p className="clinic-rooms-hero__copy">Manage consultation spaces and room availability.</p>
            </div>
            <button className="staff-button staff-button--primary" type="button" onClick={openCreate}><Icon name="plus" size={17} /> Add room</button>
          </header>

          <section aria-label="Room summary" className="clinic-rooms-summary">
            <article className="clinic-room-summary-card clinic-room-summary-card--teal"><span><Icon name="activity" size={18} /></span><small>Total rooms</small><strong>{counts.total}</strong><em>Clinic spaces</em></article>
            <article className="clinic-room-summary-card clinic-room-summary-card--blue"><span><Icon name="check" size={18} /></span><small>Available</small><strong>{counts.available}</strong><em>Ready for use</em></article>
            <article className="clinic-room-summary-card clinic-room-summary-card--amber"><span><Icon name="clock" size={18} /></span><small>Occupied</small><strong>{counts.occupied}</strong><em>In use now</em></article>
            <article className="clinic-room-summary-card clinic-room-summary-card--violet"><span><Icon name="shield" size={18} /></span><small>Maintenance</small><strong>{counts.maintenance}</strong><em>Need attention</em></article>
          </section>

          <section className="staff-card clinic-rooms-list-card">
            <div className="staff-card__header"><div><p className="staff-card__eyebrow">Room directory</p><h2>Clinic rooms</h2><span className="clinic-rooms-description">Update room status when spaces become available, occupied, or unavailable.</span></div><span className="clinic-rooms-count">{rooms.length} rooms</span></div>
            {error ? <div className="clinic-rooms-error" role="alert"><strong>Unable to load clinic rooms</strong><span>{error}</span><button type="button" onClick={() => void loadRooms()}>Try again</button></div> : null}
            {loading ? <div className="clinic-rooms-empty"><Icon name="activity" size={25} /><strong>Loading rooms</strong><span>Getting room records from the clinic API.</span></div> : null}
            {!loading && !error && rooms.length ? <div className="clinic-rooms-grid">{rooms.map((room) => { const status = normalizeStatus(room.status); return <article className="clinic-room-card" key={room.roomId}><div className="clinic-room-card__top"><span className="clinic-room-icon"><Icon name="activity" size={19} /></span><span className={`clinic-room-status clinic-room-status--${statusClass(status)}`}><i />{status}</span></div><h3>{room.roomName}</h3><p>{room.roomId}</p><button className="clinic-room-edit" type="button" onClick={() => openEdit(room)}><Icon name="edit" size={14} /> Edit room</button></article> })}</div> : null}
            {!loading && !error && !rooms.length ? <div className="clinic-rooms-empty"><Icon name="activity" size={25} /><strong>No clinic rooms yet</strong><span>Add the first room to start tracking availability.</span><button className="staff-button staff-button--secondary" type="button" onClick={openCreate}><Icon name="plus" size={15} /> Add room</button></div> : null}
          </section>
        </div>
      </main>

      {dialogMode ? <StaffDialog className="clinic-room-dialog" closeLabel="Close room form" closeOnBackdropClick={false} eyebrow="Clinic room management" onClose={closeDialog} title={dialogMode === 'edit' ? 'Edit clinic room' : 'Add clinic room'} titleId="clinic-room-dialog-title"><form className="clinic-room-form" onSubmit={submitRoom}><label>Room name<input autoFocus defaultValue={selectedRoom?.roomName ?? ''} name="roomName" placeholder="e.g. Consultation room 01" required /></label><label>Status<select defaultValue={normalizeStatus(selectedRoom?.status ?? 'Available')} name="status">{roomStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>{formError ? <div className="clinic-room-form-error" role="alert">{formError}</div> : null}<div className="clinic-room-dialog__actions"><button className="staff-button staff-button--secondary" disabled={saving} type="button" onClick={closeDialog}>Cancel</button><button className="staff-button staff-button--primary" disabled={saving} type="submit">{saving ? 'Saving…' : dialogMode === 'edit' ? 'Save changes' : 'Create room'}</button></div></form></StaffDialog> : null}
      {notice ? <div aria-live="polite" className="staff-toast"><span><Icon name="check" size={17} /></span>{notice}</div> : null}
    </div>
  )
}
