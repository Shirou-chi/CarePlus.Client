import { useEffect, useRef, useState, type ChangeEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { StaffDialog } from './StaffDialog'
import './StaffPhotoCropDialog.css'

const defaultOutputSize = 640

export function getProfilePhotoFileName(prefix: string, identifier: string) {
  const safePrefix = prefix.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'profile'
  const safeIdentifier = identifier.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'user'
  return `${safePrefix}-${safeIdentifier}`
}

export type StaffPhotoCropDialogProps = {
  file: File
  outputFileName: string
  outputSize?: number
  outputMimeType?: 'image/jpeg' | 'image/png' | 'image/webp'
  eyebrow?: string
  title?: string
  description?: string
  saveLabel?: string
  busyLabel?: string
  busy?: boolean
  error?: string
  onCancel: () => void
  onComplete: (file: File) => void | Promise<void>
  onError?: (message: string) => void
}

export function StaffPhotoCropDialog({
  file,
  outputFileName,
  outputSize = defaultOutputSize,
  outputMimeType,
  eyebrow = 'Profile picture',
  title = 'Crop profile picture',
  description = 'Drag the photo to position it, then adjust the zoom before saving.',
  saveLabel = 'Use this crop',
  busyLabel = 'Saving…',
  busy = false,
  error = '',
  onCancel,
  onComplete,
  onError,
}: StaffPhotoCropDialogProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null)
  const onErrorRef = useRef(onError)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [sourceUrl, setSourceUrl] = useState('')
  const [cropSize, setCropSize] = useState(320)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isCropping, setIsCropping] = useState(false)

  onErrorRef.current = onError

  useEffect(() => {
    let cancelled = false
    const objectUrl = URL.createObjectURL(file)
    const nextImage = new Image()

    setImage(null)
    setSourceUrl(objectUrl)
    setZoom(1)
    setOffset({ x: 0, y: 0 })

    nextImage.onload = () => {
      if (!cancelled) setImage(nextImage)
    }
    nextImage.onerror = () => {
      if (!cancelled) onErrorRef.current?.('Unable to read the selected image.')
    }
    nextImage.src = objectUrl

    return () => {
      cancelled = true
      setSourceUrl((current) => current === objectUrl ? '' : current)
      URL.revokeObjectURL(objectUrl)
    }
  }, [file])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const updateCropSize = () => setCropSize(Math.max(1, viewport.clientWidth))
    updateCropSize()

    const observer = new ResizeObserver(updateCropSize)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [])

  const getMetrics = (nextZoom = zoom) => {
    if (!image) return null

    const coverScale = Math.max(cropSize / image.naturalWidth, cropSize / image.naturalHeight)
    const renderedWidth = image.naturalWidth * coverScale * nextZoom
    const renderedHeight = image.naturalHeight * coverScale * nextZoom

    return {
      renderedWidth,
      renderedHeight,
      maxX: Math.max(0, (renderedWidth - cropSize) / 2),
      maxY: Math.max(0, (renderedHeight - cropSize) / 2),
    }
  }

  const metrics = getMetrics()

  const clampOffset = (nextOffset: { x: number; y: number }, nextMetrics = metrics) => ({
    x: Math.max(-(nextMetrics?.maxX ?? 0), Math.min(nextMetrics?.maxX ?? 0, nextOffset.x)),
    y: Math.max(-(nextMetrics?.maxY ?? 0), Math.min(nextMetrics?.maxY ?? 0, nextOffset.y)),
  })

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!metrics || busy) return

    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
    }
    setIsDragging(true)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return

    setOffset(clampOffset({
      x: dragRef.current.originX + event.clientX - dragRef.current.startX,
      y: dragRef.current.originY + event.clientY - dragRef.current.startY,
    }))
  }

  const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    dragRef.current = null
    setIsDragging(false)
  }

  const handleZoomChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextZoom = Number(event.target.value)
    const nextMetrics = getMetrics(nextZoom)
    setZoom(nextZoom)
    setOffset((current) => clampOffset(current, nextMetrics))
  }

  const cropImage = () => {
    if (!image || !metrics || isCropping || busy) return

    setIsCropping(true)
    const canvas = document.createElement('canvas')
    canvas.width = outputSize
    canvas.height = outputSize
    const context = canvas.getContext('2d')

    if (!context) {
      setIsCropping(false)
      onError?.('Your browser could not prepare the cropped image.')
      return
    }

    const outputScale = outputSize / cropSize
    const drawWidth = metrics.renderedWidth * outputScale
    const drawHeight = metrics.renderedHeight * outputScale
    const drawX = ((cropSize - metrics.renderedWidth) / 2 + offset.x) * outputScale
    const drawY = ((cropSize - metrics.renderedHeight) / 2 + offset.y) * outputScale
    const mimeType = outputMimeType ?? (file.type === 'image/png' ? 'image/png' : file.type === 'image/webp' ? 'image/webp' : 'image/jpeg')

    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(image, drawX, drawY, drawWidth, drawHeight)
    canvas.toBlob((blob) => {
      setIsCropping(false)

      if (!blob) {
        onError?.('Unable to create the cropped image. Please try again.')
        return
      }

      const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg'
      void onComplete(new File([blob], `${outputFileName}.${extension}`, {
        type: mimeType,
        lastModified: Date.now(),
      }))
    }, mimeType, mimeType === 'image/jpeg' ? 0.9 : undefined)
  }

  return (
    <StaffDialog
      className="staff-photo-crop-dialog"
      closeDisabled={busy || isCropping}
      closeLabel="Cancel photo crop"
      closeOnBackdropClick={false}
      eyebrow={eyebrow}
      onClose={onCancel}
      title={title}
      titleId="staff-photo-crop-dialog-title"
    >
      <div className="staff-photo-crop">
        <p className="staff-photo-crop__description">{description}</p>
        <div
          ref={viewportRef}
          aria-label="Photo crop area"
          className={`staff-photo-crop__viewport${isDragging ? ' staff-photo-crop__viewport--dragging' : ''}`}
          onPointerCancel={handlePointerEnd}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
        >
          {image && metrics && sourceUrl ? <img alt="Crop preview" className="staff-photo-crop__image" draggable={false} src={sourceUrl} style={{ height: metrics.renderedHeight, transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`, width: metrics.renderedWidth }} /> : <span className="staff-photo-crop__loading">Loading photo…</span>}
          <span aria-hidden="true" className="staff-photo-crop__guide" />
        </div>
        <label className="staff-photo-crop__zoom"><span>Zoom</span><input aria-label="Zoom crop" disabled={busy} max="3" min="1" step="0.05" type="range" value={zoom} onChange={handleZoomChange} /><output>{zoom.toFixed(2)}×</output></label>
        {error ? <p className="staff-photo-crop__error" role="alert">{error}</p> : null}
        <div className="staff-photo-crop__actions">
          <button className="staff-button staff-button--secondary" disabled={busy || isCropping} type="button" onClick={onCancel}>Cancel</button>
          <button className="staff-button staff-button--primary" disabled={!image || isCropping || busy} type="button" onClick={cropImage}>{busy ? busyLabel : isCropping ? 'Preparing…' : saveLabel}</button>
        </div>
      </div>
    </StaffDialog>
  )
}
