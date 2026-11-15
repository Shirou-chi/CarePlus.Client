type StaffPageEyebrowProps = {
  as?: 'h1' | 'p'
  label: string
  className?: string
}

export function StaffPageEyebrow({ as: Tag = 'p', label, className = 'staff-eyebrow' }: StaffPageEyebrowProps) {
  return <Tag className={className}>CarePlus Clinic · {label}</Tag>
}
