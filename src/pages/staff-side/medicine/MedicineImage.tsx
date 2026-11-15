import { useEffect, useState } from 'react'
import { medicineImageUrl } from '@/components/marketing/medicine/medicine-shot'
import { Icon } from '../navbar/StaffIcon'

type MedicineImageProps = {
  medicineId: string
  imagePath?: string | null
  alt: string
  size?: number
}

export function MedicineImage({ medicineId, imagePath, alt, size = 17 }: MedicineImageProps) {
  const [failed, setFailed] = useState(false)
  const src = medicineImageUrl(medicineId, imagePath)

  useEffect(() => {
    setFailed(false)
  }, [imagePath, medicineId])

  if (!src || failed) return <Icon name="box" size={size} />
  return <img alt={alt} className="medicine-image" onError={() => setFailed(true)} src={src} />
}
