import { useEffect, useState } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { resolveProfilePictureUrl } from '@/services/profileApi'
import { staffApi } from '@/services/staffApi'

type StaffProfileAvatarProps = {
  className?: string
}

function initialsFor(name: string | undefined) {
  return (name || 'Staff')
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function StaffProfileAvatar({ className = 'staff-avatar' }: StaffProfileAvatarProps) {
  const { user } = useAuth()
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null

    const loadPhoto = async () => {
      if (user?.role !== 'Doctor' || !user.staffId) {
        setPhotoUrl(null)
        return
      }

      const details = await staffApi.retrieveByRole('Doctor', user.staffId).catch(() => null)
      if (cancelled || !details?.profilePicture) {
        return
      }

      const url = await resolveProfilePictureUrl(details.profilePicture)
      if (cancelled) {
        if (url) URL.revokeObjectURL(url)
        return
      }

      objectUrl = url
      setPhotoUrl(url)
    }

    void loadPhoto()

    const refreshPhoto = () => {
      void loadPhoto()
    }
    window.addEventListener('staff-profile-photo-updated', refreshPhoto)

    return () => {
      cancelled = true
      window.removeEventListener('staff-profile-photo-updated', refreshPhoto)
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [user?.role, user?.staffId])

  return <span className={className}>{photoUrl ? <img src={photoUrl} alt="Doctor profile" /> : initialsFor(user?.name)}</span>
}
