import { useEffect, useState } from 'react'
import { resolveMedicineImageUrl } from '@/services/medicineImageApi'
import { Icon } from '../navbar/StaffIcon'

type MedicineImageProps = {
  medicineId: string
  imagePath?: string | null
  alt: string
  size?: number
}

export function MedicineImage({ medicineId, imagePath, alt, size = 17 }: MedicineImageProps) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    let objectUrl: string | null = null

    setSrc(null)
    void resolveMedicineImageUrl(medicineId, imagePath).then((url) => {
      if (!active) {
        if (url) URL.revokeObjectURL(url)
        return
      }

      objectUrl = url
      setSrc(url)
    })

    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [imagePath, medicineId])

  if (!src) return <Icon name="box" size={size} />
  return <img alt={alt} className="medicine-image" src={src} />
}
