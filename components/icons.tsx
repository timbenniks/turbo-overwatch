type IconProps = {
  className?: string
  size?: number
}

const base = (size: number, className: string) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className,
  'aria-hidden': true,
})

export function Crosshair({ className = '', size = 16 }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  )
}

export function Skull({ className = '', size = 16 }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M3 10a9 9 0 1 1 18 0v4a3 3 0 0 1-3 3h-1v3H7v-3H6a3 3 0 0 1-3-3z" />
      <circle cx="9" cy="11" r="1.2" fill="currentColor" />
      <circle cx="15" cy="11" r="1.2" fill="currentColor" />
      <line x1="10" y1="16" x2="10" y2="18" />
      <line x1="12" y1="16" x2="12" y2="18" />
      <line x1="14" y1="16" x2="14" y2="18" />
    </svg>
  )
}

export function Heart({ className = '', size = 16 }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

export function Target({ className = '', size = 16 }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  )
}

export function Bolt({ className = '', size = 16 }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <polygon points="13 2 4 14 12 14 11 22 20 10 12 10 13 2" />
    </svg>
  )
}

export function Fire({ className = '', size = 16 }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M12 2s4 4 4 9a4 4 0 0 1-8 0c0-2 1-3 1-3s-3 2-3 6a6 6 0 0 0 12 0c0-7-6-12-6-12z" />
    </svg>
  )
}

export function Trophy({ className = '', size = 16 }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <path d="M17 5h3v2a3 3 0 0 1-3 3" />
      <path d="M7 5H4v2a3 3 0 0 0 3 3" />
    </svg>
  )
}

export function Clock({ className = '', size = 16 }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 14" />
    </svg>
  )
}

export function Shield({ className = '', size = 16 }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3z" />
    </svg>
  )
}

export function Star({ className = '', size = 16 }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9 12 2" />
    </svg>
  )
}

export function Sparkles({ className = '', size = 16 }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <path d="m6 6 2 2M16 16l2 2M6 18l2-2M16 8l2-2" />
    </svg>
  )
}

export function Sword({ className = '', size = 16 }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
      <line x1="13" y1="19" x2="19" y2="13" />
      <line x1="16" y1="16" x2="20" y2="20" />
      <line x1="19" y1="21" x2="21" y2="19" />
    </svg>
  )
}

export function Hand({ className = '', size = 16 }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M18 11V6a2 2 0 1 0-4 0v5" />
      <path d="M14 10V4a2 2 0 1 0-4 0v6" />
      <path d="M10 10.5V6a2 2 0 1 0-4 0v8" />
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2a8 8 0 0 1-8-8v-1" />
    </svg>
  )
}

export function Award({ className = '', size = 16 }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="9" r="6" />
      <polyline points="8.5 13.5 7 22 12 19 17 22 15.5 13.5" />
    </svg>
  )
}

export function User({ className = '', size = 16 }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  )
}

export function TrendingUp({ className = '', size = 16 }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <polyline points="3 17 9 11 13 15 21 7" />
      <polyline points="14 7 21 7 21 14" />
    </svg>
  )
}

export function ListTree({ className = '', size = 16 }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <line x1="9" y1="6" x2="20" y2="6" />
      <line x1="9" y1="12" x2="20" y2="12" />
      <line x1="9" y1="18" x2="20" y2="18" />
      <line x1="4" y1="6" x2="4" y2="6" />
      <line x1="4" y1="12" x2="4" y2="12" />
      <line x1="4" y1="18" x2="4" y2="18" />
    </svg>
  )
}
