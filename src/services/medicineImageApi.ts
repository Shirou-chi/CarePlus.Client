import { baseUrl } from './api'

export async function resolveMedicineImageUrl(
  medicineId: string,
  imagePath: string | null | undefined,
): Promise<string | null> {
  if (!imagePath) return null

  const response = await fetch(
    `${baseUrl}/api/Medicine/Image/${encodeURIComponent(medicineId)}`,
  )

  if (!response.ok) return null
  return URL.createObjectURL(await response.blob())
}
