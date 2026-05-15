import type { ReactNode } from 'react'

export function SectionHeader({
  children,
  icon,
}: {
  children: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="block w-1.5 h-8 bg-text-primary" />
      {icon && <span className="text-text-primary">{icon}</span>}
      <h2 className="text-[20px] md:text-[28px] uppercase tracking-tight text-text-primary font-black leading-none">
        {children}
      </h2>
    </div>
  )
}
