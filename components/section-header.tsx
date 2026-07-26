import type { ReactNode } from 'react'

export function SectionHeader({
  children,
  icon,
}: {
  children: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
      {/* Mode accent, inherited from data-mode on <main>. */}
      <span
        className="block w-1 md:w-1.5 h-6 md:h-8"
        style={{ background: 'var(--color-accent)' }}
      />
      {icon && <span style={{ color: 'var(--color-accent)' }}>{icon}</span>}
      <h2 className="text-[16px] md:text-[28px] uppercase tracking-tight text-text-primary font-black leading-none">
        {children}
      </h2>
    </div>
  )
}
