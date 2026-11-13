type StaffPageEyebrowProps = {
  as?: 'h1' | 'p'
  label: string
  className?: string
}

export function StaffPageEyebrow({ as: Tag = 'h1', label, className = 'staff-eyebrow' }: StaffPageEyebrowProps) {
  return <Tag className={className}>CarePlus Clinic · {label}</Tag>
}
