import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { announcementApi, type ApiAnnouncement } from '@/services/announcementApi'
import { useTheme } from '../../../components/theme/useTheme'
import { StaffPageEyebrow } from '../components/StaffPageEyebrow'
import { Icon } from '../navbar/StaffIcon'
import { StaffNavbar } from '../navbar/StaffNavbar'
import { getStaffRole, StaffSidebar } from '../navbar/StaffSidebar'
import '../StaffHomePage.css'
import './AnnouncementsPage.css'

export function AnnouncementsPage() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const currentRole = getStaffRole(user?.role)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [titleZh, setTitleZh] = useState('')
  const [bodyZh, setBodyZh] = useState('')
  const [announcements, setAnnouncements] = useState<ApiAnnouncement[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const announce = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3200)
  }

  const loadAnnouncements = async () => {
    setLoading(true)
    setError('')
    try {
      setAnnouncements(await announcementApi.list())
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load announcements.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadAnnouncements() }, [])

  const submitAnnouncement = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!title.trim() || !body.trim()) {
      setError('Add a title and message before publishing.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const created = await announcementApi.create({
        title: title.trim(),
        body: body.trim(),
        titleZh: titleZh.trim() || undefined,
        bodyZh: bodyZh.trim() || undefined,
      })
      setAnnouncements((current) => [created, ...current.filter((item) => item.id !== created.id)])
      setTitle('')
      setBody('')
      setTitleZh('')
      setBodyZh('')
      announce('Announcement published to the clinic portal.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to publish the announcement.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="staff-page announcements-admin-page">
      <StaffSidebar activeNav="Announcements" announce={announce} onClose={() => setSidebarOpen(false)} sidebarOpen={sidebarOpen} />
      <main className="staff-main">
        <StaffNavbar
          activeNav="Announcements"
          notificationsOpen={notificationsOpen}
          onOpenSidebar={() => setSidebarOpen(true)}
          onSearchChange={() => undefined}
          onToggleNotifications={() => setNotificationsOpen((current) => !current)}
          searchTerm=""
          selectedRole={currentRole}
          theme={theme}
          toggleTheme={toggleTheme}
        />

        <div className="staff-content announcements-admin-content">
          <section className="announcements-admin-hero">
            <div>
              <StaffPageEyebrow label="Public communications" />
              <h1>Announcements</h1>
              <p>Publish clinic updates that appear on the public announcements page and in patient notifications.</p>
            </div>
            <span className="announcements-admin-hero__badge"><Icon name="bell" size={16} /> Admin only</span>
          </section>

          {error ? <div className="announcements-admin-message announcements-admin-message--error" role="alert"><Icon name="close" size={16} /><span>{error}</span><button type="button" onClick={() => void loadAnnouncements()}>Try again</button></div> : null}
          {notice ? <div className="announcements-admin-message announcements-admin-message--success" role="status"><Icon name="check" size={16} /><span>{notice}</span></div> : null}

          <div className="announcements-admin-grid">
            <section className="staff-card announcements-composer">
              <div className="announcements-card-heading"><span className="announcements-card-heading__icon"><Icon name="edit" size={18} /></span><div><p className="staff-card__eyebrow">Create update</p><h2>New announcement</h2><span>Keep patients informed about clinic operations and public notices.</span></div></div>
              <form className="announcements-form" onSubmit={submitAnnouncement}>
                <label>Title<input maxLength={160} placeholder="e.g. Clinic closed on public holiday" required value={title} onChange={(event) => setTitle(event.target.value)} /></label>
                <label>Message<textarea maxLength={4000} placeholder="Write the announcement message" required rows={7} value={body} onChange={(event) => setBody(event.target.value)} /></label>
                <div className="announcements-form__section"><span>Optional Chinese translation</span><small>Patients can switch languages to read these fields.</small></div>
                <label>Chinese title<input maxLength={160} placeholder="公告标题" value={titleZh} onChange={(event) => setTitleZh(event.target.value)} /></label>
                <label>Chinese message<textarea maxLength={4000} placeholder="公告内容" rows={5} value={bodyZh} onChange={(event) => setBodyZh(event.target.value)} /></label>
                <div className="announcements-form__actions"><span>Published immediately</span><button className="staff-button staff-button--primary" disabled={saving} type="submit"><Icon name="upload" size={16} />{saving ? 'Publishing…' : 'Publish announcement'}</button></div>
              </form>
            </section>

            <section className="staff-card announcements-list-card">
              <div className="announcements-card-heading"><span className="announcements-card-heading__icon announcements-card-heading__icon--blue"><Icon name="bell" size={18} /></span><div><p className="staff-card__eyebrow">Live notices</p><h2>Published announcements</h2><span>Most recent public messages from CarePlus Clinic.</span></div></div>
              <div className="announcements-admin-list">
                {loading ? <div className="announcements-admin-empty"><Icon name="clock" size={22} /><strong>Loading announcements…</strong></div> : null}
                {!loading && announcements.length === 0 ? <div className="announcements-admin-empty"><Icon name="bell" size={22} /><strong>No announcements yet</strong><span>Publish your first clinic update using the form.</span></div> : null}
                {!loading ? announcements.map((item) => <article className="announcements-admin-item" key={item.id}><div><strong>{item.title}</strong><small>{item.postedOn}</small></div><p>{item.body}</p></article>) : null}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
