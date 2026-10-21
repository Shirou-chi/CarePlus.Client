export type IconName =
  | 'activity'
  | 'arrowUpRight'
  | 'bell'
  | 'box'
  | 'calendar'
  | 'chart'
  | 'check'
  | 'chevronDown'
  | 'chevronRight'
  | 'clock'
  | 'close'
  | 'download'
  | 'grid'
  | 'menu'
  | 'moon'
  | 'more'
  | 'plus'
  | 'search'
  | 'settings'
  | 'shield'
  | 'staff'
  | 'sun'
  | 'users'

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, string> = {
    activity: 'M3 12h4l2.2-7 4.2 14L16 12h5',
    arrowUpRight: 'M7 17 17 7M8 7h9v9',
    bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',
    box: 'M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9ZM4 7.5l8 4.5 8-4.5M12 12v9',
    calendar: 'M5 4h14a2 2 0 0 1 2 2v13H3V6a2 2 0 0 1 2-2ZM8 2v4M16 2v4M3 9h18',
    chart: 'M4 19V5M4 19h17M8 16v-4M12 16V8M16 16v-6M20 16v-9',
    check: 'm5 12 4 4L19 6',
    chevronDown: 'm6 9 6 6 6-6',
    chevronRight: 'm9 6 6 6-6 6',
    clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2',
    close: 'm6 6 12 12M18 6 6 18',
    download: 'M12 3v12m0 0 4-4m-4 4-4-4M5 21h14',
    grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
    menu: 'M4 7h16M4 12h16M4 17h16',
    moon: 'M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z',
    more: 'M5 12h.01M12 12h.01M19 12h.01',
    plus: 'M12 5v14M5 12h14',
    search: 'm21 21-4.4-4.4M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z',
    settings: 'M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4ZM19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06-1.6 1.6-.06-.06A1.7 1.7 0 0 0 16.27 18a1.7 1.7 0 0 0-1.04 1.57V20h-2.26v-.43A1.7 1.7 0 0 0 11.93 18a1.7 1.7 0 0 0-1.87.34L10 18.4l-1.6-1.6.06-.06A1.7 1.7 0 0 0 8.8 15a1.7 1.7 0 0 0-1.57-1.04H6v-2.26h.43A1.7 1.7 0 0 0 8 10.67a1.7 1.7 0 0 0-.34-1.87L7.6 8.74l1.6-1.6.06.06A1.7 1.7 0 0 0 11.13 7a1.7 1.7 0 0 0 1.04-1.57V5h2.26v.43A1.7 1.7 0 0 0 15.47 7a1.7 1.7 0 0 0 1.87-.34l.06-.06 1.6 1.6-.06.06A1.7 1.7 0 0 0 18.6 10a1.7 1.7 0 0 0 1.57 1.04h.43v2.26h-.43A1.7 1.7 0 0 0 19.4 15Z',
    shield: 'M12 21s8-3.7 8-10V5l-8-3-8 3v6c0 6.3 8 10 8 10Z M9 12l2 2 4-4',
    staff: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM19 8v6M22 11h-6',
    sun: 'M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4M16.5 12a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z',
    users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  }

  return (
    <svg aria-hidden="true" className="staff-icon" fill="none" height={size} viewBox="0 0 24 24" width={size}>
      <path d={paths[name]} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  )
}
